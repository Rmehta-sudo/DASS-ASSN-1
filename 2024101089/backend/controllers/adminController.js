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
        const password = 'password123';

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

module.exports = {
    getClubs,
    deleteClub,
    addClub,
    requestPasswordReset,
    getResetRequests,
    processResetRequest
};
