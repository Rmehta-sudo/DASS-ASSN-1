const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceStats, exportAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/mark', protect, authorize('organizer'), markAttendance);
router.get('/stats/:eventId', protect, authorize('organizer'), getAttendanceStats);
router.get('/export/:eventId', protect, authorize('organizer'), exportAttendance);

module.exports = router;
