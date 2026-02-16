const mongoose = require('mongoose');

const formFieldSchema = mongoose.Schema({
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'dropdown', 'checkbox', 'file'], required: true },
    options: [{ type: String }], // For dropdowns
    required: { type: Boolean, default: false }
});

const eventSchema = mongoose.Schema({
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['Normal', 'Merchandise'],
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Draft'
    },
    eligibility: {
        type: String, // e.g. "Anyone", "IIIT Only"
        default: "Anyone"
    },
    registrationFee: {
        type: Number,
        default: 0
    },
    registrationLimit: {
        type: Number,
        default: 0 // 0 means unlimited
    },
    teamSizeMin: {
        type: Number,
        default: 1
    },
    teamSizeMax: {
        type: Number,
        default: 1
    },
    currentRegistrations: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    deadline: {
        type: Date
    },
    location: {
        type: String
    },
    tags: [{ type: String }],

    // Custom Registration Form (for Normal Events)
    formFields: [formFieldSchema],

    // Merchandise Specifics
    merchandise: [{
        name: String,
        price: Number,
        stock: Number
    }]
}, {
    timestamps: true,
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
