const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const path = require('path');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const User = require('./models/User');
const Organizer = require('./models/Organizer');
const { registerEvent, updateRegistrationStatus } = require('./controllers/registrationController');
const { createEvent } = require('./controllers/eventController');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.bold);
        process.exit(1);
    }
};

const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.data = null;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const mockReq = (user, body, params = {}) => ({
    user,
    body,
    params
});

const runTest = async () => {
    await connectDB();

    try {
        // 1. Setup Data
        console.log("Setting up test data...");
        let user = await User.findOne({ email: 'test_merch_user@example.com' });
        if (!user) {
            user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: 'test_merch_user@example.com',
                password: 'password123',
                contactNumber: '1234567890',
                role: 'participant'
            });
        }

        const organizerId = new mongoose.Types.ObjectId();

        // Create Merchandise Event
        const eventData = {
            organizer: organizerId,
            name: `Test Merch Event ${Date.now()}`,
            description: "Testing Merch Logic",
            type: "Merchandise",
            eligibility: "Anyone",
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000),
            deadline: new Date(Date.now() + 86400000),
            merchandise: [
                {
                    name: "T-Shirt",
                    price: 500,
                    stock: 10,
                    limitPerUser: 2,
                    variants: [{ type: "Size", options: ["S", "M", "L"] }]
                },
                {
                    name: "Sticker",
                    price: 50,
                    stock: 5,
                    limitPerUser: 5
                }
            ]
        };

        const event = await Event.create(eventData);
        console.log(`Event Created: ${event._id}`);
        const tShirtId = event.merchandise[0]._id;
        const stickerId = event.merchandise[1]._id;

        // 2. Test Success: Buy 1 T-Shirt (Size M) -> Should be Pending but Stock Deducted
        console.log("\n--- Test 1: Buy 1 T-Shirt (Size M) ---");
        let req = mockReq({ _id: user._id }, {
            eventId: event._id,
            merchandiseSelection: [
                { itemId: tShirtId, quantity: 1, variant: { Size: "M" } }
            ]
        });
        let res = mockRes();

        await registerEvent(req, res);
        console.log(`Status Code: ${res.statusCode}`);

        let regId;
        if (res.statusCode === 201) {
            regId = res.data._id;
            console.log(`Registration Logic Status: ${res.data.status}`);

            // Verify Stock Deducted Immediately
            const updatedEvent = await Event.findById(event._id);
            const tshirt = updatedEvent.merchandise.id(tShirtId);
            console.log(`Stock for T-Shirt: ${tshirt.stock} (Expected: 9)`);

            if (tshirt.stock !== 9) throw new Error("Stock not deducted immediately!");
            if (res.data.status !== 'Pending') throw new Error("Status should be Pending for Merch!");
        } else {
            console.log("Failed:", res.data);
            throw new Error("Test 1 Failed");
        }

        // 3. Test Approval: Organizer Approves -> Ticket Check
        console.log("\n--- Test 2: Organizer Approves ---");
        req = mockReq({ _id: new mongoose.Types.ObjectId() }, { status: 'Confirmed' }, { id: regId }); // Mock organizer user not needed really for this controller function check
        res = mockRes();

        await updateRegistrationStatus(req, res);
        console.log(`Approve Status Code: ${res.statusCode}`);
        if (res.statusCode === 200) {
            console.log(`Updated Reg Status: ${res.data.status}`);
            console.log(`Ticket ID: ${res.data.ticketId}`);
            if (res.data.status !== 'Confirmed') throw new Error("Status not confirmed");
            if (!res.data.ticketId) throw new Error("Ticket ID not generated");

            // Stock should STILL be 9 (no double deduction)
            const eventCheck = await Event.findById(event._id);
            const tshirt = eventCheck.merchandise.id(tShirtId);
            console.log(`Stock after approval: ${tshirt.stock} (Expected: 9)`);
            if (tshirt.stock !== 9) throw new Error("Stock changed incorrectly on approval");
        } else {
            console.log("Approve Failed:", res.data);
            throw new Error("Test 2 Failed");
        }

        // 4. Test Rejection: Reject -> Stock Restored?
        console.log("\n--- Test 3: Rejection Restores Stock ---");
        // Create another registration first
        const user2 = await User.create({
            firstName: 'Test2',
            lastName: 'User2',
            email: 'test_merch_user2@example.com',
            password: 'password123',
            contactNumber: '0987654321',
            role: 'participant'
        });

        req = mockReq({ _id: user2._id }, {
            eventId: event._id,
            merchandiseSelection: [
                { itemId: tShirtId, quantity: 2, variant: { Size: "L" } }
            ]
        });
        res = mockRes();
        await registerEvent(req, res);
        console.log(`Test 3 Register Status: ${res.statusCode}`);
        if (res.statusCode !== 201) {
            console.log("Test 3 Register Failed:", res.data);
            throw new Error("Test 3 Register Failed");
        }

        const reg2Id = res.data._id;
        console.log(`Test 3 Reg ID: ${reg2Id}`);

        // Stock should be 9 - 2 = 7
        let eventCheck = await Event.findById(event._id);
        console.log(`Stock after 2nd buy: ${eventCheck.merchandise.id(tShirtId).stock} (Expected: 7)`);
        if (eventCheck.merchandise.id(tShirtId).stock !== 7) throw new Error("Stock not deducted for 2nd user");

        // Now Reject
        req = mockReq({}, { status: 'Rejected' }, { id: reg2Id });
        res = mockRes();
        await updateRegistrationStatus(req, res);
        console.log(`Test 3 Reject Status: ${res.statusCode}`);

        // Stock should be 7 + 2 = 9
        eventCheck = await Event.findById(event._id);
        console.log(`Stock after rejection: ${eventCheck.merchandise.id(tShirtId).stock} (Expected: 9)`);
        if (eventCheck.merchandise.id(tShirtId).stock !== 9) throw new Error("Stock not restored on rejection");


        // Cleanup
        console.log("\nCleaning up...");
        await Event.findByIdAndDelete(event._id);
        await Registration.deleteMany({ event: event._id });
        // await User.findByIdAndDelete(user._id);

        console.log("\nALL TESTS PASSED".green.bold);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

runTest();
