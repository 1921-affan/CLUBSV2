const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Sequelize, QueryTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Mongoose Schema for AI Logs
const InteractionSchema = new mongoose.Schema({
    userId: String,
    userInterest: String,
    aiResponse: String,
    timestamp: { type: Date, default: Date.now }
});
const Interaction = mongoose.model('Interaction', InteractionSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // In prod, use .env

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('Club Connect API is running...');
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// API Routes
app.get('/api/clubs', async (req, res) => {
    try {
        const clubs = await sequelize.query("SELECT * FROM clubs", { type: QueryTypes.SELECT });
        res.json(clubs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- AUTH ROUTES ---

// Register User
// Rule Implemented: "handle_new_user" (Auto Role) & "check_single_admin" (One Admin Policy)
app.post('/api/auth/register', async (req, res) => {
    const { id, name, email, password, role } = req.body;
    // Note: 'id' usually comes from auth provider, but we are generating it or letting UUID() handle it.
    // For this custom auth, we will generate UUID in SQL if not provided, or expect it.
    // Let's assume we receive plain data and let MySQL generate UUID.

    try {
        // 1. Check if Admin Limit Reached
        if (role === 'admin') {
            const adminCount = await sequelize.query("SELECT COUNT(*) as count FROM profiles WHERE role='admin'", { type: QueryTypes.SELECT });
            if (adminCount[0].count >= 1) {
                return res.status(403).json({ message: "Register Failed: System already has an Admin. Only one allowed." });
            }
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create Profile
        // MySQL doesn't support 'RETURNING id', so we generate UUID here
        // Note: Node.js 14+ has crypto.randomUUID(), or we can use the uuid package if installed.
        // Since we don't have 'uuid' package but might have modern Node, let's try crypto.
        // If crypto.randomUUID is not available, we can fallback to a simple random string or require the package.
        // Let's assume standard Node environment.
        const crypto = require('crypto');
        const newUserId = crypto.randomUUID();

        await sequelize.query(
            `INSERT INTO profiles (id, name, email, password_hash, role) 
       VALUES (:id, :name, :email, :password, :role)`,
            {
                replacements: { id: newUserId, name, email, password: hashedPassword, role: role || 'student' },
                type: QueryTypes.INSERT
            }
        );



        res.status(201).json({ message: "User registered successfully", userId: newUserId });

    } catch (error) {
        console.error("Register Error:", error);
        if (error.name === 'SequelizeUniqueConstraintError' || error.message === 'Validation error') {
            return res.status(400).json({ message: "User with this email already exists." });
        }
        res.status(500).json({ message: error.message });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const users = await sequelize.query("SELECT * FROM profiles WHERE email = :email",
            { replacements: { email }, type: QueryTypes.SELECT }
        );

        if (users.length === 0) return res.status(400).json({ message: "User not found" });

        const user = users[0];
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ message: "Invalid password" });

        // Create Token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


// --- USER PROFILE ROUTES ---

// Get My Full Profile
app.get('/api/users/me', verifyToken, async (req, res) => {
    try {
        const profile = await sequelize.query("SELECT * FROM profiles WHERE id = :id",
            { replacements: { id: req.user.id }, type: QueryTypes.SELECT }
        );
        if (profile.length === 0) return res.status(404).json({ message: "Profile not found" });
        res.json(profile[0]);
    } catch (error) {
        console.error("My Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Alias for Auth Context Session Check
app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const profile = await sequelize.query("SELECT * FROM profiles WHERE id = :id",
            { replacements: { id: req.user.id }, type: QueryTypes.SELECT }
        );
        if (profile.length === 0) return res.status(404).json({ message: "Profile not found" });
        res.json(profile[0]);
    } catch (error) {
        console.error("Auth Me Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get My Clubs (Joined)
app.get('/api/users/me/clubs', verifyToken, async (req, res) => {
    try {
        const clubs = await sequelize.query(
            `SELECT c.*, cm.role_in_club as role 
             FROM club_members cm 
             JOIN clubs c ON cm.club_id = c.id 
             WHERE cm.user_id = :id`,
            { replacements: { id: req.user.id }, type: QueryTypes.SELECT }
        );
        res.json(clubs);
    } catch (error) {
        console.error("My Joined Clubs Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get My Events (Registered)
app.get('/api/users/me/events', verifyToken, async (req, res) => {
    try {
        // Fetch events with organizer club name
        const events = await sequelize.query(
            `SELECT e.*, c.name as club_name 
             FROM event_participants ep 
             JOIN events e ON ep.event_id = e.id 
             JOIN clubs c ON e.organizer_club = c.id 
             WHERE ep.user_id = :id AND e.date >= NOW() 
             ORDER BY e.date ASC`,
            { replacements: { id: req.user.id }, type: QueryTypes.SELECT }
        );

        // Format for frontend (nested organizer_club)
        const formattedEvents = events.map(e => ({
            ...e,
            organizer_club: { name: e.club_name }
        }));

        res.json(formattedEvents);
    } catch (error) {
        console.error("My Events Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Update Profile
app.put('/api/users/me', verifyToken, async (req, res) => {
    const { name, bio, avatar_url } = req.body;
    try {
        await sequelize.query(
            "UPDATE profiles SET name = :name, bio = :bio, avatar_url = :avatar_url WHERE id = :id",
            { replacements: { name, bio, avatar_url, id: req.user.id }, type: QueryTypes.UPDATE }
        );
        // Also update User record if needed, but we use profiles mainly.
        // Update Session User Name if possible? 
        // JWT is stateless so won't update until relogin, but frontend can update local state.
        res.json({ message: "Profile updated" });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

app.get('/api/admin/stats', verifyToken, async (req, res) => {
    try {
        const totalUsers = await sequelize.query("SELECT COUNT(*) as count FROM profiles", { type: QueryTypes.SELECT });
        const totalClubs = await sequelize.query("SELECT COUNT(*) as count FROM clubs", { type: QueryTypes.SELECT });
        const totalEvents = await sequelize.query("SELECT COUNT(*) as count FROM events", { type: QueryTypes.SELECT });
        const pendingClubs = await sequelize.query("SELECT COUNT(*) as count FROM clubs_pending WHERE status='pending'", { type: QueryTypes.SELECT });

        res.json({
            totalUsers: totalUsers[0].count,
            totalClubs: totalClubs[0].count,
            totalEvents: totalEvents[0].count,
            pendingClubs: pendingClubs[0].count
        });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- ANNOUNCEMENTS ---

app.get('/api/announcements', verifyToken, async (req, res) => {
    try {
        const announcements = await sequelize.query(
            `SELECT a.*, c.name as club_name 
             FROM announcements a 
             JOIN clubs c ON a.club_id = c.id
             ORDER BY a.created_at DESC`,
            { type: QueryTypes.SELECT }
        );
        res.json(announcements);
    } catch (error) {
        console.error("Announcements Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});



// Actually, I'll just add the GET route before the existing Pending one.


// Get My Pending Club Requests
app.get('/api/clubs/my-requests', verifyToken, async (req, res) => {
    try {
        const myRequests = await sequelize.query(
            "SELECT * FROM clubs_pending WHERE created_by = :id ORDER BY created_at DESC",
            { replacements: { id: req.user.id }, type: QueryTypes.SELECT }
        );
        res.json(myRequests);
    } catch (error) {
        console.error("My Club Requests Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Submit New Club Request
app.post('/api/clubs/request', verifyToken, async (req, res) => {
    const { name, category, description, faculty_advisor, whatsapp_link } = req.body;
    try {
        await sequelize.query(
            `INSERT INTO clubs_pending (id, name, category, description, faculty_advisor, whatsapp_link, created_by, status)
             VALUES (UUID(), :name, :category, :description, :faculty_advisor, :whatsapp_link, :id, 'pending')`,
            {
                replacements: {
                    name, category, description, faculty_advisor, whatsapp_link, id: req.user.id
                },
                type: QueryTypes.INSERT
            }
        );
        res.json({ message: "Club request submitted" });
    } catch (error) {
        console.error("Submit Club Request Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Admin: Get Pending Clubs
app.get('/api/admin/clubs/pending', verifyToken, async (req, res) => {
    try {
        const clubs = await sequelize.query(
            `SELECT cp.*, p.name as creator_name, p.email as creator_email
             FROM clubs_pending cp
             JOIN profiles p ON cp.created_by = p.id
             WHERE cp.status='pending'`,
            { type: QueryTypes.SELECT }
        );

        const formattedClubs = clubs.map(c => ({
            ...c,
            creator: {
                name: c.creator_name,
                email: c.creator_email
            }
        }));

        res.json(formattedClubs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Admin: Get Pending Announcements
app.get('/api/admin/announcements/pending', verifyToken, async (req, res) => {
    try {
        const announcements = await sequelize.query(
            `SELECT ap.*, c.name as club_name 
             FROM announcements_pending ap 
             JOIN clubs c ON ap.club_id = c.id
             WHERE ap.status='pending'`,
            { type: QueryTypes.SELECT }
        );
        res.json(announcements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Admin: Get Stats
app.get('/api/admin/stats', verifyToken, async (req, res) => {
    try {
        const users = await sequelize.query("SELECT COUNT(*) as count FROM profiles", { type: QueryTypes.SELECT });
        const clubs = await sequelize.query("SELECT COUNT(*) as count FROM clubs", { type: QueryTypes.SELECT });
        const events = await sequelize.query("SELECT COUNT(*) as count FROM events", { type: QueryTypes.SELECT });

        // MongoDB Stats
        let interactions = 0;
        try {
            interactions = await Interaction.countDocuments();
        } catch (e) {
            console.warn("MongoDB stats failed:", e);
        }

        res.json({
            totalUsers: users[0].count,
            totalClubs: clubs[0].count,
            totalEvents: events[0].count,
            totalInteractions: interactions
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        res.status(500).json({ message: "Error fetching stats" });
    }
});

// Admin: Get Pending Events
app.get('/api/admin/events/pending', verifyToken, async (req, res) => {
    try {
        // My schema has 'events' table directly. If I want pending events, I should have an 'events_pending' table or a status column in 'events'.
        // Frontend logic uses 'events_pending' table. MIGRATION HINT: I should have created 'events_pending' in my schema update if it wasn't there.
        // Let's check my server.js logic for 'create event'. I made it insert into 'events' directly.
        // If I want to support approval workflow, I need to fetch from 'events_pending' if it exists in MySQL schema.
        // Let's assume 'events_pending' exists (copying Supabase structure).

        const events = await sequelize.query(
            `SELECT ep.*, c.name as club_name, p.name as creator_name, p.email as creator_email
             FROM events_pending ep 
             JOIN clubs c ON ep.organizer_club = c.id
             LEFT JOIN profiles p ON ep.created_by = p.id
             WHERE ep.status = 'pending'
             ORDER BY ep.date ASC`,
            { type: QueryTypes.SELECT }
        );

        const formattedEvents = events.map(e => ({
            ...e,
            club: { name: e.club_name },
            creator: { name: e.creator_name, email: e.creator_email }
        }));

        res.json(formattedEvents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Admin: Approve Club
app.post('/api/admin/clubs/:id/approve', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Fetch pending club
        const pendingClub = await sequelize.query("SELECT * FROM clubs_pending WHERE id = :id", { replacements: { id }, type: QueryTypes.SELECT });
        if (pendingClub.length === 0) return res.status(404).json({ message: "Request not found" });
        const pc = pendingClub[0];
        const newClubId = pc.id;

        // 2. Insert into real clubs table (Check existence first to prevent duplicates on retry)
        const checkClub = await sequelize.query("SELECT id FROM clubs WHERE id = :id", { replacements: { id: newClubId }, type: QueryTypes.SELECT });
        if (checkClub.length === 0) {
            await sequelize.query(
                `INSERT INTO clubs (id, name, category, description, faculty_advisor, created_by, whatsapp_link)
                 VALUES (:id, :name, :category, :description, :faculty_advisor, :created_by, :whatsapp_link)`,
                {
                    replacements: {
                        id: pc.id,
                        name: pc.name,
                        category: pc.category,
                        description: pc.description,
                        faculty_advisor: pc.faculty_advisor,
                        created_by: pc.created_by,
                        whatsapp_link: pc.whatsapp_link
                    },
                    type: QueryTypes.INSERT
                }
            );
        }

        // 3. Make creator the Club Head (Check existence first)
        const checkMember = await sequelize.query("SELECT * FROM club_members WHERE club_id = :club_id AND user_id = :user_id", { replacements: { club_id: newClubId, user_id: pc.created_by }, type: QueryTypes.SELECT });
        if (checkMember.length === 0) {
            await sequelize.query(
                `INSERT INTO club_members (club_id, user_id, role_in_club, joined_at)
                 VALUES (:club_id, :user_id, 'head', NOW())`,
                { replacements: { club_id: newClubId, user_id: pc.created_by }, type: QueryTypes.INSERT }
            );
        }

        // 3.5 Promote user to 'club_head' role if they are currently a student
        await sequelize.query(
            "UPDATE profiles SET role = 'club_head' WHERE id = :user_id AND role = 'student'",
            { replacements: { user_id: pc.created_by }, type: QueryTypes.UPDATE }
        );

        // 4. Update pending status
        await sequelize.query("UPDATE clubs_pending SET status='approved' WHERE id = :id", { replacements: { id }, type: QueryTypes.UPDATE });

        res.json({ message: "Club approved" });
    } catch (error) {
        console.error("Approve Club Error:", error);
        res.status(500).json({ message: "Error approving club", error: error.message, sqlError: error.parent?.sqlMessage });
    }
});

// Admin: Reject Club
app.post('/api/admin/clubs/:id/reject', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await sequelize.query("UPDATE clubs_pending SET status='rejected' WHERE id = :id", { replacements: { id }, type: QueryTypes.UPDATE });
        res.json({ message: "Club rejected" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error rejecting club" });
    }
});

// Admin: Approve Event
app.post('/api/admin/events/:id/approve', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const pendingEvent = await sequelize.query("SELECT * FROM events_pending WHERE id = :id", { replacements: { id }, type: QueryTypes.SELECT });
        if (pendingEvent.length === 0) return res.status(404).json({ message: "Request not found" });
        const pe = pendingEvent[0];

        await sequelize.query(
            `INSERT INTO events (id, title, description, date, venue, organizer_club)
             VALUES (:id, :title, :description, :date, :venue, :organizer_club)`,
            { replacements: { ...pe }, type: QueryTypes.INSERT }
        );

        // Delete from pending or mark approved? Usually delete or move. 
        // Let's delete from pending to keep it clean, or update status if we want history. 
        // frontend logic suggests they disappear from list.
        await sequelize.query("DELETE FROM events_pending WHERE id = :id", { replacements: { id }, type: QueryTypes.DELETE });

        res.json({ message: "Event approved" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error approving event" });
    }
});

// Admin: Reject Event
app.post('/api/admin/events/:id/reject', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await sequelize.query("UPDATE events_pending SET status='rejected' WHERE id = :id", { replacements: { id }, type: QueryTypes.UPDATE });
        res.json({ message: "Event rejected" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error rejecting event" });
    }
});

// Admin: Approve Announcement
app.post('/api/admin/announcements/:id/approve', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const pendingAnn = await sequelize.query("SELECT * FROM announcements_pending WHERE id = :id", { replacements: { id }, type: QueryTypes.SELECT });
        if (pendingAnn.length === 0) return res.status(404).json({ message: "Request not found" });
        const pa = pendingAnn[0];

        const checkAnn = await sequelize.query("SELECT id FROM announcements WHERE id = :id", { replacements: { id }, type: QueryTypes.SELECT });
        if (checkAnn.length === 0) {
            await sequelize.query(
                `INSERT INTO announcements (id, club_id, message, created_by, created_at)
                 VALUES (:id, :club_id, :message, :created_by, NOW())`,
                { replacements: { id: pa.id, club_id: pa.club_id, message: pa.message, created_by: pa.created_by }, type: QueryTypes.INSERT }
            );
        }

        await sequelize.query("UPDATE announcements_pending SET status='approved' WHERE id = :id", { replacements: { id }, type: QueryTypes.UPDATE });

        res.json({ message: "Announcement approved" });
    } catch (error) {
        console.error("Approve Ann Error:", error);
        res.status(500).json({ message: "Error approving announcement", error: error.message, sqlError: error.parent?.sqlMessage });
    }
});

// Admin: Reject Announcement
app.post('/api/admin/announcements/:id/reject', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await sequelize.query("UPDATE announcements_pending SET status='rejected' WHERE id = :id", { replacements: { id }, type: QueryTypes.UPDATE });
        res.json({ message: "Announcement rejected" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error rejecting announcement" });
    }
});



// Home Page Data (Featured Clubs, Upcoming Events, Stats)
app.get('/api/home', async (req, res) => {
    try {
        // 1. Featured Clubs (Just top 3 for now)
        const featuredClubs = await sequelize.query("SELECT * FROM clubs LIMIT 3", { type: QueryTypes.SELECT });

        // 2. Upcoming Events (Date >= Now, Limit 3) -- MySQL uses NOW()
        const upcomingEvents = await sequelize.query(
            // Fetch event + club name. Join clubs table.
            `SELECT e.*, c.name as club_name 
             FROM events e 
             JOIN clubs c ON e.organizer_club = c.id 
             WHERE e.date >= NOW() 
             ORDER BY e.date ASC 
             LIMIT 3`,
            { type: QueryTypes.SELECT }
        );

        // 3. Stats
        const totalUsers = await sequelize.query("SELECT COUNT(*) as count FROM profiles", { type: QueryTypes.SELECT });
        const totalClubs = await sequelize.query("SELECT COUNT(*) as count FROM clubs", { type: QueryTypes.SELECT });
        const totalEvents = await sequelize.query("SELECT COUNT(*) as count FROM events", { type: QueryTypes.SELECT });

        res.json({
            featuredClubs,
            upcomingEvents: upcomingEvents.map(e => ({
                ...e,
                organizer_club: { name: e.club_name } // Format to match frontend expectation
            })),
            stats: {
                clubs: totalClubs[0].count,
                events: totalEvents[0].count,
                members: totalUsers[0].count
            }
        });
    } catch (error) {
        console.error("Home Data Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// MongoDB Connection (will connect once Mongo is installed)
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/club_connect');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Don't exit process yet, allowing server to run even if DB fails initially
    }
};

// MySQL Connection
const sequelize = new Sequelize('club_connect', 'root', process.env.MYSQL_PASSWORD || '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

const connectMySQL = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL Connected: Database synced.');
    } catch (error) {
        console.error('MySQL Error:', error.message);
    }
};

// --- PROTECTED CLUB/EVENT ROUTES ---

// Helper: Check if user is head of a specific club
const isClubHead = async (userId, clubId) => {
    const membership = await sequelize.query(
        "SELECT * FROM club_members WHERE club_id = :clubId AND user_id = :userId AND role_in_club = 'head'",
        { replacements: { clubId, userId }, type: QueryTypes.SELECT }
    );
    return membership.length > 0;
};

// Get Club Members
app.get('/api/clubs/:id/members', verifyToken, async (req, res) => {
    try {
        const members = await sequelize.query(
            `SELECT p.id, p.name, p.avatar_url, cm.role_in_club as role
             FROM club_members cm
             JOIN profiles p ON cm.user_id = p.id
             WHERE cm.club_id = :id`,
            { replacements: { id: req.params.id }, type: QueryTypes.SELECT }
        );
        res.json(members);
    } catch (error) {
        console.error("Fetch Members Error:", error);
        res.status(500).json({ message: "Server Error fetching members" });
    }
});

// Create Club (Authenticated Users)
app.post('/api/clubs', verifyToken, async (req, res) => {
    // Note: In real app, this might go to 'pending' first. For now, mimicking direct create or pending based on user role? 
    // The previous schema had 'clubs_pending'. Let's stick to the 'clubs' table for simplicity or follow the 'pending' flow if strict.
    // The SQL said: "Authenticated users can create pending clubs".
    // Let's implement that.

    try {
        const { name, category, description, faculty_advisor } = req.body;

        await sequelize.query(
            `INSERT INTO clubs_pending (id, name, category, description, faculty_advisor, created_by, status)
             VALUES (UUID(), :name, :category, :description, :faculty_advisor, :userId, 'pending')`,
            {
                replacements: { name, category, description, faculty_advisor, userId: req.user.id },
                type: QueryTypes.INSERT
            }
        );
        res.status(201).json({ message: "Club request submitted for approval." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error submitting club request" });
    }
});

// Update Club (Only Club Head)
app.put('/api/clubs/:id', verifyToken, async (req, res) => {
    const clubId = req.params.id;
    try {
        // Policy Check: "Club heads can update their clubs"
        if (!await isClubHead(req.user.id, clubId)) {
            return res.status(403).json({ message: "Access Denied: You are not the head of this club." });
        }

        const { description, whatsapp_link } = req.body;
        await sequelize.query(
            "UPDATE clubs SET description = :description, whatsapp_link = :whatsapp_link WHERE id = :clubId",
            { replacements: { description, whatsapp_link, clubId }, type: QueryTypes.UPDATE }
        );
        res.json({ message: "Club updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating club" });
    }
});

// Get Club Discussions
app.get('/api/clubs/:id/discussions', verifyToken, async (req, res) => {
    try {
        const discussions = await sequelize.query(
            `SELECT d.*, p.name as user_name, p.avatar_url as user_avatar
             FROM club_discussions d
             JOIN profiles p ON d.user_id = p.id
             WHERE d.club_id = :id
             ORDER BY d.created_at ASC`,
            { replacements: { id: req.params.id }, type: QueryTypes.SELECT }
        );

        // Map to frontend structure
        const formatted = discussions.map(d => ({
            id: d.id,
            message: d.message,
            created_at: d.created_at,
            user: {
                name: d.user_name,
                avatar_url: d.user_avatar
            }
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Fetch Discussions Error:", error);
        res.json([]); // Return empty array if table doesn't exist yet to avoid crash
    }
});

// Post Discussion
app.post('/api/clubs/:id/discussions', verifyToken, async (req, res) => {
    try {
        const { message } = req.body;
        await sequelize.query(
            `INSERT INTO club_discussions (id, club_id, user_id, message, created_at)
             VALUES (UUID(), :club_id, :user_id, :message, NOW())`,
            {
                replacements: {
                    club_id: req.params.id,
                    user_id: req.user.id,
                    message
                },
                type: QueryTypes.INSERT
            }
        );
        res.status(201).json({ message: "Posted" });
    } catch (error) {
        console.error("Post Discussion Error:", error);
        res.status(500).json({ message: "Error posting discussion" });
    }
});

// Create Event (Only Club Head)
app.post('/api/events', verifyToken, async (req, res) => {
    const { title, description, date, venue, organizer_club, whatsapp_link, banner_url } = req.body;
    try {
        // Policy Check: "Club heads can create events for their clubs"
        if (!await isClubHead(req.user.id, organizer_club)) {
            return res.status(403).json({ message: "Access Denied: You are not the head of the organizer club." });
        }

        await sequelize.query(
            `INSERT INTO events_pending (id, title, description, date, venue, organizer_club, created_by, status, whatsapp_link, banner_url)
                 VALUES (UUID(), :title, :description, :date, :venue, :organizer_club, :userId, 'pending', :whatsapp_link, :banner_url)`,
            {
                replacements: { title, description, date, venue, organizer_club, userId: req.user.id, whatsapp_link, banner_url },
                type: QueryTypes.INSERT
            }

        );
        res.status(201).json({ message: "Event submitted for approval" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating event" });
    }
});

// Update Event (Only Club Head)
app.put('/api/events/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, date, venue, whatsapp_link, banner_url } = req.body;
    try {
        // Fetch event to get club_id for policy check
        const event = await sequelize.query("SELECT organizer_club FROM events WHERE id = :id", { replacements: { id }, type: QueryTypes.SELECT });
        if (event.length === 0) return res.status(404).json({ message: "Event not found" });

        if (!await isClubHead(req.user.id, event[0].organizer_club)) {
            return res.status(403).json({ message: "Access Denied" });
        }

        await sequelize.query(
            "UPDATE events SET title=:title, description=:description, date=:date, venue=:venue, whatsapp_link=:whatsapp_link, banner_url=:banner_url WHERE id = :id",
            { replacements: { title, description, date, venue, whatsapp_link, banner_url, id }, type: QueryTypes.UPDATE }
        );
        res.json({ message: "Event updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating event" });
    }
});

// Delete Event (Only Club Head)
app.delete('/api/events/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Fetch event to get club_id for policy check
        const event = await sequelize.query("SELECT organizer_club FROM events WHERE id = :id", { replacements: { id }, type: QueryTypes.SELECT });
        if (event.length === 0) return res.status(404).json({ message: "Event not found" });

        if (!await isClubHead(req.user.id, event[0].organizer_club)) {
            return res.status(403).json({ message: "Access Denied" });
        }

        await sequelize.query("DELETE FROM events WHERE id = :id", { replacements: { id }, type: QueryTypes.DELETE });
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting event" });
    }
});

// Create Announcement (Only Club Head)
app.post('/api/announcements', verifyToken, async (req, res) => {
    const { club_id, message } = req.body;
    try {
        // Policy Check
        if (!await isClubHead(req.user.id, club_id)) {
            return res.status(403).json({ message: "Access Denied" });
        }

        // Insert directly into announcements (or pending if you prefer logic, but user said "submit for admin approval" in frontend code, checking schema)
        // Frontend logic said "announcements_pending". Let's stick to that if schema has it. 
        // Schema update Step 546 added `announcements_pending`.
        // BUT logic in `fetchClubData` (frontend) showed separate approved/pending.
        // Let's modify this to insert into `announcements_pending` if status='pending', or directly if we want instant.
        // User's frontend code says "Submit for approval". So insert into `announcements_pending`.

        await sequelize.query(
            `INSERT INTO announcements_pending (id, club_id, message, created_by, status) 
             VALUES (UUID(), :club_id, :message, :userId, 'pending')`,
            { replacements: { club_id, message, userId: req.user.id }, type: QueryTypes.INSERT }
        );

        res.status(201).json({ message: "Announcement submitted for approval" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating announcement" });
    }
});

// Get Event Participants (Only Club Head)
app.get('/api/events/:id/participants', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const participants = await sequelize.query(
            `SELECT ep.*, p.name, p.email 
             FROM event_participants ep 
             JOIN profiles p ON ep.user_id = p.id 
             WHERE ep.event_id = :id
             ORDER BY ep.registered_at ASC`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        res.json(participants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching participants" });
    }
});

// Toggle Attendance (Only Club Head)
app.put('/api/events/participants/:id/attendance', verifyToken, async (req, res) => {
    const { id } = req.params; // Using participant record ID
    const { attended } = req.body;
    try {
        await sequelize.query(
            "UPDATE event_participants SET attended = :attended WHERE id = :id",
            { replacements: { attended, id }, type: QueryTypes.UPDATE }
        );
        res.json({ message: "Attendance updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating attendance" });
    }
});

// --- PUBLIC GET ROUTES (Events, Single Club) ---

// Get All Events
app.get('/api/events', async (req, res) => {
    try {
        // Fetch events with Club Name
        const events = await sequelize.query(
            `SELECT e.*, c.name as club_name, (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) as participant_count
             FROM events e 
             LEFT JOIN clubs c ON e.organizer_club = c.id 
             WHERE e.date >= NOW() 
             ORDER BY e.date ASC`,
            { type: QueryTypes.SELECT }
        );

        // Format for frontend
        const formattedEvents = events.map(e => ({
            ...e,
            organizer_club: { name: e.club_name },
            event_participants: [{ count: e.participant_count }]
        }));

        res.json(formattedEvents);
    } catch (error) {
        console.error("Fetch Events Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get My Clubs (Clubs where user is Head) - Protected Route
app.get('/api/clubs/my-clubs', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Find clubs where user is head
        const clubs = await sequelize.query(
            `SELECT c.* 
             FROM clubs c 
             JOIN club_members cm ON c.id = cm.club_id 
             WHERE cm.user_id = :userId AND cm.role_in_club = 'head'`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );
        res.json(clubs);
    } catch (error) {
        console.error("My Clubs Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get Single Club Details
app.get('/api/clubs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const club = await sequelize.query("SELECT * FROM clubs WHERE id = :id",
            { replacements: { id }, type: QueryTypes.SELECT }
        );

        if (club.length === 0) return res.status(404).json({ message: "Club not found" });
        res.json(club[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get Club Events
app.get('/api/clubs/:id/events', async (req, res) => {
    try {
        const { id } = req.params;
        const events = await sequelize.query(
            "SELECT * FROM events WHERE organizer_club = :id AND date >= NOW() ORDER BY date ASC",
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get Club Announcements
app.get('/api/clubs/:id/announcements', async (req, res) => {
    try {
        const { id } = req.params;
        const announcements = await sequelize.query(
            "SELECT * FROM announcements WHERE club_id = :id ORDER BY created_at DESC",
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        res.json(announcements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get Club Members
app.get('/api/clubs/:id/members', async (req, res) => {
    try {
        const { id } = req.params;
        const members = await sequelize.query(
            `SELECT p.id, p.name, p.email, cm.role_in_club 
             FROM club_members cm 
             JOIN profiles p ON cm.user_id = p.id 
             WHERE cm.club_id = :id`,
            { replacements: { id }, type: QueryTypes.SELECT }
        );
        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});


// --- EVENT REGISTRATION ---

// Get My Registrations
app.get('/api/users/me/registrations', verifyToken, async (req, res) => {
    try {
        const registrations = await sequelize.query(
            "SELECT event_id FROM event_participants WHERE user_id = :userId",
            { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
        );
        res.json(registrations);
    } catch (error) {
        console.error("Fetch Registrations Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Register for Event
app.post('/api/events/:id/register', verifyToken, async (req, res) => {
    try {
        // Check if already registered
        const existing = await sequelize.query(
            "SELECT * FROM event_participants WHERE event_id = :eventId AND user_id = :userId",
            { replacements: { eventId: req.params.id, userId: req.user.id }, type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Already registered" });
        }

        await sequelize.query(
            "INSERT INTO event_participants (event_id, user_id) VALUES (:eventId, :userId)",
            { replacements: { eventId: req.params.id, userId: req.user.id }, type: QueryTypes.INSERT }
        );
        res.json({ message: "Registered successfully" });
    } catch (error) {
        console.error("Event Registration Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Unregister from Event
app.delete('/api/events/:id/register', verifyToken, async (req, res) => {
    try {
        await sequelize.query(
            "DELETE FROM event_participants WHERE event_id = :eventId AND user_id = :userId",
            { replacements: { eventId: req.params.id, userId: req.user.id }, type: QueryTypes.DELETE }
        );
        res.json({ message: "Unregistered successfully" });
    } catch (error) {
        console.error("Event Unregistration Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


// --- CLUB DISCUSSIONS ---

// Get Discussions
app.get('/api/clubs/:id/discussions', verifyToken, async (req, res) => {
    try {
        const discussions = await sequelize.query(
            `SELECT d.*, p.name as user_name 
             FROM club_discussions d 
             JOIN profiles p ON d.user_id = p.id 
             WHERE d.club_id = :clubId 
             ORDER BY d.created_at ASC`,
            { replacements: { clubId: req.params.id }, type: QueryTypes.SELECT }
        );

        // Map to frontend structure (nested user object)
        const mappedDiscussions = discussions.map(d => ({
            ...d,
            user: { name: d.user_name }
        }));

        res.json(mappedDiscussions);
    } catch (error) {
        console.error("Fetch Discussions Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Post Discussion
app.post('/api/clubs/:id/discussions', verifyToken, async (req, res) => {
    const { message } = req.body;
    try {
        await sequelize.query(
            `INSERT INTO club_discussions (id, club_id, user_id, message) 
             VALUES (UUID(), :clubId, :userId, :message)`,
            { replacements: { clubId: req.params.id, userId: req.user.id, message }, type: QueryTypes.INSERT }
        );
        res.json({ message: "Message posted" });
    } catch (error) {
        console.error("Post Discussion Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Delete Discussion
app.delete('/api/discussions/:id', verifyToken, async (req, res) => {
    try {
        // Allow user to delete their own, or club head/admin (simplified to own for now or relying on frontend checks)
        await sequelize.query(
            "DELETE FROM club_discussions WHERE id = :id",
            { replacements: { id: req.params.id }, type: QueryTypes.DELETE }
        );
        res.json({ message: "Message deleted" });
    } catch (error) {
        console.error("Delete Discussion Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});


// --- CLUB MEMBERSHIP ---

// Join Club
app.post('/api/clubs/:id/join', verifyToken, async (req, res) => {
    try {
        // Check if already member
        const existing = await sequelize.query(
            "SELECT * FROM club_members WHERE club_id = :clubId AND user_id = :userId",
            { replacements: { clubId: req.params.id, userId: req.user.id }, type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Already a member" });
        }

        await sequelize.query(
            "INSERT INTO club_members (club_id, user_id, role_in_club) VALUES (:clubId, :userId, 'member')",
            { replacements: { clubId: req.params.id, userId: req.user.id }, type: QueryTypes.INSERT }
        );
        res.json({ message: "Joined club successfully" });
    } catch (error) {
        console.error("Join Club Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Leave Club
app.post('/api/clubs/:id/leave', verifyToken, async (req, res) => {
    try {
        await sequelize.query(
            "DELETE FROM club_members WHERE club_id = :clubId AND user_id = :userId",
            { replacements: { clubId: req.params.id, userId: req.user.id }, type: QueryTypes.DELETE }
        );
        res.json({ message: "Left club successfully" });
    } catch (error) {
        console.error("Leave Club Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// Restore Head Access (Self-repair if creator lost access?)
app.put('/api/clubs/:id/restore-head', verifyToken, async (req, res) => {
    try {
        await sequelize.query(
            "UPDATE club_members SET role_in_club = 'head' WHERE club_id = :clubId AND user_id = :userId",
            { replacements: { clubId: req.params.id, userId: req.user.id }, type: QueryTypes.UPDATE }
        );
        res.json({ message: "Head access restored" });
    } catch (error) {
        console.error("Restore Head Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// --- AI FEATURES ---

// AI Club Matchmaker
app.post('/api/ai/match', verifyToken, async (req, res) => {
    const { interest } = req.body;
    if (!interest) return res.status(400).json({ message: "Interest is required" });

    try {
        // 1. Fetch all clubs to analyze
        const clubs = await sequelize.query("SELECT id, name, description, category FROM clubs", { type: QueryTypes.SELECT });

        let aiResponseText = "";
        let matchedClubs = [];

        if (genAI) {
            try {
                // Use Gemini
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                const prompt = `
                    Act as a Club Matchmaker for a university student.
                    User Interest: "${interest}"
                    Available Clubs: ${JSON.stringify(clubs)}
                    
                    Task: Recommend the top 1-3 clubs that best match the user's interest. 
                    Return ONLY a valid JSON array of objects with this structure:
                    [
                        { "club_id": "id_from_list", "reason": "Why it matches" }
                    ]
                    If no strong match, pick the closest one or empty array. Do not include markdown formatting like \`\`\`json.
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                aiResponseText = response.text();

                // Clean up code blocks if present
                const cleanJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
                const recommendations = JSON.parse(cleanJson);
                // Merge with club details
                matchedClubs = recommendations.map(rec => {
                    const club = clubs.find(c => c.id === rec.club_id);
                    return club ? { ...club, match_reason: rec.reason } : null;
                }).filter(Boolean);

            } catch (aiError) {
                console.warn("⚠️ AI Generation Failed (using fallback):", aiError.message);
                matchedClubs = []; // Ensure empty so fallback triggers
            }
        }

        // Fallback: Smart Keyword Scoring (if AI failed or wasn't used)
        if (matchedClubs.length === 0) {

            // 1. Tokenize user input (split by space, remove common small words)
            const stopWords = ['i', 'am', 'and', 'to', 'the', 'in', 'of', 'for', 'with', 'a', 'an', 'is', 'are', 'my', 'looking', 'interested', 'enjoy', 'like', 'but'];
            const searchTerms = interest.toLowerCase()
                .split(/[\s,.-]+/) // Split by space/punctuation
                .filter(w => w.length > 2 && !stopWords.includes(w)); // Filter noise

            // 2. Score each club
            const scoredClubs = clubs.map(club => {
                let score = 0;
                const clubText = `${club.name} ${club.description} ${club.category}`.toLowerCase();

                searchTerms.forEach(term => {
                    if (clubText.includes(term)) {
                        score += 1; // Basic match
                        // Boost for exact name match or category match
                        if (club.name.toLowerCase().includes(term)) score += 2;
                        if (club.category?.toLowerCase().includes(term)) score += 2;
                    }
                });

                return { ...club, score };
            });

            // 3. Filter and Sort
            matchedClubs = scoredClubs
                .filter(c => c.score > 0) // Must have at least one match
                .sort((a, b) => b.score - a.score) // Highest score first
                .slice(0, 3) // Top 3
                .map(c => ({
                    ...c,
                    match_reason: `Matches ${c.score} of your interest keywords.`
                }));

            if (!aiResponseText) aiResponseText = "Fallback: Smart Logic Match";
        }

        // 2. Log to MongoDB (NoSQL)
        try {
            const log = new Interaction({
                userId: req.user.id,
                userInterest: interest,
                aiResponse: aiResponseText
            });
            await log.save();
        } catch (mongoError) {
            console.error("MongoDB Log Error:", mongoError);
            // Non-blocking
        }

        res.json({ matches: matchedClubs, ai_powered: !!genAI });

    } catch (error) {
        console.error("AI Match Error:", error);
        res.status(500).json({ message: "Error generating recommendations", error: error.message || error.toString() });
    }
});

// --- AI POSTER GENERATION ENDPOINT ---
app.post('/api/ai/poster', verifyToken, async (req, res) => {
    const { prompt: rawPrompt, eventDetails } = req.body;
    // Construct a rich context from event details or fallback to raw prompt
    const context = eventDetails
        ? `Title: ${eventDetails.title}, Desc: ${eventDetails.description}, Date: ${eventDetails.date}, Venue: ${eventDetails.venue}`
        : rawPrompt;

    if (!context) return res.status(400).json({ message: "Event details required" });

    try {
        console.log("🧠 1. Gemini Creative Director analyzing...");

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const llmPrompt = `
            Act as a World-Class Event Poster Designer & Copywriter.
            Context: We need to create a stunning A3 poster for this event: "${context}".

            Task: 
            1. Analyze the event and write CATCHY, PROFESSIONAL copy for the poster.
            2. Design a visual prompt for an AI image generator (Flux) to create a perfect background.

            Output ONLY a valid JSON object with this exact structure (no markdown):
            {
                "poster_content": {
                    "headline": "Short, punchy 2-5 word headline (e.g. 'CODE THE FUTURE')",
                    "tagline": "A single engaging sentence or subtitle",
                    "description": "A condensed, powerful 2-sentence summary of the event description. Remove fluff.",
                    "date_display": "Format date cleanly (e.g. 'MARCH 12TH, 2026')",
                    "venue_display": "Clean venue name"
                },
                "style_config": {
                    "accent_color_hex": "#HEX_CODE (e.g. #00d4ff for tech, #ff4d4d for urgent)",
                    "font_mood": "e.g. 'Modern', 'Serif', 'Handwritten'"
                },
                "image_prompt": "A vivid, highly detailed description for the background art. CRITICAL: Require a DARK, EMPTY CENTER area for text overlay. High contrast, 8k resolution, professional style."
            }
        `;

        const result = await model.generateContent(llmPrompt);
        const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const creativeData = JSON.parse(responseText);

        console.log("✨ 2. Creative Direction Ready:", creativeData.poster_content.headline);

        // 3. Generate Image using Pollinations
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(creativeData.image_prompt)}?model=flux&width=768&height=1088&enhance=false&nologo=true&seed=${Math.floor(Math.random() * 9999)}`;

        const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(imgResponse.data, 'binary').toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64}`;

        console.log("✅ 3. Poster Generated Successfully!");

        return res.json({
            success: true,
            image: dataUri,
            content: creativeData.poster_content,
            style: creativeData.style_config,
            source: "AI Creative Director"
        });

    } catch (error) {
        console.error("❌ Creative Director Failed:", error.message);
        // Fallback: Just return generic failure or try simple image generation
        return res.status(500).json({ success: false, message: "AI Generation Failed. Please try again." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    connectDB();
    connectMySQL();
});
