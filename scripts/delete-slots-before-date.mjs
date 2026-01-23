import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env file manually
try {
  const envPath = join(__dirname, '..', '.env');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  // .env file might not exist, that's okay if DATABASE_URL is set in environment
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('   Please set DATABASE_URL in your .env file or environment variables');
  process.exit(1);
}

// Parse the date: January 25, 2026
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
      return;
    }
    
    console.log(`📊 Found ${count} time slot(s) to delete.`);
    
    // Delete the slots
    const [result] = await connection.execute(
      `DELETE FROM timeSlots WHERE startTime < ?`,
      [CUTOFF_DATE]
    );
    
    console.log(`✅ Successfully deleted ${result.affectedRows} time slot(s) before ${CUTOFF_DATE.toISOString().split('T')[0]}.`);
    
  } catch (error) {
    console.error('❌ Error deleting time slots:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
}

deleteSlotsBeforeDate()
  .then(() => {
    console.log('✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
