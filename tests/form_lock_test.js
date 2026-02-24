const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testFormLock = async () => {
    console.log("Starting Form Lock Tests...");

    let organizerToken, participantToken, eventId;

    try {
        // 1. Setup Organizer
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        // 2. Create Event with Form Fields
        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Lock Test Event",
            description: "Testing Form Lock",
            type: "Normal",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            deadline: new Date(Date.now() + 80000000).toISOString(),
            registrationLimit: 100,
            formFields: [
                { label: "Dietary", type: "text", required: false }
            ]
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;
        console.log("✅ Event Created");

        // 3. Update Form Fields (Should Succeed - 0 Registrations)
        await axios.put(`${API_URL}/events/${eventId}`, {
            formFields: [
                { label: "Dietary", type: "text", required: true }, // Changed required
                { label: "T-Shirt Size", type: "dropdown", options: ["S", "M", "L"], required: true } // Added field
            ]
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        console.log("✅ Form Updated (Pre-Registration)");

        // 4. Publish Event
        await axios.put(`${API_URL}/events/${eventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });

        // 5. Register User
        console.log("\n5. Registering Participant...");
        const uniqueEmail = `lock${Date.now()}@students.iiit.ac.in`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            firstName: "Lock", lastName: "Tester",
            email: uniqueEmail, password: "password123", contactNumber: "9999999999"
        });
        participantToken = regRes.data.token;

        await axios.post(`${API_URL}/registrations`, {
            eventId,
            responses: [
                { label: "Dietary", value: "None" },
                { label: "T-Shirt Size", value: "M" }
            ]
        }, { headers: { Authorization: `Bearer ${participantToken}` } });
        console.log("✅ Participant Registered");

        // 6. Try to Update Form Fields (Should Fail)
        console.log("\n6. Attempting to Update Form (Post-Registration)...");
        try {
            await axios.put(`${API_URL}/events/${eventId}`, {
                formFields: [
                    { label: "New Field", type: "text" }
                ]
            }, { headers: { Authorization: `Bearer ${organizerToken}` } });
            console.error("❌ Form Update Succeeded (Should have failed!)");
            process.exit(1);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log("✅ Form Update Rejected: " + error.response.data.message);
            } else {
                console.error("❌ Unexpected Error:", error.message);
                process.exit(1);
            }
        }

        // 7. Try to Update Other Fields (Should Succeed)
        console.log("\n7. Attempting to Update Name (Post-Registration)...");
        const updateNameRes = await axios.put(`${API_URL}/events/${eventId}`, {
            name: "Lock Test Event (Renamed)"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });

        if (updateNameRes.data.name === "Lock Test Event (Renamed)") {
            console.log("✅ Name Update Succeeded");
        } else {
            console.error("❌ Name Update Failed");
            process.exit(1);
        }

        // Cleanup
        await axios.delete(`${API_URL}/events/${eventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testFormLock();
