const Registration = require('../models/Registration');
const Event = require('../models/Event');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User'); // Import User for email

// Helper to generate Ticket ID
const generateTicketId = () => {
    return 'FEL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
const registerEvent = async (req, res) => {
    try {
        const { eventId, responses, merchandiseSelection } = req.body;

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

                    // Check Stock - STRICT CHECK
                    if (item.stock < selection.quantity) {
                        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
                    }

                    // Check Limit
                    if (item.limitPerUser && selection.quantity > item.limitPerUser) {
                        return res.status(400).json({ message: `Limit of ${item.limitPerUser} per user for ${item.name}` });
                    }

                    // Check Variants
                    if (item.variants && item.variants.length > 0) {
                        if (!selection.variant || typeof selection.variant !== 'object') {
                            return res.status(400).json({ message: `Variant selection required for ${item.name}` });
                        }

                        // Check if all required variant types are selected
                        for (const vDef of item.variants) {
                            const selectedOption = selection.variant[vDef.type];
                            if (!selectedOption) {
                                return res.status(400).json({ message: `Please select a ${vDef.type} for ${item.name}` });
                            }
                            if (vDef.options && !vDef.options.includes(selectedOption)) {
                                return res.status(400).json({ message: `Invalid option '${selectedOption}' for ${vDef.type} in ${item.name}` });
                            }
                        }
                    }

                    // Deduct Stock IMMEDIATELY via mongoose doc (saved later)
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

        };

        if (status === 'Confirmed') {
            regData.ticketId = generateTicketId();
        }

        const registration = await Registration.create(regData);

        // Update event count & stock
        if (status === 'Confirmed' && event.type !== 'Merchandise') {
            // For normal events, increment registration count
            event.currentRegistrations = event.currentRegistrations + 1;
        }

        // Save event (persists stock deduction)
        await event.save();

        // Send Email Confirmation
        if (status === 'Confirmed') {
            const user = await User.findById(req.user._id);
            const message = `
                <h1>Registration Confirmed!</h1>
                <p>Hello ${user.name},</p>
                <p>You have successfully registered for <strong>${event.name}</strong>.</p>
                <p><strong>Ticket ID:</strong> ${registration.ticketId}</p>
                <p>Please present this Ticket ID or the QR code available in your dashboard at the venue.</p>
            `;
            try {
                await sendEmail({
                    email: user.email,
                    subject: `Ticket Confirmed - ${event.name}`,
                    message: `You have registered for ${event.name}. Ticket ID: ${registration.ticketId}`,
                    html: message
                });
            } catch (err) {
                console.error("Email send failed", err);
            }
        } else if (status === 'Pending' && totalCost > 0) {
            const user = await User.findById(req.user._id);
            const message = `
                <h1>Payment Required</h1>
                <p>Hello ${user.name},</p>
                <p>Your order for <strong>${event.name}</strong> is pending payment.</p>
                <p><strong>Total Amount:</strong> ₹${totalCost}</p>
                <p>Please upload payment proof in your dashboard to confirm your order.</p>
                <p><strong>Note:</strong> Your items are reserved pending approval.</p>
            `;
            try {
                await sendEmail({
                    email: user.email,
                    subject: `Payment Required - ${event.name}`,
                    message: `Please complete payment for ${event.name}. Amount: ₹${totalCost}`,
                    html: message
                });
            } catch (err) {
                console.error("Email send failed", err);
            }
        }

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

        const oldStatus = registration.status;

        registration.status = status;

        const event = await Event.findById(registration.event);

        // Handle Stock Release if Rejected/Cancelled
        if ((status === 'Rejected' || status === 'Cancelled') && oldStatus !== 'Rejected' && oldStatus !== 'Cancelled') {
            // Return stock
            if (registration.merchandiseSelection && registration.merchandiseSelection.length > 0) {
                for (const sel of registration.merchandiseSelection) {
                    const item = event.merchandise.id(sel.itemId);
                    if (item) {
                        item.stock += sel.quantity;
                    }
                }
                const savedEvent = await event.save();
            }
            // Decrement count for normal events if confirmed previously
            if (oldStatus === 'Confirmed' && event.type !== 'Merchandise') {
                event.currentRegistrations = Math.max(0, event.currentRegistrations - 1);
                await event.save();
            }
        }

        // Generate ticket if confirming
        if (status === 'Confirmed' && !registration.ticketId) {
            registration.ticketId = generateTicketId();

            // Update event count for Normal Events
            if (event.type !== 'Merchandise') {
                event.currentRegistrations = event.currentRegistrations + 1;
                await event.save();
            }

            // Send Confirmation Email
            const user = await User.findById(registration.user);
            const message = `
                <h1>Registration Approved!</h1>
                <p>Hello ${user.name},</p>
                <p>Your registration for <strong>${event.name}</strong> has been approved.</p>
                <p><strong>Ticket ID:</strong> ${registration.ticketId}</p>
                <p>Please present this Ticket ID or the QR code available in your dashboard at the venue.</p>
            `;
            // Send Confirmation Email (Non-blocking)
            console.log(`[Background] Initiating email to ${user.email}...`);
            sendEmail({
                email: user.email,
                subject: `Ticket Check - ${event.name}`,
                message: `You have registered for ${event.name}. Ticket ID: ${registration.ticketId}`,
                html: message
            }).then(() => {
                console.log(`[Background] Email successfully sent to ${user.email}`);
            }).catch(err => {
                console.error(`[Background] Email failed to ${user.email}: ${err.message}`);
                // Optional: Could reschedule or notify admin
            });
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
