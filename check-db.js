const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'pawcare.db'));

console.log('Checking database...');

// Check if admins table exists and has data
try {
    const admins = db.prepare('SELECT * FROM admins').all();
    console.log('Admins in database:', admins);

    if (admins.length === 0) {
        console.log('No admins found!');
    } else {
        console.log(`Found ${admins.length} admin(s)`);
        admins.forEach(admin => {
            console.log(`  - Username: ${admin.username}, Email: ${admin.email}`);
        });
    }
} catch (error) {
    console.error('Error checking admins:', error.message);
}

db.close();
