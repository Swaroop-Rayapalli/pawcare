const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const DATA_FILE = path.join(__dirname, 'pawcare-data.json');

// Helper to load data
function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return {
                customers: [],
                pets: [],
                services: [],
                bookings: [],
                users: [],
                admins: [],
                feedback: [],
                nextId: {
                    customers: 1,
                    pets: 1,
                    services: 1,
                    bookings: 1,
                    users: 1,
                    admins: 1,
                    feedback: 1
                }
            };
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error loading JSON database:', error.message);
        throw error;
    }
}

// Helper to save data
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Error saving JSON database:', error.message);
        throw error;
    }
}

// Initialize database
async function initializeDatabase() {
    const data = loadData();

    // Ensure default services exist
    if (data.services.length === 0) {
        data.services = [
            { id: 1, name: 'Pet Sitting', description: 'In-home care', price: 45.00, duration_minutes: 60 },
            { id: 2, name: 'Dog Walking', description: 'Exercise and adventures', price: 25.00, duration_minutes: 30 },
            { id: 3, name: 'Pet Boarding', description: 'Overnight stays', price: 75.00, duration_minutes: 1440 },
            { id: 4, name: 'Grooming', description: 'Professional grooming', price: 60.00, duration_minutes: 90 },
            { id: 5, name: 'Vet Visits', description: 'Transportation to vet', price: 35.00, duration_minutes: 120 },
            { id: 6, name: 'Training Support', description: 'Training routines', price: 50.00, duration_minutes: 60 }
        ];
        data.nextId.services = 7;
        saveData(data);
    }

    // Ensure default admin exists
    if (data.admins.length === 0) {
        data.admins.push({
            id: 1,
            username: 'admin',
            email: process.env.ADMIN_EMAIL || 'admin@pawcare.com',
            password_hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'PawCareAdmin2025!', 10),
            profile_picture: null,
            created_at: new Date().toISOString()
        });
        data.nextId.admins = 2;
        saveData(data);
    }

    console.log('✅ JSON Database initialized');
}

// ==================== Customers ====================
async function createCustomer(name, email, phone) {
    const data = loadData();
    const customer = {
        id: data.nextId.customers++,
        name,
        email,
        phone,
        created_at: new Date().toISOString()
    };
    data.customers.push(customer);
    saveData(data);
    return { lastInsertRowid: customer.id };
}

async function updateCustomer(id, updateData) {
    const data = loadData();
    const index = data.customers.findIndex(c => c.id === parseInt(id));
    if (index === -1) return false;

    data.customers[index] = { ...data.customers[index], ...updateData };
    saveData(data);
    return true;
}

async function getCustomerByEmail(email) {
    const data = loadData();
    return data.customers.find(c => c.email === email) || null;
}

async function getCustomerById(id) {
    const data = loadData();
    return data.customers.find(c => c.id === parseInt(id)) || null;
}

async function getAllCustomers() {
    const data = loadData();
    return data.customers.map(customer => {
        const user = data.users.find(u => u.customer_id === customer.id);
        return {
            ...customer,
            registered: !!user,
            user_email: user?.email
        };
    });
}

// ==================== Pets ====================
async function createPet(customerId, name, type, breed, age, specialNeeds) {
    const data = loadData();
    const pet = {
        id: data.nextId.pets++,
        customer_id: parseInt(customerId),
        name,
        type,
        breed,
        age,
        special_needs: specialNeeds,
        created_at: new Date().toISOString()
    };
    data.pets.push(pet);
    saveData(data);
    return { lastInsertRowid: pet.id };
}

async function getPetsByCustomer(customerId) {
    const data = loadData();
    return data.pets.filter(p => p.customer_id === parseInt(customerId));
}

// ==================== Services ====================
async function createService(name, description, price, duration) {
    const data = loadData();
    const service = {
        id: data.nextId.services++,
        name,
        description,
        price,
        duration_minutes: duration
    };
    data.services.push(service);
    saveData(data);
    return { lastInsertRowid: service.id };
}

async function getAllServices() {
    const data = loadData();
    return data.services;
}

async function getServiceById(id) {
    const data = loadData();
    return data.services.find(s => s.id === parseInt(id)) || null;
}

// ==================== Bookings ====================
async function createBooking(customerId, petId, serviceId, bookingDate, bookingTime, notes) {
    const data = loadData();
    const booking = {
        id: data.nextId.bookings++,
        customer_id: parseInt(customerId),
        pet_id: petId ? parseInt(petId) : null,
        service_id: parseInt(serviceId),
        booking_date: bookingDate,
        booking_time: bookingTime,
        status: 'pending',
        notes,
        created_at: new Date().toISOString()
    };
    data.bookings.push(booking);
    saveData(data);
    return { lastInsertRowid: booking.id };
}

