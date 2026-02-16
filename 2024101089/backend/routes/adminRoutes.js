const express = require('express');
const router = express.Router();
const { getClubs, deleteClub, addClub, requestPasswordReset, getResetRequests, processResetRequest } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/clubs')
    .get(protect, getClubs)  // Changed: allow any authenticated user to view clubs
    .post(protect, admin, addClub);  // Keep admin-only for creating

router.route('/clubs/:id')
    .delete(protect, admin, deleteClub);

// Password Reset Routes
router.route('/reset-request')
    .post(requestPasswordReset); // Public access

router.route('/reset-requests')
    .get(protect, admin, getResetRequests);

router.route('/reset-request/:id')
    .put(protect, admin, processResetRequest);

module.exports = router;
