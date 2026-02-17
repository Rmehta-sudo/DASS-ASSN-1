const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testDiscord = async () => {
    console.log("Starting Discord Webhook Tests...");

    // Check if env var is set (Optional for this test, but good to know)
    // We cannot access server-side env here directly, but we can infer from success

    let organizerToken, eventId;

    try {
        // 1. Organizer Login
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        // 2. Create Event (Triggers Webhook log on server)
        console.log("\n2. Creating Published Event...");
        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Discord Test Event " + Date.now(),
            description: "Testing connection",
            type: "Normal",
            startDate: new Date().toISOString(),
            registrationLimit: 50,
            status: "Published"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;

        console.log("✅ Event Created - Check Server Logs for 'Discord notification sent' or 'Skipping'");

        // Cleanup
        await axios.delete(`${API_URL}/events/${eventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testDiscord();
