const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testRecommendations = async () => {
    console.log("Starting Recommendation Tests...");

    let organizerToken, userToken;
    let codingEventId, musicEventId;

    try {
        // 1. Setup Organizer & Events
        console.log("\n1. Setting up Events...");
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in', // Using existing seeded club
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;
        const clubId = orgLogin.data.organizerId;

        // Create Coding Event
        const codingEvent = await axios.post(`${API_URL}/events`, {
            name: "React Workshop",
            description: "Learn React",
            type: "Normal",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            deadline: new Date(Date.now() + 80000000).toISOString(),
            tags: "Coding, Tech"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        codingEventId = codingEvent.data._id;
        await axios.put(`${API_URL}/events/${codingEventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });

        // Create Music Event
        const musicEvent = await axios.post(`${API_URL}/events`, {
            name: "Jazz Night",
            description: "Smooth Jazz",
            type: "Normal",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            deadline: new Date(Date.now() + 80000000).toISOString(),
            tags: "Music, Art"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        musicEventId = musicEvent.data._id;
        await axios.put(`${API_URL}/events/${musicEventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });

        console.log("✅ Events Created & Published");

        // 2. Setup Participant with "Coding" interest
        console.log("\n2. Setting up Participant (Interest: Coding)...");
        const uniqueEmail = `rec${Date.now()}@students.iiit.ac.in`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            firstName: "Rec", lastName: "Tester",
            email: uniqueEmail, password: "password123", contactNumber: "9999999999"
        });
        userToken = regRes.data.token;

        // Set Preferences
        await axios.put(`${API_URL}/auth/preferences`, {
            interests: ['Coding'],
            following: []
        }, { headers: { Authorization: `Bearer ${userToken}` } });
        console.log("✅ Participant Preferences Set");

        // 3. Fetch Recommendations
        console.log("\n3. Fetching Recommendations...");
        const recRes = await axios.get(`${API_URL}/events/recommended`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        const recEvents = recRes.data;
        const recNames = recEvents.map(e => e.name);
        console.log("   Recommended:", recNames);

        if (recNames.includes("React Workshop") && !recNames.includes("Jazz Night")) {
            console.log("✅ Recommendation Logic Verified (Interest Match)");
        } else {
            console.error("❌ Recommendation Failed");
            // It might fail if "Music Club" is followed? No, following is empty.
            // But if "Music Club" created "React Workshop", tags match.
            // "Jazz Night" tags "Music". Interest "Coding". Should not match.
            process.exit(1);
        }

        // 4. Test Follow Logic
        console.log("\n4. Testing Follow Logic...");
        await axios.put(`${API_URL}/auth/preferences`, {
            interests: [],
            following: [clubId] // Follow the club
        }, { headers: { Authorization: `Bearer ${userToken}` } });

        const followRes = await axios.get(`${API_URL}/events/recommended`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const followNames = followRes.data.map(e => e.name);
        console.log("   Recommended (Following):", followNames);

        // Should see BOTH because we follow the organizer
        if (followNames.includes("React Workshop") && followNames.includes("Jazz Night")) {
            console.log("✅ Recommendation Logic Verified (Follow Match)");
        } else {
            console.error("❌ Follow Logic Failed");
            process.exit(1);
        }

        // Cleanup
        await axios.delete(`${API_URL}/events/${codingEventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });
        await axios.delete(`${API_URL}/events/${musicEventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testRecommendations();