async function getAllBookings() {
    const data = loadData();
    return data.bookings.map(b => {
        const customer = data.customers.find(c => c.id === b.customer_id);
        const pet = data.pets.find(p => p.id === b.pet_id);
        const service = data.services.find(s => s.id === b.service_id);
        return {
            ...b,
            customer_name: customer?.name,
            customer_email: customer?.email,
            customer_phone: customer?.phone,
            pet_name: pet?.name,
            pet_type: pet?.type,
            service_name: service?.name,
            service_price: service?.price
        };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function getBookingById(id) {
    const data = loadData();
    const b = data.bookings.find(booking => booking.id === parseInt(id));
    if (!b) return null;

    const customer = data.customers.find(c => c.id === b.customer_id);
    const pet = data.pets.find(p => p.id === b.pet_id);
    const service = data.services.find(s => s.id === b.service_id);

    return {
        ...b,
        customer_name: customer?.name,
        customer_email: customer?.email,
        customer_phone: customer?.phone,
        pet_name: pet?.name,
        pet_type: pet?.type,
        service_name: service?.name,
        service_price: service?.price
    };
}

async function updateBookingStatus(id, status) {
    const data = loadData();
    const index = data.bookings.findIndex(b => b.id === parseInt(id));
    if (index === -1) return { changes: 0 };

    data.bookings[index].status = status;
    saveData(data);
    return { changes: 1 };
}

async function deleteBooking(id) {
    const data = loadData();
    const initialLength = data.bookings.length;
    data.bookings = data.bookings.filter(b => b.id !== parseInt(id));
    saveData(data);
    return { changes: initialLength - data.bookings.length };
}

async function getBookingsByCustomer(customerId) {
    const data = loadData();
    return data.bookings
        .filter(b => b.customer_id === parseInt(customerId))
        .map(b => {
            const pet = data.pets.find(p => p.id === b.pet_id);
            const service = data.services.find(s => s.id === b.service_id);
            return {
                ...b,
                pet_name: pet?.name,
                pet_type: pet?.type,
                service_name: service?.name,
                service_price: service?.price
            };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// ==================== Users (Customer Portal) ====================
async function createUser(customerId, email, passwordHash) {
    const data = loadData();
    const user = {
        id: data.nextId.users++,
        customer_id: parseInt(customerId),
        email,
        password_hash: passwordHash,
        created_at: new Date().toISOString()
    };
    data.users.push(user);
    saveData(data);
    return { lastInsertRowid: user.id };
}

async function getUserByEmail(email) {
    const data = loadData();
    return data.users.find(u => u.email === email) || null;
}

async function getUserById(id) {
    const data = loadData();
    return data.users.find(u => u.id === parseInt(id)) || null;
}

async function updateUserPassword(id, passwordHash) {
    const data = loadData();
    const index = data.users.findIndex(u => u.id === parseInt(id));
    if (index === -1) return { changes: 0 };

    data.users[index].password_hash = passwordHash;
    saveData(data);
    return { changes: 1 };
}

async function getUserByCustomerId(customerId) {
    const data = loadData();
    return data.users.find(u => u.customer_id === parseInt(customerId)) || null;
}

async function updateUserEmail(customerId, newEmail) {
    const data = loadData();
    const index = data.users.findIndex(u => u.customer_id === parseInt(customerId));
    if (index === -1) return false;

    data.users[index].email = newEmail;
    saveData(data);
    return true;
}

// ==================== Admins ====================
async function getAdminByUsername(username) {
    const data = loadData();
    return data.admins.find(a => a.username === username) || null;
}

async function getAdminByEmail(email) {
    const data = loadData();
    return data.admins.find(a => a.email === email) || null;
}

async function getAdminById(id) {
    const data = loadData();
    return data.admins.find(a => a.id === parseInt(id)) || null;
}

async function updateAdmin(username, updateData) {
    const data = loadData();
    const index = data.admins.findIndex(a => a.username === username);
    if (index === -1) return false;

    data.admins[index] = { ...data.admins[index], ...updateData };
    saveData(data);
    return true;
}

async function updateAdminPassword(username, passwordHash) {
    const data = loadData();
    const index = data.admins.findIndex(a => a.username === username);
    if (index === -1) return false;

    data.admins[index].password_hash = passwordHash;
    saveData(data);
    return true;
}

// ==================== Feedback ====================
async function createFeedback(name, email, rating, category, message, isPublic) {
    const data = loadData();
    const feedback = {
        id: data.nextId.feedback++,
        name,
        email,
        rating: parseInt(rating),
        category,
        message,
        public: isPublic ? 1 : 0,
        created_at: new Date().toISOString()
    };
    data.feedback.push(feedback);
    saveData(data);
    return { lastInsertRowid: feedback.id };
}

async function getAllFeedback() {
    const data = loadData();
    return data.feedback.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function getPublicFeedback() {
    const data = loadData();
    return data.feedback
        .filter(f => f.public === 1)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function getFeedbackById(id) {
    const data = loadData();
    return data.feedback.find(f => f.id === parseInt(id)) || null;
}

function saveDatabase() {
    // Already saved in individual functions
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
