#!/usr/bin/env node
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { admins, timeSlots, bookings } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

console.log("🚀 Starting database setup...");

async function setupDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Step 1: Check if tables exist by trying to query
    console.log("\n📋 Step 1: Checking database tables...");
    try {
      await connection.query("SELECT 1 FROM admins LIMIT 1");
      console.log("✅ Tables already exist");
    } catch (error) {
      console.log("⚠️  Tables don't exist. Please run migrations first:");
      console.log("   railway run pnpm run db:push");
      await connection.end();
      process.exit(1);
    }

    // Step 2: Seed admin accounts
    console.log("\n👤 Step 2: Setting up admin accounts...");
    const existingAdmins = await db.select().from(admins);
    
    if (existingAdmins.length === 0) {
      await db.insert(admins).values([
        {
          email: "iwm@admin.com",
          password: "Admin2024!",
          name: "IWM Admin",
          location: "IWM",
        },
        {
          email: "saarland@admin.com",
          password: "Admin2024!",
          name: "Saarland Admin",
          location: "Saarland",
        },
      ]);
      console.log("✅ Admin accounts created:");
      console.log("   - iwm@admin.com / Admin2024!");
      console.log("   - saarland@admin.com / Admin2024!");
    } else {
      console.log("✅ Admin accounts already exist");
    }

    // Step 3: Generate time slots
    console.log("\n📅 Step 3: Generating time slots...");
    const existingSlots = await db.select().from(timeSlots);
    
    if (existingSlots.length === 0) {
      const slots = [];
      const startDate = new Date("2025-11-30");
      const endDate = new Date("2026-01-15");
      const locations = ["Saarland", "IWM"];
      const timeRanges = [
        { start: "09:00", end: "10:00" },
        { start: "10:00", end: "11:00" },
        { start: "11:00", end: "12:00" },
        { start: "12:00", end: "13:00" },
        { start: "13:00", end: "14:00" },
        { start: "14:00", end: "15:00" },
        { start: "15:00", end: "16:00" },
        { start: "16:00", end: "17:00" },
        { start: "17:00", end: "18:00" },
        { start: "18:00", end: "19:00" },
      ];

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        for (const location of locations) {
          for (const timeRange of timeRanges) {
            const slotDate = new Date(d);
            const [startHour, startMinute] = timeRange.start.split(":").map(Number);
            const [endHour, endMinute] = timeRange.end.split(":").map(Number);
            
            const startTime = new Date(slotDate);
            startTime.setHours(startHour, startMinute, 0, 0);
            
            const endTime = new Date(slotDate);
            endTime.setHours(endHour, endMinute, 0, 0);

            slots.push({
              location,
              startTime,
              endTime,
              maxBookings: 1,
              currentBookings: 0,
              title: `${location} - ${timeRange.start}`,
            });
          }
        }
      }

      // Insert in batches of 100
      for (let i = 0; i < slots.length; i += 100) {
        const batch = slots.slice(i, i + 100);
        await db.insert(timeSlots).values(batch);
        console.log(`   Inserted ${Math.min(i + 100, slots.length)}/${slots.length} slots...`);
      }

      console.log(`✅ Generated ${slots.length} time slots (Nov 30, 2025 - Jan 15, 2026)`);
    } else {
      console.log(`✅ Time slots already exist (${existingSlots.length} slots)`);
    }

    console.log("\n🎉 Database setup complete!");
    console.log("\n📊 Summary:");
    const adminCount = await db.select().from(admins);
    const slotCount = await db.select().from(timeSlots);
    const bookingCount = await db.select().from(bookings);
    
    console.log(`   - Admins: ${adminCount.length}`);
    console.log(`   - Time Slots: ${slotCount.length}`);
    console.log(`   - Bookings: ${bookingCount.length}`);
    
    console.log("\n🌐 Your app is ready at: https://studybookingapp-production.up.railway.app");

  } catch (error) {
    console.error("❌ Error during setup:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

setupDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
