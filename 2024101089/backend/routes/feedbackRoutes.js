const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { addFeedback, getEventFeedback } = require('../controllers/feedbackController');

router.post('/', protect, addFeedback);
router.get('/event/:identifier', protect, getEventFeedback);

module.exports = router;
