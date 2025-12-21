import mysql from "mysql2/promise";
import { ENV } from "./env";

export async function createTables() {
  if (!ENV.databaseUrl) {
    console.log("[Create-Tables] Skipping: DATABASE_URL not configured");
    return false;
  }

  try {
    const connection = await mysql.createConnection(ENV.databaseUrl);

    console.log("[Create-Tables] Dropping existing tables if they exist...");
    
    // Drop tables in correct order (bookings first due to foreign key)
    await connection.query(`DROP TABLE IF EXISTS bookings`);
    await connection.query(`DROP TABLE IF EXISTS timeSlots`);
    await connection.query(`DROP TABLE IF EXISTS admins`);
    await connection.query(`DROP TABLE IF EXISTS users`);
    
    console.log("[Create-Tables] Creating database tables...");

    // Create users table (for admin authentication)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320),
        loginMethod VARCHAR(64),
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Create admins table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(50) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create timeSlots table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS timeSlots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(100) NOT NULL,
        startTime TIMESTAMP NOT NULL,
        endTime TIMESTAMP NOT NULL,
        maxBookings INT NOT NULL DEFAULT 1,
        currentBookings INT NOT NULL DEFAULT 0,
        isActive INT NOT NULL DEFAULT 1,
        createdBy INT NOT NULL DEFAULT 1,
        holdBy VARCHAR(320),
        holdExpiresAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_location (location),
        INDEX idx_start_time (startTime),
        INDEX idx_hold_expires (holdExpiresAt)
      )
    `);

    // Create bookings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timeSlotId INT NOT NULL,
        parentName VARCHAR(255) NOT NULL,
        childName VARCHAR(255) NOT NULL,
        childAge INT NOT NULL,
        userEmail VARCHAR(320),
        userPhone VARCHAR(50),
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (timeSlotId) REFERENCES timeSlots(id) ON DELETE CASCADE,
        INDEX idx_timeslot (timeSlotId)
      )
    `);

    await connection.end();
    console.log("[Create-Tables] ✅ Database tables created successfully");
    return true;
  } catch (error) {
    console.error("[Create-Tables] Error:", error);
    return false;
  }
}
