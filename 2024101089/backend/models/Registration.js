const mongoose = require('mongoose');

const registrationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Rejected'],
        default: 'Confirmed' // Default confirmed for free events
    },

    // Custom Form Responses
    responses: [{
        label: String,
        answer: mongoose.Schema.Types.Mixed
    }],

    // Merchandise Specifics
    paymentProof: {
        type: String // URL to image
    },
    merchandiseSelection: [{
        itemId: String,
        quantity: Number
    }],

    // Team Logic (Tier A)
    teamName: {
        type: String
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },

    // Ticket ID
    ticketId: {
        type: String,
        unique: true
    },
    attended: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true,
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
