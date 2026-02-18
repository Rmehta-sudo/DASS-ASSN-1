const express = require('express');
const router = express.Router();
const { getEventMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/event/:eventId', protect, getEventMessages);


module.exports = router;
