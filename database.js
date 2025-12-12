const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pawcare_db',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

// Initialize database - create tables if they don't exist
async function initializeDatabase() {
    try {
        // Create customers table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
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
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100),
                breed VARCHAR(100),
                age INTEGER,
                special_needs TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);

        // Create services table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS services (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                duration_minutes INTEGER NOT NULL
            )
        `);

        // Create bookings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                pet_id INTEGER,
                service_id INTEGER NOT NULL,
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
                id SERIAL PRIMARY KEY,
                customer_id INTEGER NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        `);

        // Create admins table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
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
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                rating INTEGER NOT NULL,
                category VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                public BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database tables initialized');

        // Initialize default admin if none exists
        const adminsResult = await pool.query('SELECT COUNT(*) as count FROM admins');
        if (parseInt(adminsResult.rows[0].count) === 0) {
            const defaultAdmin = {
                username: 'admin',
                email: process.env.ADMIN_EMAIL || 'admin@pawcare.com',
                profile_picture: null,
                password_hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'PawCareAdmin2025!', 10)
            };
            await pool.query(
                'INSERT INTO admins (username, email, profile_picture, password_hash) VALUES ($1, $2, $3, $4)',
                [defaultAdmin.username, defaultAdmin.email, defaultAdmin.profile_picture, defaultAdmin.password_hash]
            );
            console.log('✅ Default admin account initialized');
        }

        console.log('✅ Database initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
}

// Database helper functions

// ==================== Customers ====================
async function createCustomer(name, email, phone) {
    const result = await pool.query(
        'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING id',
        [name, email, phone]
    );
    return { lastInsertRowid: result.rows[0].id };
}

async function updateCustomer(id, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.name) {
        updates.push(`name = $${paramCount++}`);
        values.push(data.name);
    }
    if (data.email) {
        updates.push(`email = $${paramCount++}`);
        values.push(data.email);
    }
    if (data.phone) {
        updates.push(`phone = $${paramCount++}`);
        values.push(data.phone);
    }
    if (data.profile_picture !== undefined) {
        updates.push(`profile_picture = $${paramCount++}`);
        values.push(data.profile_picture);
    }

    if (updates.length === 0) return false;

    values.push(parseInt(id));
    const result = await pool.query(
        `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramCount}`,
        values
    );
    return result.rowCount > 0;
}

async function getCustomerByEmail(email) {
    const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    return result.rows[0] || null;
}

async function getCustomerById(id) {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [parseInt(id)]);
    return result.rows[0] || null;
}

async function getAllCustomers() {
    const customersResult = await pool.query('SELECT * FROM customers');
    const customers = customersResult.rows;

    // Add user registration status
    const customersWithStatus = await Promise.all(customers.map(async (customer) => {
        const usersResult = await pool.query('SELECT email FROM users WHERE customer_id = $1', [customer.id]);
        return {
            ...customer,
            registered: usersResult.rows.length > 0,
            user_email: usersResult.rows[0]?.email
        };
    }));

    return customersWithStatus;
}

// ==================== Pets ====================
async function createPet(customerId, name, type, breed, age, specialNeeds) {
    const result = await pool.query(
        'INSERT INTO pets (customer_id, name, type, breed, age, special_needs) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [customerId, name, type, breed, age, specialNeeds]
    );
    return { lastInsertRowid: result.rows[0].id };
}

async function getPetsByCustomer(customerId) {
    const result = await pool.query('SELECT * FROM pets WHERE customer_id = $1', [parseInt(customerId)]);
    return result.rows;
}

// ==================== Services ====================
async function createService(name, description, price, duration) {
    const result = await pool.query(
        'INSERT INTO services (name, description, price, duration_minutes) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, description, price, duration]
    );
    return { lastInsertRowid: result.rows[0].id };
}

async function getAllServices() {
    const result = await pool.query('SELECT * FROM services');
    return result.rows;
}

async function getServiceById(id) {
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [parseInt(id)]);
    return result.rows[0] || null;
}

