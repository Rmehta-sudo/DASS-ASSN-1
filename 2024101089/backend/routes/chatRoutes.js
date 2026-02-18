const express = require('express');
const router = express.Router();
const { getEventMessages, togglePinMessage, deleteMessage, reactToMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/event/:eventId', protect, getEventMessages);
router.put('/message/:id/pin', protect, togglePinMessage);
router.delete('/message/:id', protect, deleteMessage);
router.put('/message/:id/react', protect, reactToMessage);


module.exports = router;
