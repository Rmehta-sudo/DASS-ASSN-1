const express = require('express');
const router = express.Router();
const { getEventMessages, getTeamMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/event/:eventId', protect, getEventMessages);
router.get('/team/:teamId', protect, getTeamMessages);

module.exports = router;
