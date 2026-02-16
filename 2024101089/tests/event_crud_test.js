const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testEventCRUD = async () => {
    console.log("Starting Event CRUD Tests...");
    let organizerToken = null;
    let eventId = null;

    try {
        // 1. Login as Organizer (Music Club from seeds)
        console.log("\n1. Logging in as Music Club...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = loginRes.data.token;
        console.log("✅ Organizer Login Successful:", loginRes.data.name);

        const config = {
            headers: { Authorization: `Bearer ${organizerToken}` }
        };

        // 2. Create Event
        console.log("\n2. Creating Event...");
        const newEvent = {
            name: "Summer Jam 2025",
            description: "An open mic night for all students.",
            type: "Normal",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            deadline: new Date(Date.now() + 80000000).toISOString(),
            tags: "music, fun, cultural"
        };
        const createRes = await axios.post(`${API_URL}/events`, newEvent, config);
        eventId = createRes.data._id;
        console.log("✅ Event Created:", createRes.data.name);

        // 3. Get My Events
        console.log("\n3. Fetching My Events...");
        const myEventsRes = await axios.get(`${API_URL}/events/my`, config);
        console.log(`✅ Fetched ${myEventsRes.data.length} events for this organizer`);

        // 4. Update Event
        console.log("\n4. Updating Event...");
        const updateRes = await axios.put(`${API_URL}/events/${eventId}`, {
            name: "Summer Jam 2025 (Updated)"
        }, config);
        console.log("✅ Event Updated:", updateRes.data.name);

        // 5. Delete Event
        console.log("\n5. Deleting Event...");
        await axios.delete(`${API_URL}/events/${eventId}`, config);
        console.log("✅ Event Deleted");

    } catch (error) {
        console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
    }
};

testEventCRUD();
