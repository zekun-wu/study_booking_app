import 'dotenv/config';
import mysql from "mysql2/promise";

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Configuration
const START_DATE = new Date('2026-02-24T00:00:00');
const END_DATE = new Date('2026-03-31T00:00:00');
const START_HOUR = 14; // 2 PM
const END_HOUR = 18; // 6 PM (last slot starts at 17:00)
const SLOT_DURATION_HOURS = 1;
const LOCATIONS = ['Saarland', 'IWM'];
const MAX_BOOKINGS_PER_SLOT = 1;
const STUDY_TIMEZONE = 'Europe/Berlin';

// Excluded start times (local wall clock time).
const EXCLUDED_SLOT_STARTS = new Set([
  '2026-02-24 16:00',
  '2026-03-03 17:00',
  '2026-02-23 16:00', // Included as requested; outside date range so no effect.
]);

const formatDateLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Get owner ID (assuming first admin user)
const [users] = await connection.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
const OWNER_ID = users[0]?.id || 1;

console.log('Starting bulk time slot generation...');
console.log(`Date range: ${START_DATE.toDateString()} to ${END_DATE.toDateString()}`);
console.log(`Time range: ${START_HOUR}:00 - ${END_HOUR}:00`);
console.log('Days: Monday to Friday');
console.log(`Locations: ${LOCATIONS.join(', ')}`);
console.log(`Timezone for display labels: ${STUDY_TIMEZONE}`);
console.log('');

let totalSlots = 0;

// Reset existing slots in the target window before regenerating.
const resetWindowStart = new Date('2026-02-24T00:00:00');
const resetWindowEnd = new Date('2026-04-01T00:00:00'); // exclusive upper bound for 2026-03-31
const [deleteResult] = await connection.execute(
  `DELETE FROM timeSlots WHERE startTime >= ? AND startTime < ?`,
  [resetWindowStart, resetWindowEnd]
);
console.log(`Deleted ${deleteResult.affectedRows} existing slot(s) in reset window.`);

// Generate slots for each day
for (let date = new Date(START_DATE); date <= END_DATE; date.setDate(date.getDate() + 1)) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  const day = date.getDay();

  // Workdays only: Monday(1) to Friday(5)
  if (day < 1 || day > 5) {
    continue;
  }

  console.log(`Generating slots for ${date.toDateString()} (${dayOfWeek})...`);
  
  // Generate slots for each location
  for (const location of LOCATIONS) {
    // Generate hourly slots
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      const dateKey = formatDateLocal(date);
      const hourKey = `${String(hour).padStart(2, '0')}:00`;
      const exclusionKey = `${dateKey} ${hourKey}`;
      if (EXCLUDED_SLOT_STARTS.has(exclusionKey)) {
        continue;
      }

      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(hour + SLOT_DURATION_HOURS, 0, 0, 0);
      
      const title = `${location} - ${startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: STUDY_TIMEZONE,
      })}`;
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
