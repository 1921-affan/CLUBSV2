
# Club Connect

Club Connect is a comprehensive platform for university societies to manage events, announcements, and memberships.

## Architecture

This project has migrated from a Serverless (Supabase) architecture to a self-hosted custom backend.

*   **Frontend:** React (Vite), Tailwind CSS, Shadcn UI
*   **Backend:** Node.js, Express.js
*   **Database (Relational):** MySQL (Users, Clubs, Events, Announcements)
*   **Database (NoSQL):** MongoDB (AI Logs, Analytics)
*   **Authentication:** Custom JWT-based Auth (merged with MySQL Profiles)

## Prerequisites

1.  **Node.js** (v18+)
2.  **MySQL Server** (Running on localhost:3306)
3.  **MongoDB Community Server** (Running on localhost:27017)

## Installation & Setup

### 1. Database Setup

1.  Open your MySQL Workbench or CLI.
2.  Run the script `MYSQL_SCHEMA.sql` located in the root directory to create the database and tables.
3.  Ensure MongoDB is running locally.

### 2. Backend Setup

1.  Navigate to the backend folder:
    ```bash
    cd Backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `Backend` directory with the following:
    ```env
    PORT=5000
    MYSQL_PASSWORD=your_mysql_password
    JWT_SECRET=your_jwt_secret
    MONGO_URI=mongodb://127.0.0.1:27017/club_connect
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```

### 3. Frontend Setup

1.  Navigate to the root directory (if not already there):
    ```bash
    cd ..
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend:
    ```bash
    npm run dev
    ```

## Features

*   **Authentication:** Student, Club Head, and Admin roles.
*   **Club Management:** Application, Approval, and Custom Dashboards.
*   **Events:** Creation, Registration, and Management.
*   **Announcements:** Club-wide broadcasts.
*   **AI Integration (Upcoming):** Club Matchmaker & Generative Posters.

## API Documentation

The backend runs on `http://localhost:5000/api`.

*   `POST /api/auth/register` - Create account
*   `POST /api/auth/login` - Login & Get Token
*   `GET /api/clubs` - List all clubs
*   `GET /api/events` - List upcoming events


AI Creative Director Deployed 🧑‍🎨

I have successfully updated the system!

Feature 1: Smart Copywriting 📝 Before: You typed "Hackathon" -> Poster said "Hackathon". Now: You typed "Hackathon" -> Gemini writes "CODE THE FUTURE" and a catchy slogan for you.

Feature 2: Dynamic Styling 🎨 Your poster now intelligently picks an Accent Color based on the event vibe (e.g., Cyber Blue for tech, Red for sports) and applies it to the layout elements automatically.

Try it out:

Enter your raw details.
Click "Generate AI Poster".
Watch as the AI re-writes your text and designs the image simultaneously!
Go ahead and create your next masterpiece! ✨

