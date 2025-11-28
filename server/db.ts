import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, admins, InsertAdmin, timeSlots, InsertTimeSlot, bookings, InsertBooking } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Time slot queries
export async function createTimeSlot(slot: InsertTimeSlot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(timeSlots).values(slot);
  return result;
}

export async function updateTimeSlot(id: number, updates: Partial<InsertTimeSlot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(timeSlots).set(updates).where(eq(timeSlots.id, id));
}

export async function deleteTimeSlot(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(timeSlots).where(eq(timeSlots.id, id));
}

export async function getAllTimeSlots() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeSlots).orderBy(timeSlots.startTime);
}

export async function getActiveTimeSlots() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeSlots).where(eq(timeSlots.isActive, 1)).orderBy(timeSlots.startTime);
}

export async function getActiveTimeSlotsByLocation(location: string) {
  const db = await getDb();
  if (!db) return [];
  const { and } = await import("drizzle-orm");
  return db.select().from(timeSlots).where(and(eq(timeSlots.isActive, 1), eq(timeSlots.location, location))).orderBy(timeSlots.startTime);
}

export async function getTimeSlotById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(timeSlots).where(eq(timeSlots.id, id)).limit(1);
  return result[0] || null;
}

// Booking queries
export async function createBooking(booking: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookings).values(booking);
  return result;
}

export async function getBookingsByTimeSlot(timeSlotId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.timeSlotId, timeSlotId));
}

// Admin queries
export async function getAllAdmins() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(admins);
}

export async function getAdminsByLocation(location: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(admins).where(eq(admins.location, location));
}

export async function getAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  return result[0] || null;
}

export async function createAdmin(admin: InsertAdmin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(admins).values(admin);
  return result;
}

export async function deleteAdmin(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(admins).where(eq(admins.id, id));
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(bookings.createdAt);
}

export async function clearBookingsByTimeSlot(timeSlotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bookings).where(eq(bookings.timeSlotId, timeSlotId));
}

export async function deleteBooking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bookings).where(eq(bookings.id, id));
}
