import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Configuration
const START_DATE = new Date('2025-12-01');
const END_DATE = new Date('2026-01-15');
const START_HOUR = 9; // 9 AM
const END_HOUR = 19; // 7 PM
const SLOT_DURATION_HOURS = 1;
const LOCATIONS = ['Saarland', 'IWM'];
const MAX_BOOKINGS_PER_SLOT = 1;

// Get owner ID (assuming first admin user)
const [users] = await connection.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
const OWNER_ID = users[0]?.id || 1;

console.log('Starting bulk time slot generation...');
console.log(`Date range: ${START_DATE.toDateString()} to ${END_DATE.toDateString()}`);
console.log(`Time range: ${START_HOUR}:00 - ${END_HOUR}:00`);
console.log(`Locations: ${LOCATIONS.join(', ')}`);
console.log('');

let totalSlots = 0;

// Generate slots for each day
for (let date = new Date(START_DATE); date <= END_DATE; date.setDate(date.getDate() + 1)) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  console.log(`Generating slots for ${date.toDateString()} (${dayOfWeek})...`);
  
  // Generate slots for each location
  for (const location of LOCATIONS) {
    // Generate hourly slots
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(hour + SLOT_DURATION_HOURS, 0, 0, 0);
      
      const title = `${location} - ${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      const description = `Research study session at ${location}`;
      
      try {
        await connection.execute(
          `INSERT INTO timeSlots (title, description, location, startTime, endTime, maxBookings, currentBookings, isActive, createdBy, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, NOW(), NOW())`,
          [title, description, location, startTime, endTime, MAX_BOOKINGS_PER_SLOT, OWNER_ID]
        );
        totalSlots++;
      } catch (error) {
        console.error(`Error creating slot: ${error.message}`);
      }
    }
  }
}

console.log('');
console.log(`✅ Successfully generated ${totalSlots} time slots!`);
console.log('');
console.log('Summary:');
console.log(`- Total days: ${Math.ceil((END_DATE - START_DATE) / (1000 * 60 * 60 * 24)) + 1}`);
console.log(`- Slots per day per location: ${END_HOUR - START_HOUR}`);
console.log(`- Locations: ${LOCATIONS.length}`);
console.log(`- Total slots: ${totalSlots}`);

await connection.end();
