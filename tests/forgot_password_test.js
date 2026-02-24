const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testForgotPassword = async () => {
    console.log("Starting Forgot Password Tests...");

    try {
        // 1. Register new user
        const uniqueEmail = `forgot${Date.now()}@students.iiit.ac.in`;
        console.log(`\n1. Registering ${uniqueEmail}...`);
        await axios.post(`${API_URL}/auth/register`, {
            firstName: "Forgot", lastName: "Tester",
            email: uniqueEmail, password: "oldpassword",
            contactNumber: "9999999999"
        });
        console.log("✅ Registered with password: oldpassword");

        // 2. Request Password Reset
        console.log("\n2. Requesting Password Reset...");
        const forgotRes = await axios.post(`${API_URL}/auth/forgot-password`, {
            email: uniqueEmail
        });

        console.log("✅ Request Sent");
        const resetToken = forgotRes.data.resetToken;
        if (!resetToken) {
            throw new Error("Reset Token not returned in response (Mock mode failed?)");
        }
        console.log(`   Detailed Token: ${resetToken.substring(0, 20)}...`);

        // 3. Reset Password
        console.log("\n3. Resetting Password...");
        const newPassword = "newpassword123";
        await axios.post(`${API_URL}/auth/reset-password`, {
            token: resetToken,
            newPassword
        });
        console.log("✅ Password Reset Successful");

        // 4. Verify Login with New Password
        console.log("\n4. Verifying Login with New Password...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: uniqueEmail,
            password: newPassword
        });

        if (loginRes.data.token) {
            console.log("✅ Login Verified with NEW password!");
        }

        // 5. Verify Login with Old Password (should fail)
        try {
            await axios.post(`${API_URL}/auth/login`, {
                email: uniqueEmail,
                password: "oldpassword"
            });
            console.error("❌ Old Password still works!");
            process.exit(1);
        } catch (e) {
            console.log("✅ Old Password correctly rejected");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testForgotPassword();
