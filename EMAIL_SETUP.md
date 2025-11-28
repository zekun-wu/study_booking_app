# Email Notification Setup Guide

## Overview
The study booking app sends two types of emails when a booking is made:
1. **Notice Email** - Sent to the location-specific admin
2. **Confirmation Email** - Sent to the user who made the booking

## Email Configuration

### Sender Email
- **Email Address**: `childread2025@gmail.com`
- All emails are sent from this address

### Admin Email Recipients (Location-Based)
- **Saarland Bookings** → Notice email sent to: `wuzekun@cs.uni-saarland.de`
- **IWM Bookings** → Notice email sent to: `m.su@iwm-tuebingen.de`

### User Confirmation Emails
- Sent to the email address provided during booking registration

---

## Setup Instructions

### Step 1: Generate Gmail App Password

Since the app uses Gmail SMTP, you need to create an **App Password** for `childread2025@gmail.com`:

1. **Log in to Gmail** with `childread2025@gmail.com`

2. **Enable 2-Step Verification** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup instructions

3. **Create App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it: "Study Booking App"
   - Click "Generate"
   - **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 2: Add Email Password to Environment Variables

Add the Gmail app password to the `.env` file:

```bash
# Open the .env file
nano /home/ubuntu/study_booking_app/.env

# Add this line (replace with your actual app password):
EMAIL_PASSWORD=abcdefghijklmnop

# Note: Remove spaces from the app password
```

### Step 3: Restart the Server

After adding the email password, restart the server:

```bash
cd /home/ubuntu/study_booking_app
ps aux | grep "node dist/index.js" | grep -v grep | awk '{print $2}' | xargs kill
NODE_ENV=production nohup pnpm run start > server.log 2>&1 &
```

---

## Email Templates

### Notice Email (to Admin)
**Subject**: `New Booking: [Location] - [Slot Title]`

**Content**:
- Booking details (time slot, date, location)
- Participant information (parent name, child name/age, contact info)
- Link to admin dashboard

### Confirmation Email (to User)
**Subject**: `Booking Confirmation - [Location] Study Session`

**Content**:
- Thank you message
- Booking details (time slot, date, location)
- Important reminder: Study conducted in German
- Contact information for questions
- Coordinator email based on location

---

## Testing Email Notifications

### Test with Saarland Booking
1. Go to: https://3000-i2f3edpag3pnqr2bm30md-c0f700fc.manusvm.computer/book
2. Select **Saarland** location
3. Choose a time slot
4. Fill in booking form with your test email
5. Submit booking

**Expected Emails:**
- Notice email → `wuzekun@cs.uni-saarland.de`
- Confirmation email → Your test email

### Test with IWM Booking
1. Go to: https://3000-i2f3edpag3pnqr2bm30md-c0f700fc.manusvm.computer/book
2. Select **IWM** location
3. Choose a time slot
4. Fill in booking form with your test email
5. Submit booking

**Expected Emails:**
- Notice email → `m.su@iwm-tuebingen.de`
- Confirmation email → Your test email

---

## Troubleshooting

### Emails Not Sending

1. **Check server logs**:
   ```bash
   tail -50 /home/ubuntu/study_booking_app/server.log
   ```

2. **Verify EMAIL_PASSWORD is set**:
   ```bash
   cat /home/ubuntu/study_booking_app/.env | grep EMAIL_PASSWORD
   ```

3. **Check for error messages**:
   - Look for `[Email]` prefix in logs
   - Common issues:
     - "Email not configured" - EMAIL_PASSWORD not set
     - "Invalid credentials" - Wrong app password
     - "Authentication failed" - 2-Step Verification not enabled

### Gmail Security Issues

If you see "Less secure app" warnings:
- Use **App Password** instead of regular password
- Ensure **2-Step Verification** is enabled
- App passwords bypass "less secure app" restrictions

### Email Delivery Issues

If emails are not received:
1. Check spam/junk folders
2. Verify recipient email addresses are correct
3. Check Gmail sending limits (500 emails/day for free accounts)
4. Review Gmail account activity for any blocks

---

## Current Configuration

**Environment Variables** (in `.env`):
```bash
EMAIL_USER=childread2025@gmail.com
EMAIL_PASSWORD=[Your Gmail App Password]
```

**Admin Emails** (hardcoded in `server/_core/env.ts`):
```typescript
saarlandAdminEmail: "wuzekun@cs.uni-saarland.de"
iwmAdminEmail: "m.su@iwm-tuebingen.de"
```

---

## Security Notes

1. **Never commit `.env` file** to version control
2. **Use App Passwords** instead of regular Gmail password
3. **Rotate passwords regularly** for security
4. **Monitor Gmail account activity** for suspicious access
5. **Keep EMAIL_PASSWORD secret** - it grants full email access

---

## Email Sending Flow

```
User Makes Booking
       ↓
Booking Saved to Database
       ↓
Email Service Triggered
       ↓
    ┌─────────────────────┐
    │                     │
    ↓                     ↓
Notice Email        Confirmation Email
to Admin            to User
(Location-based)    (User's email)
```

**Saarland Flow:**
- User books Saarland slot
- Notice → `wuzekun@cs.uni-saarland.de`
- Confirmation → User's email

**IWM Flow:**
- User books IWM slot
- Notice → `m.su@iwm-tuebingen.de`
- Confirmation → User's email

---

## Support

If you encounter issues with email notifications:
1. Check this guide for troubleshooting steps
2. Review server logs for error messages
3. Verify Gmail account settings and app password
4. Test with a simple booking to isolate the issue
