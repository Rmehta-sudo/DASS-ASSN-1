const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testClubDetails = async () => {
    console.log("Starting Club Details Tests...");

    let adminToken, participantToken, clubId;

    try {
        // 1. Admin Login & Get Clubs
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@felicity.iiit.ac.in',
            password: 'adminpassword'
        });
        adminToken = adminLogin.data.token;

        const clubsRes = await axios.get(`${API_URL}/admin/clubs`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (clubsRes.data.length === 0) throw new Error("No clubs found");
        clubId = clubsRes.data[0]._id;
        console.log(`✅ Found Club ID: ${clubId}`);

        // 2. Participant Login
        const uniqueEmail = `clubview${Date.now()}@students.iiit.ac.in`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            firstName: "View", lastName: "Tester",
            email: uniqueEmail, password: "password123", contactNumber: "9999999999"
        });
        participantToken = regRes.data.token;

        // 3. Get Club Details (As Participant)
        console.log("\n3. Fetching Club Details...");
        const detailRes = await axios.get(`${API_URL}/admin/clubs/${clubId}`, {
            headers: { Authorization: `Bearer ${participantToken}` }
        });

        if (detailRes.data._id === clubId && detailRes.data.name) {
            console.log(`✅ Club Details Verified: ${detailRes.data.name}`);
        } else {
            console.error("❌ Club Details Mismatch");
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testClubDetails();
