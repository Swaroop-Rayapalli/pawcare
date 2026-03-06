const https = require('https');
require('dotenv').config();

// TO USE THIS:
// 1. Go to Render Dashboard -> Your Service -> Settings
// 2. Scroll down to "Deploy Hook"
// 3. Copy the URL and add it to your .env file as RENDER_DEPLOY_HOOK
// Example: RENDER_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxxxxxxxxxxxxx?key=yyyyyyyyyyy

async function triggerDeploy() {
    const hookUrl = process.env.RENDER_DEPLOY_HOOK;

    if (!hookUrl) {
        console.log('❌ Error: RENDER_DEPLOY_HOOK is not set in your .env file.');
        console.log('\nTo get your Deploy Hook:');
        console.log('1. Open your Render dashboard.');
        console.log('2. Go to your PawCare Web Service.');
        console.log('3. Click "Settings" in the left sidebar.');
        console.log('4. Scroll down to the "Deploy Hook" section.');
        console.log('5. Copy the URL and add it to .env like this:');
        console.log('   RENDER_DEPLOY_HOOK=https://api.render.com/deploy/srv-...');
        return;
    }

    console.log('🚀 Triggering Render deployment...');

    https.get(hookUrl, (res) => {
        if (res.statusCode === 201 || res.statusCode === 200) {
            console.log('✅ Deployment triggered successfully!');
            console.log('Check your Render dashboard to follow the progress.');
        } else {
            console.log(`❌ Failed to trigger deployment. Status: ${res.statusCode}`);
        }
    }).on('error', (err) => {
        console.log(`❌ Error triggering deployment: ${err.message}`);
    });
}

triggerDeploy();
