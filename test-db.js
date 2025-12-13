const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
    // First try to connect to default 'postgres' database
    const defaultPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || undefined, // Use undefined for no password
        database: 'postgres', // Connect to default database first
        port: process.env.DB_PORT || 5432
    });

    try {
        console.log('Testing connection to PostgreSQL...');
        const client = await defaultPool.connect();
        console.log('✅ Connected to PostgreSQL successfully!');

        // Check if pawcare_db exists
        const dbResult = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'pawcare_db'"
        );

        if (dbResult.rows.length === 0) {
            console.log('Creating pawcare_db database...');
            await client.query('CREATE DATABASE pawcare_db');
            console.log('✅ Database pawcare_db created successfully!');
        } else {
            console.log('✅ Database pawcare_db already exists');
        }

        client.release();
        await defaultPool.end();

        console.log('\n✅ All checks passed! You can now start the server.');
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        console.error('\nPlease check:');
        console.error('1. PostgreSQL is running');
        console.error('2. DB_PASSWORD in .env file is correct');
        console.error('3. DB_USER has proper permissions');
        await defaultPool.end();
        process.exit(1);
    }
}

testConnection();
