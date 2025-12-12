const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Export database to Excel file
function exportToExcel(database) {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Customers sheet
    const customersData = database.customers.map(c => ({
        'Customer ID': c.id,
        'Name': c.name,
        'Email': c.email,
        'Phone': c.phone,
        'Created At': c.created_at
    }));
    const customersSheet = XLSX.utils.json_to_sheet(customersData);
    XLSX.utils.book_append_sheet(workbook, customersSheet, 'Customers');

    // Pets sheet
    const petsData = database.pets.map(p => ({
        'Pet ID': p.id,
        'Customer ID': p.customer_id,
        'Pet Name': p.name,
        'Type': p.type,
        'Breed': p.breed || '',
        'Age': p.age || '',
        'Special Needs': p.special_needs || '',
        'Created At': p.created_at
    }));
    const petsSheet = XLSX.utils.json_to_sheet(petsData);
    XLSX.utils.book_append_sheet(workbook, petsSheet, 'Pets');

    // Services sheet
    const servicesData = database.services.map(s => ({
        'Service ID': s.id,
        'Service Name': s.name,
        'Description': s.description,
        'Price ($)': s.price,
        'Duration (min)': s.duration_minutes
    }));
    const servicesSheet = XLSX.utils.json_to_sheet(servicesData);
    XLSX.utils.book_append_sheet(workbook, servicesSheet, 'Services');

    // Bookings sheet (with joined data)
    const bookingsData = database.bookings.map(b => {
        const customer = database.customers.find(c => c.id === b.customer_id);
        const pet = database.pets.find(p => p.id === b.pet_id);
        const service = database.services.find(s => s.id === b.service_id);

        return {
            'Booking ID': b.id,
            'Customer Name': customer?.name || 'N/A',
            'Customer Email': customer?.email || 'N/A',
            'Customer Phone': customer?.phone || 'N/A',
            'Pet Name': pet?.name || 'N/A',
            'Pet Type': pet?.type || 'N/A',
            'Service': service?.name || 'N/A',
            'Price ($)': service?.price || 0,
            'Booking Date': b.booking_date,
            'Booking Time': b.booking_time,
            'Status': b.status,
            'Notes': b.notes || '',
            'Created At': b.created_at
        };
    });
    const bookingsSheet = XLSX.utils.json_to_sheet(bookingsData);
    XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Bookings');

    // Write to file
    const excelPath = path.join(__dirname, 'pawcare-database.xlsx');
    XLSX.writeFile(workbook, excelPath);

    console.log('✅ Database exported to Excel:', excelPath);
    return excelPath;
}

// Import data from Excel file
function importFromExcel(excelPath) {
    if (!fs.existsSync(excelPath)) {
        throw new Error('Excel file not found');
    }

    const workbook = XLSX.readFile(excelPath);
    const database = {
        customers: [],
        pets: [],
        services: [],
        bookings: [],
        nextId: {
            customers: 1,
            pets: 1,
            services: 1,
            bookings: 1
        }
    };

    // Read Customers sheet
    if (workbook.SheetNames.includes('Customers')) {
        const customersSheet = workbook.Sheets['Customers'];
        const customersData = XLSX.utils.sheet_to_json(customersSheet);
        database.customers = customersData.map(row => ({
            id: row['Customer ID'],
            name: row['Name'],
            email: row['Email'],
            phone: row['Phone'],
            created_at: row['Created At']
        }));
        if (database.customers.length > 0) {
            database.nextId.customers = Math.max(...database.customers.map(c => c.id)) + 1;
        }
    }

    // Read Pets sheet
    if (workbook.SheetNames.includes('Pets')) {
        const petsSheet = workbook.Sheets['Pets'];
        const petsData = XLSX.utils.sheet_to_json(petsSheet);
        database.pets = petsData.map(row => ({
            id: row['Pet ID'],
            customer_id: row['Customer ID'],
            name: row['Pet Name'],
            type: row['Type'],
            breed: row['Breed'] || null,
            age: row['Age'] || null,
            special_needs: row['Special Needs'] || null,
            created_at: row['Created At']
        }));
        if (database.pets.length > 0) {
            database.nextId.pets = Math.max(...database.pets.map(p => p.id)) + 1;
        }
    }

    // Read Services sheet
    if (workbook.SheetNames.includes('Services')) {
        const servicesSheet = workbook.Sheets['Services'];
        const servicesData = XLSX.utils.sheet_to_json(servicesSheet);
        database.services = servicesData.map(row => ({
            id: row['Service ID'],
            name: row['Service Name'],
            description: row['Description'],
            price: row['Price ($)'],
            duration_minutes: row['Duration (min)']
        }));
        if (database.services.length > 0) {
            database.nextId.services = Math.max(...database.services.map(s => s.id)) + 1;
        }
    }

    // Note: We don't import bookings from Excel to avoid data conflicts
    // Bookings should be managed through the admin interface

    console.log('✅ Database imported from Excel');
    return database;
}

// Export bookings only to CSV (simpler format)
function exportBookingsToCSV(bookings, database) {
    const csvData = bookings.map(b => {
        const customer = database.customers.find(c => c.id === b.customer_id);
        const pet = database.pets.find(p => p.id === b.pet_id);
        const service = database.services.find(s => s.id === b.service_id);

        return {
            'Booking ID': b.id,
            'Customer Name': customer?.name || 'N/A',
            'Email': customer?.email || 'N/A',
            'Phone': customer?.phone || 'N/A',
            'Pet Name': pet?.name || 'N/A',
            'Pet Type': pet?.type || 'N/A',
            'Service': service?.name || 'N/A',
            'Price': service?.price || 0,
            'Date': b.booking_date,
            'Time': b.booking_time,
            'Status': b.status,
            'Notes': b.notes || '',
            'Created': b.created_at
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csvPath = path.join(__dirname, 'bookings.csv');
    XLSX.writeFile({ Sheets: { 'Bookings': worksheet }, SheetNames: ['Bookings'] }, csvPath);

    console.log('✅ Bookings exported to CSV:', csvPath);
    return csvPath;
}

module.exports = {
    exportToExcel,
    importFromExcel,
    exportBookingsToCSV
};
