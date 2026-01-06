-- MySQL Schema for Club Connect
-- Generated based on previous Supabase Schema

CREATE DATABASE IF NOT EXISTS club_connect;
USE club_connect;

-- 1. Users (Profiles)
CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) PRIMARY KEY, -- UUID
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Required for Custom Auth (since we left Supabase)
    role ENUM('student', 'club_head', 'admin') DEFAULT 'student',
    bio TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clubs
CREATE TABLE IF NOT EXISTS clubs (
    id CHAR(36) PRIMARY KEY, -- UUID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    faculty_advisor VARCHAR(255),
    whatsapp_link VARCHAR(255),
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 3. Events
CREATE TABLE IF NOT EXISTS events (
    id CHAR(36) PRIMARY KEY, -- UUID
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATETIME,
    venue VARCHAR(255),
    organizer_club CHAR(36),
    banner_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_club) REFERENCES clubs(id) ON DELETE CASCADE
);

-- 4. Club Members
CREATE TABLE IF NOT EXISTS club_members (
    club_id CHAR(36),
    user_id CHAR(36),
    role_in_club VARCHAR(50) DEFAULT 'member', -- 'member', 'head', 'admin'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (club_id, user_id),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 5. Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id CHAR(36) PRIMARY KEY, -- UUID
    club_id CHAR(36),
    message TEXT,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 6. Event Participants (Registrations)
CREATE TABLE IF NOT EXISTS event_participants (
    event_id CHAR(36),
    user_id CHAR(36),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 7. Pending Clubs (Approvals)
CREATE TABLE IF NOT EXISTS clubs_pending (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    faculty_advisor VARCHAR(255),
    whatsapp_link VARCHAR(255),
    created_by CHAR(36),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 8. Club Discussions
CREATE TABLE IF NOT EXISTS club_discussions (
    id CHAR(36) PRIMARY KEY, -- UUID
    club_id CHAR(36),
    user_id CHAR(36),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 9. Pending Announcements
CREATE TABLE IF NOT EXISTS announcements_pending (
    id CHAR(36) PRIMARY KEY, -- UUID
    club_id CHAR(36),
    message TEXT,
    created_by CHAR(36),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- 10. Pending Events
CREATE TABLE IF NOT EXISTS events_pending (
    id CHAR(36) PRIMARY KEY, -- UUID
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATETIME,
    venue VARCHAR(255),
    organizer_club CHAR(36),
    banner_url VARCHAR(255),
    created_by CHAR(36),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_club) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);
