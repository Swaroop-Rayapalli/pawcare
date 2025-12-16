// Fix for MySQL field name mismatch
// This script transforms MySQL snake_case field names to camelCase expected by admin.html

// Store the original fetch function
const originalFetch = window.fetch;

// Override fetch to transform booking data
window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    // Only transform /api/bookings responses
    if (args[0] && args[0].includes('/api/bookings')) {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();

        if (data.success && data.data) {
            // Transform each booking object
            data.data = data.data.map(booking => ({
                ...booking,
                name: booking.customer_name,
                email: booking.customer_email,
                service: booking.service_name,
                bookingDate: booking.booking_date,
                bookingTime: booking.booking_time,
                petName: booking.pet_name,
                petType: booking.pet_type
            }));
        }

        // Return a new response with transformed data
        return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    }

    return response;
};

console.log('✅ MySQL field name transformer loaded');
