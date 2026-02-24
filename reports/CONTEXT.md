# 🎪 Felicity Fest — Full Codebase Context
> **Student ID:** 2024101089 | **Course:** DASS Sem 4  
> **Last updated:** 2026-02-24  
> Load this file to instantly restore full project context.

---

## 1. Project Overview

A full-stack **Event Management Platform** for IIIT Hyderabad's Felicity Fest.  
- **Backend:** Node.js + Express + MongoDB (Mongoose) + Socket.io — runs on port **5000**  
- **Frontend:** React 19 + Vite + TailwindCSS v4 + React-Router v7 — runs on port **5173**  
- **Tests:** Plain Node.js scripts in `tests/`, using `axios` to hit the live API  
- **Root project dir:** `2024101089/`

---

## 2. Directory Structure

```
2024101089/
├── backend/
│   ├── server.js               # Express + Socket.io entry point
│   ├── config/db.js            # Mongoose connection
│   ├── models/                 # 8 Mongoose models
│   ├── controllers/            # 8 controllers
│   ├── routes/                 # 8 route files (all under /api/*)
│   ├── middleware/             # authMiddleware.js, rateLimiter.js
│   ├── utils/                  # sendEmail, discordWebhook, generateToken, captcha
│   ├── seeder.js               # Standalone DB seeder
│   └── .env                    # JWT_SECRET, MONGO_URI, SMTP_*, DISCORD_WEBHOOK_URL, etc.
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Router + all routes
│   │   ├── context/AuthContext.jsx
│   │   ├── apiConfig.js        # Base URL (VITE_API_URL)
│   │   ├── pages/              # 14 top-level pages + organizer/ subdir
│   │   └── components/         # 7 shared components
│   └── .env                    # VITE_API_URL, VITE_RECAPTCHA_SITE_KEY
└── tests/                      # 29 test/verify scripts (.js)
```

---

## 3. Backend

### 3.1 Entry Point — `server.js`

- Creates an `http.Server` wrapping Express, then mounts `socket.io` on it.
- CORS: allows `localhost:5173`, `localhost:3000`, and `FRONTEND_URL` env var.
- Mounts all route prefixes:
  - `POST/GET /api/auth/*`
  - `GET/POST/PUT/DELETE /api/admin/*`
  - `GET/POST/PUT/DELETE /api/events/*`
  - `GET/POST/PUT /api/registrations/*`
  - `POST/GET /api/attendance/*`
  - `GET/PUT/DELETE /api/chat/*`
  - `POST/GET /api/feedback/*`
  - `GET/PUT /api/notifications/*`
- **Socket.io events (real-time):**
  - `join_room(room)` — join an event chat room
  - `join_user_room(userId)` — join personal notification room `user_<id>`
  - `send_message(data)` — saves message to DB, emits `receive_message` to room; triggers reply/announcement notifications
  - `message_updated`, `message_deleted` — emitted by chat controller after pin/react/delete

### 3.2 Environment Variables (backend `.env`)

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Server port (default 5000) |
| `FRONTEND_URL` | Deployed frontend URL for CORS |
| `SMTP_EMAIL` | Gmail address for nodemailer |
| `SMTP_PASSWORD` | Gmail app password |
| `FROM_NAME` | Email "from" display name |
| `DISCORD_WEBHOOK_URL` | Fallback global Discord webhook |
| `DEFAULT_CLUB_PASSWORD` | Auto-generated password for new clubs |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v2 secret |

---

### 3.3 Models

#### `User`
Fields: `firstName`, `lastName`, `email` (unique), `password` (bcrypt hashed via pre-save), `role` (enum: `participant|admin|organizer`, default `participant`), `participantType` (enum: `IIIT|Non-IIIT`), `collegeName`, `contactNumber`, `interests[]`, `following[]` (ref: Organizer).  
Method: `matchPassword(enteredPassword)`.

#### `Organizer`
Fields: `user` (ref: User), `name` (unique), `category` (enum: `Cultural|Technical|Sports|Other`), `description`, `contactEmail`, `followers[]` (ref: User), `isArchived` (bool, default false), `discordWebhook` (string URL).  
Each organizer is a club account. One-to-one with a User of role `organizer`.

