// Centralized configuration for the PawCare frontend
const CONFIG = {
    // During local development, this should be http://localhost:3000
    // After deploying the backend to Render, update this to your Render URL
    // Example: https://pawcare-backend.onrender.com
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : 'https://pawcare-backend.onrender.com' // <-- UPDATE THIS AFTER DEPLOYING TO RENDER
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
