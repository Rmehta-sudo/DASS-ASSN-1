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
        await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@felicity.iiit.ac.in',
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
            contactNumber: '0000000000',
            participantType: 'IIIT'
        });

        console.log('Admin Created');

        // 2. Define Orgs to Seed: 6 Clubs + 2 Councils + 3 Fest Teams
        const orgs = [
            // --- Clubs ---
            { name: 'Music Club', category: 'Clubs', email: 'music@clubs.iiit.ac.in', desc: 'The official Music Club of IIIT Hyderabad. Concerts, jam sessions and more.' },
            { name: 'The Dance Crew', category: 'Clubs', email: 'dance@clubs.iiit.ac.in', desc: 'Expressing through movement and rhythm. All dance forms welcome.' },
            { name: 'Hacking Club', category: 'Clubs', email: 'hacking@clubs.iiit.ac.in', desc: 'Cybersecurity, CTF competitions and ethical hacking workshops.' },
            { name: 'Programming Club', category: 'Clubs', email: 'programming@clubs.iiit.ac.in', desc: 'Competitive programming, algorithms and coding contests.' },
            { name: 'Cyclorama', category: 'Clubs', email: 'cyclorama@clubs.iiit.ac.in', desc: 'Photography and filmmaking enthusiasts capturing moments.' },
            { name: 'LitClub', category: 'Clubs', email: 'litclub@clubs.iiit.ac.in', desc: 'For the love of literature, poetry and creative writing.' },
            // --- Councils ---
            { name: 'Student Council', category: 'Councils', email: 'studentcouncil@iiit.ac.in', desc: 'The student governing body of IIIT Hyderabad. Representing every student.' },
            { name: 'Sports Council', category: 'Councils', email: 'sportscouncil@iiit.ac.in', desc: 'Organising all inter and intra college sports events and tournaments.' },
            // --- Fest Teams ---
            { name: 'Fest Marketing Team', category: 'Fest Teams', email: 'marketing@felicity.iiit.ac.in', desc: 'Promoting Felicity and managing sponsor events like brand showcases and stunt shows.' },
            { name: 'Fest Design Team', category: 'Fest Teams', email: 'design@felicity.iiit.ac.in', desc: 'Creating Fest merchandise — T-shirts, hoodies, badges and all official Felicity swag.' },
            { name: 'Fest Food Stalls', category: 'Fest Teams', email: 'food@felicity.iiit.ac.in', desc: 'Managing all food stalls and culinary experiences at Felicity Fest.' },
        ];

        // 3. Create Org Users & Organizer docs
        const password = process.env.DEFAULT_CLUB_PASSWORD || 'clubpass123';
        for (const org of orgs) {
            const user = await User.create({
                firstName: org.name,
                lastName: '',
                email: org.email,
                password,
                role: 'organizer',
                contactNumber: '1234567890',
                participantType: 'IIIT'
            });

            await Organizer.create({
                user: user._id,
                name: org.name,
                category: org.category,
                description: org.desc,
                contactEmail: org.email,
                discordWebhook: process.env.DISCORD_WEBHOOK_URL
            });
            console.log(`Seeded: ${org.name} [${org.category}]`);
        }

        // 4. Create 10 standardised participant users
        //    user1-user7: IIIT (@students.iiit.ac.in)
        //    user8-user10: Non-IIIT (@gmail.com)
        const participants = [
            { n: 1, type: 'IIIT', email: 'user1@students.iiit.ac.in', interests: ['Music', 'Dance', 'Art'] },
            { n: 2, type: 'IIIT', email: 'user2@students.iiit.ac.in', interests: ['Hackathons', 'Coding'] },
            { n: 3, type: 'IIIT', email: 'user3@students.iiit.ac.in', interests: ['Sports', 'Health'] },
            { n: 4, type: 'IIIT', email: 'user4@students.iiit.ac.in', interests: ['Photography', 'Design', 'Art'] },
            { n: 5, type: 'IIIT', email: 'user5@students.iiit.ac.in', interests: ['Literature', 'Drama'] },
            { n: 6, type: 'IIIT', email: 'user6@students.iiit.ac.in', interests: ['Gaming', 'Coding', 'Robotics'] },
            { n: 7, type: 'IIIT', email: 'user7@students.iiit.ac.in', interests: ['Entrepreneurship', 'Leadership'] },
            { n: 8, type: 'Non-IIIT', email: 'user8@gmail.com', interests: ['Music', 'Dance'] },
            { n: 9, type: 'Non-IIIT', email: 'user9@gmail.com', interests: ['Hackathons', 'Coding'] },
            { n: 10, type: 'Non-IIIT', email: 'user10@gmail.com', interests: ['Art', 'Design', 'Photography'] },
        ];

        for (const p of participants) {
            await User.create({
                firstName: `user${p.n}`,
                lastName: '',
                email: p.email,
                password: `user${p.n}pass`,
                role: 'participant',
                contactNumber: '9876543210',
                participantType: p.type,
                collegeName: p.type === 'IIIT' ? 'IIIT Hyderabad' : 'Other College',
                interests: p.interests,
            });
            console.log(`Seeded participant: user${p.n} [${p.type}]`);
        }

        console.log('✅ Seeding Complete! 11 orgs + 10 participants + 1 admin');
        process.exit();

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
