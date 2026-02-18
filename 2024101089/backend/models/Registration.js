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
        itemId: { type: String },
        quantity: { type: Number, default: 1 },
        variant: { type: Object },
        price: { type: Number }
    }],



    // Ticket ID
    ticketId: {
        type: String,
        unique: true,
        sparse: true // Allow multiple nulls
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
