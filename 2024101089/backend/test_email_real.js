const sendEmail = require('./utils/sendEmail');
const dotenv = require('dotenv');
const path = require('path');
const colors = require('colors');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const recipient = process.argv[2];

if (!recipient) {
    console.log('Usage: node test_email_real.js <recipient_email>'.yellow);
    console.log('Example: node test_email_real.js myemail@gmail.com'.gray);
    process.exit(1);
}

const run = async () => {
    console.log(`Attempting to send email to ${recipient}...`.cyan);
    console.log(`Using SMTP_EMAIL: ${process.env.SMTP_EMAIL || 'Not Set'}`.blue);

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.error('ERROR: SMTP_EMAIL or SMTP_PASSWORD is missing in .env'.red.bold);
        console.log('Please add them to backend/.env'.yellow);
        return; // Don't exit, let sendEmail handle/log too if it wants, but actually sendEmail checks too.
    }

    try {
        await sendEmail({
            email: recipient,
            subject: 'Test Email from Felicity Fest App',
            message: 'This is a test email to verify your SMTP configuration. If you see this, email sending is working!',
            html: '<h1>Test Email</h1><p>This is a test email to verify your SMTP configuration.</p><p>If you see this, email sending is working!</p>'
        });
        console.log('✅ Email sent successfully! Check your inbox.'.green.bold);
    } catch (error) {
        console.error('❌ Failed to send email:'.red.bold);
        console.error(error);
    }
};

run();
