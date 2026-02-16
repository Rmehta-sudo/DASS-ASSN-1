const express = require('express');
const router = express.Router();
const { createTeam, joinTeam, getMyTeam, leaveTeam } = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTeam);
router.post('/join', protect, joinTeam);
router.post('/leave', protect, leaveTeam);
router.get('/:eventId', protect, getMyTeam);

module.exports = router;
