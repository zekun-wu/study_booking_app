// Simple script to delete time slots before January 25, 2026
// Run with: node scripts/delete-slots-before-jan25.mjs
// Make sure DATABASE_URL is set in your environment or .env file

import mysql from 'mysql2/promise';

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('   Please set DATABASE_URL in your environment or .env file');
  process.exit(1);
}

// January 25, 2026 at 00:00:00 UTC
const CUTOFF_DATE = new Date('2026-01-25T00:00:00.000Z');

async function deleteSlotsBeforeDate() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DATABASE_URL);
    
    console.log(`🗑️  Deleting all time slots before ${CUTOFF_DATE.toISOString().split('T')[0]}...`);
    
    // First, get count of slots to be deleted
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as count FROM timeSlots WHERE startTime < ?`,
      [CUTOFF_DATE]
    );
    const count = countResult[0].count;
    
    if (count === 0) {
      console.log('✅ No time slots found before the cutoff date.');
      await connection.end();
      return;
    }
    
    console.log(`📊 Found ${count} time slot(s) to delete.`);
    
    // Delete the slots
    const [result] = await connection.execute(
      `DELETE FROM timeSlots WHERE startTime < ?`,
      [CUTOFF_DATE]
    );
    
    console.log(`✅ Successfully deleted ${result.affectedRows} time slot(s) before ${CUTOFF_DATE.toISOString().split('T')[0]}.`);
    
    await connection.end();
    console.log('🔌 Database connection closed.');
    console.log('✨ Script completed successfully!');
    
  } catch (error) {
    console.error('❌ Error deleting time slots:', error);
    if (connection) {
      await connection.end();
    }
    throw error;
  }
}

deleteSlotsBeforeDate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
