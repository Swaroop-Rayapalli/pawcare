// Smart database loader - prioritized for JSON storage
require('dotenv').config();

// Default to JSON database as requested
console.log('📂 Using JSON database (Human-Readable Mode)');
module.exports = require('./database-json');
