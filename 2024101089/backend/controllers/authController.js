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

    const user = await User.findOne({ email });

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
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

module.exports = { authUser, registerUser };
