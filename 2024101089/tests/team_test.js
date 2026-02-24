const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testTeamFlow = async () => {
    console.log("Starting Team Logic Tests...");
    let organizerToken, tokenA, tokenB, tokenC;
    let eventId;
    let inviteCode;
    let teamId;

    try {
        // --- 0. SETUP: Register Users & Organizer ---
        const registerUser = async (name) => {
            const email = `${name.toLowerCase()}${Date.now()}@students.iiit.ac.in`;
            await axios.post(`${API_URL}/auth/register`, {
                firstName: name, lastName: "Test", email, password: "password123", contactNumber: "9999999999"
            });
            const res = await axios.post(`${API_URL}/auth/login`, { email, password: "password123" });
            return res.data.token;
        };

        const validOrgEmail = `org${Date.now()}@clubs.iiit.ac.in`;
        // Register org first to be sure
        await axios.post(`${API_URL}/auth/signup-organizer`, {
            name: "HackClub", category: "Clubs", email: validOrgEmail, description: "Test"
        }).catch(err => { }); // If fails, might be admin only restriction, let's try direct admin creation or just use known admin creds to creating org?

        // Actually, let's use the Admin to Create the Organizer properly as per flow
        const adminLogin = await axios.post(`${API_URL}/auth/login`, { email: 'admin@felicity.iiit.ac.in', password: 'adminpassword' });
        const adminToken = adminLogin.data.token;

        await axios.post(`${API_URL}/admin/clubs`, {
            name: "HackClub Test " + Date.now(), category: "Clubs", email: validOrgEmail, description: "Test Club"
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        // Password for created club is 'password123'
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: validOrgEmail,
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        tokenA = await registerUser("Alice");
        tokenB = await registerUser("Bob");
        tokenC = await registerUser("Charlie");

        // --- 1. Create Hackathon Event (Max Team Size: 2) ---
        console.log("\n1. Creating Hackathon Event...");
        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Hackathon " + Date.now(),
            description: "Team Event",
            type: "Normal",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            deadline: new Date(Date.now() + 80000000).toISOString(),
            teamSizeMin: 1,
            teamSizeMax: 2, // Small limit for testing
            registrationLimit: 100,
            tags: "hackathon"
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;

        await axios.put(`${API_URL}/events/${eventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });

        // --- 2. Alice Creates a Team ---
        console.log("\n2. Alice Creating Team...");
        const teamRes = await axios.post(`${API_URL}/teams`, {
            eventId,
            name: "CodeWarriors"
        }, { headers: { Authorization: `Bearer ${tokenA}` } });

        teamId = teamRes.data._id;
        inviteCode = teamRes.data.inviteCode;
        console.log(`✅ Team Created! Code: ${inviteCode}`);

        // --- 3. Bob Joins Team ---
        console.log("\n3. Bob Joining Team...");
        await axios.post(`${API_URL}/teams/join`, {
            inviteCode
        }, { headers: { Authorization: `Bearer ${tokenB}` } });
        console.log("✅ Bob Joined!");

        // --- 4. Charlie Tries to Join (Should Fail - Full) ---
        console.log("\n4. Charlie Trying to Join (Should Fail)...");
        try {
            await axios.post(`${API_URL}/teams/join`, { inviteCode },
                { headers: { Authorization: `Bearer ${tokenC}` } });
            console.error("❌ Charlie Joined but should have failed!");
        } catch (e) {
            console.log(`✅ Expected Error: ${e.response?.data?.message}`);
        }

        // --- 5. Verify Team Details ---
        console.log("\n5. Verifying Team Details...");
        const getTeamRes = await axios.get(`${API_URL}/teams/${eventId}`,
            { headers: { Authorization: `Bearer ${tokenA}` } });
        const members = getTeamRes.data.members;
        console.log(`   Members Count: ${members.length}`);
        if (members.length === 2) console.log("✅ Member Count Correct");
        else console.error("❌ Incorrect Member Count");

        // --- 6. Bob Leaves Team ---
        console.log("\n6. Bob Leaving Team...");
        await axios.post(`${API_URL}/teams/leave`, { teamId },
            { headers: { Authorization: `Bearer ${tokenB}` } });

        const getTeamAfterRes = await axios.get(`${API_URL}/teams/${eventId}`,
            { headers: { Authorization: `Bearer ${tokenA}` } });

        if (getTeamAfterRes.data.members.length === 1) console.log("✅ Bob Left Successfully");
        else console.error("❌ Bob still in team");

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
    }
};

testTeamFlow();
