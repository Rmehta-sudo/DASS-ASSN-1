const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

const testMerchWorkflow = async () => {
    console.log("Starting Merchandise Payment Workflow Tests...");

    let organizerToken, participantToken, eventId, registrationId;

    try {
        // 1. Organizer Login & Create Event
        const orgLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'music@clubs.iiit.ac.in',
            password: 'password123'
        });
        organizerToken = orgLogin.data.token;

        const eventRes = await axios.post(`${API_URL}/events`, {
            name: "Merch Sale",
            description: "Buy Cool Stuff",
            type: "Merchandise",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            deadline: new Date(Date.now() + 80000000).toISOString(),
            registrationFee: 500, // Fee required
            registrationLimit: 50
        }, { headers: { Authorization: `Bearer ${organizerToken}` } });
        eventId = eventRes.data._id;

        await axios.put(`${API_URL}/events/${eventId}`, { status: 'Published' },
            { headers: { Authorization: `Bearer ${organizerToken}` } });
        console.log("✅ Merchandise Event Created");

        // 2. Participant Register
        console.log("\n2. Participant Registering...");
        const uniqueEmail = `merch${Date.now()}@students.iiit.ac.in`;
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            firstName: "Merch", lastName: "Buyer",
            email: uniqueEmail, password: "password123", contactNumber: "9999999999"
        });
        participantToken = regRes.data.token;

        const purchaseRes = await axios.post(`${API_URL}/registrations`, {
            eventId,
            responses: []
        }, { headers: { Authorization: `Bearer ${participantToken}` } });

        registrationId = purchaseRes.data._id;
        if (purchaseRes.data.status === 'Pending') {
            console.log("✅ Registration Status: Pending (Expected)");
        } else {
            console.error("❌ Unexpected Status:", purchaseRes.data.status);
            process.exit(1);
        }

        // 3. Upload Payment Proof
        console.log("\n3. Uploading Payment Proof...");
        await axios.put(`${API_URL}/registrations/${registrationId}/payment`, {
            paymentProof: "http://example.com/receipt.jpg"
        }, { headers: { Authorization: `Bearer ${participantToken}` } });
        console.log("✅ Payment Proof Uploaded");

        // 4. Organizer Approves
        console.log("\n4. Organizer Approving...");
        const approveRes = await axios.put(`${API_URL}/registrations/${registrationId}/status`, {
            status: 'Confirmed'
        }, { headers: { Authorization: `Bearer ${organizerToken}` } }); // Using status update endpoint
        // Wait, route is /:id/status.

        if (approveRes.data.status === 'Confirmed' && approveRes.data.ticketId) {
            console.log("✅ Registration Confirmed & Ticket Generated");
        } else {
            console.error("❌ Approval Failed");
            process.exit(1);
        }

        // 5. Participant Checks
        console.log("\n5. Participant Checking Status...");
        const myRegs = await axios.get(`${API_URL}/registrations/my`, {
            headers: { Authorization: `Bearer ${participantToken}` }
        });
        const myReg = myRegs.data.find(r => r._id === registrationId);

        if (myReg.status === 'Confirmed') {
            console.log("✅ Verification Successful");
        } else {
            console.error("❌ Final Status Mismatch");
            process.exit(1);
        }

        // Cleanup
        await axios.delete(`${API_URL}/events/${eventId}`, { headers: { Authorization: `Bearer ${organizerToken}` } });

    } catch (error) {
        console.error("❌ Test Failed:", error.response?.data || error.message);
        process.exit(1);
    }
};

testMerchWorkflow();
