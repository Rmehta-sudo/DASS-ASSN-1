const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');

// @desc    Upload a file (for form responses)
// @route   POST /api/uploads
// @access  Private
router.post('/', protect, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return URL using the protected route
    res.json({
        url: `/api/uploads/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size
    });
});

// @desc    Download a file — protected: organizer of the event, admin, or the uploader
// @route   GET /api/uploads/:filename
// @access  Private
router.get('/:filename', protect, async (req, res) => {
    try {
        const { filename } = req.params;

        // Reject any path-traversal attempts
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ message: 'Invalid filename' });
        }

        const fileUrl = `/api/uploads/${filename}`;

        // Find the registration that contains this file URL in its responses or as paymentProof
        const registration = await Registration.findOne({
            $or: [
                { 'responses.answer': fileUrl },
                { paymentProof: fileUrl }
            ]
        }).populate('event');

        // If no registration found, deny access (fail closed — never expose files not tied to a registration)
        if (!registration) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const isAdmin = req.user.role === 'admin';
        // Compare ObjectId strings explicitly
        const isUploader = registration.user.toString() === req.user._id.toString();

        let isOrganizer = false;
        if (req.user.role === 'organizer') {
            const organizer = await Organizer.findOne({ user: req.user._id });
            if (
                organizer &&
                registration.event &&
                registration.event.organizer.toString() === organizer._id.toString()
            ) {
                isOrganizer = true;
            }
        }

        if (!isAdmin && !isOrganizer && !isUploader) {
            return res.status(403).json({ message: 'Not authorized to access this file' });
        }

        const filePath = path.join(__dirname, '..', 'uploads', filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
