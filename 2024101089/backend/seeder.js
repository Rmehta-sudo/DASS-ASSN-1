const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Organizer = require('./models/Organizer');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedData = async () => {
    try {
        await User.deleteMany();
        await Organizer.deleteMany();

        console.log('Data Destroyed...');

        // 1. Create Admin
        const adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@felicity.iiit.ac.in',
            password: 'adminpassword',
            role: 'admin',
            contactNumber: '0000000000',
            participantType: 'IIIT'
        });

        console.log('Admin Created');

        // 2. define Clubs to Seed
        const clubs = [
            { name: 'Music Club', category: 'Cultural', email: 'music@clubs.iiit.ac.in' },
            { name: 'The Gaming Club', category: 'Technical', email: 'gaming@clubs.iiit.ac.in' },
            { name: 'Decore', category: 'Cultural', email: 'decore@clubs.iiit.ac.in' },
            { name: 'The Dance Crew', category: 'Cultural', email: 'dance@clubs.iiit.ac.in' },
            { name: 'Cyclorama', category: 'Cultural', email: 'cyclorama@clubs.iiit.ac.in' }, // Photography?
            { name: 'LitClub', category: 'Cultural', email: 'litclub@clubs.iiit.ac.in' },
            { name: 'Pentaprism', category: 'Cultural', email: 'pentaprism@clubs.iiit.ac.in' }, // Photography
            { name: 'Hacking Club', category: 'Technical', email: 'hacking@clubs.iiit.ac.in' },
            { name: 'Programming Club', category: 'Technical', email: 'programming@clubs.iiit.ac.in' },
            { name: 'Amateur Sports Enthusiasts Club', category: 'Sports', email: 'sports@clubs.iiit.ac.in' },
        ];

        // 3. Create Club Users & Organizers
        for (const club of clubs) {
            const password = 'password123'; // Default password for all clubs

            const user = await User.create({
                firstName: club.name,
                lastName: '(Club)',
                email: club.email,
                password: password,
                role: 'organizer',
                contactNumber: '1234567890',
                participantType: 'IIIT'
            });

            await Organizer.create({
                user: user._id,
                name: club.name,
                category: club.category,
                description: `Official ${club.name} of IIIT Hyderabad. Join us for amazing events!`,
                contactEmail: club.email
            });
            console.log(`Seeded: ${club.name}`);
        }

        console.log('✅ Seeding Complete!');
        process.exit();

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
