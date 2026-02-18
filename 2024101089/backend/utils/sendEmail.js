const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Check if email credentials exist
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.log('⚠️  Email credentials not found in .env. Skipping email sending.');
        console.log('📧  Would have sent email to:', options.email);
        console.log('📝  Subject:', options.subject);
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail', // or use host/port for other providers
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        },
        connectionTimeout: 12000, // 12 seconds to connect
        socketTimeout: 12000 // 12 seconds for socket activity
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Felicity Fest'} <${process.env.SMTP_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html // Optional HTML content
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
