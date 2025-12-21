import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { admins, timeSlots } from "../../drizzle/schema";
import { ENV } from "./env";
import { createTables } from "./create-tables";
import bcrypt from "bcryptjs";

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
      
      // Hash passwords before storing
      const hashedPassword = await bcrypt.hash("Admin2024!", 10);
      
      await db.insert(admins).values([
        {
          email: "iwm@admin.com",
          password: hashedPassword,
          name: "IWM Admin",
          location: "IWM",
        },
        {
          email: "saarland@admin.com",
          password: hashedPassword,
          name: "Saarland Admin",
          location: "Saarland",
        },
      ]);
      console.log("[Auto-Init] ✅ Admin accounts created with hashed passwords");
    }

    // Check if time slots exist
    const existingSlots = await db.select().from(timeSlots).limit(1);
    
    if (existingSlots.length === 0) {
      console.log("[Auto-Init] Generating time slots...");
      const slots = [];
      
      // Helper function to check if a date is a weekday (Monday-Friday)
      const isWeekday = (date: Date) => {
        const day = date.getDay();
        return day >= 1 && day <= 5; // 1=Monday, 5=Friday
      };
      
      // Generate Saarland slots: Jan 19 - Feb 27, 2026, workdays only, 2-7 PM
      const saarlandStart = new Date("2026-01-19");
      const saarlandEnd = new Date("2026-02-27");
      const saarlandTimeRanges = [
        { start: "14:00", end: "15:00" }, // 2-3 PM
        { start: "15:00", end: "16:00" }, // 3-4 PM
        { start: "16:00", end: "17:00" }, // 4-5 PM
        { start: "17:00", end: "18:00" }, // 5-6 PM
        { start: "18:00", end: "19:00" }, // 6-7 PM
      ];

      for (let d = new Date(saarlandStart); d <= saarlandEnd; d.setDate(d.getDate() + 1)) {
        // Skip weekends for Saarland
        if (!isWeekday(d)) continue;
        
        for (const timeRange of saarlandTimeRanges) {
          const slotDate = new Date(d);
          const [startHour, startMinute] = timeRange.start.split(":").map(Number);
          const [endHour, endMinute] = timeRange.end.split(":").map(Number);
          
          const startTime = new Date(slotDate);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          const endTime = new Date(slotDate);
          endTime.setHours(endHour, endMinute, 0, 0);

          slots.push({
            location: "Saarland",
            startTime,
            endTime,
            maxBookings: 1,
            currentBookings: 0,
            title: `Saarland - ${timeRange.start}`,
            description: null,
            isActive: 1,
            createdBy: 1,
          });
        }
      }
      
      // Generate IWM slots: Keep original schedule (Nov 30, 2025 - Jan 15, 2026, all days, 9 AM - 7 PM)
      const iwmStart = new Date("2025-11-30");
      const iwmEnd = new Date("2026-01-15");
      const iwmTimeRanges = [
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

      for (let d = new Date(iwmStart); d <= iwmEnd; d.setDate(d.getDate() + 1)) {
        for (const timeRange of iwmTimeRanges) {
          const slotDate = new Date(d);
          const [startHour, startMinute] = timeRange.start.split(":").map(Number);
          const [endHour, endMinute] = timeRange.end.split(":").map(Number);
          
          const startTime = new Date(slotDate);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          const endTime = new Date(slotDate);
          endTime.setHours(endHour, endMinute, 0, 0);

          slots.push({
            location: "IWM",
            startTime,
            endTime,
            maxBookings: 1,
            currentBookings: 0,
            title: `IWM - ${timeRange.start}`,
            description: null,
            isActive: 1,
            createdBy: 1,
          });
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
