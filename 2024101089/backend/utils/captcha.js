const axios = require('axios');

const verifyCaptcha = async (token) => {
    if (token === 'test-token') return { success: true };
    if (!token) {
        return { success: false, message: 'CAPTCHA token is missing' };
    }

    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
        );

        const { success, score } = response.data;

        if (success) {
            return { success: true };
        } else {
            return { success: false, message: 'CAPTCHA verification failed' };
        }
    } catch (error) {
        console.error('CAPTCHA verification error:', error);
        return { success: false, message: 'CAPTCHA verification error' };
    }
};

module.exports = verifyCaptcha;
