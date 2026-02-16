const Registration = require('../models/Registration');
const Event = require('../models/Event');
const crypto = require('crypto');

// Helper to generate Ticket ID
const generateTicketId = () => {
    return 'FEL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
const registerEvent = async (req, res) => {
    try {
        const { eventId, responses, teamName } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if already registered
        const existingReg = await Registration.findOne({ user: req.user._id, event: eventId });
        if (existingReg) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Check seats
        if (event.currentRegistrations >= event.registrationLimit) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Determine status
        let status = 'Confirmed';
        if (event.type === 'Merchandise' || event.registrationFee > 0) {
            status = 'Pending'; // Waiting for payment proof (Tier A implementation later)
        }

        const registration = await Registration.create({
            user: req.user._id,
            event: eventId,
            status,
            responses,
            teamName,
            ticketId: status === 'Confirmed' ? generateTicketId() : null
        });

        // Update event count
        if (status === 'Confirmed') {
            event.currentRegistrations = event.currentRegistrations + 1;
            await event.save();
        }

        res.status(201).json(registration);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get my registrations
// @route   GET /api/registrations/my
// @access  Private
const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ user: req.user._id })
            .populate('event', 'name type startDate registrationFee status');
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if registered for specific event
// @route   GET /api/registrations/check/:eventId
// @access  Private
const checkRegistration = async (req, res) => {
    try {
        const registration = await Registration.findOne({ user: req.user._id, event: req.params.eventId });
        if (registration) {
            res.json({ isRegistered: true, registration });
        } else {
            res.json({ isRegistered: false });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { registerEvent, getMyRegistrations, checkRegistration };
