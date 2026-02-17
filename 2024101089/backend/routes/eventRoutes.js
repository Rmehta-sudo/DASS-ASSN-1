const express = require('express');
const router = express.Router();
const {
    createEvent, getEvents, getMyEvents, getEventById, updateEvent, deleteEvent, getRecommendedEvents
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getEvents)
    .post(protect, createEvent);

router.route('/my')
    .get(protect, getMyEvents);

router.route('/recommended')
    .get(protect, getRecommendedEvents);

router.route('/:id')
    .get(getEventById)
    .put(protect, updateEvent)
    .delete(protect, deleteEvent);

module.exports = router;
