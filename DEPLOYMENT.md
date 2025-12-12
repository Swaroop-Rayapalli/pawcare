# 🚀 PawCare Deployment Guide

This guide covers deploying the PawCare application to various platforms.

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] MySQL database credentials ready
- [ ] Email service credentials (Gmail app password)
- [ ] Google OAuth credentials (if using OAuth)
- [ ] All environment variables configured
- [ ] Database schema initialized

## 🌐 Deployment Options

### Option 1: Heroku (Recommended for Beginners)

#### Prerequisites
- Heroku account ([sign up here](https://signup.heroku.com/))
- Heroku CLI installed ([download here](https://devcenter.heroku.com/articles/heroku-cli))

#### Steps

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   heroku create your-pawcare-app
   ```

3. **Add MySQL Database**
   ```bash
   heroku addons:create jawsdb:kitefin
   ```
   
   Or use ClearDB:
   ```bash
   heroku addons:create cleardb:ignite
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-random-secret-key-here
   heroku config:set EMAIL_USER=pawcare376@gmail.com
   heroku config:set EMAIL_PASSWORD=your-gmail-app-password
   heroku config:set ADMIN_EMAIL=admin@pawcare.com
   heroku config:set ADMIN_PASSWORD=YourSecurePassword123!
   ```

5. **Get Database URL**
   ```bash
   heroku config:get JAWSDB_URL
   ```
   
   Parse the URL and set individual variables:
   ```bash
   heroku config:set DB_HOST=hostname
   heroku config:set DB_USER=username
   heroku config:set DB_PASSWORD=password
   heroku config:set DB_NAME=database_name
   heroku config:set DB_PORT=3306
   ```

6. **Deploy**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push heroku main
   ```

7. **Initialize Database**
   ```bash
   heroku run npm run init-db
   ```

8. **Open Your App**
   ```bash
   heroku open
   ```

#### Troubleshooting Heroku
- View logs: `heroku logs --tail`
- Restart app: `heroku restart`
- Check config: `heroku config`

---

### Option 2: Render

#### Prerequisites
- Render account ([sign up here](https://render.com/))
- GitHub repository with your code

#### Steps

1. **Push Code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/pawcare.git
   git push -u origin main
   ```

2. **Create MySQL Database on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "MySQL"
   - Choose a name (e.g., `pawcare-db`)
   - Select a region
   - Click "Create Database"
   - Save the connection details

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `pawcare`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Add Environment Variables**
   In the "Environment" section, add:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<from-render-mysql>
   DB_USER=<from-render-mysql>
   DB_PASSWORD=<from-render-mysql>
   DB_NAME=<from-render-mysql>
   DB_PORT=3306
   SESSION_SECRET=<generate-random-string>
   EMAIL_USER=pawcare376@gmail.com
   EMAIL_PASSWORD=<your-gmail-app-password>
   ADMIN_EMAIL=admin@pawcare.com
   ADMIN_PASSWORD=<your-secure-password>
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your app

6. **Initialize Database**
   - Go to "Shell" tab in your web service
   - Run: `npm run init-db`

#### Troubleshooting Render
- Check logs in the "Logs" tab
- Restart service from "Settings" → "Manual Deploy"

---

### Option 3: Railway

#### Prerequisites
- Railway account ([sign up here](https://railway.app/))
- GitHub repository

#### Steps

1. **Create New Project**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Add MySQL Database**
   - Click "+ New"
   - Select "Database" → "MySQL"
   - Railway will create and configure the database

3. **Configure Environment Variables**
   - Click on your web service
   - Go to "Variables" tab
   - Add:
   ```
   NODE_ENV=production
   SESSION_SECRET=<random-string>
   EMAIL_USER=pawcare376@gmail.com
   EMAIL_PASSWORD=<gmail-app-password>
   ADMIN_EMAIL=admin@pawcare.com
   ADMIN_PASSWORD=<secure-password>
   ```
   
   Database variables are auto-configured by Railway!

4. **Deploy**
   - Railway automatically deploys on push to main branch
   - Get your public URL from the "Settings" tab

5. **Initialize Database**
   - Use Railway CLI or run from the dashboard terminal:
   ```bash
   npm run init-db
   ```

---

### Option 4: Local Production Setup

For running on your own server or VPS:

#### Prerequisites
- Node.js 14+ installed
- MySQL server installed and running
- PM2 for process management (optional but recommended)

#### Steps

1. **Install Dependencies**
   ```bash
   npm install
   npm install -g pm2  # Optional: for process management
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Fill in all required values:
   ```env
   NODE_ENV=production
   PORT=3000
   
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your-mysql-password
   DB_NAME=pawcare_db
   DB_PORT=3306
   
   EMAIL_USER=pawcare376@gmail.com
   EMAIL_PASSWORD=your-gmail-app-password
   
   SESSION_SECRET=generate-a-random-secret-key
   
   ADMIN_EMAIL=admin@pawcare.com
   ADMIN_PASSWORD=YourSecurePassword123!
   ```

3. **Create MySQL Database**
   ```bash
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE pawcare_db;
   EXIT;
   ```

4. **Initialize Database**
   ```bash
   npm run init-db
   ```

5. **Start Application**
   
   **Option A: Direct Node**
   ```bash
   npm start
   ```
   
   **Option B: With PM2 (Recommended)**
   ```bash
   pm2 start server.js --name pawcare
   pm2 save
   pm2 startup  # Follow the instructions
   ```

6. **Access Application**
   - Open browser: `http://localhost:3000`
   - Or use your server's IP address

#### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs pawcare        # View logs
pm2 restart pawcare     # Restart app
pm2 stop pawcare        # Stop app
pm2 delete pawcare      # Remove from PM2
```

---

## 🔐 Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] Use strong SESSION_SECRET (generate with `openssl rand -base64 32`)
- [ ] Enable HTTPS/SSL certificate
- [ ] Set NODE_ENV=production
- [ ] Review rate limiting settings
- [ ] Configure CORS for your domain only
- [ ] Enable database backups
- [ ] Set up monitoring/logging

---

## 📧 Email Configuration

### Gmail Setup

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification

2. **Generate App Password**
   - Security → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
   - Use this as EMAIL_PASSWORD

---

## 🗄️ Database Management

### Backup Database
```bash
mysqldump -u username -p pawcare_db > backup.sql
```

### Restore Database
```bash
mysql -u username -p pawcare_db < backup.sql
```

### Export Data to Excel
Access the admin panel and use the "Export Data" feature, or:
```bash
curl http://your-domain.com/api/admin/export/excel > pawcare-data.xlsx
```

---

## 🔍 Monitoring & Logs

### View Application Logs

**Heroku:**
```bash
heroku logs --tail
```

**Render:**
Check the "Logs" tab in dashboard

**Railway:**
Check the "Deployments" → "Logs" section

**Local/PM2:**
```bash
pm2 logs pawcare
```

---

## 🚨 Common Issues

### Database Connection Failed
- Verify DB credentials in environment variables
- Check if MySQL server is running
- Ensure database exists
- Check firewall/security group settings

### Email Not Sending
- Verify Gmail app password (not regular password)
- Check EMAIL_USER and EMAIL_PASSWORD variables
- Ensure 2FA is enabled on Gmail account

### Session Issues
- Set `trust proxy` for production (already configured)
- Ensure SESSION_SECRET is set
- Check cookie settings for HTTPS

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

---

## 📱 Mobile Access

Your app is automatically mobile-responsive. To access from mobile devices on the same network:

1. Find your local IP address:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. Access from mobile: `http://YOUR_IP:3000`

---

## 🎯 Next Steps

After deployment:

1. Test all features (booking, login, admin panel)
2. Set up custom domain (if desired)
3. Configure SSL certificate
4. Set up automated backups
5. Monitor application performance
6. Set up error tracking (e.g., Sentry)

---

## 📞 Support

For issues or questions:
- Check the logs first
- Review this deployment guide
- Verify all environment variables are set correctly
- Ensure database is initialized

---

## 🔄 Updating Your Deployment

### Heroku
```bash
git add .
git commit -m "Update description"
git push heroku main
```

### Render/Railway
```bash
git add .
git commit -m "Update description"
git push origin main
```
(Auto-deploys on push)

### Local
```bash
git pull origin main
npm install  # If dependencies changed
pm2 restart pawcare
```
