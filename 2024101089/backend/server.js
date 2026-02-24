const express = require('express');
const http = require('http'); // Import HTTP
const { Server } = require("socket.io"); // Import Server
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const connectDB = require('./config/db');
const Message = require('./models/Message'); // Import Message Model

// Load env vars
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

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

const attendanceRoutes = require('./routes/attendanceRoutes');
const chatRoutes = require('./routes/chatRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const Notification = require('./models/Notification'); // Import Notification Model

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

app.use('/api/attendance', attendanceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/uploads', uploadRoutes);

// Make io accessible to our router
app.set('io', io);

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    // Join Room (Event or Team)
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    // Join User Specific Room for Notifications
    socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${socket.id} joined user room: user_${userId}`);
    });

    // Send Message
    socket.on('send_message', async (data) => {
        // data: { room, content, senderId, type (event/team), objectId, parentMessage, messageType }
        const { room, content, senderId, type, objectId, parentMessage, messageType } = data; // objectId = eventId or teamId

        // Save to DB
        try {
            const messageData = {
                sender: senderId,
                content,
                event: type === 'event' ? objectId : null,
                team: type === 'team' ? objectId : null,
                parentMessage: parentMessage || null,
                type: messageType || 'text'
            };
            const msg = await Message.create(messageData);

            // Populate sender for frontend
            await msg.populate('sender', 'firstName lastName');
            if (msg.parentMessage) {
                await msg.populate('parentMessage');
            }

            // Broadcast to room
            io.to(room).emit('receive_message', msg);

            // New: Emit system notification to the room (excluding sender) 
            // This is for the live notification system for new messages
            socket.to(room).emit('receive_notification', {
                message: `New message from ${msg.sender.firstName}: "${content.substring(0, 30)}..."`,
                type: 'system',
                relatedId: objectId
            });

            // --- Notification Logic ---
            // 1. Reply Notification
            if (parentMessage) {
                const parentMsg = await Message.findById(parentMessage);
                if (parentMsg && parentMsg.sender.toString() !== senderId) {
                    // Create notification for original sender
                    await Notification.create({
                        recipient: parentMsg.sender,
                        message: `New reply to your message in ${type}: "${content.substring(0, 30)}..."`,
                        type: 'reply',
                        relatedId: objectId // Link to event/team
                    });

                    // Emit real-time notification
                    io.to(`user_${parentMsg.sender}`).emit('receive_notification', {
                        message: `New reply from ${msg.sender.firstName}: "${content.substring(0, 30)}..."`,
                        type: 'reply',
                        relatedId: objectId
                    });
                }
            }

            // 2. Announcement Notification (if messageType is announcement)
            if (messageType === 'announcement') {
                // For now, we might not want to create a DB notification for EVERY user as it's expensive.
                // But we can emit a socket event to the room.
                socket.to(room).emit('receive_notification', {
                    message: `New announcement: ${content.substring(0, 50)}...`,
                    type: 'announcement',
                    relatedId: objectId
                });
            }

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
