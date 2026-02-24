const axios = require('axios');

// Simple test script to verify Auth API
// Ensure backend is running on port 5000 before running this

const API_URL = 'http://localhost:5000/api/auth';

const testAuth = async () => {
    console.log("Starting Auth Tests...");
    let token = null;

    try {
        // 1. Test Registration
        console.log("\n1. Testing Registration...");
        const regData = {
            firstName: "Test",
            lastName: "Student",
            email: `test${Date.now()}@students.iiit.ac.in`, // Dynamic email to avoid duplicates
            password: "password123",
            contactNumber: "9999999999",
            collegeName: "IIIT Hyderabad"
        };

        const regRes = await axios.post(`${API_URL}/register`, regData);
        console.log("✅ Registration Successful:", regRes.data.email);
        token = regRes.data.token;

        if (!token) throw new Error("No token received after registration");

        // 2. Test Login
        console.log("\n2. Testing Login...");
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: regData.email,
            password: regData.password
        });
        console.log("✅ Login Successful:", loginRes.data.email);

        // 3. Test Invalid Login
        console.log("\n3. Testing Invalid Login...");
        try {
            await axios.post(`${API_URL}/login`, {
                email: regData.email,
                password: "wrongpassword"
            });
            console.error("❌ Invalid Login Check Failed (Should have errored)");
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log("✅ Invalid Login correctly rejected (401)");
            } else {
                console.error("❌ Unexpected error:", error.message);
            }
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
    }
};

testAuth();
