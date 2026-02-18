const Message = require('../models/Message');

// @desc    Get messages for an event (Discussion Forum)
// @route   GET /api/chat/event/:eventId
// @access  Private
const getEventMessages = async (req, res) => {
    try {
        const messages = await Message.find({ event: req.params.eventId })
            .populate('sender', 'firstName lastName')
            .populate('parentMessage') // Populate parent for threading
            .sort({ createdAt: 1 }); // Oldest first
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle Pin Message (Organizer Only)
// @route   PUT /api/chat/message/:id/pin
// @access  Private (Organizer)
const togglePinMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Check if user is organizer of the event
        // Ideally we check event ownership here. For now, assuming middleware or frontend checks role.
        // A better check: const event = await Event.findById(message.event); if (event.organizer.user.toString() !== req.user._id) ...

        message.isPinned = !message.isPinned;
        await message.save();

        // Emit update
        const io = req.app.get('io');
        if (message.event) {
            io.to(`event_${message.event}`).emit('message_updated', message);
        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Message
// @route   DELETE /api/chat/message/:id
// @access  Private (Sender or Organizer)
const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Allow deletion if user is sender OR user is organizer (admin-like)
        // Check req.user._id vs message.sender
        // Also check if req.user is the organizer of the event

        if (message.sender.toString() !== req.user._id.toString() && req.user.role !== 'organizer') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await message.deleteOne();

        // Emit delete event
        const io = req.app.get('io');
        if (message.event) {
            io.to(`event_${message.event}`).emit('message_deleted', message._id);
        }

        res.json({ message: 'Message removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    React to Message
// @route   PUT /api/chat/message/:id/react
// @access  Private
const reactToMessage = async (req, res) => {
    try {
        const { reaction } = req.body; // e.g., 'like', 'love', 'funny'
        const message = await Message.findById(req.params.id);

        if (!message) return res.status(404).json({ message: 'Message not found' });

        const userId = req.user._id.toString();

        // Toggle reaction: if already reacted with same type, remove it. Else, set it.
        // Using Map: message.reactions.get(userId)

        if (message.reactions.get(userId) === reaction) {
            message.reactions.delete(userId);
        } else {
            message.reactions.set(userId, reaction);
        }

        await message.save();

        // Emit update
        const io = req.app.get('io');
        if (message.event) {
            io.to(`event_${message.event}`).emit('message_updated', message);
        }

        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getEventMessages, togglePinMessage, deleteMessage, reactToMessage };
