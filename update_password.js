const { initializeDatabase, updateAdminPassword } = require('./database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function run() {
    // Load the database
    await initializeDatabase();

    // Generate a strong random password
    const newPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update the password
    if (updateAdminPassword('admin', hashedPassword)) {
        console.log('==========================================');
        console.log('✅ ADMIN PASSWORD SUCCESSFULLY UPDATED');
        console.log('==========================================');
        console.log('New Username: admin');
        console.log('New Password: ' + newPassword);
        console.log('==========================================');
        console.log('⚠️  PLEASE SAVE THIS PASSWORD IMMEDIATELY');
    } else {
        console.log('❌ Failed to update admin password. User "admin" not found.');
    }
}

run();
