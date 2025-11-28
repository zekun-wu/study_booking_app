# Project TODO

- [x] Design database schema for time slots and bookings
- [x] Implement backend procedures for creating/editing/deleting time slots (admin only)
- [x] Implement backend procedures for listing available time slots (public)
- [x] Implement backend procedures for booking time slots (public)
- [x] Build admin dashboard for managing time slots
- [x] Build public page for viewing and booking time slots
- [x] Test time slot management and booking flow
- [x] Generate QR code linking to the public booking page

## New Features

- [x] Add location field to time slots (Saarland, IWM)
- [x] Update booking form with parent name, child name, and child age fields
- [x] Add bilingual support (English/German) with language switcher
- [x] Add study description page before booking (English and German)
- [x] Create bulk time slot generation script (Dec 1, 2025 - Jan 15, 2026, 9 AM - 7 PM daily)
- [x] Update database schema for location and enhanced booking fields
- [x] Update backend procedures for location filtering
- [x] Test bilingual functionality

## Calendar View Implementation

- [x] Create calendar view component with month and week views
- [x] Implement month view with day cells showing available slots
- [x] Implement week view with time grid (9 AM - 7 PM)
- [x] Add view switcher (Month/Week) for both user and admin
- [x] Add date navigation (previous/next month or week)
- [x] Update booking page to use calendar interface
- [x] Update admin dashboard to use calendar management interface
- [x] Test calendar functionality on both pages

## Calendar Interface Improvements

- [x] Add day view that shows when clicking a day in month view (Google Calendar style)
- [x] Implement Doodle-style slot selection (clean, single clickable slots per hour)
- [x] Fix duplicate time slots issue (should be one slot per hour, not two)
- [x] Fix time display to accurately match actual slot times in database
- [x] Ensure smooth transition between month view → day view → booking

## Bug Fixes

- [x] Fix duplicate time slots showing in day view (each hour appears twice)

## UI Improvements

- [x] Emphasize location selection with bold text and clear instructions
- [x] Make it obvious that users must choose Saarland OR IWM before booking

## Content Updates

- [x] Add location information (Saarland and IWM) to study description page

## Admin Management & Notifications

- [x] Add admin management UI (add/remove admins by email)
- [x] Implement location-based admin notifications (IWM → m.su@iwm-tuebingen.de, Saarland → wuzekun@cs.uni-saarland.de)
- [x] Send confirmation emails to participants after booking
- [x] Make email field mandatory in booking form
- [x] Test email notification system

## AWS SES Email Integration

- [x] Install AWS SDK package (@aws-sdk/client-ses)
- [x] Create SES email service module
- [x] Update notification system to send real emails via SES
- [x] Add HTML email templates for better formatting
- [x] Test email sending with AWS SES

## Rollback and Reapply Features

- [x] Rollback to checkpoint 624277ae (last valid Manus checkpoint)
- [x] Reapply German language warning to study description
- [x] Reapply admin login page and authentication
- [x] Migrate from AWS SES to Gmail SMTP email service
- [x] Remove owner notifications (wuzekun2020@gmail.com)
- [x] Seed admin accounts (iwm@admin.com, saarland@admin.com)
- [x] Create proper Manus checkpoint
- [x] Publish and verify all features work