#### `Event`
Fields: `organizer` (ref: Organizer), `name`, `description`, `type` (enum: `Normal|Merchandise`), `status` (enum: `Draft|Published|Ongoing|Completed|Cancelled`, default `Draft`), `eligibility` (string, default "Anyone"), `registrationFee`, `registrationLimit` (0 = unlimited), `currentRegistrations`, `startDate`, `endDate`, `deadline`, `location`, `tags[]`, `formFields[]` (sub-schema with label, type, options, required), `merchandise[]` (sub-schema with name, price, stock, description, image, limitPerUser, variants).

#### `Registration`
Fields: `user` (ref: User), `event` (ref: Event), `status` (enum: `Pending|Confirmed|Cancelled|Rejected`, default `Confirmed`), `responses[]` (label+answer), `paymentProof` (URL string), `merchandiseSelection[]` (itemId, quantity, variant, price), `ticketId` (unique, sparse — format `FEL-XXXXXXXX`), `attended` (bool, default false).

#### `Feedback`
Fields: `event` (ref), `user` (ref), `rating` (1-5), `comment`, `isAnonymous` (default true).  
Compound unique index on `{event, user}` — one feedback per user per event.

#### `Message`
Fields: `sender` (ref: User), `event` (ref: Event, nullable), `content`, `parentMessage` (ref: Message, for threading), `isPinned` (bool), `reactions` (Map of userId → reaction string), `type` (enum: `text|announcement|question`).

#### `Notification`
Fields: `recipient` (ref: User), `message` (string), `type` (enum: `reply|announcement|reaction|system`), `relatedId` (ObjectId), `isRead` (bool, default false).

#### `PasswordReset`
Fields: `organizer` (ref: Organizer), `email`, `reason`, `status` (enum: `Pending|Approved|Rejected`), `adminComment`.  
Used for organizer-to-admin password reset request flow.

---

### 3.4 Controllers

#### `authController.js`
| Function | Route | Notes |
|---|---|---|
| `authUser` | `POST /api/auth/login` | Verifies CAPTCHA, matches bcrypt password, returns JWT. For organizers checks `isArchived`. |
| `registerUser` | `POST /api/auth/register` | Verifies CAPTCHA, auto-detects IIIT by email domain (`iiit.ac.in`). |
| `getUserProfile` | `GET /api/auth/profile` | Returns user + organizer details if `role=organizer`. |
| `updateUserProfile` | `PUT /api/auth/profile` | Allows name/contact/password changes. Organizers also update Organizer doc fields (name, description, category, discordWebhook, contactEmail). Organizers cannot change password directly via this endpoint. |
| `updatePreferences` | `PUT /api/auth/preferences` | Updates `interests` and `following` arrays. |
| `forgotPassword` | `POST /api/auth/forgot-password` | Generates 10-min JWT reset token, mocks email to console. |
| `resetPassword` | `POST /api/auth/reset-password` | Verifies token, updates user password. |

#### `eventController.js`
| Function | Route | Notes |
|---|---|---|
| `createEvent` | `POST /api/events` | Organizer only. Sends Discord webhook if status=Published. |
| `getEvents` | `GET /api/events` | Public (optionalProtect). Personalization: +1000 score for followed organizers, +50 for tag/interest match. Supports `?search=`, `?type=`, `?organizer=`. |
| `getMyEvents` | `GET /api/events/my` | Organizer only. Returns events with pending/confirmed/rejected counts. |
| `getEventById` | `GET /api/events/:id` | Public. Populates organizer name/category/contactEmail/description. |
| `updateEvent` | `PUT /api/events/:id` | Organizer only, ownership check. Blocks form field changes if registrations exist. Sends Discord webhook on Publish. |
| `deleteEvent` | `DELETE /api/events/:id` | Organizer only, ownership check. |
| `getRecommendedEvents` | `GET /api/events/recommended` | Private. Filters Published events by user interests/following. |
| `getTrendingEvents` | `GET /api/events/trending` | Public. Aggregates top 5 events by registrations in last 24h. Falls back to recent Published events. |
| `getEventAnalytics` | `GET /api/events/:id/analytics` | Organizer only. Returns totalReg, confirmedReg, pendingReg, totalRevenue, dailyStats. |
| `exportEventCsv` | `GET /api/events/:id/csv` | Organizer only. Returns CSV with Ticket ID, Name, Email, Phone, College, Date. |

