const User = require('../models/User');
const Organizer = require('../models/Organizer');
const PasswordReset = require('../models/PasswordReset');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// @desc    Get all organizers/clubs
// @route   GET /api/admin/clubs
// @access  Private/Admin
const getClubs = async (req, res) => {
    try {
        const clubs = await Organizer.find({}).populate('user', 'firstName lastName email participantType');
        res.json(clubs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a club
// @route   DELETE /api/admin/clubs/:id
// @access  Private/Admin
const deleteClub = async (req, res) => {
    try {
        const club = await Organizer.findById(req.params.id);
        if (club) {
            // Also delete the associated user
            await User.findByIdAndDelete(club.user);
            await club.deleteOne();
            res.json({ message: 'Club removed' });
        } else {
            res.status(404).json({ message: 'Club not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new club
// @route   POST /api/admin/clubs
// @access  Private/Admin
const addClub = async (req, res) => {
    const { name, category, email, description } = req.body;

    try { // Added try-catch block for addClub
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        // Auto-generate password (simple for student project, maybe use random string in real life)
        const password = process.env.DEFAULT_CLUB_PASSWORD;

        const user = await User.create({
            firstName: name,
            lastName: '(Club)',
            email,
            password,
            role: 'organizer',
            participantType: 'IIIT', // Assuming clubs are IIIT entities
            contactNumber: '1234567890'
        });

        if (user) {
            const organizer = await Organizer.create({
                user: user._id,
                name,
                category,
                description,
                contactEmail: email
            });

            res.status(201).json({
                _id: organizer._id,
                name: organizer.name,
                email: user.email,
                password: password // Return this so admin can share it
            });
        } else {
            res.status(400).json({ message: 'Invalid club data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Password Reset Logic ---

// @desc    Request Password Reset (Organizer)
// @route   POST /api/admin/reset-request
// @access  Public (since they can't login) or Protected? 
// Assignment says "Organizers can request... from Admin". 
// Since they might not be able to login, we'll make it public but verify email exists.
const requestPasswordReset = async (req, res) => {
    try {
        const { email, reason } = req.body;
        const organizer = await Organizer.findOne({ contactEmail: email }); // Changed to contactEmail

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer email not found' });
        }

        const resetRequest = await PasswordReset.create({
            organizer: organizer._id,
            email,
            reason
        });

        res.status(201).json(resetRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Reset Requests
// @route   GET /api/admin/reset-requests
// @access  Private/Admin
const getResetRequests = async (req, res) => {
    try {
        const requests = await PasswordReset.find().populate('organizer', 'name contactEmail').sort({ createdAt: -1 }); // Changed to contactEmail
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process Reset Request (Approve/Reject)
// @route   PUT /api/admin/reset-request/:id
// @access  Private/Admin
const processResetRequest = async (req, res) => {
    try {
        const { status, adminComment } = req.body; // status: 'Approved' or 'Rejected'
        const request = await PasswordReset.findById(req.params.id).populate('organizer');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (status === 'Approved') {
            // Generate new password
            const newPassword = Math.random().toString(36).slice(-8); // Simple 8 char password

            // Update Organizer's User account
            const organizer = await Organizer.findById(request.organizer._id);
            const user = await User.findById(organizer.user);

            // User model pre-save hook handles hashing!
            user.password = newPassword;
            await user.save();

            request.status = 'Approved';
            request.adminComment = `New Password: ${newPassword}`; // Storing here so Admin can see and share it
        } else {
            request.status = 'Rejected';
            request.adminComment = adminComment;
        }

        await request.save();
        res.json(request);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single club/organizer by ID
// @route   GET /api/admin/clubs/:id
// @access  Private (Authenticated users)
const getClubById = async (req, res) => {
    try {
        const club = await Organizer.findById(req.params.id).populate('user', 'name email');
        if (club) {
            res.json(club);
        } else {
            res.status(404).json({ message: 'Club not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Club/Organizer Profile (for the organizer themselves)
// @route   PUT /api/admin/clubs/profile
// @access  Private (Organizer)
const updateClubProfile = async (req, res) => {
    try {
        const organizer = await Organizer.findOne({ user: req.user._id });
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer profile not found' });
        }

        organizer.name = req.body.name || organizer.name;
        organizer.description = req.body.description || organizer.description;
        organizer.contactEmail = req.body.contactEmail || organizer.contactEmail;
        organizer.category = req.body.category || organizer.category;

        const updatedOrganizer = await organizer.save();
        res.json(updatedOrganizer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Database (Keep Admin, Restore Clubs, Create Rachit)
// @route   POST /api/admin/reset-database
// @access  Private/Admin
const resetDatabase = async (req, res) => {
    try {
        // 1. Delete everything except the current Admin
        await User.deleteMany({ _id: { $ne: req.user._id } });
        await Organizer.deleteMany();
        const Event = require('../models/Event');
        const Registration = require('../models/Registration');
        await Event.deleteMany();
        await Registration.deleteMany();
        await PasswordReset.deleteMany();

        console.log('Database Cloud Cleared (Admin Preserved)...');

        // 2. Re-seed Clubs
        const clubs = [
            { name: 'Music Club', category: 'Cultural', email: 'music@clubs.iiit.ac.in' },
            { name: 'The Gaming Club', category: 'Technical', email: 'gaming@clubs.iiit.ac.in' },
            { name: 'Decore', category: 'Cultural', email: 'decore@clubs.iiit.ac.in' },
            { name: 'The Dance Crew', category: 'Cultural', email: 'dance@clubs.iiit.ac.in' },
            { name: 'Cyclorama', category: 'Cultural', email: 'cyclorama@clubs.iiit.ac.in' },
            { name: 'LitClub', category: 'Cultural', email: 'litclub@clubs.iiit.ac.in' },
            { name: 'Pentaprism', category: 'Cultural', email: 'pentaprism@clubs.iiit.ac.in' },
            { name: 'Hacking Club', category: 'Technical', email: 'hacking@clubs.iiit.ac.in' },
            { name: 'Programming Club', category: 'Technical', email: 'programming@clubs.iiit.ac.in' },
            { name: 'Amateur Sports Enthusiasts Club', category: 'Sports', email: 'sports@clubs.iiit.ac.in' },
        ];

        let createdClubs = [];

        for (const club of clubs) {
            const password = process.env.DEFAULT_CLUB_PASSWORD || 'password123';

            const user = await User.create({
                firstName: club.name,
                lastName: '(Club)',
                email: club.email,
                password: password,
                role: 'organizer',
                contactNumber: '1234567890',
                participantType: 'IIIT'
            });

            const organizer = await Organizer.create({
                user: user._id,
                name: club.name,
                category: club.category,
                description: `Official ${club.name} of IIIT Hyderabad. Join us for amazing events!`,
                contactEmail: club.email
            });
            createdClubs.push(organizer); // Push full organizer object
        }

        // 3. SEED EVENTS (2 per club)
        console.log('Seeding Events...');
        const locations = ['Amphitheatre', 'Himalaya 105', 'Himalaya 205', 'Library', 'Online', 'KRB Auditorium'];

        for (const club of createdClubs) {
            for (let i = 1; i <= 2; i++) {
                const isMerch = (i === 2); // 2nd event is Merch
                const type = isMerch ? 'Merchandise' : 'Normal';

                // Distribute dates: Event 1 is soon, Event 2 is later
                const today = new Date();
                const startOffset = i * 5; // 5 days or 10 days from now
                const startDate = new Date(today);
                startDate.setDate(today.getDate() + startOffset);

                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 1); // 1 day event

                const deadline = new Date(startDate);
                deadline.setDate(startDate.getDate() - 1); // Reg closes 1 day before

                await Event.create({
                    organizer: club._id,
                    name: `${club.name} Event ${i}`,
                    description: `This is ${type === 'Merchandise' ? 'an exclusive merchandise sale' : 'a verified event'} by ${club.name}. Join us!`,
                    type: type,
                    eligibility: 'Everyone',
                    registrationFee: isMerch ? (i * 200) : (i * 50), // 50 or 400
                    registrationLimit: 50 * i, // 50 or 100
                    startDate: startDate,
                    endDate: endDate,
                    deadline: deadline,
                    location: locations[Math.floor(Math.random() * locations.length)],
                    tags: [club.category, type === 'Merchandise' ? 'Merch' : 'Fun'],
                    formFields: [],
                    merchandise: isMerch ? [
                        { name: 'T-Shirt', price: 200, stock: 50 },
                        { name: 'Sticker', price: 50, stock: 100 }
                    ] : [],
                    status: 'Published'
                });
            }
        }

        // 4. Create Specific User "Rachit Mehta"
        const rachit = await User.create({
            firstName: 'Rachit',
            lastName: 'Mehta',
            email: 'rachit.mehta@students.iiit.ac.in',
            password: 'rm123',
            role: 'participant',
            contactNumber: '9372276184',
            participantType: 'IIIT',
            // Hardcoded interests and following as requested
            interests: ['Technical', 'Cultural', 'Gaming', 'Coding'],
            following: [createdClubs[1]._id, createdClubs[7]._id, createdClubs[8]._id] // Gaming, Hacking, Programming clubs
        });

        res.json({ message: 'Database Reset Successfully! Created Rachit, Clubs & 2 Events/Club.' });
    } catch (error) {
        console.error("Reset Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getClubs,
    deleteClub,
    addClub,
    requestPasswordReset,
    getResetRequests,
    processResetRequest,
    getClubById,
    updateClubProfile,
    resetDatabase
};
