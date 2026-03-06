const https = require('https');
require('dotenv').config();

// Determine URL - prioritize config.js, then allow override via .env
const PROD_URL = process.env.PROD_API_URL || 'https://pawcare-server.onrender.com';
const url = `${PROD_URL}/api/health`;

async function checkHealth() {
    console.log(`🔍 Checking production health at: ${url}...`);

    if (PROD_URL.includes('pawcare-backend.onrender.com')) {
        console.log('\n⚠️  WARNING: You are using the default placeholder URL.');
        console.log('You MUST update your Render URL in config.js or set PROD_API_URL in .env');
        console.log('Follow the steps in DEPLOYMENT.md to find your actual Render URL.');
    }

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✅ Production backend is LIVE and healthy!');
                try {
                    const parsed = JSON.parse(data);
                    console.log('Status Details:', parsed);
                } catch (e) {
                    console.log(`Raw Response: ${data}`);
                }
            } else if (res.statusCode === 404) {
                console.log(`❌ Production backend returned status: 404 (Not Found)`);
                console.log('\nThis usually means one of two things:');
                console.log(`1. The URL "${PROD_URL}" is wrong or doesn't have a service assigned to it yet.`);
                console.log('2. Your Render dashboard has a different "Public URL" for your project.');
                console.log('\n👉 FIX: Go to your Render Dashboard, copy the URL at the top, and update config.js line 8.');
            } else {
                console.log(`❌ Production backend returned status: ${res.statusCode}`);
                console.log('Please check your Render dashboard for logs or verify the URL.');
            }
        });
    }).on('error', (err) => {
        console.log(`❌ Error connecting to production: ${err.message}`);
        console.log('\nCommon fixes:');
        console.log('1. Ensure your Render service is active (Free tier services sleep after 15 mins).');
        console.log(`2. Verify the URL is correct: ${PROD_URL}`);
        console.log('3. You can set PROD_API_URL in your .env file to override the default.');
    });
}

checkHealth();
