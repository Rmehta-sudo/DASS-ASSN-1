const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const colors = require('colors');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const inputUrl = process.argv[2];
const webhookUrl = inputUrl || process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {
    console.log('Error: No Discord Webhook URL provided.'.red.bold);
    console.log('Usage: node test_webhook_real.js <webhook_url>'.yellow);
    console.log('Or set DISCORD_WEBHOOK_URL in .env'.yellow);
    process.exit(1);
}

const run = async () => {
    console.log(`Attempting to send notification to Discord...`.cyan);
    console.log(`URL: ${webhookUrl}`.blue);

    try {
        await axios.post(webhookUrl, {
            content: "📢 **Test Notification** from Felicity Fest Backend!\nIf you see this, Webhooks are working correctly. 🚀"
        });
        console.log('✅ Notification sent successfully! Check your Discord channel.'.green.bold);
    } catch (error) {
        console.error('❌ Failed to send notification:'.red.bold);
        console.error(error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(error.response.data);
        }
    }
};

run();
