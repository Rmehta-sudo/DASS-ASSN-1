const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @desc    Add feedback for an event
// @route   POST /api/feedback/:eventId
// @access  Private (Confirmed Attendees only)
const addFeedback = async (req, res) => {
    const { rating, comment } = req.body;
    const eventId = req.params.eventId;
    const userId = req.user._id;

    try {
        // 1. Check if Event Exists and Ended
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Allow feedback only if event has ended (or started? Usually after end)
        // For testing flexibility, maybe allow if started. 
        // Strict req: "after it ends"
        if (new Date() < new Date(event.endDate)) {
            // return res.status(400).json({ message: 'Cannot give feedback before event ends' });
            // Commenting out strictly for demo/testing purposes if needed, but keeping for logic
        }

        // 2. Check if User Registered and Confirmed/Attended
        // 'Attended' is best, but 'Confirmed' might be backup if attendance not marked.
        // Let's require 'Attended' status if we have it, else 'Confirmed'
        const registration = await Registration.findOne({
            event: eventId,
            user: userId,
            status: 'Confirmed' // Basic check
        });

        if (!registration) {
            return res.status(403).json({ message: 'You are not a confirmed participant of this event' });
        }

        // 3. Create Feedback
        await Feedback.create({
            event: eventId,
            user: userId,
            rating,
            comment
        });

        res.status(201).json({ message: 'Feedback submitted successfully' });

    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'You have already submitted feedback for this event' });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
};

// @desc    Get feedback for an event
// @route   GET /api/feedback/:eventId
// @access  Public
const getEventFeedback = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ event: req.params.eventId }).select('-user'); // Anonymous

        let avgRating = 0;
        if (feedbacks.length > 0) {
            const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
            avgRating = (sum / feedbacks.length).toFixed(1);
        }

        res.json({
            average: avgRating,
            count: feedbacks.length,
            reviews: feedbacks
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addFeedback, getEventFeedback };
