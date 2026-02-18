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
            location, tags, formFields, merchandise,
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
            location, tags, formFields, merchandise,
            status: eventStatus
        });

        if (eventStatus === 'Published') {
            sendDiscordNotification(
                `📢 New Event Published: **${name}** by ${organizer.name}! Check it out now.`,
                organizer.discordWebhook
            );
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
                // Only block if formFields have ACTUALLY changed
                const newFields = JSON.stringify(req.body.formFields);
                const oldFields = JSON.stringify(event.formFields);

                // We need to be careful about Mongoose ID fields in oldFields vs potentially no IDs in newFields
                // Simplest check: if length differs or if content differs (ignoring _id might be hard with stringify)

                // Better approach for strict comparison involving IDs:
                // Let's rely on the fact that the frontend probably sends back what it got, potentially with _ids.
                // If the user didn't touch form builder, it should be identical?
                // Actually, let's just use a loose check or trust the organizer knows what they are doing? 
                // No, protecting data is key.

                // Let's strip _id from oldFields for comparison if newFields doesn't have them?
                // Or simply: If I assume the frontend sends the exact same object back if untouched.

                if (newFields !== oldFields) {
                    // Fallback: This might be too strict if order changes or _id is handled differently.
                    // But for now, let's try to be lenient or specific.

                    // If the user is just trying to change status, maybe we should prioritize that?
                    // But they used the Edit endpoint.

                    // Let's try to remove _id from both for comparison.
                    const cleanOld = event.formFields.map(f => ({ label: f.label, type: f.type, options: f.options, required: f.required }));
                    const cleanNew = req.body.formFields.map(f => ({ label: f.label, type: f.type, options: f.options, required: f.required }));

                    if (JSON.stringify(cleanOld) !== JSON.stringify(cleanNew)) {
                        return res.status(400).json({ message: 'Cannot modify form fields after registrations have started' });
                    }
                }
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

// @desc    Get trending events (Top 5 by registrations in last 24h)
// @route   GET /api/events/trending
// @access  Public
const getTrendingEvents = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Aggregate registrations to find top events
        const trending = await Registration.aggregate([
            {
                $match: {
                    createdAt: { $gte: twentyFourHoursAgo }, // Filter last 24h
                    status: { $in: ['Confirmed', 'Pending'] } // Valid registrations
                }
            },
            {
                $group: {
                    _id: '$event', // Group by Event ID
                    count: { $sum: 1 } // Count registrations
                }
            },
            {
                $sort: { count: -1 } // Sort descending
            },
            {
                $limit: 5 // Top 5
            },
            {
                $lookup: { // Populate Event details
                    from: 'events',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'eventDetails'
                }
            },
            {
                $unwind: '$eventDetails' // Unwind array
            },
            {
                $project: { // Shape output
                    _id: '$eventDetails._id',
                    name: '$eventDetails.name',
                    description: '$eventDetails.description',
                    startDate: '$eventDetails.startDate',
                    type: '$eventDetails.type',
                    registrationFee: '$eventDetails.registrationFee',
                    registrationCount: '$count'
                }
            }
        ]);

        // If no trending (e.g. dev env), return recently created Published events as fallback
        if (trending.length === 0) {
            const fallback = await Event.find({ status: 'Published' })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name description startDate type registrationFee');
            return res.json(fallback);
        }

        res.json(trending);

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

// @desc    Export event registrations to CSV
// @route   GET /api/events/:id/csv
// @access  Private (Organizer)
const exportEventCsv = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check ownership
        const organizer = await Organizer.findOne({ user: req.user._id });
        if (!organizer || event.organizer.toString() !== organizer._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const registrations = await Registration.find({ event: req.params.id })
            .populate('user', 'firstName lastName email contactNumber collegeName')
            .sort({ createdAt: -1 });

        // Generate CSV content
        const headers = ['Ticket ID', 'Status', 'First Name', 'Last Name', 'Email', 'Phone', 'College', 'Reg Date'];
        const rows = registrations.map(reg => [
            reg.ticketId || 'N/A',
            reg.status,
            reg.user.firstName,
            reg.user.lastName,
            reg.user.email,
            reg.user.contactNumber || 'N/A',
            reg.user.collegeName || 'N/A',

            new Date(reg.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        res.header('Content-Type', 'text/csv');
        res.attachment(`${event.name.replace(/[^a-z0-9]/yi, '_')}_participants.csv`);
        res.send(csvContent);

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
    getTrendingEvents,
    getRecommendedEvents,
    getTrendingEvents,
    getEventAnalytics,
    exportEventCsv
};
