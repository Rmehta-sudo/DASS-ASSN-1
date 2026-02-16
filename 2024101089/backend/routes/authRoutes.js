const express = require('express');
const router = express.Router();
const { authUser, registerUser, updatePreferences } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', authUser);
router.post('/register', registerUser);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
