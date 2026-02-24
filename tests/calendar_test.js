const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testCalendar = async () => {
    console.log("Starting Calendar Tests...");

    let organizerToken, participantToken, eventId, registrationId;

    try {
        // 1. Organizer Login & Create Event
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Cal Test Event",
            description: "ICS Generation",
            type: "Normal",
            startDate: new Date().toISOString(),
            registrationLimit: 50
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;

        await axios.put(`${API_URL}/events/${eventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });

        // 2. Participant Register
        const uniqueEmail = `cal${Date.now()}@students.iiit.ac.in`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            firstName: "Cal", lastName: "User",
            email: uniqueEmail, password: "password123", contactNumber: "9999999999"
        });
        participantToken = regRes.data.token;

        const purchaseRes = await axios.post(`${API_URL}/registrations`, {
            eventId,
            responses: []
        }, { headers: { Authorization: `Bearer ${participantToken}` } });
        registrationId = purchaseRes.data._id;

        // 3. Download ICS
        console.log("\n3. Downloading ICS...");
        const icsRes = await axios.get(`${API_URL}/registrations/${registrationId}/ics`, {
            headers: { Authorization: `Bearer ${participantToken}` }
        });

        if (icsRes.data && icsRes.data.includes("BEGIN:VCALENDAR")) {
            console.log("✅ ICS File Generated Successfully");
        } else {
            console.error("❌ Invalid ICS Content");
            process.exit(1);
        }

        // Cleanup
        await axios.delete(`${API_URL}/events/${eventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testCalendar();