// ==================== Bookings ====================
async function createBooking(customerId, petId, serviceId, bookingDate, bookingTime, notes) {
    const result = await pool.query(
        'INSERT INTO bookings (customer_id, pet_id, service_id, booking_date, booking_time, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [customerId, petId, serviceId, bookingDate, bookingTime, notes]
    );
    return { lastInsertRowid: result.rows[0].id };
}

async function getAllBookings() {
    const result = await pool.query(`
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
    return result.rows;
}

async function getBookingById(id) {
    const result = await pool.query(`
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
        WHERE b.id = $1
    `, [parseInt(id)]);
    return result.rows[0] || null;
}

async function updateBookingStatus(id, status) {
    const result = await pool.query(
        'UPDATE bookings SET status = $1 WHERE id = $2',
        [status, parseInt(id)]
    );
    return { changes: result.rowCount };
}

async function deleteBooking(id) {
    const result = await pool.query('DELETE FROM bookings WHERE id = $1', [parseInt(id)]);
    return { changes: result.rowCount };
}

async function getBookingsByCustomer(customerId) {
    const result = await pool.query(`
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
        WHERE b.customer_id = $1
        ORDER BY b.created_at DESC
    `, [parseInt(customerId)]);
    return result.rows;
}

// ==================== Users (Customer Portal) ====================
async function createUser(customerId, email, passwordHash) {
    const result = await pool.query(
        'INSERT INTO users (customer_id, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [customerId, email, passwordHash]
    );
    return { lastInsertRowid: result.rows[0].id };
}

async function getUserByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
}

async function getUserById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
    return result.rows[0] || null;
}

async function updateUserPassword(id, passwordHash) {
    const result = await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, parseInt(id)]
    );
    return { changes: result.rowCount };
}

async function getUserByCustomerId(customerId) {
    const result = await pool.query('SELECT * FROM users WHERE customer_id = $1', [parseInt(customerId)]);
    return result.rows[0] || null;
}

async function updateUserEmail(customerId, newEmail) {
    const result = await pool.query(
        'UPDATE users SET email = $1 WHERE customer_id = $2',
        [newEmail, parseInt(customerId)]
    );
    return result.rowCount > 0;
}

// ==================== Admins ====================
async function getAdminByUsername(username) {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    return result.rows[0] || null;
}

async function getAdminByEmail(email) {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    return result.rows[0] || null;
}

async function getAdminById(id) {
    const result = await pool.query('SELECT * FROM admins WHERE id = $1', [parseInt(id)]);
    return result.rows[0] || null;
}

async function updateAdmin(username, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.username) {
        updates.push(`username = $${paramCount++}`);
        values.push(data.username);
    }
    if (data.email) {
        updates.push(`email = $${paramCount++}`);
        values.push(data.email);
    }
    if (data.profile_picture !== undefined) {
        updates.push(`profile_picture = $${paramCount++}`);
        values.push(data.profile_picture);
    }

    if (updates.length === 0) return false;

    values.push(username);
    const result = await pool.query(
        `UPDATE admins SET ${updates.join(', ')} WHERE username = $${paramCount}`,
        values
    );
    return result.rowCount > 0;
}

async function updateAdminPassword(username, passwordHash) {
    const result = await pool.query(
        'UPDATE admins SET password_hash = $1 WHERE username = $2',
        [passwordHash, username]
    );
    return result.rowCount > 0;
}

// ==================== Feedback ====================
async function createFeedback(name, email, rating, category, message, isPublic) {
    const result = await pool.query(
        'INSERT INTO feedback (name, email, rating, category, message, public) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [name, email, rating, category, message, isPublic]
    );
    return { lastInsertRowid: result.rows[0].id };
}

async function getAllFeedback() {
    const result = await pool.query('SELECT * FROM feedback ORDER BY created_at DESC');
    return result.rows;
}

async function getPublicFeedback() {
    const result = await pool.query('SELECT * FROM feedback WHERE public = TRUE ORDER BY created_at DESC');
    return result.rows;
}

async function getFeedbackById(id) {
    const result = await pool.query('SELECT * FROM feedback WHERE id = $1', [parseInt(id)]);
    return result.rows[0] || null;
}

// Save database function (no-op for PostgreSQL, kept for compatibility)
function saveDatabase() {
    // No-op - PostgreSQL auto-saves
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
