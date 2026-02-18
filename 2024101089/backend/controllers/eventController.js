const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const Registration = require('../models/Registration');
const sendDiscordNotification = require('../utils/discordWebhook');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private/Organizer
const createEvent = async (req, res) => {
    try {
        const {
            name, description, type, eligibility,
            registrationFee, registrationLimit, startDate, endDate, deadline,
            location, tags, formFields, merchandise, teamSizeMin, teamSizeMax,
            status
        } = req.body;

        // Ensure user is an organizer
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can create events' });
        }

        const organizer = await Organizer.findOne({ user: req.user._id });

        if (!organizer) {
            return res.status(404).json({ message: 'Organizer profile not found' });
        }

        const eventStatus = status || 'Draft';

        const event = await Event.create({
            organizer: organizer._id,
            name, description, type, eligibility,
            registrationFee, registrationLimit, startDate, endDate, deadline,
            location, tags, formFields, merchandise, teamSizeMin, teamSizeMax,
            status: eventStatus
        });

        if (eventStatus === 'Published') {
            sendDiscordNotification(`📢 New Event Published: **${name}** by ${organizer.name}! Check it out now.`);
        }

        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all events (public)
// @route   GET /api/events
// @access  Public
// @desc    Get all events (public, with optional personalization)
// @route   GET /api/events
// @access  Public (Optional Auth)
const getEvents = async (req, res) => {
    try {
        let query = { status: { $ne: 'Draft' } };

        // Filter by Organizer
        if (req.query.organizer) {
            query.organizer = req.query.organizer;
        }

        // Search by Name or Description
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Filter by Type
        if (req.query.type) {
            query.type = req.query.type; // 'Normal' or 'Merchandise'
        }

        let events = await Event.find(query)
            .populate('organizer', 'name category')
            .lean(); // Convert to plain JS objects for modification

        // Personalization Logic
        if (req.user) {
            const userInterests = req.user.interests || [];
            const userFollowing = req.user.following.map(id => id.toString()) || [];

            events = events.map(event => {
                let score = 0;

                // Score based on Following (Aggressive Boost)
                if (event.organizer && userFollowing.includes(event.organizer._id.toString())) {
                    score += 1000;
                }

                // Score based on Interests (+50 per match)
                if (event.tags && event.tags.length > 0) {
                    const hasInterest = event.tags.some(tag =>
                        userInterests.some(interest => tag.toLowerCase().includes(interest.toLowerCase()))
                    );
                    if (hasInterest) {
                        score += 50;
                    }
                }

                return { ...event, score };
            });

            // Sort: High Score first, then Soonest Start Date
            events.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return new Date(a.startDate) - new Date(b.startDate);
            });
        } else {
            // Default Sort: Soonest Start Date
            events.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        }

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
        const events = await Event.find({ organizer: organizer._id }).lean();

        // Attach registration counts
        const eventsWithCounts = await Promise.all(events.map(async (event) => {
            const pendingCount = await Registration.countDocuments({ event: event._id, status: 'Pending' });
            const confirmedCount = await Registration.countDocuments({ event: event._id, status: 'Confirmed' });
            const rejectedCount = await Registration.countDocuments({ event: event._id, status: 'Rejected' });

            return {
                ...event,
                stats: {
                    pending: pendingCount,
                    confirmed: confirmedCount,
                    rejected: rejectedCount,
                    total: pendingCount + confirmedCount + rejectedCount
                }
            };
        }));

        res.json(eventsWithCounts);
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

// @desc    Get event analytics (Organizer)
// @route   GET /api/events/:id/analytics
// @access  Private (Organizer)
const getEventAnalytics = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check ownership
        const organizer = await Organizer.findOne({ user: req.user._id });
        if (!organizer) {
            return res.status(403).json({ message: 'Not authorized as an organizer' });
        }

        if (event.organizer.toString() !== organizer._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view analytics for this event' });
        }

        const registrations = await Registration.find({ event: req.params.id });

        const totalRegistrations = registrations.length;
        const confirmedRegistrations = registrations.filter(r => r.status === 'Confirmed').length;
        const pendingRegistrations = registrations.filter(r => r.status === 'Pending').length;
        const totalRevenue = confirmedRegistrations * event.registrationFee;

        // Daily registrations (last 7 days)
        const dailyStats = {};
        registrations.forEach(reg => {
            const date = reg.createdAt.toISOString().split('T')[0];
            dailyStats[date] = (dailyStats[date] || 0) + 1;
        });

        res.json({
            eventName: event.name,
            totalRegistrations,
            confirmedRegistrations,
            pendingRegistrations,
            totalRevenue,
            dailyStats
        });

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
    getRecommendedEvents,
    getEventAnalytics
};
