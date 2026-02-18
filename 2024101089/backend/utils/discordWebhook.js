const axios = require('axios');

const sendDiscordNotification = async (message, webhookUrl = null) => {
    try {
        const urlToUse = webhookUrl || process.env.DISCORD_WEBHOOK_URL;

        if (urlToUse) {
            await axios.post(urlToUse, { content: message });
            console.log('Discord notification sent');
        } else {
            console.log('Discord Webhook URL not configured, skipping notification');
        }
    } catch (error) {
        console.error('Discord Webhook Error:', error.message);
    }
};

module.exports = sendDiscordNotification;
