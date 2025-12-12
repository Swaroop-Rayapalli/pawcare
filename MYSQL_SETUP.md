# MySQL Installation and Setup Guide for Windows

## Step 1: Download MySQL

1. Go to [MySQL Downloads](https://dev.mysql.com/downloads/installer/)
2. Download **MySQL Installer for Windows** (mysql-installer-community-x.x.xx.msi)
3. Choose the larger "web" installer (recommended)

## Step 2: Install MySQL

1. Run the downloaded installer
2. Choose **"Developer Default"** setup type (includes MySQL Server, Workbench, and tools)
3. Click **Next** through the installation
4. When prompted for MySQL Server Configuration:
   - **Config Type**: Development Computer
   - **Port**: 3306 (default)
   - **Authentication**: Use Strong Password Encryption (Recommended)
   
5. **Set Root Password**: 
   - Choose a password (remember this!)
   - For development, you can use something simple like: `root123`
   - **IMPORTANT**: Save this password - you'll need it for the .env file

6. **Windows Service**:
   - ✅ Configure MySQL Server as a Windows Service
   - ✅ Start the MySQL Server at System Startup
   - Service Name: MySQL80 (default)

7. Click **Execute** to apply configuration
8. Click **Finish** when complete

## Step 3: Verify MySQL is Running

Open Command Prompt (as Administrator) and run:

```cmd
mysql --version
```

You should see something like: `mysql  Ver 8.0.xx for Win64`

To check if MySQL service is running:

```cmd
sc query MySQL80
```

Look for `STATE: 4 RUNNING`

## Step 4: Create the Database

### Option A: Using MySQL Command Line

1. Open Command Prompt
2. Login to MySQL:
   ```cmd
   mysql -u root -p
   ```
3. Enter your root password
4. Create the database:
   ```sql
   CREATE DATABASE pawcare_db;
   SHOW DATABASES;
   EXIT;
   ```

### Option B: Using MySQL Workbench (GUI)

1. Open MySQL Workbench (installed with MySQL)
2. Click on "Local instance MySQL80"
3. Enter your root password
4. In the query window, run:
   ```sql
   CREATE DATABASE pawcare_db;
   ```
5. Click the lightning bolt icon to execute

## Step 5: Update .env File

Open `d:\Web_Projects\PetCare\.env` and update the MySQL credentials:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=pawcare_db
DB_PORT=3306
```

**Replace `your_password_here` with the password you set during installation.**

## Step 6: Initialize the Database

In your project directory, run:

```cmd
cd d:\Web_Projects\PetCare
npm run init-db
```

Expected output:
```
🚀 Initializing PawCare MySQL Database...
✅ Database tables initialized
✅ Default admin account initialized
📋 Adding services to database...
  ✓ Added: Pet Sitting
  ✓ Added: Dog Walking
  ...
✅ Database initialization complete!
```

## Step 7: Start the Server

```cmd
npm start
```

You should see:
```
🐾 PawCare API Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 API: http://localhost:3000/api
🌐 Website: http://localhost:3000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
- Check your password in the `.env` file
- Make sure it matches the password you set during installation

### Error: "ECONNREFUSED ::1:3306"
- MySQL service is not running
- Start it with: `net start MySQL80` (as Administrator)
- Or use Services app: Win+R → `services.msc` → Find MySQL80 → Start

### Error: "Unknown database 'pawcare_db'"
- You forgot to create the database
- Run: `mysql -u root -p` then `CREATE DATABASE pawcare_db;`

### MySQL Service Won't Start
- Check Windows Services (services.msc)
- Look for error logs in: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\`
- Try reinstalling MySQL

## Quick Commands Reference

```cmd
# Start MySQL service
net start MySQL80

# Stop MySQL service
net stop MySQL80

# Login to MySQL
mysql -u root -p

# Check MySQL status
sc query MySQL80

# View databases
mysql -u root -p -e "SHOW DATABASES;"
```

## Default Admin Credentials

After initialization, you can login to the admin panel with:
- **Username**: `admin`
- **Password**: `PawCareAdmin2025!`

## Next Steps

Once MySQL is running and the database is initialized:
1. Access the website at `http://localhost:3000`
2. Test the booking form
3. Login to admin panel at `http://localhost:3000/login.html`
4. Check that data is being saved in MySQL (not JSON file)

---

**Need Help?** If you encounter any issues during installation, let me know the specific error message and I'll help you resolve it.
