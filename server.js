const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const {
    initializeDatabase,
    createCustomer,
    getCustomerByEmail,
    getCustomerById,
    createPet,
    createBooking,
    getAllBookings,
    getBookingById,
    getAllCustomers,
    updateBookingStatus,
    deleteBooking,
    getAllServices,
    getServiceById,
    createUser,
    getUserByEmail,
    getUserById,
    getBookingsByCustomer,
    updateUserPassword,
    updateCustomer,
    updateUserEmail,
    updateAdminPassword,
    getAdminByUsername,
    getAdminByEmail,
    getAdminById,
    updateAdmin,
    getUserByCustomerId
} = require('./database');
const {
    initializeEmailService,
    sendStatusUpdateEmail,
    sendBookingConfirmationEmail,
    sendPasswordResetEmail,
    sendFeedbackNotificationEmail
} = require('./email-service');
const { exportToExcel, exportBookingsToCSV } = require('./excel-export');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Security Headers with Helmet (relaxed for mobile compatibility)
app.use(helmet({
    contentSecurityPolicy: false, // Temporarily disable CSP to test mobile CSS loading
    hsts: false, // Disable HSTS for local testing
    frameguard: {
        action: 'deny'
    },
    noSniff: false, // Allow MIME type sniffing for mobile browsers
    xssFilter: true
}));

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts, please try again after 15 minutes.',
    skipSuccessfulRequests: true
});

const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 bookings per hour
    message: 'Too many booking requests, please try again later.'
});

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

// CORS Configuration
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Increased limit for profile pictures


// Session configuration
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = process.env.NODE_ENV === 'production' || process.env.USE_MYSQL === 'true'
    ? new MySQLStore({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pawcare_db',
        clearExpired: true,
        checkExpirationInterval: 900000, // 15 minutes
        expiration: 86400000 // 1 day
    })
    : undefined; // Fallback to MemoryStore for local dev if not using MySQL

const sessionConfig = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'pawcare-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    }
};

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // trusty first proxy for Heroku/Render
}

app.use(session(sessionConfig));

// Serve static files with explicit headers for mobile compatibility
app.use(express.static(path.join(__dirname), {
    setHeaders: (res, filePath) => {
        // Force correct MIME types for all browsers including mobile
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (filePath.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
        }
        // Add cache control for better mobile performance
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
}));


// Password validation helper
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!hasUpperCase) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!hasLowerCase) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!hasNumbers) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecialChar) {
        return { valid: false, message: 'Password must contain at least one special character' };
    }

    return { valid: true };
};

