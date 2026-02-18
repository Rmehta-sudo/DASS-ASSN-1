const User = require('../models/User');
const Organizer = require('../models/Organizer');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    // Student style debugging
    console.log("Login attempt for:", email);

    const user = await User.findOne({ email }).populate('following', 'organizerName category');

    if (user && (await user.matchPassword(password))) {

        // If user is an organizer, fetch organizer details too
        let organizerDetails = null;
        if (user.role === 'organizer') {
            organizerDetails = await Organizer.findOne({ user: user._id });
        }

        res.json({
            _id: user._id,
            name: user.firstName + ' ' + user.lastName,
            email: user.email,
            role: user.role,
            organizerId: organizerDetails ? organizerDetails._id : null,
            interests: user.interests,
            following: user.following,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { firstName, lastName, email, password, contactNumber, collegeName } = req.body;

    console.log("Registering user:", email);

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    // Domain check for IIIT
    let participantType = 'Non-IIIT';
    if (email.endsWith('iiit.ac.in')) {
        participantType = 'IIIT';
    }

    const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        participantType,
        collegeName: participantType === 'IIIT' ? 'IIIT Hyderabad' : collegeName,
        contactNumber
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.firstName + ' ' + user.lastName,
            email: user.email,
            role: user.role,
            participantType: user.participantType,
            interests: user.interests,
            following: user.following,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Update user preferences (interests, following)
// @route   PUT /api/auth/preferences
// @access  Private (Participant)
const updatePreferences = async (req, res) => {
    try {
        const { interests, following } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update preferences
        if (interests) user.interests = interests;
        if (following) user.following = following;

        await user.save();

        res.json({
            message: 'Preferences updated successfully',
            interests: user.interests,
            following: user.following
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Editable fields
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.contactNumber = req.body.contactNumber || user.contactNumber;
        user.collegeName = req.body.collegeName || user.collegeName;

        // Interests & Following (Optional updates)
        if (req.body.interests) user.interests = req.body.interests;
        if (req.body.following) user.following = req.body.following;

        // Password change (Optional - if provided)
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        await updatedUser.populate('following', 'organizerName category');

        res.json({
            _id: updatedUser._id,
            name: updatedUser.firstName + ' ' + updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            participantType: updatedUser.participantType,
            interests: updatedUser.interests,
            following: updatedUser.following,
            token: generateToken(updatedUser._id),
            contactNumber: updatedUser.contactNumber,
            collegeName: updatedUser.collegeName
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('following', 'organizerName category');

        if (user) {
            res.json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                participantType: user.participantType,
                contactNumber: user.contactNumber,
                collegeName: user.collegeName,
                interests: user.interests,
                following: user.following
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const jwt = require('jsonwebtoken');

// ... existing imports ...

// @desc    Forgot Password - Generate Reset Token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate specific reset token (valid for 10 mins)
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

        // Mock Email
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
        console.log(`[EMAIL MOCK] Password Reset Link for ${email}: ${resetLink}`);

        res.json({
            message: 'Password reset link sent to email (Check console)',
            resetToken // For testing, return it here
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password - Verify Token and Update
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};

module.exports = { authUser, registerUser, updatePreferences, updateUserProfile, getUserProfile, forgotPassword, resetPassword };
