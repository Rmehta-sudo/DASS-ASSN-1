const Team = require('../models/Team');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const crypto = require('crypto');

// Helper to generate unique invite code
const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Helper to generate Ticket ID
const generateTicketId = () => {
    return 'FEL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// @desc    Create a new team for an event
// @route   POST /api/teams
// @access  Private (Participant)
const createTeam = async (req, res) => {
    const { eventId, name } = req.body;
    const userId = req.user._id;

    try {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check if user already has a team for this event
        const existingTeam = await Team.findOne({ event: eventId, members: userId });
        if (existingTeam) return res.status(400).json({ message: 'You are already in a team for this event' });

        // Generate Code
        let inviteCode = generateInviteCode();
        // Ensure uniqueness (simple check)
        while (await Team.findOne({ inviteCode })) {
            inviteCode = generateInviteCode();
        }

        const team = await Team.create({
            event: eventId,
            name,
            leader: userId,
            members: [userId],
            inviteCode
        });

        // Also create a Registration or update existing one?
        // Since we are creating a team, we should probably ensure the user is 'Registered' but maybe 'Pending' untill team is complete?
        // For simplicity, let's assume team creation implies registration logic handled separately or linked.
        // Actually, the requirement usually is: Register -> Select 'Create Team' or 'Join Team'.
        // Let's assume the user MUST be registered first? Or this registers them?
        // Let's assume this registers them if not already.

        // Check if registration exists
        let registration = await Registration.findOne({ user: userId, event: eventId });
        if (!registration) {
            // Create registration
            registration = await Registration.create({
                user: userId,
                event: eventId,
                status: 'Confirmed', // Or pending?
                team: team._id,
                ticketId: generateTicketId()
            });
        } else {
            registration.team = team._id;
            await registration.save();
        }

        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Join a team via invite code
// @route   POST /api/teams/join
// @access  Private (Participant)
const joinTeam = async (req, res) => {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    try {
        const team = await Team.findOne({ inviteCode }).populate('event');
        if (!team) return res.status(404).json({ message: 'Invalid Invite Code' });

        const event = team.event;

        console.log(`Debug Join: Members=${team.members.length}, Max=${event.teamSizeMax}`);

        // Check if team is full
        if (team.members.length >= event.teamSizeMax) {
            return res.status(400).json({ message: 'Team is full' });
        }

        // Check if user already in a team
        const existingTeam = await Team.findOne({ event: event._id, members: userId });
        if (existingTeam) return res.status(400).json({ message: 'You are already in a team for this event' });

        // Add member
        team.members.push(userId);
        await team.save();

        // Handle Registration
        let registration = await Registration.findOne({ user: userId, event: event._id });
        if (!registration) {
            registration = await Registration.create({
                user: userId,
                user: userId,
                event: event._id,
                status: 'Confirmed',
                team: team._id,
                ticketId: generateTicketId()
            });
        } else {
            registration.team = team._id;
            await registration.save();
        }

        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my team for an event
// @route   GET /api/teams/:eventId
// @access  Private
const getMyTeam = async (req, res) => {
    try {
        const team = await Team.findOne({ event: req.params.eventId, members: req.user._id })
            .populate('members', 'firstName lastName email')
            .populate('leader', 'firstName lastName');

        if (!team) return res.status(404).json({ message: 'No team found' });
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Leave Team
// @route   POST /api/teams/leave
// @access  Private
const leaveTeam = async (req, res) => {
    const { teamId } = req.body;
    const userId = req.user._id;

    try {
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Remove user from members
        team.members = team.members.filter(memberId => memberId.toString() !== userId.toString());

        // Update Registration
        const registration = await Registration.findOne({ user: userId, event: team.event });
        if (registration) {
            registration.team = undefined; // Unset team
            await registration.save();
        }

        // If no members left, delete team
        if (team.members.length === 0) {
            await Team.findByIdAndDelete(teamId);
            return res.json({ message: 'Team deleted as last member left' });
        }

        // If leader left, assign new leader (first member)
        if (team.leader.toString() === userId.toString()) {
            team.leader = team.members[0];
        }

        await team.save();
        res.json({ message: 'Left team successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createTeam, joinTeam, getMyTeam, leaveTeam };
