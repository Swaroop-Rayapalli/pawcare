// Smart database loader - automatically selects the right database based on environment
require('dotenv').config();

// Determine which database to use
const usePostgres = process.env.DATABASE_URL || process.env.NODE_ENV === 'production';

if (usePostgres) {
    console.log('🐘 Using PostgreSQL database (Production/Render)');
    module.exports = require('./database-postgres');
} else {
    console.log('💾 Using SQLite database (Local Development)');
    module.exports = require('./database-sqlite');
}
