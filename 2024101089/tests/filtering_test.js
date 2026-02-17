const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testFiltering = async () => {
    console.log("Starting Event Filtering Tests...");

    let organizerToken;
    let event1Id, event2Id;

    try {
        // 1. Setup Organizer & Events
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        // Create "Rock Concert" (Normal)
        const e1 = await axios.post(`${API_URL}/events`, {
            name: "Rock Concert",
            description: "Live loud music",
            type: "Normal",
            startDate: new Date().toISOString(),
            registrationLimit: 500
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        event1Id = e1.data._id;
        await axios.put(`${API_URL}/events/${event1Id}`, { status: 'Published' }, { headers: { Authorization: `Bearer ${organizerToken}` } });

        // Create "Band T-Shirt" (Merchandise)
        const e2 = await axios.post(`${API_URL}/events`, {
            name: "Band T-Shirt",
            description: "Official Merch",
            type: "Merchandise",
            startDate: new Date().toISOString(),
            registrationLimit: 100
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        event2Id = e2.data._id;
        await axios.put(`${API_URL}/events/${event2Id}`, { status: 'Published' }, { headers: { Authorization: `Bearer ${organizerToken}` } });

        console.log("✅ Test Events Created");

        // 2. Test Search "Rock"
        console.log("\n2. Searching for 'Rock'...");
        const searchRes = await axios.get(`${API_URL}/events?search=rock`);
        if (searchRes.data.some(e => e.name === "Rock Concert") && !searchRes.data.some(e => e.name === "Band T-Shirt")) {
            console.log("✅ Search Verified");
        } else {
            console.error("❌ Search Failed");
            process.exit(1);
        }

        // 3. Test Type Filter "Merchandise"
        console.log("\n3. Filtering by Type 'Merchandise'...");
        const typeRes = await axios.get(`${API_URL}/events?type=Merchandise`);
        if (typeRes.data.some(e => e.name === "Band T-Shirt") && !typeRes.data.some(e => e.name === "Rock Concert")) {
            console.log("✅ Type Filter Verified");
        } else {
            console.error("❌ Type Filter Failed");
            process.exit(1);
        }

        // Cleanup
        await axios.delete(`${API_URL}/events/${event1Id}`, { headers: { Authorization: `Bearer ${organizerToken}` } });
        await axios.delete(`${API_URL}/events/${event2Id}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testFiltering();
