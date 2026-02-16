const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testAdmin = async () => {
    console.log("Starting Admin API Tests...");
    let adminToken = null;
    let newClubId = null;

    try {
        // 1. Login as Admin
        console.log("\n1. Logging in as Admin...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@felicity.iiit.ac.in',
            password: 'adminpassword'
        });
        adminToken = loginRes.data.token;
        console.log("✅ Admin Login Successful");

        const config = {
            headers: { Authorization: `Bearer ${adminToken}` }
        };

        // 2. Fetch Clubs
        console.log("\n2. Fetching Clubs...");
        const clubsRes = await axios.get(`${API_URL}/admin/clubs`, config);
        console.log(`✅ Fetched ${clubsRes.data.length} clubs`);

        // 3. Add New Club
        console.log("\n3. Adding New Club...");
        const newClub = {
            name: "Test Club " + Date.now(),
            category: "Technical",
            email: `testclub${Date.now()}@clubs.iiit.ac.in`,
            description: "A test club for automation"
        };
        const addRes = await axios.post(`${API_URL}/admin/clubs`, newClub, config);
        newClubId = addRes.data._id;
        console.log("✅ Club Added:", addRes.data.name);

        // 4. Delete Club
        console.log("\n4. Deleting Club...");
        if (newClubId) {
            await axios.delete(`${API_URL}/admin/clubs/${newClubId}`, config);
            console.log("✅ Club Deleted");
        } else {
            console.error("❌ Skipping delete, no club ID");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
    }
};

testAdmin();
