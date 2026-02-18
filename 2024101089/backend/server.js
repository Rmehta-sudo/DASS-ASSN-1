const express = require('express');
const http = require('http'); // Import HTTP
const { Server } = require("socket.io"); // Import Server
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const connectDB = require('./config/db');
const Message = require('./models/Message'); // Import Message Model

// Load env vars
dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.".red.bold);
    process.exit(1);
}

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// CORS Config
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL // Deployed Frontend URL
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Logging middleware (Student style)
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const teamRoutes = require('./routes/teamRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const chatRoutes = require('./routes/chatRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes'); // Import feedbackRoutes

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes); // Use feedbackRoutes

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    // Join Room (Event or Team)
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    // Send Message
    socket.on('send_message', async (data) => {
        // data: { room, content, senderId, type (event/team), objectId }
        const { room, content, senderId, type, objectId } = data; // objectId = eventId or teamId

        // Save to DB
        try {
            const messageData = {
                sender: senderId,
                content,
                event: type === 'event' ? objectId : null,
                team: type === 'team' ? objectId : null
            };
            await Message.create(messageData);

            // Broadcast to room (including sender for simplicity, or exclude sender on frontend)
            io.to(room).emit('receive_message', data);
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
    });
});

// Basic route
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => { // Changed app.listen to server.listen
    console.log(`Server running on port ${PORT}`);
});
