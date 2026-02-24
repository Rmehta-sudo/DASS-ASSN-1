const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Check if email credentials exist
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.log('[WARN] Email credentials not found in .env. Skipping email sending.');
        console.log('[MOCK] Would have sent email to:', options.email);
        console.log('[MOCK] Subject:', options.subject);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465, false for other ports
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
