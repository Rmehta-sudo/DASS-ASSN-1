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

// @desc    Manually override and mark attendance via Ticket ID
// @route   POST /api/attendance/manual
// @access  Private/Organizer
const manualOverride = async (req, res) => {
    const { ticketId, reason } = req.body;

    if (!reason || String(reason).trim() === '') {
        return res.status(400).json({ message: 'A reason must be provided for manual override' });
    }

    try {
        const registration = await Registration.findOne({ ticketId })
            .populate('user', 'firstName lastName email collegeName')
            .populate('event', 'name organizer');

        if (!registration) {
            return res.status(404).json({ message: 'Invalid Ticket ID' });
        }

        if (registration.attended) {
            return res.status(400).json({
                message: 'Already Marked Present'
            });
        }

        registration.attended = true;
        registration.auditLog.push({
            action: 'MANUAL_OVERRIDE',
            reason: reason
        });
        await registration.save();

        res.json({
            message: 'Manual Override Successful',
            user: registration.user,
            event: registration.event
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance statistics for an event
// @route   GET /api/attendance/stats/:eventId
// @access  Private/Organizer
const getAttendanceStats = async (req, res) => {
    try {
        const { eventId } = req.params;
        const totalRegistrations = await Registration.countDocuments({ event: eventId, status: 'Confirmed' });
        const attendedCount = await Registration.countDocuments({ event: eventId, status: 'Confirmed', attended: true });

        // Get recent scans
        const recentScans = await Registration.find({ event: eventId, status: 'Confirmed', attended: true })
            .sort({ updatedAt: -1 })
            .limit(10)
            .populate('user', 'firstName lastName email');

        res.json({
            totalRegistrations,
            attendedCount,
            recentScans
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export attendance report as CSV
// @route   GET /api/attendance/export/:eventId
// @access  Private/Organizer
const exportAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;
        const registrations = await Registration.find({ event: eventId, status: 'Confirmed' })
            .populate('user', 'firstName lastName email contactNumber collegeName')
            .sort({ attended: -1, 'user.firstName': 1 }); // Attended first

        const fields = ['Ticket ID', 'Name', 'Email', 'Contact', 'College', 'Attended', 'Check-in Time'];
        const csvRows = [fields.join(',')];

        registrations.forEach(reg => {
            const checkInTime = reg.attended ? new Date(reg.updatedAt).toLocaleString() : '-';
            const row = [
                reg.ticketId,
                `"${reg.user.firstName} ${reg.user.lastName}"`,
                reg.user.email,
                reg.user.contactNumber || '',
                `"${reg.user.collegeName || ''}"`,
                reg.attended ? 'Yes' : 'No',
                checkInTime
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${eventId}.csv"`);
        res.status(200).send(csvString);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { markAttendance, getAttendanceStats, exportAttendance, manualOverride };
