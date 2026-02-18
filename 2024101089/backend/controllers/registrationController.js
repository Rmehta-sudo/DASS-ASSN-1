const Registration = require('../models/Registration');
const Event = require('../models/Event');
const crypto = require('crypto');

// Helper to generate Ticket ID
const generateTicketId = () => {
    return 'FEL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
const registerEvent = async (req, res) => {
    try {
        const { eventId, responses, teamName, merchandiseSelection } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if already registered
        const existingReg = await Registration.findOne({ user: req.user._id, event: eventId });
        if (existingReg) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Check seats
        if (event.currentRegistrations >= event.registrationLimit && event.registrationLimit > 0) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // Check Eligibility
        if (event.eligibility === 'IIIT Only' && req.user.participantType !== 'IIIT') {
            return res.status(403).json({ message: 'This event is restricted to IIIT students only' });
        }

        // Determine status and Handle Merchandise
        let status = 'Confirmed';
        let totalCost = 0;

        // Merchandise Logic
        if (event.type === 'Merchandise' || (merchandiseSelection && merchandiseSelection.length > 0)) {
            // Validate Merchandise Selection
            if (merchandiseSelection && merchandiseSelection.length > 0) {
                for (const selection of merchandiseSelection) {
                    const item = event.merchandise.id(selection.itemId);
                    if (!item) {
                        return res.status(404).json({ message: `Merchandise item not found: ${selection.itemId}` });
                    }

                    // Check Sort
                    if (item.stock < selection.quantity) {
                        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
                    }

                    // Check Limit
                    if (item.limitPerUser && selection.quantity > item.limitPerUser) {
                        return res.status(400).json({ message: `Limit of ${item.limitPerUser} per user for ${item.name}` });
                    }

                    // Check Variants
                    if (item.variants && item.variants.length > 0) {
                        if (!selection.variant) {
                            return res.status(400).json({ message: `Variant selection required for ${item.name}` });
                        }
                        // Ideally validate if variant exists in options, but for now just ensure it's provided
                    }

                    // Deduct Stock
                    item.stock -= selection.quantity;
                    totalCost += item.price * selection.quantity;
                }
            } else if (event.type === 'Merchandise') {
                return res.status(400).json({ message: 'Must select at least one item for Merchandise events' });
            }

            if (totalCost > 0) {
                status = 'Pending'; // Waiting for payment
            }
        } else if (event.registrationFee > 0) {
            status = 'Pending';
        }

        const regData = {
            user: req.user._id,
            event: eventId,
            status,
            responses, // Form responses
            merchandiseSelection,
            teamName
        };

        if (status === 'Confirmed') {
            regData.ticketId = generateTicketId();
        }

        const registration = await Registration.create(regData);

        // Update event count & stock
        if (status === 'Confirmed' && event.type !== 'Merchandise') {
            // For normal events, increment registration count
            // (For merchandise events, we don't count "registrations" against a global limit usually, 
            // but if there is a global limit, we should. Let's assume yes.)
            event.currentRegistrations = event.currentRegistrations + 1;
        }

        // Save event (persists stock deduction)
        await event.save();

        res.status(201).json(registration);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get my registrations
// @route   GET /api/registrations/my
// @access  Private
const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ user: req.user._id })
            .populate({
                path: 'event',
                select: 'name type startDate registrationFee status organizer',
                populate: { path: 'organizer', select: 'name' }
            })
            .sort({ createdAt: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if registered for specific event
// @route   GET /api/registrations/check/:eventId
// @access  Private
const checkRegistration = async (req, res) => {
    try {
        const registration = await Registration.findOne({ user: req.user._id, event: req.params.eventId });
        if (registration) {
            res.json({ isRegistered: true, registration });
        } else {
            res.json({ isRegistered: false });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get all registrations for an event (for organizers)
// @route   GET /api/registrations/event/:eventId
// @access  Private (Organizer)
const getEventRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('user', 'firstName lastName email contactNumber')
            .sort({ createdAt: -1 });
        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update registration status (approve/reject from waitlist)
// @route   PUT /api/registrations/:id/status
// @access  Private (Organizer)
const updateRegistrationStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'Confirmed', 'Rejected'
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        registration.status = status;

        // Generate ticket if confirming
        if (status === 'Confirmed' && !registration.ticketId) {
            registration.ticketId = generateTicketId();

            // Update event count
            const event = await Event.findById(registration.event);
            event.currentRegistrations = event.currentRegistrations + 1;
            await event.save();
        }

        await registration.save();
        res.json(registration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload payment proof
// @route   PUT /api/registrations/:id/payment
// @access  Private
const uploadPaymentProof = async (req, res) => {
    try {
        const { paymentProof } = req.body;
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Check ownership
        if (registration.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        registration.paymentProof = paymentProof;
        await registration.save();

        res.json(registration);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download ICS file for a registration
// @route   GET /api/registrations/:id/ics
// @access  Private
const downloadIcs = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id).populate('event');
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Ownership check
        if (registration.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const event = registration.event;
        const formatTime = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

        const startDate = formatTime(new Date(event.startDate));
        const endDate = event.endDate ? formatTime(new Date(event.endDate)) : startDate;

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Felicity Fest//EN
BEGIN:VEVENT
UID:${registration._id}@felicity.iiit.ac.in
DTSTAMP:${formatTime(new Date())}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.name}
DESCRIPTION:${event.description}
LOCATION:${event.location || 'TBA'}
END:VEVENT
END:VCALENDAR`;

        res.set('Content-Type', 'text/calendar');
        res.set('Content-Disposition', `attachment; filename="${event.name.replace(/[^a-z0-9]/yi, '_')}.ics"`);
        res.send(icsContent);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerEvent, getMyRegistrations, checkRegistration, getEventRegistrations, updateRegistrationStatus, uploadPaymentProof, downloadIcs };
