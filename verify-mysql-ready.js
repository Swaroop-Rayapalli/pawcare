require('dotenv').config();
const mysql = require('mysql2/promise');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

async function verify() {
    console.log('🔍 Verifying MySQL Deployment Readiness...');

    // 1. Check Env Vars
    if (!process.env.USE_MYSQL || process.env.USE_MYSQL !== 'true') {
        console.warn('⚠️ USE_MYSQL is not set to "true". This is required for production.');
    } else {
        console.log('✅ USE_MYSQL is enabled.');
    }

    // 2. Check Database Connection
    console.log('🐬 Testing MySQL Connection...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pawcare_db',
            port: process.env.DB_PORT || 3306
        });
        console.log('✅ MySQL Connection Successful!');
        await connection.end();
    } catch (error) {
        console.error('❌ MySQL Connection Failed:', error.message);
        console.log('   (This is expected if you don\'t have a local MySQL running, but ensure credentials are correct for production)');
    }

    // 3. Check Session Store Instantiation
    console.log('💾 Verifying Session Store Configuration...');
    try {
        const sessionStore = new MySQLStore({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pawcare_db'
        });
        console.log('✅ MySQL Session Store initialized successfully.');
        // We can't easily "test" the store without an express app running, but instantiation confirms the library is loaded.
    } catch (error) {
        console.error('❌ Session Store Initialization Failed:', error.message);
    }

    console.log('\n✨ Deployment Check Complete.');
}

verify();
