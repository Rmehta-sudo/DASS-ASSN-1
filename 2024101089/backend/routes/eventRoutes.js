const express = require('express');
const router = express.Router();
const {
    createEvent, getEvents, getMyEvents, getEventById, updateEvent, deleteEvent, getRecommendedEvents, getEventAnalytics, getTrendingEvents, exportEventCsv
} = require('../controllers/eventController');
const { protect, authorize, optionalProtect } = require('../middleware/authMiddleware');

router.route('/')
    .get(optionalProtect, getEvents)
    .post(protect, createEvent);

router.route('/my')
    .get(protect, getMyEvents);

router.route('/recommended')
    .get(protect, getRecommendedEvents);

router.route('/trending')
    .get(getTrendingEvents);

router.route('/:id')
    .get(getEventById)
    .put(protect, authorize('organizer'), updateEvent)
    .delete(protect, authorize('organizer'), deleteEvent);

router.route('/:id/analytics')
    .get(protect, authorize('organizer'), getEventAnalytics);

router.route('/:id/csv')
    .get(protect, authorize('organizer'), exportEventCsv);

module.exports = router;
