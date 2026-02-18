const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testFeedback = async () => {
    console.log("Starting Feedback Tests...");
    let userToken;
    let eventId;

    try {
        // --- 0. SETUP ---
        const registerUser = async (name) => {
            const email = `${name.toLowerCase()}${Date.now()}@feedback.com`;
            await axios.post(`${API_URL}/auth/register`, {
                firstName: name, lastName: "Test", email, password: "password123", contactNumber: "9999999999",
                captchaToken: "test-token"
            });
            const res = await axios.post(`${API_URL}/auth/login`, { email, password: "password123", captchaToken: "test-token" });
            return res.data.token;
        };

        userToken = await registerUser("Reviewer");

        // Login Admin to create Organizer
        const adminLogin = await axios.post(`${API_URL}/auth/login`, { email: 'admin@felicity.iiit.ac.in', password: 'thisisadmin', captchaToken: "test-token" });
        const adminToken = adminLogin.data.token;

        const orgEmail = `org_feed_${Date.now()}@clubs.iiit.ac.in`;
        await axios.post(`${API_URL}/admin/clubs`, {
            name: "Feedback Club " + Date.now(), category: "Cultural", email: orgEmail, description: "Test"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        const orgLogin = await axios.post(`${API_URL}/auth/login`, { email: orgEmail, password: 'thisisclub', captchaToken: "test-token" });
        const organizerToken = orgLogin.data.token;

        // --- 1. Create ENDED Event ---
        console.log("\n1. Creating Past Event...");
        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Past Event " + Date.now(),
            description: "History",
            type: "Normal",
            startDate: new Date(Date.now() - 10000000).toISOString(),
            endDate: new Date(Date.now() - 5000000).toISOString(), // Ended
            deadline: new Date(Date.now() - 8000000).toISOString(),
            registrationLimit: 100,
            tags: "history"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;

        // --- 2. Register User & Confirm ---
        console.log("\n2. Registering & Confirming User...");
        const regRes = await axios.post(`${API_URL}/registrations`, {
            eventId,
            responses: []
        }, { headers: { Authorization: `Bearer ${userToken}` } });

        // Mark as Confirmed (Simulating Ticket Scan)
        await axios.post(`${API_URL}/attendance/mark`, {
            ticketId: regRes.data.ticketId
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });

        console.log("✅ User Confirmed/Attended");

        // --- 3. Submit Feedback ---
        console.log("\n3. Submitting Feedback...");
        const rating = 5;
        const comment = "Great event!";

        await axios.post(`${API_URL}/feedback`, {
            eventId,
            rating,
            comment
        }, { headers: { Authorization: `Bearer ${userToken}` } });

        console.log("✅ Feedback Submitted");

        // --- 4. Verify Feedback ---
        console.log("\n4. Verifying Feedback Retrieval...");
        const feedRes = await axios.get(`${API_URL}/feedback/event/${eventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

        if (feedRes.data.comments.length > 0 && feedRes.data.comments[0].text === comment) {
            console.log("✅ Feedback Retrieved Successfully");
        } else {
            console.error("❌ Feedback Not Found in Response");
        }

        // --- 5. Verify Duplicate fails ---
        console.log("\n5. Testing Duplicate Submission...");
        try {
            await axios.post(`${API_URL}/feedback`, {
                eventId,
                rating: 1,
                comment: "Bad duplicate"
            }, { headers: { Authorization: `Bearer ${userToken}` } });
            console.error("❌ Should have failed!");
        } catch (e) {
            console.log(`✅ Expected Error: ${e.response?.data?.message}`);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
    }
};

testFeedback();
