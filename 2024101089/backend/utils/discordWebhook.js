const axios = require('axios');

const sendDiscordNotification = async (message) => {
    try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (webhookUrl) {
            await axios.post(webhookUrl, { content: message });
            console.log('Discord notification sent');
        } else {
            console.log('Discord Webhook URL not configured, skipping notification');
        }
    } catch (error) {
        console.error('Discord Webhook Error:', error.message);
    }
};

module.exports = sendDiscordNotification;
