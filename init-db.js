const { initializeDatabase, createService } = require('./database');
require('dotenv').config();

async function init() {
    console.log('🚀 Initializing PawCare MySQL Database...\n');

    try {
        // Initialize database schema
        await initializeDatabase();

        // Insert sample services
        const { getAllServices } = require('./database');
        const existingServices = await getAllServices();

        if (existingServices.length === 0) {
            console.log('📋 Adding services to database...');
            const services = [
                {
                    name: 'Pet Sitting',
                    description: 'In-home care while you\'re away. Your pet stays comfortable in their familiar environment with personalized attention.',
                    price: 45.00,
                    duration: 60
                },
                {
                    name: 'Dog Walking',
                    description: 'Regular exercise and outdoor adventures. Keep your pup happy, healthy, and well-socialized.',
                    price: 25.00,
                    duration: 30
                },
                {
                    name: 'Pet Boarding',
                    description: 'Safe, comfortable overnight stays. Your pet enjoys a home-like setting with round-the-clock supervision.',
                    price: 75.00,
                    duration: 1440 // 24 hours
                },
                {
                    name: 'Grooming',
                    description: 'Professional grooming services. Keep your pet looking and feeling their absolute best.',
                    price: 60.00,
                    duration: 90
                },
                {
                    name: 'Vet Visits',
                    description: 'Transportation to appointments. We ensure your pet gets to their vet visits safely and on time.',
                    price: 35.00,
                    duration: 120
                },
                {
                    name: 'Training Support',
                    description: 'Reinforcement of training routines. We maintain consistency with your pet\'s training program.',
                    price: 50.00,
                    duration: 60
                }
            ];

            for (const service of services) {
                try {
                    await createService(service.name, service.description, service.price, service.duration);
                    console.log(`  ✓ Added: ${service.name}`);
                } catch (error) {
                    console.log(`  ⚠ Service may already exist: ${service.name}`);
                }
            }
        } else {
            console.log('✅ Services already exist in database');
        }

        console.log('\n✅ Database initialization complete!');
        console.log('📁 Database: MySQL');
        console.log('\n💡 You can now start the server with: npm start');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

init();