// Start server function
async function startServer() {
    // Initialize database on server start
    await initializeDatabase();

    // Auto-initialize services if they don't exist
    const services = await getAllServices();
    if (services.length === 0) {
        console.log('📋 Initializing services...');
        const { createService } = require('./database');
        const defaultServices = [
            { name: 'Pet Sitting', description: 'In-home care', price: 45.00, duration: 60 },
            { name: 'Dog Walking', description: 'Exercise and adventures', price: 25.00, duration: 30 },
            { name: 'Pet Boarding', description: 'Overnight stays', price: 75.00, duration: 1440 },
            { name: 'Grooming', description: 'Professional grooming', price: 60.00, duration: 90 },
            { name: 'Vet Visits', description: 'Transportation to vet', price: 35.00, duration: 120 },
            { name: 'Training Support', description: 'Training routines', price: 50.00, duration: 60 }
        ];

        for (const s of defaultServices) {
            await createService(s.name, s.description, s.price, s.duration);
        }
        console.log('✅ Services initialized');
    } else {
        console.log(`✅ Found ${services.length} services in database`);
    }

    // Initialize email service
    await initializeEmailService();

    // ==================== API Routes ====================

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', message: 'PawCare API is running' });
    });

    // ==================== Authentication ====================

    // Authentication middleware
    const requireAuth = (req, res, next) => {
        if (req.session && req.session.isAuthenticated) {
            next();
        } else {
            res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
        }
    };

    // Login (with rate limiting)
    app.post('/api/auth/login', authLimiter, async (req, res) => {

        try {
            const { username, password, remember } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and password are required'
                });
            }

            // Check credentials
            const admin = await getAdminByUsername(username);
            if (admin && bcrypt.compareSync(password, admin.password_hash)) {
                req.session.isAuthenticated = true;
                req.session.username = username;

                // Extend session if remember me is checked
                if (remember) {
                    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
                }

                res.json({
                    success: true,
                    message: 'Login successful',
                    user: { username }
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: 'Invalid username or password'
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Logout
    app.post('/api/auth/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Logout failed' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });

    // Check authentication status
    app.get('/api/auth/check', async (req, res) => {
        if (req.session && req.session.isAuthenticated) {
            const admin = await getAdminByUsername(req.session.username);
            res.json({
                authenticated: true,
                user: {
                    username: req.session.username,
                    email: admin?.email,
                    profile_picture: admin?.profile_picture
                }
            });
        } else {
            res.json({ authenticated: false });
        }
    });

    // Admin logout
    app.post('/api/auth/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Logout failed' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });

    // Update admin profile
    app.put('/api/admin/profile', async (req, res) => {
        if (!req.session || !req.session.isAuthenticated) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            const { username, email, profile_picture } = req.body;
            const currentUsername = req.session.username;

            // Get current admin data
            const admin = await getAdminByUsername(currentUsername);
            if (!admin) {
                return res.status(404).json({ success: false, message: 'Admin not found' });
            }

            // Update admin profile
            await updateAdmin(admin.id, {
                username: username || admin.username,
                email: email || admin.email,
                profile_picture: profile_picture || admin.profile_picture
            });

            // Update session if username changed
            if (username && username !== currentUsername) {
                req.session.username = username;
            }

            // Get updated admin data
            const updatedAdmin = await getAdminByUsername(username || currentUsername);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                admin: {
                    username: updatedAdmin.username,
                    email: updatedAdmin.email,
                    profile_picture: updatedAdmin.profile_picture
                }
            });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Change admin password
    app.put('/api/admin/password', async (req, res) => {
        if (!req.session || !req.session.isAuthenticated) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
            }

            // Get admin
            const admin = await getAdminByUsername(req.session.username);
            if (!admin) {
                return res.status(404).json({ success: false, message: 'Admin not found' });
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, admin.password);
            if (!isValid) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }

            // Validate new password
            const validation = validatePassword(newPassword);
            if (!validation.valid) {
                return res.status(400).json({ success: false, message: validation.message });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await updateAdmin(admin.id, { password: hashedPassword });

            res.json({ success: true, message: 'Password updated successfully' });
        } catch (error) {
            console.error('Password change error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== Customer Portal Authentication ====================

    // Customer registration (with rate limiting and validation)
    app.post('/api/customer/register', authLimiter, [
        body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('phone').matches(/^[+]?[0-9]{10,13}$/).withMessage('Invalid phone number'),
        body('password').custom((value) => {
            const validation = validatePassword(value);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            return true;
        })
    ], async (req, res) => {

        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: errors.array()[0].msg,
                    errors: errors.array()
                });
            }

            console.log('📝 Registering new customer:', req.body.email);
            const { name, email, phone, password } = req.body;

            // Check if user already exists
            const existingUser = await getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            // Create customer first
            let customer = await getCustomerByEmail(email);
            if (!customer) {
                console.log('Creating new customer record...');
                const result = await createCustomer(name, email, phone);
                customer = { id: result.lastInsertRowid, name, email, phone };
            }

            // Hash password and create user
            console.log('Hashing password and creating user...');
            const passwordHash = bcrypt.hashSync(password, 10);
            await createUser(customer.id, email, passwordHash);

            // Create session
            req.session.isCustomerAuthenticated = true;
            req.session.customerId = customer.id;
            req.session.customerEmail = email;

            console.log('✅ Registration successful for:', email);

            res.json({
                success: true,
                message: 'Registration successful',
                user: { id: customer.id, name, email }
            });
        } catch (error) {
            console.error('❌ Registration error:', error);
            res.status(500).json({ success: false, message: 'Server error: ' + error.message });
        }
    });

    // Customer login (with rate limiting)
    app.post('/api/customer/login', authLimiter, async (req, res) => {

        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find user
            const user = await getUserByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Verify password
            if (!bcrypt.compareSync(password, user.password_hash)) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Get customer details
            const customer = await getCustomerById(user.customer_id);

            // Create session
            req.session.isCustomerAuthenticated = true;
            req.session.customerId = customer.id;
            req.session.customerEmail = email;

            res.json({
                success: true,
                message: 'Login successful',
                user: { id: customer.id, name: customer.name, email: customer.email }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Customer logout
    app.post('/api/customer/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Logout failed' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    });

    // Update Admin Profile
    app.put('/api/admin/profile', async (req, res) => {
        if (!req.session || !req.session.isAuthenticated) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            const { username, email, profile_picture } = req.body;
            const currentUsername = req.session.username;

            // Check if new email is already taken by another admin
            if (email) {
                const existingAdmin = await getAdminByEmail(email);
                const currentAdmin = await getAdminByUsername(currentUsername);

                if (existingAdmin && existingAdmin.id !== currentAdmin.id) {
                    return res.status(400).json({ success: false, message: 'Email already in use by another admin' });
                }
            }

            // Update admin profile
            const result = await updateAdmin(currentUsername, {
                username,
                email,
                profile_picture
            });

            if (result) {
                // Update session if username changed
                if (username && username !== currentUsername) {
                    req.session.username = username;
                }

                const updatedAdmin = await getAdminByUsername(username || currentUsername);
                res.json({
                    success: true,
                    message: 'Profile updated successfully',
                    admin: {
                        id: updatedAdmin.id,
                        username: updatedAdmin.username,
                        email: updatedAdmin.email,
                        profile_picture: updatedAdmin.profile_picture
                    }
                });
            } else {
                res.status(404).json({ success: false, message: 'Admin not found' });
            }
        } catch (error) {
            console.error('Admin profile update error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Customer Forgot Password
    app.post('/api/customer/forgot-password', async (req, res) => {
        try {
            const { email } = req.body;
            const user = await getUserByEmail(email);

            if (!user) {
                return res.status(404).json({ success: false, message: 'No account found with this email' });
            }

            // Generate temporary password
            const tempPassword = Math.random().toString(36).slice(-8);
            const passwordHash = bcrypt.hashSync(tempPassword, 10);

            // Update user password
            await updateUserPassword(user.id, passwordHash);

            // Send email
            await sendPasswordResetEmail(email, tempPassword);

            res.json({ success: true, message: 'Temporary password sent to your email' });
        } catch (error) {
            console.error('Customer forgot password error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Admin Forgot Password
    app.post('/api/admin/forgot-password', async (req, res) => {
        try {
            const { email } = req.body;
            const admin = await getAdminByEmail(email);

            if (!admin) {
                return res.status(404).json({ success: false, message: 'No admin account found with this email' });
            }

            // Generate temporary password
            const tempPassword = Math.random().toString(36).slice(-8);
            const passwordHash = bcrypt.hashSync(tempPassword, 10);

            // Update admin password
            await updateAdminPassword(admin.username, passwordHash);

            // Send email
            await sendPasswordResetEmail(email, tempPassword);

            res.json({ success: true, message: 'Temporary password sent to your email' });
        } catch (error) {
            console.error('Admin forgot password error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Check customer authentication
    app.get('/api/customer/check', async (req, res) => {
        if (req.session && req.session.isCustomerAuthenticated) {
            const customer = await getCustomerById(req.session.customerId);
            if (!customer) {
                // If customer was deleted but session exists
                req.session.destroy();
                return res.json({ authenticated: false });
            }
            res.json({
                authenticated: true,
                user: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    profile_picture: customer.profile_picture
                }
            });
        } else {
            res.json({ authenticated: false });
        }
    });

    // Update customer profile
    app.put('/api/customer/profile', async (req, res) => {
        if (!req.session || !req.session.isCustomerAuthenticated) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            const { name, email, phone, profile_picture } = req.body;
            const customerId = req.session.customerId;

            // Update customer details
            const result = await updateCustomer(customerId, {
                name,
                email,
                phone,
                profile_picture
            });

            if (result) {
                // If email changed, update user record too
                if (email && email !== req.session.customerEmail) {
                    // Check if email already taken by another user
                    const existingUser = await getUserByEmail(email);
                    const currentUser = await getUserByCustomerId(customerId);

                    if (existingUser && existingUser.id !== currentUser.id) {
                        return res.status(400).json({ success: false, message: 'Email already in use' });
                    }

                    await updateUserEmail(customerId, email);
                    req.session.customerEmail = email; // Update session
                }

                const updatedCustomer = await getCustomerById(customerId);
                res.json({
                    success: true,
                    message: 'Profile updated successfully',
                    user: updatedCustomer
                });
            } else {
                res.status(404).json({ success: false, message: 'Customer not found' });
            }
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Change customer password
    app.put('/api/customer/password', async (req, res) => {
        if (!req.session || !req.session.isCustomerAuthenticated) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            const { currentPassword, newPassword } = req.body;
            const customerId = req.session.customerId;

            const user = await getUserByCustomerId(customerId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Verify current password
            if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
                return res.status(400).json({ success: false, message: 'Incorrect current password' });
            }

            // Update password
            const newHash = bcrypt.hashSync(newPassword, 10);
            await updateUserPassword(user.id, newHash);

            res.json({ success: true, message: 'Password updated successfully' });
        } catch (error) {
            console.error('Password update error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Change admin password
    app.put('/api/admin/password', async (req, res) => {
        if (!req.session || !req.session.isAuthenticated) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            const { currentPassword, newPassword } = req.body;
            const username = req.session.username;

            const admin = await getAdminByUsername(username);

            // Verify current password
            if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
                return res.status(400).json({ success: false, message: 'Incorrect current password' });
            }

            // Update password
            const newHash = bcrypt.hashSync(newPassword, 10);
            await updateAdminPassword(username, newHash);

            res.json({ success: true, message: 'Password updated successfully' });
        } catch (error) {
            console.error('Admin password update error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Get customer bookings
    app.get('/api/customer/bookings', async (req, res) => {
        if (!req.session || !req.session.isCustomerAuthenticated) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            const bookings = await getBookingsByCustomer(req.session.customerId);
            res.json({ success: true, data: bookings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ==================== Services ====================

    // Get all services
    app.get('/api/services', async (req, res) => {
        try {
            const services = await getAllServices();
            res.json({ success: true, data: services });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get service by ID
    app.get('/api/services/:id', async (req, res) => {
        try {
            const service = await getServiceById(req.params.id);
            if (!service) {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }
            res.json({ success: true, data: service });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ==================== Bookings ====================

    // Create a new booking (with rate limiting)
    app.post('/api/bookings', bookingLimiter, async (req, res) => {
        try {
            const { name, email, phone, service, petName, petType, petAge, message } = req.body;

            // Validate required fields
            if (!name || !email || !phone || !service) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: name, email, phone, service'
                });
            }

            // Check if customer exists, create if not
            let customer = await getCustomerByEmail(email);
            let customerId;

            if (!customer) {
                const result = await createCustomer(name, email, phone);
                customerId = result.lastInsertRowid;
            } else {
                customerId = customer.id;
            }

            // Create pet if pet information provided
            let petId = null;
            if (petName) {
                // Parse petAge - convert to integer or null if not a number
                let parsedPetAge = null;
                if (petAge) {
                    const ageNum = parseInt(petAge);
                    if (!isNaN(ageNum)) {
                        parsedPetAge = ageNum;
                    }
                }

                const petResult = await createPet(
                    customerId,
                    petName,
                    petType || 'Not specified',
                    null, // breed
                    parsedPetAge,
                    message || null
                );
                petId = petResult.lastInsertRowid;
            }

            // Get service ID from database by name
            let serviceId = null;

            // Map frontend service values to database service names
            const serviceNameMap = {
                'pet-sitting': 'Pet Sitting',
                'dog-walking': 'Dog Walking',
                'pet-boarding': 'Pet Boarding',
                'grooming': 'Grooming',
                'vet-visits': 'Vet Visits',
                'training': 'Training Support'
            };

            const serviceName = serviceNameMap[service] || service;

            // Look up service in database
            const services = await getAllServices();
            const foundService = services.find(s =>
                s.name.toLowerCase() === serviceName.toLowerCase()
            );

            if (foundService) {
                serviceId = foundService.id;
            } else {
                // Fallback to first service if not found
                serviceId = services[0]?.id || 1;
            }

            // Use custom booking date and time from request, or default to tomorrow at 10:00 AM
            let bookingDate, bookingTime;

            if (req.body.bookingDate && req.body.bookingTime) {
                bookingDate = req.body.bookingDate;
                bookingTime = req.body.bookingTime + ':00'; // Add seconds if not present
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                bookingDate = tomorrow.toISOString().split('T')[0];
                bookingTime = '10:00:00';
            }

            const bookingResult = await createBooking(
                customerId,
                petId,
                serviceId,
                bookingDate,
                bookingTime,
                message || null
            );

            const booking = await getBookingById(bookingResult.lastInsertRowid);

            // Send booking confirmation email
            sendBookingConfirmationEmail(booking).catch(err =>
                console.error('Email sending failed:', err.message)
            );

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: booking
            });

        } catch (error) {
            console.error('Booking error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get all bookings (for admin dashboard)
    app.get('/api/bookings', async (req, res) => {
        try {
            const bookings = await getAllBookings();
            res.json({
                success: true,
                data: bookings
            });
        } catch (error) {
            console.error('Get bookings error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get customer bookings
    app.get('/api/customer/bookings', async (req, res) => {
        if (!req.session || !req.session.isCustomerAuthenticated) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            const bookings = await getBookingsByCustomer(req.session.customerId);
            res.json({
                success: true,
                data: bookings
            });
        } catch (error) {
            console.error('Get customer bookings error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get all customers (for admin dashboard)
    app.get('/api/customers', async (req, res) => {
        try {
            const customers = await getAllCustomers();
            res.json({
                success: true,
                data: customers
            });
        } catch (error) {
            console.error('Get customers error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ==================== Feedback ====================

    // Create feedback
    app.post('/api/feedback', (req, res) => {
        try {
            const { name, email, rating, category, message, public } = req.body;

            // Validate required fields
            if (!name || !email || !rating || !category || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }

            // Validate rating
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5'
                });
            }

            const { createFeedback } = require('./database');
            const result = createFeedback(name, email, rating, category, message, public || false);

            // Send feedback notification email to admin
            sendFeedbackNotificationEmail({
                name,
                email,
                rating,
                category,
                message,
                public: public || false
            }).catch(err =>
                console.error('Feedback email sending failed:', err.message)
            );

            res.status(201).json({
                success: true,
                message: 'Feedback submitted successfully',
                data: { id: result.lastInsertRowid }
            });

        } catch (error) {
            console.error('Feedback error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get all feedback (Admin only)
    app.get('/api/feedback', requireAuth, async (req, res) => {
        try {
            const { getAllFeedback } = require('./database');
            const feedback = await getAllFeedback();
            res.json({ success: true, data: feedback });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get public feedback
    app.get('/api/feedback/public', async (req, res) => {
        try {
            const { getPublicFeedback } = require('./database');
            const feedback = await getPublicFeedback();
            res.json({ success: true, data: feedback });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });



    // Get all customers (Admin only)
    app.get('/api/customers', async (req, res) => {
        // Build-in security check for admin
        if (!req.session || !req.session.isAuthenticated) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        try {
            const customers = await getAllCustomers();
            res.json({ success: true, data: customers });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get all bookings
    app.get('/api/bookings', async (req, res) => {
        try {
            const bookings = await getAllBookings();
            res.json({ success: true, data: bookings });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get booking by ID
    app.get('/api/bookings/:id', async (req, res) => {
        try {
            const booking = await getBookingById(req.params.id);
            if (!booking) {
                return res.status(404).json({ success: false, error: 'Booking not found' });
            }
            res.json({ success: true, data: booking });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Update booking status
    app.put('/api/bookings/:id', async (req, res) => {
        try {
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({ success: false, error: 'Status is required' });
            }

            const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status. Must be: pending, confirmed, completed, or cancelled'
                });
            }

            await updateBookingStatus(req.params.id, status);
            const booking = await getBookingById(req.params.id);

            res.json({
                success: true,
                message: 'Booking updated successfully',
                data: booking
            });

            // Send status update email to customer (after response)
            sendStatusUpdateEmail(booking, status).catch(err =>
                console.error('Email sending failed:', err.message)
            );

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Delete booking
    app.delete('/api/bookings/:id', async (req, res) => {
        try {
            await deleteBooking(req.params.id);
            res.json({
                success: true,
                message: 'Booking deleted successfully'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ==================== Excel Export ====================

    // Export database to Excel
    app.get('/api/export/excel', (req, res) => {
        try {
            const database = require('./database.js');
            const dbData = {
                customers: database.db?.customers || [],
                pets: database.db?.pets || [],
                services: database.db?.services || [],
                bookings: database.db?.bookings || []
            };

            // Load database from file
            const dbPath = path.join(__dirname, 'pawcare-data.json');
            const fullDatabase = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

            const excelPath = exportToExcel(fullDatabase);
            res.download(excelPath, 'pawcare-database.xlsx', (err) => {
                if (err) {
                    console.error('Download error:', err);
                }
            });
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ==================== Serve Frontend ====================

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    // ==================== Start Server ====================

    app.listen(PORT, () => {
        console.log(`\n🐾 PawCare API Server Running`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📡 API: http://localhost:${PORT}/api`);
        console.log(`🌐 Website: http://localhost:${PORT}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        console.log(`Available endpoints:`);
        console.log(`  GET    /api/health`);
        console.log(`  GET    /api/services`);
        console.log(`  POST   /api/bookings`);
        console.log(`  GET    /api/bookings`);
        console.log(`  GET    /api/bookings/:id`);
        console.log(`  PUT    /api/bookings/:id`);
        console.log(`  DELETE /api/bookings/:id\n`);
    });
}

// Start the server
startServer().catch(console.error);

module.exports = app;
