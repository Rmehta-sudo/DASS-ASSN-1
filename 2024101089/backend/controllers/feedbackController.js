const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// @desc    Add feedback for an event
// @route   POST /api/feedback
// @access  Private (Participant)
const addFeedback = async (req, res) => {
    try {
        const { eventId, rating, comment } = req.body;

        // 1. Check if user registered and confirmed
        const registration = await Registration.findOne({
            user: req.user._id,
            event: eventId,
            status: 'Confirmed'
        });

        if (!registration) {
            return res.status(403).json({ message: 'You can only rate events you have attended (Confirmed registration).' });
        }

        // 2. Check if event is over (optional, but logical)
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Allow feedback even if strictly not "Completed" status, but usually for past events
        // User requirement: "events they have attended"

        // 3. Check for existing feedback
        const existingFeedback = await Feedback.findOne({
            user: req.user._id,
            event: eventId
        });

        if (existingFeedback) {
            return res.status(400).json({ message: 'You have already submitted feedback for this event.' });
        }

        const feedback = await Feedback.create({
            user: req.user._id,
            event: eventId,
            rating,
            comment,
            isAnonymous: true
        });

        res.status(201).json(feedback);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get feedback for an event (Organizer)
// @route   GET /api/feedback/event/:identifier
// @access  Private (Organizer)
const getEventFeedback = async (req, res) => {
    try {
        // identifier can be eventId
        const eventId = req.params.identifier;

        const feedbackList = await Feedback.find({ event: eventId }).select('-user'); // Exclude user to ensure anonymity

        if (feedbackList.length === 0) {
            return res.json({
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                comments: []
            });
        }

        // Calculate Stats
        let totalRating = 0;
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const comments = [];

        feedbackList.forEach(f => {
            totalRating += f.rating;
            if (f.rating >= 1 && f.rating <= 5) {
                ratingDistribution[f.rating]++;
            }
            if (f.comment) {
                comments.push({
                    rating: f.rating,
                    text: f.comment,
                    createdAt: f.createdAt
                });
            }
        });

        const averageRating = (totalRating / feedbackList.length).toFixed(1);

        res.json({
            averageRating,
            ratingDistribution,
            comments
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addFeedback,
    getEventFeedback
};
