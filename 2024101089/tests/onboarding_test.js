const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testOnboarding = async () => {
    console.log("Starting Onboarding & Preference Tests...");

    try {
        // 1. Register new user
        const uniqueEmail = `onboard${Date.now()}@students.iiit.ac.in`;
        console.log(`\n1. Registering ${uniqueEmail}...`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            firstName: "Onboard", lastName: "Tester",
            email: uniqueEmail, password: "password123",
            contactNumber: "9999999999"
        });
        let token = regRes.data.token;
        console.log("✅ Registered");

        // 2. Fetch Clubs
        console.log("\n2. Fetching Clubs...");
        const clubsRes = await axios.get(`${API_URL}/admin/clubs`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const clubs = clubsRes.data;
        if (clubs.length === 0) throw new Error("No clubs found (Run seeder?)");
        console.log(`✅ Found ${clubs.length} clubs`);
        const clubIdToFollow = clubs[0]._id; // Follow the first club (User ID or Org ID? Org ID)
        // clubsRes returns Organizers populated with user. 
        // Organizer model has _id.

        // 3. Set Preferences
        console.log("\n3. Setting Preferences...");
        const interests = ['Coding', 'Music'];
        const following = [clubIdToFollow];

        const updateRes = await axios.put(`${API_URL}/auth/preferences`, {
            interests,
            following
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ Preferences Updated");

        // 4. Verify Persistence via Login
        console.log("\n4. Verifying Persistence via Login...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: uniqueEmail,
            password: "password123"
        });

        const user = loginRes.data;
        console.log("   Login Response Interests:", user.interests);
        console.log("   Login Response Following:", user.following);

        if (!user.interests || !user.following) {
            console.error("❌ Login response missing interests/following fields!");
            process.exit(1);
        }

        if (user.interests.includes('Coding') && user.following.includes(clubIdToFollow)) {
            console.log("✅ Verification Successful: Preferences persisted and returned on login.");
        } else {
            console.error("❌ Preferences mismatch!");
            console.log("Expected:", { interests, following });
            console.log("Got:", { interests: user.interests, following: user.following });
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testOnboarding();
