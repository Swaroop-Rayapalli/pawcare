const { initializeDatabase, updateAdminPassword } = require('./database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');

async function run() {
    // Load the database
    await initializeDatabase();

    // Generate a strong random password
    const newPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update the password
    if (updateAdminPassword('admin', hashedPassword)) {
        const content = `Username: admin\nPassword: ${newPassword}`;
        fs.writeFileSync('new_credentials.txt', content, 'utf8');
        console.log('Credentials saved to new_credentials.txt');
    } else {
        console.log('❌ Failed to update admin password. User "admin" not found.');
    }
}

run();
