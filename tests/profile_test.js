const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testProfileUpdate = async () => {
    console.log("Starting Profile Update Tests...");

    try {
        // 1. Register new user
        const uniqueEmail = `profile${Date.now()}@students.iiit.ac.in`;
        console.log(`\n1. Registering ${uniqueEmail}...`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            firstName: "OldName", lastName: "OldLast",
            email: uniqueEmail, password: "password123",
            contactNumber: "1111111111",
            collegeName: "Old College"
        });
        const token = regRes.data.token;
        console.log("✅ Registered");

        // 2. Update Profile
        console.log("\n2. Updating Profile...");
        const newProfile = {
            firstName: "NewName",
            lastName: "NewLast",
            contactNumber: "9999999999",
            collegeName: "New College"
        };

        const updateRes = await axios.put(`${API_URL}/auth/profile`, newProfile, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const updatedUser = updateRes.data;
        console.log("   Update Response:", {
            firstName: updatedUser.name.split(' ')[0], // name is "First Last"
            contact: updatedUser.contactNumber,
            college: updatedUser.collegeName
        });

        // 3. Verify Changes
        if (updatedUser.name === "NewName NewLast" &&
            updatedUser.contactNumber === "9999999999" &&
            updatedUser.collegeName === "New College") {
            console.log("✅ Profile Update Verified");
        } else {
            console.error("❌ Profile Update Failed: Data mismatch");
            process.exit(1);
        }

        // 4. Verify Partial Update (only firstName)
        console.log("\n3. Testing Partial Update...");
        const partialUpdate = await axios.put(`${API_URL}/auth/profile`, { firstName: "Partial" }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (partialUpdate.data.name === "Partial NewLast") {
            console.log("✅ Partial Update Verified");
        } else {
            console.error("❌ Partial Update Failed");
            process.exit(1);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testProfileUpdate();
