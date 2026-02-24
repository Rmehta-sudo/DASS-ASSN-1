const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

const runVerification = async () => {
    console.log('--- Starting CAPTCHA Verification ---');

    // 1. Test Login without CAPTCHA
    try {
        console.log('\n1. Testing Login WITHOUT CAPTCHA...');
        await axios.post(`${API_URL}/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        console.error('❌ Failed: Login should have been rejected');
    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.message.includes('CAPTCHA')) {
            console.log('✅ Passed: Login rejected with 400 and CAPTCHA message');
        } else {
            console.error('❌ Failed: Unexpected error', error.response ? error.response.data : error.message);
        }
    }

    // 2. Test Register without CAPTCHA
    try {
        console.log('\n2. Testing Register WITHOUT CAPTCHA...');
        await axios.post(`${API_URL}/register`, {
            firstName: 'Bot',
            lastName: 'User',
            email: 'bot@example.com',
            password: 'password123',
            contactNumber: '1234567890',
            collegeName: 'Bot Institute'
        });
        console.error('❌ Failed: Register should have been rejected');
    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.message.includes('CAPTCHA')) {
            console.log('✅ Passed: Register rejected with 400 and CAPTCHA message');
        } else {
            console.error('❌ Failed: Unexpected error', error.response ? error.response.data : error.message);
        }
    }

    // 3. Test Login with INVALID CAPTCHA
    try {
        console.log('\n3. Testing Login with INVALID CAPTCHA...');
        await axios.post(`${API_URL}/login`, {
            email: 'test@example.com',
            password: 'password123',
            captchaToken: 'invalid-token'
        });
        console.error('❌ Failed: Login should have been rejected');
    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.message.includes('CAPTCHA')) {
            console.log('✅ Passed: Login rejected with 400 and CAPTCHA message');
        } else {
            console.error('❌ Failed: Unexpected error', error.response ? error.response.data : error.message);
        }
    }

    console.log('\n--- Verification Complete ---');
};

runVerification();
