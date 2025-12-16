// Test MySQL connection and create database
require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
    try {
        console.log('🔄 Connecting to MySQL...');

        // First, connect without specifying a database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'pawcare_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✅ Database '${dbName}' created/verified`);

        // Show all databases
        const [databases] = await connection.query('SHOW DATABASES');
        console.log('\n📋 Available databases:');
        databases.forEach(db => console.log(`  - ${db.Database}`));

        await connection.end();
        console.log('\n✅ Setup complete! You can now start the server with: npm start');
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n⚠️  Access denied. Please update your .env file with the correct MySQL password.');
            console.log('   If you forgot your MySQL root password, you may need to reset it.');
        }
    }
}

setupDatabase();
