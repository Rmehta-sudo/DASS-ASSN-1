const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testMyRegistrations = async () => {
    console.log("Starting My Registrations Tests...");
    let organizerToken = null;
    let participantToken = null;
    let eventId = null;

    try {
        // --- SETUP: Create Event ---
        console.log("\n0. Creating Test Event...");
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Reg Test " + Date.now(),
            description: "Testing My Registrations",
            type: "Normal",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            deadline: new Date(Date.now() + 80000000).toISOString(),
            registrationLimit: 10,
            tags: "test"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });

        eventId = eventRes.data._id;

        // Publish it
        await axios.put(`${API_URL}/events/${eventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });

        // --- PARTICIPANT FLOW ---
        console.log("\n1. Participant Registration & Login...");
        const uniqueEmail = `student${Date.now()}@students.iiit.ac.in`;
        try {
            await axios.post(`${API_URL}/auth/register`, {
                firstName: "Reg", lastName: "Tester", email: uniqueEmail, password: "password123", contactNumber: "9999999999"
            });
        } catch (e) { }

        const loginRes = await axios.post(`${API_URL}/auth/login`, { email: uniqueEmail, password: 'password123' });
        participantToken = loginRes.data.token;
        console.log("✅ Logged in");

        // Register for event
        console.log("\n2. Registering for Event...");
        await axios.post(`${API_URL}/registrations`, { eventId, responses: [] },
            { headers: { Authorization: `Bearer ${participantToken}` } });
        console.log("✅ Registered");

        // --- VERIFY MY REGISTRATIONS ---
        console.log("\n3. Fetching My Registrations...");
        const myRegRes = await axios.get(`${API_URL}/registrations/my`,
            { headers: { Authorization: `Bearer ${participantToken}` } });

        const myReg = myRegRes.data.find(r => r.event._id === eventId);

        if (myReg) {
            console.log(`✅ Found Registration!`);
            console.log(`   Event: ${myReg.event.name}`);
            console.log(`   Status: ${myReg.status}`);
            console.log(`   Ticket ID: ${myReg.ticketId}`);
        } else {
            console.error("❌ Registration NOT found in 'My Registrations' list!");
        }

        // Cleanup
        await axios.delete(`${API_URL}/events/${eventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
    }
};

testMyRegistrations();
