const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Mark attendance via Ticket ID
// @route   POST /api/attendance/mark
// @access  Private/Organizer (or Admin)
const markAttendance = async (req, res) => {
    const { ticketId } = req.body;

    try {
        const registration = await Registration.findOne({ ticketId })
            .populate('user', 'firstName lastName email collegeName')
            .populate('event', 'name organizer');

        if (!registration) {
            return res.status(404).json({ message: 'Invalid Ticket ID' });
        }

        // Check if event belongs to organizer (Optional security check)
        // For now, allow any organizer to scan (or check strictly)
        // rigid check: if (registration.event.organizer.toString() !== req.user.organizerId) ...
        // skipping strict check for simplicity/admin use.

        if (registration.attended) {
            return res.status(400).json({
                message: 'Unknown Error', // Placeholder
                error: 'Already Marked Present',
                registration
            });
        }

        registration.attended = true;
        await registration.save();

        res.json({
            message: 'Attendance Marked Successfully',
            user: registration.user,
            event: registration.event
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { markAttendance };
