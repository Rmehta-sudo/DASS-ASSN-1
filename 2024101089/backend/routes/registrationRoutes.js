const express = require('express');
const router = express.Router();
const { registerEvent, getMyRegistrations, checkRegistration, getEventRegistrations, updateRegistrationStatus, uploadPaymentProof, downloadIcs } = require('../controllers/registrationController');
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

router.route('/:id/payment')
    .put(protect, uploadPaymentProof);

router.route('/:id/ics')
    .get(protect, downloadIcs);

module.exports = router;
