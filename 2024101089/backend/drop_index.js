const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Registration = require('./models/Registration');

dotenv.config({ path: '.env' });

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        await Registration.collection.dropIndex('ticketId_1');
        console.log('Index dropped');

        process.exit();
    } catch (error) {
        console.error('Error dropping index (might not exist):', error.message);
        process.exit();
    }
};

dropIndex();
