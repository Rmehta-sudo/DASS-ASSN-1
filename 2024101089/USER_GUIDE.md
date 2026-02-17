# Felicity Fest Management System - User Guide

## 🚀 Installation & Setup
### Prerequisites
- Node.js (v14+)
- MongoDB (Local or Atlas)

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env file if not exists (see .env.example)
# Ensure MONGO_URI is set
# Add ADMIN_PASSWORD and DEFAULT_CLUB_PASSWORD to .env
node server.js
```
*Server runs on `http://localhost:5000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Client runs on `http://localhost:5173`*

---

## 🧪 Automated Testing
Run these scripts to verify backend logic without using the GUI.
**Note**: Ensure backend is running (`node server.js`) before running tests.

| Test Script | Description | Command |
| :--- | :--- | :--- |
| `tests/auth_test.js` | Verifies Login/Signup & Token generation | `node tests/auth_test.js` |
| `tests/event_crud_test.js` | Verifies Event CRUD operations | `node tests/event_crud_test.js` |
| `tests/registration_test.js` | Verifies Event Registration limits | `node tests/registration_test.js` |
| `tests/team_test.js` | **Tier A**: Verifies Team Creation, Join, Leave | `node tests/team_test.js` |
| `tests/attendance_test.js` | **Tier A**: Verifies QR Ticket & Scanning | `node tests/attendance_test.js` |
| `tests/chat_test.js` | **Tier B**: Verifies Real-Time Chat (Socket.io) | `node tests/chat_test.js` |
| `tests/feedback_test.js` | **Tier C**: Verifies Anonymous Feedback | `node tests/feedback_test.js` |
| `tests/password_reset_test.js` | Verifies Admin-Organizer Reset Flow | `node tests/password_reset_test.js` |

---

## 🖥️ Manual Walkthrough (GUI)
Follow this flow to test all features in the browser.

### 1. Admin Setup (First Time)
1. Go to `/login` and sign in as **Admin**:
   - Email: `admin@felicity.iiit.ac.in`
   - Password: `adminpassword`
2. Go to **Admin Dashboard**.
3. **Create a Club** (Organizer):
   - Name: "Coding Club"
   - Email: `coding@clubs.iiit.ac.in`
   - Password: (Set a known password like `123456`)
4. Logout.

### 2. Organizer Flow (Create Event)
1. Login as the **Club** you just created.
2. Go to **Organizer Dashboard** -> **Create Event**.
3. Create a **Hackathon** (to test Teams):
   - Name: "HackIIIT"
   - Team Size: Min 2, Max 4
   - End Date: (Set to future for now)
4. Create a **Past Event** (to test Feedback):
   - Name: "Old Concert"
   - End Date: (Set to yesterday)

### 3. User Flow (Register & Participate)
1. Open Incognito window (or logout).
2. **Sign Up** a new user (Participant).
3. **Register for Hackathon**:
   - Go to "HackIIIT" details.
   - Click "Register".
   - **Team**: Create a Team ("Alpha Squad").
   - Copy Invite Code.
4. **Join Team (Optional)**:
   - Creating another user -> Register -> Join Team with code.
5. **My Registrations**:
   - View Ticket & QR Code.
6. **Chat**:
   - In "HackIIIT" details, verify **Discussion Forum** loads.
   - If registered, verify **Team Chat** works.

### 4. Organizer Flow (Scan & Verify)
1. Login as Organizer again.
2. Go to `http://localhost:5173/organizer/scanner` (or via Dashboard link).
3. Enter the **Ticket ID** from the User's "My Registrations".
4. Click **Verify**. (Should see "Verified!" and user details).
5. Try verifying again (Should see "Already Marked Present").

### 5. Feedback Flow
1. Login as the User who registered for "Old Concert" (Past Event).
2. Go to "Old Concert" details.
3. Scroll down to **Feedback Form**.
4. Submit a 5-star rating.
5. Verify it appears in the list.

---

## 🛠️ Troubleshooting
- **Socket Connection Failed**: Ensure backend is running. Check browser console for `socket.io` errors.
- **MongoDB Error**: Ensure `mongod` is running locally.
- **Login Failed**: Check `admin` seeds or created user credentials.

---

## 🚀 Deployment Guide (Render & Vercel)

### 1. Backend (Render)
When deploying the backend to Render, you **MUST** add the environment variables in the Render Dashboard.

1.  Go to your **Render Dashboard** -> Select your **Backend Service**.
2.  Click on **Environment**.
3.  Add the following Environment Variables (Key-Value pairs):
    - `MONGO_URI`: (Your MongoDB Atlas Connection String)
    - `JWT_SECRET`: (A strong secret key, e.g., `supersecretkey123`)
    - `ADMIN_PASSWORD`: (Set a strong password for the Admin account)
    - `DEFAULT_CLUB_PASSWORD`: (Set a default password for new clubs)
    - `PORT`: `5000` (Optional, Render usually handles this)

### 2. Frontend (Vercel)
The Frontend **DOES NOT** require the admin/club passwords. It only needs to know where the backend is.

1.  Go to your **Vercel Dashboard** -> Select your **Frontend Project**.
2.  Click on **Settings** -> **Environment Variables**.
3.  Add the following:
    - `VITE_API_URL`: (Your Render Backend URL, e.g., `https://your-backend.onrender.com/api`)
    
> [!IMPORTANT]
> **NEVER** commit your `.env` file to GitHub. It is included in `.gitignore` to prevent this.

