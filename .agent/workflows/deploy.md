---
description: Deploy PawCare application to production
---

# Deploy PawCare Application

This workflow guides you through deploying the PawCare application. Choose your preferred platform and follow the steps.

## Prerequisites

Before deploying, ensure you have:
1. MySQL database credentials
2. Gmail app password for email service
3. All environment variables ready
4. Code committed to Git (for cloud platforms)

## Choose Your Platform

### Option 1: Heroku Deployment

// turbo-all

1. **Login to Heroku**
```bash
heroku login
```

2. **Create Heroku app** (skip if already created)
```bash
heroku create pawcare-app
```

3. **Add MySQL database**
```bash
heroku addons:create jawsdb:kitefin
```

4. **Get database credentials**
```bash
heroku config:get JAWSDB_URL
```
Parse the URL to extract: host, user, password, database name

5. **Set environment variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
heroku config:set EMAIL_USER=pawcare376@gmail.com
heroku config:set EMAIL_PASSWORD=your-gmail-app-password
heroku config:set ADMIN_EMAIL=admin@pawcare.com
heroku config:set ADMIN_PASSWORD=YourSecurePassword123!
heroku config:set DB_HOST=your-db-host
heroku config:set DB_USER=your-db-user
heroku config:set DB_PASSWORD=your-db-password
heroku config:set DB_NAME=your-db-name
heroku config:set DB_PORT=3306
```

6. **Deploy to Heroku**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

7. **Initialize database**
```bash
heroku run npm run init-db
```

8. **Open your app**
```bash
heroku open
```

9. **View logs** (if needed)
```bash
heroku logs --tail
```

---

### Option 2: Render Deployment

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/pawcare.git
git push -u origin main
```

2. **Create MySQL database on Render**
- Go to https://dashboard.render.com/
- Click "New +" → "MySQL"
- Name it `pawcare-db`
- Save connection details

3. **Create Web Service**
- Click "New +" → "Web Service"
- Connect GitHub repository
- Set Build Command: `npm install`
- Set Start Command: `npm start`

4. **Add environment variables in Render dashboard**
```
NODE_ENV=production
PORT=3000
DB_HOST=<from-render-mysql>
DB_USER=<from-render-mysql>
DB_PASSWORD=<from-render-mysql>
DB_NAME=<from-render-mysql>
DB_PORT=3306
SESSION_SECRET=<random-string>
EMAIL_USER=pawcare376@gmail.com
EMAIL_PASSWORD=<gmail-app-password>
ADMIN_EMAIL=admin@pawcare.com
ADMIN_PASSWORD=<secure-password>
```

5. **Deploy** - Render auto-deploys from GitHub

6. **Initialize database** - Use Shell tab in Render dashboard
```bash
npm run init-db
```

---

### Option 3: Local Production

// turbo

1. **Install dependencies**
```bash
npm install
```

2. **Install PM2** (optional, for process management)
```bash
npm install -g pm2
```

3. **Create MySQL database**
```bash
mysql -u root -p -e "CREATE DATABASE pawcare_db;"
```

4. **Configure environment variables**
- Copy `.env.example` to `.env`
- Fill in all required values

5. **Initialize database**
```bash
npm run init-db
```

6. **Start with PM2** (recommended)
```bash
pm2 start server.js --name pawcare
pm2 save
pm2 startup
```

OR **Start directly**
```bash
npm start
```

7. **Verify deployment**
- Open browser: http://localhost:3000
- Test booking form
- Login to admin panel

---

## Post-Deployment Checklist

After deployment:
- [ ] Test booking form submission
- [ ] Login to admin panel
- [ ] Verify email notifications work
- [ ] Check customer portal login
- [ ] Test all CRUD operations
- [ ] Change default admin password
- [ ] Set up SSL certificate (for production)
- [ ] Configure custom domain (optional)
- [ ] Set up database backups

---

## Troubleshooting

**Database connection failed:**
- Verify all DB_* environment variables
- Check if MySQL server is running
- Ensure database exists

**Email not sending:**
- Use Gmail app password (not regular password)
- Enable 2FA on Gmail account
- Verify EMAIL_USER and EMAIL_PASSWORD

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**View logs:**
- Heroku: `heroku logs --tail`
- PM2: `pm2 logs pawcare`
- Render/Railway: Check dashboard logs

---

## Updating Deployment

**Heroku:**
```bash
git add .
git commit -m "Update message"
git push heroku main
```

**Render/Railway:**
```bash
git add .
git commit -m "Update message"
git push origin main
```
(Auto-deploys)

**Local:**
```bash
git pull origin main
npm install
pm2 restart pawcare
```

---

For detailed instructions, see DEPLOYMENT.md
