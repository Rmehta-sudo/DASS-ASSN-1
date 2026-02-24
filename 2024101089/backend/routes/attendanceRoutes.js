const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceStats, exportAttendance, manualOverride } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/mark', protect, authorize('organizer'), markAttendance);
router.post('/manual', protect, authorize('organizer'), manualOverride);
router.get('/stats/:eventId', protect, authorize('organizer'), getAttendanceStats);
router.get('/export/:eventId', protect, authorize('organizer'), exportAttendance);

module.exports = router;
