const User = require('../models/User');
const Organizer = require('../models/Organizer');
const PasswordReset = require('../models/PasswordReset');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

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

            try {
                await sendEmail({
                    email: request.email,
                    subject: 'Password Reset Request Rejected',
                    message: `Your password reset request has been rejected by the administrator.\n\nReason: ${adminComment || 'No reason provided.'}`
                });
            } catch (emailErr) {
                console.error("Failed to send password rejection email:", emailErr);
            }
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

        // 2. Re-seed Orgs: 6 Clubs + 2 Councils + 3 Fest Teams
        const clubs = [
            // --- Clubs ---
            { name: 'Music Club', category: 'Clubs', email: 'music@clubs.iiit.ac.in', desc: 'The official Music Club of IIIT Hyderabad. Concerts, jam sessions and more.' },
            { name: 'The Dance Crew', category: 'Clubs', email: 'dance@clubs.iiit.ac.in', desc: 'Expressing through movement and rhythm. All dance forms welcome.' },
            { name: 'Hacking Club', category: 'Clubs', email: 'hacking@clubs.iiit.ac.in', desc: 'Cybersecurity, CTF competitions and ethical hacking workshops.' },
            { name: 'Programming Club', category: 'Clubs', email: 'programming@clubs.iiit.ac.in', desc: 'Competitive programming, algorithms and coding contests.' },
            { name: 'Cyclorama', category: 'Clubs', email: 'cyclorama@clubs.iiit.ac.in', desc: 'Photography and filmmaking enthusiasts capturing moments.' },
            { name: 'LitClub', category: 'Clubs', email: 'litclub@clubs.iiit.ac.in', desc: 'For the love of literature, poetry and creative writing.' },
            // --- Councils ---
            { name: 'Student Council', category: 'Councils', email: 'studentcouncil@iiit.ac.in', desc: 'The student governing body of IIIT Hyderabad. Representing every student.' },
            { name: 'Sports Council', category: 'Councils', email: 'sportscouncil@iiit.ac.in', desc: 'Organising all inter and intra college sports events and tournaments.' },
            // --- Fest Teams ---
            { name: 'Fest Marketing Team', category: 'Fest Teams', email: 'marketing@felicity.iiit.ac.in', desc: 'Promoting Felicity and managing sponsor events like brand showcases and stunt shows.' },
            { name: 'Fest Design Team', category: 'Fest Teams', email: 'design@felicity.iiit.ac.in', desc: 'Creating Fest merchandise — T-shirts, hoodies, badges and all official Felicity swag.' },
            { name: 'Fest Food Stalls', category: 'Fest Teams', email: 'food@felicity.iiit.ac.in', desc: 'Managing all food stalls and culinary experiences at Felicity Fest.' },
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

        // 3. Seed 10 standardised participant users
        //    user1-user7: IIIT (iiit.ac.in), user8-user10: Non-IIIT
        const participants = [
            { n: 1, type: 'IIIT', email: 'user1@students.iiit.ac.in', interests: ['Music', 'Dance', 'Art'], followingIndices: [0, 1] },
            { n: 2, type: 'IIIT', email: 'user2@students.iiit.ac.in', interests: ['Hackathons', 'Coding'], followingIndices: [2, 3] },
            { n: 3, type: 'IIIT', email: 'user3@students.iiit.ac.in', interests: ['Sports', 'Health'], followingIndices: [7] },
            { n: 4, type: 'IIIT', email: 'user4@students.iiit.ac.in', interests: ['Photography', 'Design', 'Art'], followingIndices: [4, 5] },
            { n: 5, type: 'IIIT', email: 'user5@students.iiit.ac.in', interests: ['Literature', 'Drama'], followingIndices: [5, 6] },
            { n: 6, type: 'IIIT', email: 'user6@students.iiit.ac.in', interests: ['Gaming', 'Coding', 'Robotics'], followingIndices: [2, 3] },
            { n: 7, type: 'IIIT', email: 'user7@students.iiit.ac.in', interests: ['Entrepreneurship', 'Leadership'], followingIndices: [6, 8] },
            { n: 8, type: 'Non-IIIT', email: 'user8@gmail.com', interests: ['Music', 'Dance'], followingIndices: [0] },
            { n: 9, type: 'Non-IIIT', email: 'user9@gmail.com', interests: ['Hackathons', 'Coding'], followingIndices: [2] },
            { n: 10, type: 'Non-IIIT', email: 'user10@gmail.com', interests: ['Art', 'Design', 'Photography'], followingIndices: [4, 9, 10] },
        ];

        for (const p of participants) {
            await User.create({
                firstName: `user${p.n}`,
                lastName: '',
                email: p.email,
                password: `user${p.n}pass`,
                role: 'participant',
                contactNumber: '9876543210',
                participantType: p.type,
                collegeName: p.type === 'IIIT' ? 'IIIT Hyderabad' : 'Other College',
                interests: p.interests,
                following: p.followingIndices.map(i => createdClubs[i]?._id).filter(Boolean)
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

            // Event 2: CURRENT (Ongoing or Published soon) - Mix Merch/Normal
            const isMerch2 = Math.random() > 0.3; // 70% chance of Merch for variety
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

            // Event 3: FUTURE (Published) - Mix Merch/Normal
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

        res.json({ message: 'Database Reset Successfully! Created 11 Orgs (6 Clubs + 2 Councils + 3 Fest Teams), 10 Participants, & ~44 varied Events.' });

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
