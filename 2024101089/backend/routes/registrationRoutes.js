const express = require('express');
const router = express.Router();
const { registerEvent, getMyRegistrations, checkRegistration, getEventRegistrations, updateRegistrationStatus } = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, registerEvent);

router.route('/my')
    .get(protect, getMyRegistrations);

router.route('/check/:eventId')
    .get(protect, checkRegistration);

router.route('/event/:eventId')
    .get(protect, getEventRegistrations);

router.route('/:id/status')
    .put(protect, updateRegistrationStatus);

module.exports = router;
