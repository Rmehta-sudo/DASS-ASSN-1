# Event Management Platform

## Overview
A comprehensive event management platform featuring advanced capabilities like real-time communication, form building, QR-based attendance tracking, merchandise management, and robust role-based access control.

## Technology Stack

### Frontend
- **React**: Chosen for its robust component-based architecture, allowing for modular and maintainable UI development. State management and side effects are easily managed using hooks.
- **Tailwind CSS**: Utility-first CSS framework chosen for rapid UI prototyping and consistent styling without the overhead of writing custom CSS files or managing complex class naming conventions. Focuses on developer velocity and a neat design.
- **React Router DOM**: Provides declarative routing for React applications, essential for navigating seamlessly between multiple pages (e.g., auth, dashboards, event details) in a Single Page Application (SPA) without reloading the page.
- **Axios**: A promise-based HTTP client used for establishing robust communication with the backend REST API. Interceptors streamline token injection for authenticated requests and global error handling.
- **Socket.io-client**: Enables real-time, bi-directional communication between the frontend and the backend server. Critical for features like live discussion forums and real-time notifications.
- **React-Toastify**: Used for elegant and non-intrusive toast notifications to provide immediate feedback to users on actions like successful logins, error states, and real-time updates.
- **HTML5-QRCode**: An external library used to seamlessly integrate QR code scanning functionality directly in the browser using the device camera for fast attendance tracking.
- **React-Google-Recaptcha**: Integrates Google's reCAPTCHA to protect authentication endpoints from automated bots and abuse.

### Backend
- **Node.js & Express**: Provides a robust, lightweight, and scalable asynchronous backend environment. Express simplifies routing, middleware integration, and API endpoint creation.
- **MongoDB & Mongoose**: A NoSQL database paired with Mongoose ODM. Chosen for its flexible schema representation, which is ideal for changing or dynamic data like event details, dynamic registration forms, and access logs.
- **JSON Web Token (JWT) & Bcryptjs**: Used for secure authentication and authorization. Bcrypt hashes passwords securely, while JWT provides stateless sessions, allowing the server to authenticate requests quickly without database lookups on every request.
- **Socket.io**: Powers the WebSocket server to handle real-time events, such as new messages in the discussion forum, threaded replies, and live attendance count updates.
- **Multer**: A middleware for handling `multipart/form-data`, primarily used for managing file uploads like event banners and profile pictures securely.
- **Nodemailer**: Enables the application to send transactional e-mails easily, such as registration confirmations and merchandise order updates.
- **Express-rate-limit**: Secures the application from DDoS and brute-force attacks by limiting the number of repeated requests to public APIs (like login/register).

---

## Advanced Features Implemented

### Tier A Features
1. **Role-Based Access Control (RBAC) & Interactive Dashboards**
   - **Justification**: A large-scale event platform requires strict security boundaries between general participants, event organizers, and system admins to prevent unauthorized data manipulation.
   - **Design Choices & Technical Decisions**: Designed distinct middleware for protected routes on the backend. The Admin dashboard features central oversight of all users/events. Organizers have tailored views restricted strictly to their events, minimizing UI clutter and data leaks. Participants see features tailored to event discovery and their interactive attendance.

### Tier B Features
1. **Real-time Notifications & Alerts**
   - **Justification**: Keeps users immediately informed about critical updates (like event date changes or forum replies) without requiring constant manual page reloads.
   - **Design Choices & Technical Decisions**: Implemented using Socket.IO to broadcast events instantly to connected clients. 

2. **Security Enhancements (Rate Limiting & CAPTCHA)**
   - **Justification**: Essential for protecting the platform against automated bots, brute force login attacks, and spam API requests.
   - **Design Choices & Technical Decisions**: Google reCAPTCHA v2 is used on the frontend during authentication flows. `express-rate-limit` acts as a backend safeguard to enforce IP-level rate-limiting on sensitive routes, terminating malicious request floods early.

### Tier C Features
1. **Real-time Discussion Forum & Threading**
   - **Justification**: Enhances user engagement by allowing participants to ask questions, react to posts, and form communities directly on the event details page before or during the event.
   - **Design Choices & Technical Decisions**: Messages and threads are persisted in MongoDB while Socket.IO handles live push delivery to active viewers. Organizers are equipped with moderation tools (pinning/deleting messages). Threading utilizes hierarchical structures in the document schema.

2. **QR Code Scanner & Attendance Tracking**
   - **Justification**: Significantly streamlines the check-in process at physical events, preventing huge bottlenecks at entry points.
   - **Design Choices & Technical Decisions**: Utilizes `html5-qrcode` to parse QR codes directly from mobile/laptop browsers, bypassing the need for native platform apps. The backend ensures duplicate scans are rejected and logs timestamps for verified attendances.

3. **Merchandise Management & Payment Tracking**
   - **Justification**: Offers organizers an additional channel to monetize events by selling associated goods directly alongside event registrations.
   - **Design Choices & Technical Decisions**: Features an intelligent stock depletion and restoration logic based on order status (approved or rejected). Tracks detailed order status dynamically with integrated email alerts for changes to order states.

4. **Dynamic Form Builder**
   - **Justification**: Every event has unique data collection needs; a static global registration form algorithm is highly restrictive for diverse event types.
   - **Design Choices & Technical Decisions**: Organizers can visually construct forms using multiple field types (text, single-choice, multiple-choice, file upload). The frontend dynamically renders registration forms parsing JSON schemas that defines field validation and properties linked precisely to the individual event configuration.

---

## Setup and Installation Instructions

Follow these steps to set up the project locally:

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Database (Local instance or MongoDB Atlas cluster URI)
- Git

### 1. Clone the repository
Navigate to your desired directory, clone the project files and change directory into the root folder.
```bash
git clone <repository_url>
cd <project_directory>
```

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install backend package dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the root of the `backend` directory and configure the necessary variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_smtp_email
   EMAIL_PASS=your_smtp_password
   DISCORD_WEBHOOK_URL=your_discord_webhook_url
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal instance and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend package dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the root of the `frontend` directory and configure the necessary variables:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   ```
4. Start the frontend Vite development server:
   ```bash
   npm run dev
   ```

### 4. Access the Application
The frontend interface should now be accessible at `http://localhost:5173/` (or the local port specified by Vite in your terminal). Ensure the backend server is running concurrently on `http://localhost:5000/`.
