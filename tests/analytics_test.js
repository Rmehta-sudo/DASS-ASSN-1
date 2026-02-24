const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testAnalytics = async () => {
    console.log("Starting Analytics Tests...");

    let organizerToken, participantToken, eventId;

    try {
        // 1. Organizer Login & Create Event
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Analytics Party",
            description: "Data Science Fun",
            type: "Normal",
            startDate: new Date().toISOString(),
            registrationFee: 100,
            registrationLimit: 100
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;

        await axios.put(`${API_URL}/events/${eventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });

        // 2. Participant Register (Pending)
        const uniqueEmail = `analyst${Date.now()}@students.iiit.ac.in`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            firstName: "Data", lastName: "Analyst",
            email: uniqueEmail, password: "password123", contactNumber: "9999999999"
        });
        participantToken = regRes.data.token;

        await axios.post(`${API_URL}/registrations`, {
            eventId,
            responses: []
        }, { headers: { Authorization: `Bearer ${participantToken}` } });
        console.log("✅ Participant Registered");

        // 3. Fetch Analytics
        console.log("\n3. Fetching Analytics...");
        const analyticsRes = await axios.get(`${API_URL}/events/${eventId}/analytics`, {
            headers: { Authorization: `Bearer ${organizerToken}` }
        });

        const data = analyticsRes.data;
        console.log("   Revenue:", data.totalRevenue);
        console.log("   Pending:", data.pendingRegistrations);

        if (data.totalRegistrations === 1 && data.pendingRegistrations === 1 && data.totalRevenue === 0) {
            console.log("✅ Analytics Verified (Pending)");
        } else {
            console.error("❌ Analytics Mismatch");
            console.log(data);
            process.exit(1);
        }

        // Cleanup
        await axios.delete(`${API_URL}/events/${eventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testAnalytics();
