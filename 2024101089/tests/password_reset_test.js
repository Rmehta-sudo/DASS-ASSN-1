const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testPasswordReset = async () => {
    console.log("Starting Password Reset Flow Tests...");
    let adminToken = null;
    let requestId = null;
    let newPassword = null;

    try {
        // 1. Admin Login (to get token for later)
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@felicity.iiit.ac.in',
            password: 'adminpassword'
        });
        adminToken = adminLogin.data.token;
        console.log("✅ Admin Logged in");

        // 2. Organizer Requests Reset (Public)
        console.log("\n2. Organizer Requesting Reset...");
        const targetEmail = 'music@clubs.iiit.ac.in';
        await axios.post(`${API_URL}/admin/reset-request`, {
            email: targetEmail,
            reason: "Lost access to account"
        });
        console.log("✅ Request Submitted");

        // 3. Admin Fetches Requests
        console.log("\n3. Admin Fetching Requests...");
        const requestsRes = await axios.get(`${API_URL}/admin/reset-requests`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        const myRequest = requestsRes.data.find(r => r.email === targetEmail && r.status === 'Pending');
        if (!myRequest) throw new Error("Request not found in Admin list");
        requestId = myRequest._id;
        console.log(`✅ Found Request ID: ${requestId}`);

        // 4. Admin Approves Request
        console.log("\n4. Admin Approving Request...");
        const approveRes = await axios.put(`${API_URL}/admin/reset-request/${requestId}`, {
            status: 'Approved'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        console.log("✅ Request Approved");

        // Extract new password from admin comment
        const comment = approveRes.data.adminComment;
        newPassword = comment.split(': ')[1];
        console.log(`   New Password Generated: ${newPassword}`);

        // 5. Verify Login with NEW Password
        console.log("\n5. Verifying Login with New Password...");
        const newLogin = await axios.post(`${API_URL}/auth/login`, {
            email: targetEmail,
            password: newPassword
        });
        if (newLogin.data.token) {
            console.log("✅ Login Successful with New Password!");
        }

        // 6. Reset back to default (optional, but good for re-running tests)
        // In a real scenario, we might leave it. Here let's just leave it or creating a 'Reset password functionality' would be recursive.
        // We'll just log that the password is changed.

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
    }
};

testPasswordReset();
