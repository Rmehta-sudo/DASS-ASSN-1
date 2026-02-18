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
    }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
