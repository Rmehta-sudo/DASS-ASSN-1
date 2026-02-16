const express = require('express');
const router = express.Router();
const { registerEvent, getMyRegistrations, checkRegistration } = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, registerEvent);

router.route('/my')
    .get(protect, getMyRegistrations);

router.route('/check/:eventId')
    .get(protect, checkRegistration);

module.exports = router;
