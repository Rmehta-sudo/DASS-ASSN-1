const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testOrgProfile = async () => {
    console.log("Starting Organizer Profile Tests...");

    let organizerToken;

    try {
        // 1. Organizer Login
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        // 2. Update Profile
        console.log("\n2. Updating Club Profile...");
        const updateRes = await axios.put(`${API_URL}/admin/clubs/profile`, {
            description: "Updated Description " + Date.now(),
            contactEmail: "newemail@clubs.iiit.ac.in"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });

        if (updateRes.data.contactEmail === "newemail@clubs.iiit.ac.in") {
            console.log("✅ Profile Update Verified");
        } else {
            console.error("❌ Profile Update Failed");
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testOrgProfile();
