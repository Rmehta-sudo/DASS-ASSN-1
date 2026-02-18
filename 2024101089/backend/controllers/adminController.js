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
            lastName: '',
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


// @desc    Archive/Unarchive a Club
// @route   PUT /api/admin/clubs/:id/archive
// @access  Private/Admin
const toggleArchiveStatus = async (req, res) => {
    try {
        const club = await Organizer.findById(req.params.id);
        if (club) {
            club.isArchived = !club.isArchived;
            const updatedClub = await club.save();
            res.json({
                _id: updatedClub._id,
                name: updatedClub.name,
                isArchived: updatedClub.isArchived,
                message: `Club ${updatedClub.isArchived ? 'Archived' : 'Unarchived'}`
            });
        } else {
            res.status(404).json({ message: 'Club not found' });
        }
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
        await Registration.deleteMany(); // Add Registration to imports if not already handled
        await PasswordReset.deleteMany();

        console.log('Database Cloud Cleared (Admin Preserved)...');

        // 2. Re-seed Clubs
        const clubs = [
            { name: 'Music Club', category: 'Cultural', email: 'music@clubs.iiit.ac.in', desc: 'The official Music Club of IIIT Hyderabad.' },
            { name: 'The Gaming Club', category: 'Technical', email: 'gaming@clubs.iiit.ac.in', desc: 'For gamers, by gamers. Lan parties and tournaments.' },
            { name: 'Decore', category: 'Cultural', email: 'decore@clubs.iiit.ac.in', desc: 'Designing the campus, one event at a time.' },
            { name: 'The Dance Crew', category: 'Cultural', email: 'dance@clubs.iiit.ac.in', desc: 'Expressing through movement and rhythm.' },
            { name: 'Cyclorama', category: 'Cultural', email: 'cyclorama@clubs.iiit.ac.in', desc: 'Photography and filmmaking enthusiasts.' },
            { name: 'LitClub', category: 'Cultural', email: 'litclub@clubs.iiit.ac.in', desc: 'For the love of literature and poetry.' },
            { name: 'Pentaprism', category: 'Cultural', email: 'pentaprism@clubs.iiit.ac.in', desc: 'Capturing moments through the lens.' },
            { name: 'Hacking Club', category: 'Technical', email: 'hacking@clubs.iiit.ac.in', desc: 'Cybersecurity and CTF competitions.' },
            { name: 'Programming Club', category: 'Technical', email: 'programming@clubs.iiit.ac.in', desc: 'Competitive programming and algorithms.' },
            { name: 'Amateur Sports Enthusiasts Club', category: 'Sports', email: 'sports@clubs.iiit.ac.in', desc: 'Promoting sports culture on campus.' },
        ];

        let createdClubs = [];

        for (const club of clubs) {
            const password = process.env.DEFAULT_CLUB_PASSWORD || 'password123';

            const user = await User.create({
                firstName: club.name,
                lastName: '',
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
                description: club.desc,
                contactEmail: club.email
            });
            createdClubs.push(organizer);
        }

        // 3. Seed Users (Variety)
        const userPool = [
            { firstName: 'Alice', lastName: 'Cultural', email: 'alice@test.com', type: 'IIIT', interests: ['Cultural', 'Music', 'Dance'], followingIndices: [0, 3, 5] },
            { firstName: 'Bob', lastName: 'Techie', email: 'bob@test.com', type: 'Node', interests: ['Technical', 'Gaming', 'Coding'], followingIndices: [1, 7, 8] },
            { firstName: 'Charlie', lastName: 'Sportsfan', email: 'charlie@test.com', type: 'IIIT', interests: ['Sports', 'health'], followingIndices: [9, 2] },
            { firstName: 'David', lastName: 'General', email: 'david@test.com', type: 'Non-IIIT', interests: ['Technical', 'Art'], followingIndices: [8, 4] },
            { firstName: 'Eve', lastName: 'Collector', email: 'eve@test.com', type: 'IIIT', interests: ['Cultural', 'Technical'], followingIndices: [0, 1, 6] },
            { firstName: 'Frank', lastName: 'Newbie', email: 'frank@test.com', type: 'IIIT', interests: ['Music', 'Art'], followingIndices: [0, 5] },
            { firstName: 'Rachit', lastName: 'Mehta', email: 'rachit.mehta@students.iiit.ac.in', type: 'IIIT', interests: ['Technical', 'Cultural', 'Gaming', 'Coding'], followingIndices: [1, 7, 8] }
        ];

        for (const u of userPool) {
            await User.create({
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                password: u.email === 'rachit.mehta@students.iiit.ac.in' ? 'rm123' : 'password123',
                role: 'participant',
                contactNumber: '9876543210',
                participantType: u.type,
                interests: u.interests,
                following: u.followingIndices.map(i => createdClubs[i]._id)
            });
        }

        // 4. Seed Events (Comprehensive & Varied)
        console.log('Seeding Events...');
        const locations = ['Amphitheatre', 'Himalaya 105', 'Himalaya 205', 'Library', 'Online', 'KRB Auditorium', 'Felicity Ground'];

        for (const club of createdClubs) {
            const today = new Date();

            // Event 1: PAST (Completed) - Normal
            // ~20 days ago
            const pastStart = new Date(today); pastStart.setDate(today.getDate() - 20);
            const pastEnd = new Date(pastStart); pastEnd.setDate(pastStart.getDate() + 1);
            const pastDeadline = new Date(pastStart); pastDeadline.setDate(pastStart.getDate() - 1);

            await Event.create({
                organizer: club._id,
                name: `${club.name} Intro Session`,
                description: `First meetup of the semester for ${club.name}.`,
                type: 'Normal',
                eligibility: 'Everyone',
                registrationFee: 0,
                registrationLimit: 100,
                startDate: pastStart,
                endDate: pastEnd,
                deadline: pastDeadline,
                location: locations[Math.floor(Math.random() * locations.length)],
                tags: [club.category, 'Intro', 'Freshers'],
                status: 'Completed'
            });

            // Event 2: CURRENT (Ongoing or Published soon) - 50% Merch
            const isMerch2 = Math.random() > 0.5;
            // Starts yesterday, ends tomorrow (Ongoing)
            const currStart = new Date(today); currStart.setDate(today.getDate() - 1);
            const currEnd = new Date(today); currEnd.setDate(today.getDate() + 2);
            const currDeadline = new Date(currEnd);

            const type2 = isMerch2 ? 'Merchandise' : 'Normal';
            const merchItems2 = isMerch2 ? [
                { name: `${club.name} Tee`, price: 300, stock: 50 },
                { name: 'Sticker Pack', price: 50, stock: 200 }
            ] : [];

            await Event.create({
                organizer: club._id,
                name: `${club.name} ${isMerch2 ? 'Merch Drop' : 'Workshop'}`,
                description: `Happening now! Don't miss out on ${club.name}'s latest activity.`,
                type: type2,
                eligibility: 'Everyone',
                registrationFee: isMerch2 ? 50 : 100,
                registrationLimit: 200,
                startDate: currStart,
                endDate: currEnd,
                deadline: currDeadline,
                location: locations[Math.floor(Math.random() * locations.length)],
                tags: [club.category, type2, 'Live'],
                merchandise: merchItems2,
                status: 'Ongoing'
            });

            // Event 3: FUTURE (Published) - 50% Merch
            const isMerch3 = Math.random() > 0.5;
            // 10 days from now
            const futStart = new Date(today); futStart.setDate(today.getDate() + 10);
            const futEnd = new Date(futStart); futEnd.setDate(futStart.getDate() + 1);
            const futDeadline = new Date(futStart); futDeadline.setDate(futStart.getDate() - 2);

            const type3 = isMerch3 ? 'Merchandise' : 'Normal';
            const merchItems3 = isMerch3 ? [
                { name: 'Hoodie', price: 600, stock: 20 },
                { name: 'Mug', price: 150, stock: 30 },
                { name: 'Cap', price: 200, stock: 40 }
            ] : [];

            await Event.create({
                organizer: club._id,
                name: `${club.name} ${isMerch3 ? 'Winter Collection' : 'Hackathon'}`,
                description: `Upcoming major event by ${club.name}. Register now!`,
                type: type3,
                eligibility: 'IIIT Only',
                registrationFee: isMerch3 ? 0 : 250,
                registrationLimit: 150,
                startDate: futStart,
                endDate: futEnd,
                deadline: futDeadline,
                location: locations[Math.floor(Math.random() * locations.length)],
                tags: [club.category, 'Big Event'],
                merchandise: merchItems3,
                status: 'Published'
            });

            // Event 4: VARIED (Draft or Cancelled)
            const isCancelled = Math.random() > 0.5;
            // 30 days from now
            const draftStart = new Date(today); draftStart.setDate(today.getDate() + 30);

            await Event.create({
                organizer: club._id,
                name: `${club.name} Secret Project`,
                description: `For organizer eyes only (or cancelled plan).`,
                type: 'Normal',
                eligibility: 'Everyone',
                registrationFee: 0,
                registrationLimit: 50,
                startDate: draftStart,
                endDate: draftStart,
                deadline: draftStart,
                location: 'TBD',
                tags: ['Planning'],
                status: isCancelled ? 'Cancelled' : 'Draft'
            });
        }

        res.json({ message: 'Database Reset Successfully! Created 10 Clubs, 7 Users, & ~40 varied Events.' });

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
    updateClubProfile,
    resetDatabase,
    toggleArchiveStatus
};
