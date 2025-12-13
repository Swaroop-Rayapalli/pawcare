const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

// Create SQLite database
const db = new Database(path.join(__dirname, 'pawcare.db'));

// Initialize database - create tables if they don't exist
function initializeDatabase() {
    try {
        // Create customers table
        db.exec(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                profile_picture TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create pets table
        db.exec(`
            CREATE TABLE IF NOT EXISTS pets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT,
                breed TEXT,
                age INTEGER,
                special_needs TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);

        // Create services table
        db.exec(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                duration_minutes INTEGER NOT NULL
            )
        `);

        // Create bookings table
        db.exec(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                pet_id INTEGER,
                service_id INTEGER NOT NULL,
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                status TEXT DEFAULT 'pending',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
            )
        `);

        // Create users table (for customer portal)
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);

        // Create admins table
        db.exec(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                profile_picture TEXT,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create feedback table
        db.exec(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                rating INTEGER NOT NULL,
                category TEXT NOT NULL,
                message TEXT NOT NULL,
                public INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database tables initialized');

        // Initialize default admin if none exists
        const adminsCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
        if (adminsCount.count === 0) {
            const defaultAdmin = {
                username: 'admin',
                email: 'admin@pawcare.com',
                profile_picture: null,
                password_hash: bcrypt.hashSync('PawCareAdmin2025!', 10)
            };
            db.prepare('INSERT INTO admins (username, email, profile_picture, password_hash) VALUES (?, ?, ?, ?)')
                .run(defaultAdmin.username, defaultAdmin.email, defaultAdmin.profile_picture, defaultAdmin.password_hash);
            console.log('✅ Default admin account initialized');
            console.log('   Username: admin');
            console.log('   Password: PawCareAdmin2025!');
        }

        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
}

// Database helper functions

// ==================== Customers ====================
function createCustomer(name, email, phone) {
    const stmt = db.prepare('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)');
    return stmt.run(name, email, phone);
}

function updateCustomer(id, data) {
    const updates = [];
    const values = [];

    if (data.name) {
        updates.push('name = ?');
        values.push(data.name);
    }
    if (data.email) {
        updates.push('email = ?');
        values.push(data.email);
    }
    if (data.phone) {
        updates.push('phone = ?');
        values.push(data.phone);
    }
    if (data.profile_picture !== undefined) {
        updates.push('profile_picture = ?');
        values.push(data.profile_picture);
    }

    if (updates.length === 0) return false;

    values.push(id);
    const stmt = db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
}

function getCustomerByEmail(email) {
    return db.prepare('SELECT * FROM customers WHERE email = ?').get(email);
}

function getCustomerById(id) {
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
}

function getAllCustomers() {
    const customers = db.prepare('SELECT * FROM customers').all();

    // Add user registration status
    return customers.map(customer => {
        const user = db.prepare('SELECT email FROM users WHERE customer_id = ?').get(customer.id);
        return {
            ...customer,
            registered: !!user,
            user_email: user?.email
        };
    });
}

// ==================== Pets ====================
function createPet(customerId, name, type, breed, age, specialNeeds) {
    const stmt = db.prepare('INSERT INTO pets (customer_id, name, type, breed, age, special_needs) VALUES (?, ?, ?, ?, ?, ?)');
    return stmt.run(customerId, name, type, breed, age, specialNeeds);
}

function getPetsByCustomer(customerId) {
    return db.prepare('SELECT * FROM pets WHERE customer_id = ?').all(customerId);
}

// ==================== Services ====================
function createService(name, description, price, duration) {
    const stmt = db.prepare('INSERT INTO services (name, description, price, duration_minutes) VALUES (?, ?, ?, ?)');
    return stmt.run(name, description, price, duration);
}

function getAllServices() {
    return db.prepare('SELECT * FROM services').all();
}

function getServiceById(id) {
    return db.prepare('SELECT * FROM services WHERE id = ?').get(id);
}

// ==================== Bookings ====================
function createBooking(customerId, petId, serviceId, bookingDate, bookingTime, notes) {
    const stmt = db.prepare('INSERT INTO bookings (customer_id, pet_id, service_id, booking_date, booking_time, notes) VALUES (?, ?, ?, ?, ?, ?)');
    return stmt.run(customerId, petId, serviceId, bookingDate, bookingTime, notes);
}

function getAllBookings() {
    return db.prepare(`
        SELECT 
            b.*,
            c.name as customer_name,
            c.email as customer_email,
            c.phone as customer_phone,
            p.name as pet_name,
            p.type as pet_type,
            s.name as service_name,
            s.price as service_price
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN pets p ON b.pet_id = p.id
        LEFT JOIN services s ON b.service_id = s.id
        ORDER BY b.created_at DESC
    `).all();
}

function getBookingById(id) {
    return db.prepare(`
        SELECT 
            b.*,
            c.name as customer_name,
            c.email as customer_email,
            c.phone as customer_phone,
            p.name as pet_name,
            p.type as pet_type,
            s.name as service_name,
            s.price as service_price
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN pets p ON b.pet_id = p.id
        LEFT JOIN services s ON b.service_id = s.id
        WHERE b.id = ?
    `).get(id);
}

function updateBookingStatus(id, status) {
    return db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
}

function deleteBooking(id) {
    return db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
}

function getBookingsByCustomer(customerId) {
    return db.prepare(`
        SELECT 
            b.*,
            c.name as customer_name,
            c.email as customer_email,
            c.phone as customer_phone,
            p.name as pet_name,
            p.type as pet_type,
            s.name as service_name,
            s.price as service_price
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN pets p ON b.pet_id = p.id
        LEFT JOIN services s ON b.service_id = s.id
        WHERE b.customer_id = ?
        ORDER BY b.created_at DESC
    `).all(customerId);
}

// ==================== Users (Customer Portal) ====================
function createUser(customerId, email, passwordHash) {
    const stmt = db.prepare('INSERT INTO users (customer_id, email, password_hash) VALUES (?, ?, ?)');
    return stmt.run(customerId, email, passwordHash);
}

function getUserByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function getUserById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function updateUserPassword(id, passwordHash) {
    return db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
}

function getUserByCustomerId(customerId) {
    return db.prepare('SELECT * FROM users WHERE customer_id = ?').get(customerId);
}

function updateUserEmail(customerId, newEmail) {
    const result = db.prepare('UPDATE users SET email = ? WHERE customer_id = ?').run(newEmail, customerId);
    return result.changes > 0;
}

// ==================== Admins ====================
function getAdminByUsername(username) {
    return db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
}

function getAdminByEmail(email) {
    return db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
}

function getAdminById(id) {
    return db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
}

function updateAdmin(username, data) {
    const updates = [];
    const values = [];

    if (data.username) {
        updates.push('username = ?');
        values.push(data.username);
    }
    if (data.email) {
        updates.push('email = ?');
        values.push(data.email);
    }
    if (data.profile_picture !== undefined) {
        updates.push('profile_picture = ?');
        values.push(data.profile_picture);
    }

    if (updates.length === 0) return false;

    values.push(username);
    const stmt = db.prepare(`UPDATE admins SET ${updates.join(', ')} WHERE username = ?`);
    return stmt.run(...values);
}

function updateAdminPassword(username, passwordHash) {
    const result = db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(passwordHash, username);
    return result.changes > 0;
}

// ==================== Feedback ====================
function createFeedback(name, email, rating, category, message, isPublic) {
    const stmt = db.prepare('INSERT INTO feedback (name, email, rating, category, message, public) VALUES (?, ?, ?, ?, ?, ?)');
    return stmt.run(name, email, rating, category, message, isPublic ? 1 : 0);
}

function getAllFeedback() {
    return db.prepare('SELECT * FROM feedback ORDER BY created_at DESC').all();
}

function getPublicFeedback() {
    return db.prepare('SELECT * FROM feedback WHERE public = 1 ORDER BY created_at DESC').all();
}

function getFeedbackById(id) {
    return db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
}

// Save database function
function saveDatabase() {
    // SQLite auto-saves, but we can force a checkpoint
    db.pragma('wal_checkpoint(TRUNCATE)');
}

module.exports = {
    initializeDatabase,
    saveDatabase,
    createCustomer,
    updateCustomer,
    getCustomerByEmail,
    getCustomerById,
    getAllCustomers,
    createPet,
    getPetsByCustomer,
    createService,
    getAllServices,
    getServiceById,
    createBooking,
    getAllBookings,
    getBookingById,
    updateBookingStatus,
    deleteBooking,
    getBookingsByCustomer,
    createUser,
    getUserByEmail,
    getUserById,
    updateUserPassword,
    getUserByCustomerId,
    updateUserEmail,
    getAdminByUsername,
    getAdminByEmail,
    getAdminById,
    updateAdmin,
    updateAdminPassword,
    createFeedback,
    getAllFeedback,
    getPublicFeedback,
    getFeedbackById
};
