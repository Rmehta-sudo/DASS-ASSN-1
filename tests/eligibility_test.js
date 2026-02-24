const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testEligibility = async () => {
    console.log("Starting Eligibility Enforcement Tests...");

    let organizerToken, iiitToken, nonIiitToken, eventId;

    try {
        // 1. Organizer Login & Create IIIT-Only Event
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "IIIT Exclusive Night",
            description: "Only for IIITians",
            type: "Normal",
            startDate: new Date().toISOString(),
            eligibility: "IIIT Only",
            registrationLimit: 100
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;

        await axios.put(`${API_URL}/events/${eventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });
        console.log("✅ IIIT-Only Event Created");

        // 2. Register Non-IIIT User
        const nonIiitEmail = `noniiit${Date.now()}@gmail.com`;
        const regNon = await axios.post(`${API_URL}/auth/register`, {
            firstName: "Non", lastName: "IIITian",
            email: nonIiitEmail, password: "password123", contactNumber: "9999999999",
            participantType: "Non-IIIT"
        });
        nonIiitToken = regNon.data.token;

        // 3. Attempt Registration (Should Fail)
        console.log("\n3. Non-IIIT User Attempting to Register...");
        try {
            await axios.post(`${API_URL}/registrations`, {
                eventId,
                responses: []
            }, { headers: { Authorization: `Bearer ${nonIiitToken}` } });
            console.error("❌ Registration Succeeded (Should have failed!)");
            process.exit(1);
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log("✅ Registration Correctly Rejected: " + error.response.data.message);
            } else {
                console.error("❌ Unexpected Error:", error.message);
                process.exit(1);
            }
        }

        // 4. Register IIIT User
        const iiitEmail = `student${Date.now()}@students.iiit.ac.in`;
        const regIiit = await axios.post(`${API_URL}/auth/register`, {
            firstName: "IIIT", lastName: "Student",
            email: iiitEmail, password: "password123", contactNumber: "9999999999",
            participantType: "IIIT"
        });
        iiitToken = regIiit.data.token;

        // 5. Attempt Registration (Should Succeed)
        console.log("\n5. IIIT User Attempting to Register...");
        await axios.post(`${API_URL}/registrations`, {
            eventId,
            responses: []
        }, { headers: { Authorization: `Bearer ${iiitToken}` } });
        console.log("✅ Registration Succeeded");

        // Cleanup
        await axios.delete(`${API_URL}/events/${eventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testEligibility();
