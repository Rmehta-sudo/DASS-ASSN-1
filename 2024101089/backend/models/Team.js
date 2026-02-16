const mongoose = require('mongoose');

const teamSchema = mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    inviteCode: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['Forming', 'Complete'], // Forming: Can still add members. Complete: Locked.
        default: 'Forming'
    }
}, {
    timestamps: true
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
