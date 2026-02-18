const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Context: Either Event (Global) or Team (Private)
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },

    content: {
        type: String,
        required: true
    },
    // Threading
    parentMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    // Moderation
    isPinned: {
        type: Boolean,
        default: false
    },
    // Reactions: Map of userId -> reactionType (e.g. 'like', 'heart')
    reactions: {
        type: Map,
        of: String,
        default: {}
    },
    // Message Type
    type: {
        type: String,
        enum: ['text', 'announcement', 'question'],
        default: 'text'
    }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
