const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Registration = require('../models/Registration');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Organizer
const createEvent = async (req, res) => {
    try {
        const {
            name, description, type, eligibility,
            registrationFee, registrationLimit, startDate, endDate, deadline,
            location, tags, formFields, merchandise, teamSizeMin, teamSizeMax
        } = req.body;

        // Ensure user is an organizer
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can create events' });
        }

        const organizer = await Organizer.findOne({ user: req.user._id });

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer profile not found' });
        }

        const event = await Event.create({
            organizer: organizer._id,
            name, description, type, eligibility,
            registrationFee, registrationLimit, startDate, endDate, deadline,
            location, tags, formFields, merchandise, teamSizeMin, teamSizeMax,
            status: 'Draft' // Default status
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all events (public)
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
    try {
        // Can add filters here later
        const events = await Event.find({ status: { $ne: 'Draft' } })
            .populate('organizer', 'name category');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get organizer's own events
// @route   GET /api/events/my
// @access  Private/Organizer
const getMyEvents = async (req, res) => {
    try {
        const organizer = await Organizer.findOne({ user: req.user._id });
        if (!organizer) {
            return res.status(404).json({ message: 'Not an organizer' });
        }
        const events = await Event.find({ organizer: organizer._id });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name category contactEmail description');
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Organizer
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check ownership
        const organizer = await Organizer.findOne({ user: req.user._id });
        if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this event' });
        }

        // Check if formFields are being updated
        if (req.body.formFields) {
            const registrationCount = await Registration.countDocuments({ event: event._id });
            if (registrationCount > 0) {
                return res.status(400).json({ message: 'Cannot modify form fields after registrations have started' });
            }
        }

        // Logic check: Can't edit core details if published? (Student logic: allow it but warn?)
        // Applying updates
        Object.assign(event, req.body);

        await event.save();
        res.json(event);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Organizer
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const organizer = await Organizer.findOne({ user: req.user._id });
        if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this event' });
        }

        await event.deleteOne();
        res.json({ message: 'Event removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get recommended events based on user interests
// @route   GET /api/events/recommended
// @access  Private (Participant)
const getRecommendedEvents = async (req, res) => {
    try {
        const user = req.user;

        // Build query based on interests and following
        let query = { status: 'Published' };

        if (user.interests.length > 0 || user.following.length > 0) {
            const tagQueries = user.interests.map(interest => ({
                tags: { $regex: interest, $options: 'i' }
            }));

            query.$or = [
                { organizer: { $in: user.following } },
                ...tagQueries
            ];
        }

        const recommended = await Event.find(query)
            .sort({ startDate: 1 })
            .limit(10)
            .populate('organizer', 'name category');

        res.json(recommended);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createEvent,
    getEvents,
    getMyEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    getRecommendedEvents
};
