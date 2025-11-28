import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("timeSlots procedures", () => {
  it("allows admin to create time slot", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const startTime = new Date("2025-12-01T10:00:00").getTime();
    const endTime = new Date("2025-12-01T11:00:00").getTime();

    const result = await caller.timeSlots.create({
      title: "Full Slot",
      description: "Fully booked slot",
      location: "IWM",
      startTime,
      endTime,
      maxBookings: 1,
    });
    expect(result).toEqual({ success: true });
  });

  it("prevents non-admin from creating time slot", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const startTime = new Date("2025-12-01T10:00:00").getTime();
    const endTime = new Date("2025-12-01T11:00:00").getTime();

    await expect(
      caller.timeSlots.create({
        title: "Test Meeting",
        description: "Test description",
        startTime,
        endTime,
        maxBookings: 5,
      })
    ).rejects.toThrow();
  });

  it("allows public access to list active time slots", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.timeSlots.listActive();

    expect(Array.isArray(result)).toBe(true);
  });

  it("allows admin to list all time slots", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.timeSlots.listAll();

    expect(Array.isArray(result)).toBe(true);
  });

  it("prevents non-admin from listing all time slots", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.timeSlots.listAll()).rejects.toThrow();
  });
});

describe("bookings procedures", () => {
  it("allows public to create booking", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First create a time slot as admin
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    const startTime = new Date("2025-12-15T14:00:00").getTime();
    const endTime = new Date("2025-12-15T15:00:00").getTime();

    await adminCaller.timeSlots.create({
      title: "Booking Test Slot",
      description: "Test slot for booking",
      location: "Saarland",
      startTime,
      endTime,
      maxBookings: 3,
    });

    // Get the created slot
    const slots = await caller.timeSlots.listActive();
    const testSlot = slots.find((s) => s.title === "Booking Test Slot");

    if (testSlot) {
      const result = await caller.bookings.create({
        timeSlotId: testSlot.id,
        parentName: "John Doe",
        childName: "Jane Doe",
        childAge: 8,
        userEmail: "test@example.com",
        userPhone: "+1234567890",
        notes: "Test booking",
      });

      expect(result).toEqual({ success: true });
    }
  });

  it("allows admin to list all bookings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.listAll();

    expect(Array.isArray(result)).toBe(true);
  });

  it("prevents non-admin from listing all bookings", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.bookings.listAll()).rejects.toThrow();
  });
});
