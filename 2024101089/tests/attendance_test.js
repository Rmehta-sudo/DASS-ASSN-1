const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testAttendance = async () => {
    console.log("Starting Attendance Flow Tests...");
    let organizerToken, userToken;
    let eventId;
    let ticketId;

    try {
        // --- 0. SETUP ---
        const registerUser = async (name) => {
            const email = `${name.toLowerCase()}${Date.now()}@test.com`;
            await axios.post(`${API_URL}/auth/register`, {
                firstName: name, lastName: "Test", email, password: "password123", contactNumber: "9999999999"
            });
            const res = await axios.post(`${API_URL}/auth/login`, { email, password: "password123" });
            return res.data.token;
        };

        // Login Admin to create Organizer
        const adminLogin = await axios.post(`${API_URL}/auth/login`, { email: 'admin@felicity.iiit.ac.in', password: 'adminpassword' });
        const adminToken = adminLogin.data.token;

        const orgEmail = `org_att_${Date.now()}@clubs.iiit.ac.in`;
        await axios.post(`${API_URL}/admin/clubs`, {
            name: "Attendance Club " + Date.now(), category: "Clubs", email: orgEmail, description: "Test"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const orgLogin = await axios.post(`${API_URL}/auth/login`, { email: orgEmail, password: 'password123' });
        organizerToken = orgLogin.data.token;

        userToken = await registerUser("Attendee");

        // --- 1. Create Event ---
        console.log("\n1. Creating Event...");
        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Concert " + Date.now(),
            description: "Music",
            type: "Normal",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            deadline: new Date(Date.now() + 80000000).toISOString(),
            registrationLimit: 100,
            tags: "fun"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;

        await axios.put(`${API_URL}/events/${eventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });

        // --- 2. Register User ---
        console.log("\n2. Registering User...");
        const regRes = await axios.post(`${API_URL}/registrations`, {
            eventId,
            responses: []
        }, { headers: { Authorization: `Bearer ${userToken}` } });

        ticketId = regRes.data.ticketId;
        console.log(`✅ Registration Successful. Ticket ID: ${ticketId}`);

        if (!ticketId) throw new Error("Ticket ID not generated!");

        // --- 3. Mark Attendance (Scan) ---
        console.log("\n3. Marking Attendance...");
        const scanRes = await axios.post(`${API_URL}/attendance/mark`, {
            ticketId
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });

        console.log(`✅ Scan Result: ${scanRes.data.message}`);
        if (scanRes.data.message !== 'Attendance Marked Successfully') throw new Error("Unexpected message");

        // --- 4. Mark Again (Should Fail) ---
        console.log("\n4. Marking Duplicate Attendance...");
        try {
            await axios.post(`${API_URL}/attendance/mark`, {
                ticketId
            }, { headers: { Authorization: `Bearer ${organizerToken}` } });
            console.error("❌ Should have failed!");
        } catch (e) {
            console.log(`✅ Expected Error: ${e.response?.data?.error || e.response?.data?.message}`);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
    }
};

testAttendance();
