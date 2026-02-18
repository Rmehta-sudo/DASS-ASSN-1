const mongoose = require('mongoose');

const organizerSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        enum: ['Cultural', 'Technical', 'Sports', 'Other'],
        required: true
    },
    description: {
        type: String,
    },
    contactEmail: {
        type: String,
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isArchived: {
        type: Boolean,
        default: false
    },
    discordWebhook: {
        type: String
    }
}, {
    timestamps: true,
});

const Organizer = mongoose.model('Organizer', organizerSchema);

module.exports = Organizer;