#### `registrationController.js`
| Function | Route | Notes |
|---|---|---|
| `registerEvent` | `POST /api/registrations` | Checks duplicate, seat limit, IIIT eligibility. For Merchandise: validates stock/limit/variants, deducts stock immediately, sets status=Pending if totalCost>0. For normal free events: status=Confirmed + generates ticketId. Sends email (confirmed or payment-required). |
| `getMyRegistrations` | `GET /api/registrations/my` | Returns user's registrations, populated with event details. |
| `checkRegistration` | `GET /api/registrations/check/:eventId` | Returns `{isRegistered, registration}`. |
| `getEventRegistrations` | `GET /api/registrations/event/:eventId` | Organizer view of all registrations with user details. |
| `updateRegistrationStatus` | `PUT /api/registrations/:id/status` | Organizer: Confirm/Reject. On Confirm: generates ticketId, increments event count, sends email. On Reject/Cancel: restores merchandise stock, decrements count if was Confirmed. |
| `uploadPaymentProof` | `PUT /api/registrations/:id/payment` | Participant uploads payment proof URL. |
| `downloadIcs` | `GET /api/registrations/:id/ics` | Returns `.ics` calendar file for the event. |

#### `adminController.js`
| Function | Route | Notes |
|---|---|---|
| `getClubs` | `GET /api/admin/clubs` | Any authenticated user. Returns all Organizers. |
| `addClub` | `POST /api/admin/clubs` | Admin only. Creates User (role=organizer) + Organizer doc. Password from `DEFAULT_CLUB_PASSWORD` env var. |
| `deleteClub` | `DELETE /api/admin/clubs/:id` | Admin only. Deletes Organizer + its linked User. |
| `toggleArchiveStatus` | `PUT /api/admin/clubs/:id/archive` | Admin only. Flips `isArchived`. Archived organizers cannot login. |
| `getClubById` | `GET /api/admin/clubs/:id` | Authenticated. |
| `updateClubProfile` | `PUT /api/admin/clubs/profile` | Organizer only. Updates own club name/desc/contactEmail/category. |
| `requestPasswordReset` | `POST /api/admin/reset-request` | **Public** (organizer can't login to request). Looks up Organizer by `contactEmail`. |
| `getResetRequests` | `GET /api/admin/reset-requests` | Admin only. |
| `processResetRequest` | `PUT /api/admin/reset-request/:id` | Admin only. On Approve: generates 8-char random password and stores in `adminComment`. |
| `resetDatabase` | `POST /api/admin/reset-database` | Admin only. Clears all data except admin user, re-seeds 10 clubs + 7 users + ~40 events (4 per club). |

#### `attendanceController.js`
| Function | Route | Notes |
|---|---|---|
| `markAttendance` | `POST /api/attendance/mark` | Looks up registration by `ticketId`. Marks `attended=true`. Returns error if already attended. |
| `getAttendanceStats` | `GET /api/attendance/stats/:eventId` | Returns total confirmed, attended count, recent 10 scans. |
| `exportAttendance` | `GET /api/attendance/export/:eventId` | Returns CSV: TicketID, Name, Email, Contact, College, Attended (Yes/No), Check-in Time. |

#### `chatController.js`
| Function | Route | Notes |
|---|---|---|
| `getEventMessages` | `GET /api/chat/event/:eventId` | Returns all messages (populated sender + parentMessage), sorted oldest first. |
| `togglePinMessage` | `PUT /api/chat/message/:id/pin` | Flips `isPinned`. Emits `message_updated` socket event. |
| `deleteMessage` | `DELETE /api/chat/message/:id` | Allowed if sender or organizer role. Emits `message_deleted`. |
| `reactToMessage` | `PUT /api/chat/message/:id/react` | Toggles reaction (Map of userId→emoji). Emits `message_updated`. |

#### `feedbackController.js`
| Function | Route | Notes |
|---|---|---|
| `addFeedback` | `POST /api/feedback` | Participant must have Confirmed registration. One feedback per user per event (compound index). Always anonymous. |
| `getEventFeedback` | `GET /api/feedback/event/:identifier` | Organizer view. Returns `{averageRating, ratingDistribution, comments}`. User field excluded for anonymity. |

---

### 3.5 Middleware

**`authMiddleware.js`**
- `protect` — verifies Bearer JWT, attaches `req.user` (User doc, no password).
- `admin` — checks `req.user.role === 'admin'`.
- `authorize(...roles)` — checks `req.user.role` is in the provided roles list.
- `optionalProtect` — same as protect but continues (as guest) if no/invalid token.

**`rateLimiter.js`** — `loginLimiter` applied to `POST /api/auth/login`.

### 3.6 Utils

| File | Purpose |
|---|---|
| `generateToken.js` | `jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' })` |
| `sendEmail.js` | nodemailer via Gmail SMTP (port 465). Gracefully skips if `SMTP_EMAIL`/`SMTP_PASSWORD` missing. |
| `discordWebhook.js` | `axios.post(webhookUrl, { content: message })`. Uses organizer-level webhook URL if provided, else falls back to global env var. |
| `captcha.js` | Verifies Google reCAPTCHA v2 token against `RECAPTCHA_SECRET_KEY`. Returns `{success, message}`. |

---

## 4. Frontend

### 4.1 Tech Stack
React 19 + Vite 7 + TailwindCSS v4 + React Router v7 + Axios + Socket.io-client + react-google-recaptcha + html5-qrcode + react-toastify

### 4.2 Auth Context
`src/context/AuthContext.jsx` — stores user info from `localStorage`. Token stored as `localStorage.getItem('token')`.

### 4.3 Routes (App.jsx)

| Path | Component | Access |
|---|---|---|
| `/login` | `Login` | Public |
| `/signup` | `Signup` | Public |
| `/forgot-password` | `ForgotPassword` | Public |
| `/reset-password/:token` | `ResetPassword` | Public |
| `/reset-request` | `ResetRequest` | Public (organizer flow) |
| `/dashboard` | `Dashboard` | Private |
| `/admin/dashboard` | `AdminDashboard` | Private |
| `/organizer/dashboard` | `OrganizerDashboard` | Private |
| `/organizer/events/create` | `EventCreate` | Private |
| `/organizer/events/edit/:id` | `EventEdit` | Private |
| `/organizer/events/:id` | `OrganizerEventDetails` | Private |
| `/organizer/scanner` | `AttendanceScanner` | Private |
| `/events` | `BrowseEvents` | Private |
| `/events/:id` | `EventDetails` | Private |
| `/my-registrations` | `MyRegistrations` | Private |
| `/onboarding` | `Onboarding` | Private |
| `/profile` | `Profile` | Private |
| `/clubs` | `Clubs` | Private |
| `/clubs/:id` | `ClubDetails` | Private |
| `/notifications` | `Notifications` | Private |

> `PrivateRoute` simply checks `localStorage.getItem('token')`, redirects to `/login` if missing.

### 4.4 Pages

**Participant-facing:**
- `Login.jsx` — email/password + Google reCAPTCHA v2 widget
- `Signup.jsx` — registration form + reCAPTCHA
- `Dashboard.jsx` — landing after login; redirects by role
- `BrowseEvents.jsx` — search/filter events, shows Trending section, recommended events
- `EventDetails.jsx` — full event page: register button, merchandise selector, `DiscussionForum` component, `FeedbackForm` component, QR code of ticket
- `MyRegistrations.jsx` — shows all user registrations (Pending/Confirmed/Rejected), payment proof upload for Pending, ICS download, view ticket QR
- `Onboarding.jsx` — interest selection + follow clubs (shown after first login)
- `Clubs.jsx` — list all organizer clubs, filter by category
- `ClubDetails.jsx` — club info + their events list, follow/unfollow button
- `Profile.jsx` — edit name/contact/password (participants) OR organizer details (name, description, category, contactEmail, discordWebhook)
- `Notifications.jsx` — list all notifications, mark as read
- `ForgotPassword.jsx` — request token; logs link to console (mock email)
- `ResetPassword.jsx` — enter new password using URL token

**Organizer-facing (`pages/organizer/`):**
- `OrganizerDashboard.jsx` — tabbed dashboard: My Events list (with stats), registrations management (approve/reject), analytics charts, feedback view, attendance stats
- `EventCreate.jsx` — create event form: supports Normal (with `FormBuilder`) and Merchandise (with `MerchandiseBuilder`), set status Draft or Publish directly
- `EventEdit.jsx` — edit existing event, same form as create but pre-filled; enforces edit rules: Published events can only change description/deadline/limit/status
- `OrganizerEventDetails.jsx` — detailed view of one event for organizer: registrations table, payment proof review, analytics
- `AttendanceScanner.jsx` — uses `QRScanner` component to scan ticket QR codes
- `ResetRequest.jsx` — public form for organizer to submit a password reset request to admin

**Admin-facing:**
- `AdminDashboard.jsx` — tabbed: Clubs management (add/delete/archive/unarchive), password reset requests (approve/reject), reset database button

### 4.5 Components

| Component | Purpose |
|---|---|
| `Navbar.jsx` | Role-aware nav links: Participant (Events, Clubs, My Registrations, Notifications), Organizer (Dashboard, Create Event, Scanner), Admin (Dashboard). Shows profile link + logout. |
| `DiscussionForum.jsx` | Real-time event chat forum. Connects via socket.io to room `event_<id>`. Shows messages with threading, reactions, pin indicators. Organizers can pin/delete. |
| `FeedbackForm.jsx` | Star rating + comment form. Calls `POST /api/feedback`. Only shown after event end if user is Confirmed. |
| `FormBuilder.jsx` | Drag/add-able form field builder for Normal events. Fields: text, number, dropdown, checkbox, file. |
| `FormRenderer.jsx` | Renders dynamic form fields from `formFields[]` schema at registration time. |
| `MerchandiseBuilder.jsx` | UI to add merchandise items (name, price, stock, description, image URL, limitPerUser, variants). |
| `QRScanner.jsx` | Wraps `html5-qrcode` library. Calls `POST /api/attendance/mark` with scanned ticketId. |

---

## 5. Tests (`tests/`)

All test files use `axios` and hit `http://localhost:5000/api/*`. Run with `node tests/<file>.js`.

| File | Tests |
|---|---|
| `auth_test.js` | Register, login, profile get/update |
| `admin_test.js` | Club CRUD, archive, reset DB |
| `event_crud_test.js` | Create/read/update/delete events |
| `registration_test.js` | Register for event, check status |
| `my_registrations_test.js` | My registrations list, payment proof upload |
| `attendance_test.js` | markAttendance, getStats, exportCSV |
| `chat_test.js` | Get messages, pin, delete, react |
| `feedback_test.js` | Add feedback, get event feedback |
| `eligibility_test.js` | IIIT-only eligibility enforcement |
| `filtering_test.js` | Search/filter events |
| `merch_workflow_test.js` | Merch selection, stock deduction, approve/reject |
| `discord_test.js` | Discord webhook trigger on publish |
| `analytics_test.js` | Event analytics endpoint |
| `recommendation_test.js` | Recommended/trending events |
| `form_lock_test.js` | Cannot change formFields after registrations exist |
| `calendar_test.js` | ICS download |
| `forgot_password_test.js` | Forgot/reset password flow |
| `password_reset_test.js` | Organizer password reset via admin |
| `onboarding_test.js` | Interests/following update |
| `profile_test.js` | Profile update |
| `org_profile_test.js` | Organizer profile update |
| `club_details_test.js` | Club details fetch |
| `team_test.js` | (Legacy) team-related tests — team feature was **removed** |
| `verify_captcha.js` | CAPTCHA verification check |
| `verify_participant_features.js` | End-to-end participant flow |
| `verifyAdmin.js` | Admin flow verification |
| `clean_test.js` | Cleanup helper |

---

## 6. Key Business Logic & Flows

### Registration Flow
1. User selects event → hits `POST /api/registrations`
2. Checks: duplicate, seat limit, IIIT eligibility
3. **Normal free event** → status=Confirmed, ticketId generated, email sent
4. **Normal paid event** (registrationFee > 0) → status=Pending
5. **Merchandise** → stock deducted immediately, status=Pending if cost>0
6. Organizer reviews Pending → `PUT /api/registrations/:id/status` → Confirmed (ticketId generated, email sent) or Rejected (stock restored)

### Event Publication + Discord Webhook
- When event status transitions to `Published` (via create or update): `sendDiscordNotification()` is called
- Uses organizer's own `discordWebhook` URL if set, else falls back to global `DISCORD_WEBHOOK_URL` env var

### Attendance Tracking
- Each confirmed registration gets a `ticketId` in format `FEL-XXXXXXXX`
- Frontend generates QR code from ticketId displayed in MyRegistrations
- Organizer scans QR via `AttendanceScanner.jsx` → `POST /api/attendance/mark` → sets `attended=true`

### Discussion Forum
- Real-time via Socket.io room `event_<eventId>`
- Supports: threaded replies (parentMessage), reactions (Map), pinning (organizer), delete (sender or organizer), message types (text/announcement/question)
- Reply to a message triggers a Notification for the original sender

### Password Reset Flows
- **Participants:** Standard forgot-password → JWT token link (mocked to console) → reset-password page
- **Organizers:** Cannot reset own password. Must submit `POST /api/admin/reset-request` (public endpoint, no auth needed). Admin approves via admin dashboard, new 8-char password stored in `adminComment`.

---

## 7. Seeder / DB Reset

`seeder.js` (standalone) or `resetDatabase` controller (via admin dashboard) re-seeds:
- **10 clubs**: Music Club, The Gaming Club, Decore, The Dance Crew, Cyclorama, LitClub, Pentaprism, Hacking Club, Programming Club, Amateur Sports Enthusiasts Club
- **7 test users**: Alice (Cultural/IIIT), Bob (Technical/Non-IIIT), Charlie (Sports/IIIT), David (Technical/Non-IIIT), Eve (Both/IIIT), Frank (Music/IIIT), **Rachit Mehta** (`rachit.mehta@students.iiit.ac.in` / `rm123`)
- **~40 events** (4 per club): 1 Completed (past), 1 Ongoing, 1 Published (future), 1 Draft/Cancelled

---

## 8. Notable Implementation Details

- **CAPTCHA** is required on login AND register (Google reCAPTCHA v2). Backend verifies with `RECAPTCHA_SECRET_KEY`. Frontend uses `react-google-recaptcha` with `VITE_RECAPTCHA_SITE_KEY`.
- **Rate Limiter** on login route via `express-rate-limit`.
- **Stock management** for merchandise: stock deducted on registration, restored on reject/cancel.
- **Form lock**: cannot edit `formFields` after any registration exists for that event.
- **optionalProtect** middleware enables personalized event listing for logged-in users while still serving public guests.
- **Team feature was fully removed** — `team_test.js` is legacy/dead.
- **ICS calendar download** supported for confirmed registrations.
- **CSV export** available for both event registrations and attendance.
- Password for organizer accounts is set via `DEFAULT_CLUB_PASSWORD` env var (admin-managed).

---

## 9. Running Locally

```bash
# Backend
cd 2024101089/backend
npm install
npm run dev       # nodemon server.js → port 5000

# Frontend
cd 2024101089/frontend
npm install
npm run dev       # vite → port 5173

# Tests (backend must be running)
cd 2024101089/tests
node auth_test.js
node admin_test.js
# etc.
```
