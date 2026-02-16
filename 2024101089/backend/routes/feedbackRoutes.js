const express = require('express');
const router = express.Router();
const { addFeedback, getEventFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:eventId', protect, addFeedback);
router.get('/:eventId', getEventFeedback);

module.exports = router;
