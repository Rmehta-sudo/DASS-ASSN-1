const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const testChat = async () => {
    console.log("Starting Chat Tests...");
    let tokenA, tokenB;
    let eventId;

    try {
        // --- 0. SETUP ---
        const registerUser = async (name) => {
            const email = `${name.toLowerCase()}${Date.now()}@chat.com`;
            await axios.post(`${API_URL}/auth/register`, {
                firstName: name, lastName: "Test", email, password: "password123", contactNumber: "9999999999"
            });
            const res = await axios.post(`${API_URL}/auth/login`, { email, password: "password123" });
            return { token: res.data.token, user: res.data };
        };

        const userA = await registerUser("AliceChat");
        const userB = await registerUser("BobChat");
        tokenA = userA.token;
        tokenB = userB.token;

        // Login Admin to create Organizer for Event
        const adminLogin = await axios.post(`${API_URL}/auth/login`, { email: 'admin@felicity.iiit.ac.in', password: 'adminpassword' });
        const adminToken = adminLogin.data.token;

        const orgEmail = `org_chat_${Date.now()}@clubs.iiit.ac.in`;
        await axios.post(`${API_URL}/admin/clubs`, {
            name: "Chat Club " + Date.now(), category: "Clubs", email: orgEmail, description: "Test"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const orgLogin = await axios.post(`${API_URL}/auth/login`, { email: orgEmail, password: 'password123' });
        const organizerToken = orgLogin.data.token;

        // Create Event
        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Chat Event " + Date.now(),
            description: "Talk",
            type: "Normal",
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            deadline: new Date().toISOString(),
            registrationLimit: 100,
            tags: "chat"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;

        // --- 1. Connect Sockets ---
        console.log("\n1. Connecting Sockets...");
        const socketA = io(SOCKET_URL);
        const socketB = io(SOCKET_URL);

        const room = `event_${eventId}`;
        const msgContent = "Hello Bob!";

        await new Promise((resolve) => {
            socketA.on('connect', resolve);
        });
        await new Promise((resolve) => {
            socketB.on('connect', resolve);
        });
        console.log("✅ Sockets Connected");

        // --- 2. Join Room ---
        socketA.emit('join_room', room);
        socketB.emit('join_room', room);

        // --- 3. Send & Receive Message ---
        console.log("\n3. Testing Message Flow...");

        const messagePromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout waiting for message")), 5000);

            socketB.on('receive_message', (data) => {
                clearTimeout(timeout);
                if (data.content === msgContent && data.senderId === userA.user._id) {
                    console.log("✅ Bob Received Message:", data.content);
                    resolve();
                } else {
                    reject(new Error("Received incorrect message data"));
                }
            });
        });

        socketA.emit('send_message', {
            room,
            content: msgContent,
            senderId: userA.user._id,
            type: 'event',
            objectId: eventId
        });

        await messagePromise;

        // --- 4. Verify Persistence ---
        console.log("\n4. Verifying Database Persistence...");
        // Wait a bit for async DB save
        await new Promise(r => setTimeout(r, 1000));

        const chatRes = await axios.get(`${API_URL}/chat/event/${eventId}`, {
            headers: { Authorization: `Bearer ${tokenB}` }
        });

        if (chatRes.data.length > 0 && chatRes.data[chatRes.data.length - 1].content === msgContent) {
            console.log("✅ Message Persisted in DB");
        } else {
            console.error("❌ Message NOT found in DB");
        }

        socketA.disconnect();
        socketB.disconnect();

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
    }
};

testChat();
