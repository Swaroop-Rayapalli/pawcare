// Smart database loader - automatically selects the right database based on environment
require('dotenv').config();

// Determine which database to use
const isProduction = process.env.NODE_ENV === 'production';
const hasPostgres = process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres') || process.env.DATABASE_URL.startsWith('postgresql'));
const useMySQL = process.env.USE_MYSQL === 'true' || process.env.DATABASE_URL?.startsWith('mysql');

if (useMySQL) {
    console.log('🐬 Using MySQL database');
    module.exports = require('./database-mysql');
} else if (hasPostgres || isProduction) {
    // In production (Render), we ALWAYS want to use Postgres if possible
    console.log('🐘 Using PostgreSQL database (Production/Render)');
    module.exports = require('./database-postgres');
} else {
    // Default to SQLite for local development only
    console.log('💾 Using SQLite database (Local Development)');
    module.exports = require('./database-sqlite');
}
