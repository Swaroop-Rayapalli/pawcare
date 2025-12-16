const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pawcare_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('🐬 Connecting to MySQL...');
console.log(`📍 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'pawcare_db'}`);

// Initialize database - create tables if they don't exist
async function initializeDatabase() {
    try {
        console.log('🔄 Initializing MySQL database...');

        // Test connection
        const connection = await pool.getConnection();
        console.log('✅ MySQL connection successful');
        connection.release();

        // Create customers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                profile_picture TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create pets table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100),
                breed VARCHAR(100),
                age INT,
                special_needs TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);

        // Create services table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                duration_minutes INT NOT NULL
            )
        `);

        // Create bookings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                pet_id INT,
                service_id INT NOT NULL,
                booking_date DATE NOT NULL,
                booking_time TIME NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
            )
        `);

        // Create users table (for customer portal)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);

        // Create admins table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                profile_picture TEXT,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create feedback table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                rating INT NOT NULL,
                category VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                public BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database tables initialized');

        // Initialize default admin if none exists
        const [admins] = await pool.query('SELECT COUNT(*) as count FROM admins');
        if (parseInt(admins[0].count) === 0) {
            const defaultAdmin = {
                username: 'admin',
                email: process.env.ADMIN_EMAIL || 'admin@pawcare.com',
                profile_picture: null,
                password_hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'PawCareAdmin2025!', 10)
            };
            await pool.query(
                'INSERT INTO admins (username, email, profile_picture, password_hash) VALUES (?, ?, ?, ?)',
                [defaultAdmin.username, defaultAdmin.email, defaultAdmin.profile_picture, defaultAdmin.password_hash]
            );
            console.log('✅ Default admin account initialized');
        }

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        throw error;
    }
}

// Database helper functions

// ==================== Customers ====================
async function createCustomer(name, email, phone) {
    const [result] = await pool.query(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone]
    );
    return { lastInsertRowid: result.insertId };
}

async function updateCustomer(id, data) {
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

    values.push(parseInt(id));
    const [result] = await pool.query(
        `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
        values
    );
    return result.affectedRows > 0;
}

async function getCustomerByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
    return rows[0] || null;
}

async function getCustomerById(id) {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [parseInt(id)]);
    return rows[0] || null;
}

async function getAllCustomers() {
    const [customers] = await pool.query('SELECT * FROM customers');

    // Add user registration status
    const customersWithStatus = await Promise.all(customers.map(async (customer) => {
        const [users] = await pool.query('SELECT email FROM users WHERE customer_id = ?', [customer.id]);
        return {
            ...customer,
            registered: users.length > 0,
            user_email: users[0]?.email
        };
    }));

    return customersWithStatus;
}

// ==================== Pets ====================
async function createPet(customerId, name, type, breed, age, specialNeeds) {
    const [result] = await pool.query(
        'INSERT INTO pets (customer_id, name, type, breed, age, special_needs) VALUES (?, ?, ?, ?, ?, ?)',
        [customerId, name, type, breed, age, specialNeeds]
    );
    return { lastInsertRowid: result.insertId };
}

async function getPetsByCustomer(customerId) {
    const [rows] = await pool.query('SELECT * FROM pets WHERE customer_id = ?', [parseInt(customerId)]);
    return rows;
}

// ==================== Services ====================
async function createService(name, description, price, duration) {
    const [result] = await pool.query(
        'INSERT INTO services (name, description, price, duration_minutes) VALUES (?, ?, ?, ?)',
        [name, description, price, duration]
    );
    return { lastInsertRowid: result.insertId };
}

async function getAllServices() {
    const [rows] = await pool.query('SELECT * FROM services');
    return rows;
}

async function getServiceById(id) {
    const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [parseInt(id)]);
    return rows[0] || null;
}

// ==================== Bookings ====================
async function createBooking(customerId, petId, serviceId, bookingDate, bookingTime, notes) {
    const [result] = await pool.query(
        'INSERT INTO bookings (customer_id, pet_id, service_id, booking_date, booking_time, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [customerId, petId, serviceId, bookingDate, bookingTime, notes]
    );
    return { lastInsertRowid: result.insertId };
}

async function getAllBookings() {
    const [rows] = await pool.query(`
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
    `);
    return rows;
}

async function getBookingById(id) {
    const [rows] = await pool.query(`
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
    `, [parseInt(id)]);
    return rows[0] || null;
}

async function updateBookingStatus(id, status) {
    const [result] = await pool.query(
        'UPDATE bookings SET status = ? WHERE id = ?',
        [status, parseInt(id)]
    );
    return { changes: result.affectedRows };
}

async function deleteBooking(id) {
    const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [parseInt(id)]);
    return { changes: result.affectedRows };
}

async function getBookingsByCustomer(customerId) {
    const [rows] = await pool.query(`
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
    `, [parseInt(customerId)]);
    return rows;
}

// ==================== Users (Customer Portal) ====================
async function createUser(customerId, email, passwordHash) {
    const [result] = await pool.query(
        'INSERT INTO users (customer_id, email, password_hash) VALUES (?, ?, ?)',
        [customerId, email, passwordHash]
    );
    return { lastInsertRowid: result.insertId };
}

async function getUserByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
}

async function getUserById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [parseInt(id)]);
    return rows[0] || null;
}

async function updateUserPassword(id, passwordHash) {
    const [result] = await pool.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, parseInt(id)]
    );
    return { changes: result.affectedRows };
}

async function getUserByCustomerId(customerId) {
    const [rows] = await pool.query('SELECT * FROM users WHERE customer_id = ?', [parseInt(customerId)]);
    return rows[0] || null;
}

async function updateUserEmail(customerId, newEmail) {
    const [result] = await pool.query(
        'UPDATE users SET email = ? WHERE customer_id = ?',
        [newEmail, parseInt(customerId)]
    );
    return result.affectedRows > 0;
}

// ==================== Admins ====================
async function getAdminByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows[0] || null;
}

async function getAdminByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0] || null;
}

async function getAdminById(id) {
    const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [parseInt(id)]);
    return rows[0] || null;
}

async function updateAdmin(username, data) {
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
    const [result] = await pool.query(
        `UPDATE admins SET ${updates.join(', ')} WHERE username = ?`,
        values
    );
    return result.affectedRows > 0;
}

async function updateAdminPassword(username, passwordHash) {
    const [result] = await pool.query(
        'UPDATE admins SET password_hash = ? WHERE username = ?',
        [passwordHash, username]
    );
    return result.affectedRows > 0;
}

// ==================== Feedback ====================
async function createFeedback(name, email, rating, category, message, isPublic) {
    const [result] = await pool.query(
        'INSERT INTO feedback (name, email, rating, category, message, public) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, rating, category, message, isPublic]
    );
    return { lastInsertRowid: result.insertId };
}

async function getAllFeedback() {
    const [rows] = await pool.query('SELECT * FROM feedback ORDER BY created_at DESC');
    return rows;
}

async function getPublicFeedback() {
    const [rows] = await pool.query('SELECT * FROM feedback WHERE public = TRUE ORDER BY created_at DESC');
    return rows;
}

async function getFeedbackById(id) {
    const [rows] = await pool.query('SELECT * FROM feedback WHERE id = ?', [parseInt(id)]);
    return rows[0] || null;
}

// Save database function (no-op for MySQL, kept for compatibility)
function saveDatabase() {
    // No-op - MySQL auto-saves
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
