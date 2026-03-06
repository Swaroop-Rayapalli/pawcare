// Centralized configuration for the PawCare frontend
const CONFIG = {
    // DURING DEVELOPMENT: http://localhost:3000
    // FOR PRODUCTION: Update this to your Render Web Service URL
    // You can find this at the top of your Render Dashboard (e.g., https://pawcare-backend.onrender.com)
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://pawcare-backend.onrender.com' // <-- UPDATE THIS TO YOUR ACTUAL RENDER URL
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
