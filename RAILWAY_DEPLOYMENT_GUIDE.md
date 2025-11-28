# Railway Deployment Guide - Study Booking App

This guide will help you deploy the Study Booking App to Railway for **FREE** permanent hosting.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Login" and sign up with GitHub (recommended) or email
3. Verify your email if needed
4. **No credit card required for free tier!**

### Step 2: Create New Project from GitHub

#### Option A: Deploy from GitHub (Recommended)
1. Push your code to GitHub:
   ```bash
   # Create a new repository on GitHub first, then:
   cd /home/ubuntu/study_booking_app
   git remote add origin https://github.com/YOUR_USERNAME/study_booking_app.git
   git branch -M main
   git push -u origin main
   ```

2. In Railway dashboard:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select your `study_booking_app` repository
   - Railway will automatically detect the configuration and start deploying

#### Option B: Deploy from Local (Alternative)
1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   cd /home/ubuntu/study_booking_app
   railway login
   railway init
   railway up
   ```

### Step 3: Add MySQL Database
1. In your Railway project dashboard
2. Click "+ New" button
3. Select "Database" → "Add MySQL"
4. Railway will automatically:
   - Create a MySQL database
   - Generate a `DATABASE_URL` environment variable
   - Connect it to your app

### Step 4: Configure Environment Variables
1. Click on your app service (not the database)
2. Go to "Variables" tab
3. Add these environment variables:

```
DATABASE_URL = (automatically set by Railway MySQL)
JWT_SECRET = study_booking_secret_key_2025
VITE_APP_ID = study_booking_app
EMAIL_USER = childread2025@gmail.com
EMAIL_PASSWORD = etcnvzrparunrhtw
PORT = 3000
NODE_ENV = production
```

**Note:** `DATABASE_URL` is automatically created when you add MySQL database.

### Step 5: Run Database Setup
1. In Railway dashboard, click on your app
2. Go to "Settings" tab
3. Scroll to "Deploy" section
4. Add these commands to run once after first deployment:

**One-time setup commands** (run in Railway shell or locally with Railway CLI):
```bash
# Connect to your Railway project
railway link

# Run migrations
railway run pnpm run db:push

# Seed admin accounts
railway run npx tsx seed-admins.mjs

# Generate time slots
railway run npx tsx scripts/generate-slots.mjs
```

### Step 6: Deploy!
1. Railway will automatically build and deploy your app
2. Wait 2-3 minutes for the build to complete
3. Click on "Settings" → "Networking" → "Generate Domain"
4. Your app will be live at: `https://your-app-name.up.railway.app`

---

## ✅ Verification Checklist

After deployment, verify everything is working:

- [ ] Visit your Railway URL
- [ ] Homepage loads correctly
- [ ] Language switcher works (EN/DE)
- [ ] Booking page shows time slots
- [ ] Can create a test booking
- [ ] Admin login works (saarland@admin.com / Admin2024!)
- [ ] Admin dashboard shows slots
- [ ] Email notifications sent (check server logs)

---

## 🔧 Troubleshooting

### Build Fails
**Problem:** Build fails with "command not found" or dependency errors

**Solution:**
1. Check `railway.json` and `nixpacks.toml` are in the root directory
2. Ensure `package.json` has correct scripts:
   ```json
   {
     "scripts": {
       "build": "tsc && vite build",
       "start": "node dist/index.js"
     }
   }
   ```

### Database Connection Error
**Problem:** App can't connect to database

**Solution:**
1. Verify MySQL database is added to your project
2. Check `DATABASE_URL` variable is set automatically
3. Make sure database and app are in the same project
4. Run migrations: `railway run pnpm run db:push`

### No Time Slots Showing
**Problem:** Booking page shows "No slots"

**Solution:**
1. Connect to Railway: `railway link`
2. Run slot generation: `railway run npx tsx scripts/generate-slots.mjs`
3. Check server logs for errors

### Admin Login Fails
**Problem:** Can't log in to admin dashboard

**Solution:**
1. Verify admin accounts are seeded: `railway run npx tsx seed-admins.mjs`
2. Check `JWT_SECRET` and `VITE_APP_ID` environment variables are set
3. Clear browser cookies and try again

