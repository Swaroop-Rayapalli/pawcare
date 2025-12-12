# PawCare - Pet Care Website with Database

A premium pet care booking website with a complete backend database system.

## 🚀 Features

- **Modern Frontend**: Glassmorphism design, smooth animations, fully responsive
- **SQLite Database**: Lightweight, serverless database for bookings
- **RESTful API**: Express.js backend with CRUD operations
- **Real-time Booking**: Form submissions save directly to database

## 📁 Project Structure

```
PetCare/
├── index.html          # Frontend website
├── style.css           # Premium CSS design system
├── script.js           # Frontend JavaScript with API integration
├── server.js           # Express.js API server
├── database.js         # Database schema and helper functions
├── init-db.js          # Database initialization script
├── package.json        # Node.js dependencies
└── pawcare.db          # SQLite database (created after init)
```

## 🗄️ Database Schema

### Tables

**customers**
- id, name, email, phone, created_at

**pets**
- id, customer_id, name, type, breed, age, special_needs, created_at

**services**
- id, name, description, price, duration_minutes

**bookings**
- id, customer_id, pet_id, service_id, booking_date, booking_time, status, notes, created_at

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

   If you encounter errors, try installing individually:
   ```bash
   npm install express
   npm install cors
   npm install better-sqlite3
   ```

2. **Initialize Database**
   ```bash
   npm run init-db
   ```
   This creates the database file and populates services.

3. **Start Server**
   ```bash
   npm start
   ```
   Server runs on http://localhost:3000

## 📡 API Endpoints

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Delete booking

### Example: Create Booking

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "service": "pet-sitting",
    "petName": "Max",
    "petType": "Dog",
    "message": "Golden Retriever, 3 years old"
  }'
```

## 🎯 Usage

1. Start the backend server: `npm start`
2. Open http://localhost:3000 in your browser
3. Fill out the booking form
4. Submission saves to SQLite database
5. View bookings via API: http://localhost:3000/api/bookings

## 🔧 Troubleshooting

### npm install fails
- Make sure you have Node.js installed: `node --version`
- Try clearing npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json, then reinstall

### Database not created
- Run `npm run init-db` manually
- Check for pawcare.db file in project directory

### Form submission fails
- Ensure server is running on port 3000
- Check browser console for errors
- Verify CORS is enabled in server.js

## 📊 Viewing Database

You can view the SQLite database using:
- **DB Browser for SQLite** (GUI): https://sqlitebrowser.org/
- **SQLite CLI**: `sqlite3 pawcare.db`

Example queries:
```sql
-- View all bookings
SELECT * FROM bookings;

-- View bookings with customer info
SELECT b.*, c.name, c.email 
FROM bookings b 
JOIN customers c ON b.customer_id = c.id;

-- Count bookings by service
SELECT s.name, COUNT(*) as booking_count
FROM bookings b
JOIN services s ON b.service_id = s.id
GROUP BY s.name;
```

## 🎨 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite with better-sqlite3
- **API**: RESTful architecture

## 📝 License

MIT License - Feel free to use for your projects!
