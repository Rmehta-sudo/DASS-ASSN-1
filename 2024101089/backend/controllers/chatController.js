const Message = require('../models/Message');

// @desc    Get messages for an event (Discussion Forum)
// @route   GET /api/chat/event/:eventId
// @access  Private
const getEventMessages = async (req, res) => {
    try {
        const messages = await Message.find({ event: req.params.eventId, team: null }) // Ensure not team chat
            .populate('sender', 'firstName lastName')
            .sort({ createdAt: 1 }); // Oldest first
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get messages for a team
// @route   GET /api/chat/team/:teamId
// @access  Private
const getTeamMessages = async (req, res) => {
    try {
        const messages = await Message.find({ team: req.params.teamId })
            .populate('sender', 'firstName lastName')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getEventMessages, getTeamMessages };