### Emails Not Sending
**Problem:** Bookings work but no emails received

**Solution:**
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` are set correctly
2. Check Gmail app password is still valid
3. Look at Railway logs: Click on app → "Deployments" → Latest deployment → "View Logs"
4. Search for "[Email]" in logs to see email status

---

## 📊 Railway Free Tier Limits

Railway's free tier (Hobby Plan) includes:
- ✅ **$5 free credit per month** (enough for small apps)
- ✅ **500 hours of runtime** per month
- ✅ **Unlimited projects**
- ✅ **Custom domains**
- ✅ **Automatic HTTPS**
- ✅ **MySQL database included**

**Your app should stay within free tier easily!**

---

## 🔐 Security Best Practices

### After Deployment:

1. **Change Admin Passwords**
   - Log in to admin dashboard
   - Update default passwords for both admins

2. **Rotate JWT Secret**
   - Generate a new random secret
   - Update `JWT_SECRET` in Railway variables
   - Redeploy the app

3. **Monitor Logs**
   - Check Railway logs regularly
   - Look for suspicious activity
   - Monitor email sending

4. **Backup Database**
   - Railway provides automatic backups
   - You can also export manually from Railway dashboard

---

## 📱 Custom Domain (Optional)

To use your own domain (e.g., studybooking.yourdomain.com):

1. In Railway dashboard, go to your app
2. Click "Settings" → "Networking"
3. Click "Custom Domain"
4. Enter your domain name
5. Add the CNAME record to your DNS provider:
   ```
   Type: CNAME
   Name: studybooking (or your subdomain)
   Value: your-app-name.up.railway.app
   ```
6. Wait for DNS propagation (5-30 minutes)

---

## 🔄 Updating Your App

### Automatic Deployments (GitHub)
If you deployed from GitHub:
1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. Railway automatically detects the push and redeploys!

### Manual Deployments (CLI)
If you used Railway CLI:
```bash
cd /home/ubuntu/study_booking_app
railway up
```

---

## 📞 Support & Resources

### Railway Documentation
- **Getting Started**: https://docs.railway.app/getting-started
- **Environment Variables**: https://docs.railway.app/develop/variables
- **MySQL Database**: https://docs.railway.app/databases/mysql
- **Custom Domains**: https://docs.railway.app/deploy/exposing-your-app

### Railway Community
- **Discord**: https://discord.gg/railway
- **GitHub**: https://github.com/railwayapp
- **Twitter**: @Railway

### Your App Information
- **Project Location**: `/home/ubuntu/study_booking_app/`
- **Git Repository**: Initialized and ready
- **Configuration Files**: `railway.json`, `nixpacks.toml`
- **Admin Credentials**: See `DEPLOYMENT_READY_REPORT.md`

---

## 🎉 Success!

Once deployed, your Study Booking App will be:
- ✅ **Permanently hosted** on Railway
- ✅ **Accessible 24/7** with automatic HTTPS
- ✅ **Automatically backed up** by Railway
- ✅ **Free to run** within Railway's free tier
- ✅ **Easy to update** with automatic deployments

**Your permanent URL will look like:**
`https://study-booking-app.up.railway.app`

Share this URL with your users and admins!

---

## 📋 Quick Reference

### Admin Credentials
- **Saarland**: saarland@admin.com / Admin2024!
- **IWM**: iwm@admin.com / Admin2024!

### Admin Emails
- **Saarland**: wuzekun@cs.uni-saarland.de
- **IWM**: m.su@iwm-tuebingen.de

### System Email
- **Sender**: childread2025@gmail.com

### Important URLs
- **Railway Dashboard**: https://railway.app/dashboard
- **Your App**: (will be generated after deployment)
- **Admin Login**: https://your-app.up.railway.app/admin/login
- **Public Booking**: https://your-app.up.railway.app/book

---

**Deployment Guide Created**: November 28, 2025  
**Platform**: Railway (Free Tier)  
**Estimated Setup Time**: 5-10 minutes  
**Status**: Ready to Deploy! 🚀
