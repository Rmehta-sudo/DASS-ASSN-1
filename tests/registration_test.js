const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testRegistration = async () => {
    console.log("Starting Registration Flow Tests...");
    let organizerToken = null;
    let participantToken = null;
    let eventId = null;

    try {
        // --- PRE-REQUISITE: Create an Event ---
        console.log("\n0. Logging in as Organizer to create event...");
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Test Concert " + Date.now(),
            description: "Live music!",
            type: "Normal",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            deadline: new Date(Date.now() + 80000000).toISOString(),
            registrationLimit: 50,
            tags: "music,test"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });

        eventId = eventRes.data._id;
        console.log(`✅ Organization created event: ${eventRes.data.name}`);

        // Update to Published
        await axios.put(`${API_URL}/events/${eventId}`, {
            status: 'Published'
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        console.log(`✅ Event Published`);


        // --- PARTICIPANT FLOW ---

        // 1. Register a new user (Participant)
        console.log("\n1. Registering new Participant...");
        const uniqueEmail = `student${Date.now()}@students.iiit.ac.in`;
        try {
            await axios.post(`${API_URL}/auth/register`, {
                firstName: "Test",
                lastName: "Student",
                email: uniqueEmail,
                password: "password123",
                contactNumber: "9876543210"
            });
        } catch (e) { }

        // Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email: uniqueEmail, password: 'password123' });
        participantToken = loginRes.data.token;
        console.log("✅ Participant Login Successful");

        const config = { headers: { Authorization: `Bearer ${participantToken}` } };

        // 2. Fetch Events (Verification)
        console.log("\n2. Fetching Events...");
        const eventsRes = await axios.get(`${API_URL}/events`);
        const foundEvent = eventsRes.data.find(e => e._id === eventId);
        if (!foundEvent) throw new Error("Created event not found in list!");
        console.log(`✅ Found event in list: ${foundEvent.name}`);

        // 3. Register for Event
        console.log("\n3. Registering for Event...");
        const regRes = await axios.post(`${API_URL}/registrations`, {
            eventId: eventId,
            responses: []
        }, config);
        console.log("✅ Registration Successful. Status:", regRes.data.status);

        // 4. Verify Registration Check
        console.log("\n4. Verifying Registration Status...");
        const checkRes = await axios.get(`${API_URL}/registrations/check/${eventId}`, config);
        if (checkRes.data.isRegistered) {
            console.log("✅ Verification Confirmed: User is registered.");
        } else {
            console.error("❌ Verification Failed: API says not registered.");
        }

        // 5. Cleanup
        console.log("\n5. Cleaning up (Deleting Event)...");
        await axios.delete(`${API_URL}/events/${eventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });
        console.log("✅ Event Deleted");

    } catch (error) {
        console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
    }
};

testRegistration();
