import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { admins, timeSlots } from "../../drizzle/schema";
import { ENV } from "./env";
import { createTables } from "./create-tables";

let initialized = false;

export async function autoInitializeDatabase() {
  if (initialized) return;
  if (!ENV.databaseUrl) {
    console.log("[Auto-Init] Skipping: DATABASE_URL not configured");
    return;
  }

  console.log("[Auto-Init] Checking database initialization...");

  try {
    // First, ensure tables exist
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.log("[Auto-Init] Failed to create tables");
      return;
    }

    const connection = await mysql.createConnection(ENV.databaseUrl);
    const db = drizzle(connection);

    // Check if admins exist
    const existingAdmins = await db.select().from(admins).limit(1);
    
    if (existingAdmins.length === 0) {
      console.log("[Auto-Init] Creating admin accounts...");
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
      console.log("[Auto-Init] ✅ Admin accounts created");
    }

    // Check if time slots exist
    const existingSlots = await db.select().from(timeSlots).limit(1);
    
    if (existingSlots.length === 0) {
      console.log("[Auto-Init] Generating time slots...");
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

      // Insert in batches
      for (let i = 0; i < slots.length; i += 100) {
        const batch = slots.slice(i, i + 100);
        await db.insert(timeSlots).values(batch);
      }

      console.log(`[Auto-Init] ✅ Generated ${slots.length} time slots`);
    }

    await connection.end();
    initialized = true;
    console.log("[Auto-Init] ✅ Database initialization complete");
  } catch (error) {
    console.error("[Auto-Init] Error:", error);
    // Don't throw - let the app continue even if init fails
  }
}
