import { describe, expect, it, vi } from "vitest";
import { sendBookingNotifications } from "./notifications";
import type { TimeSlot } from "../drizzle/schema";

describe("sendBookingNotifications", () => {
  it("sends notifications for IWM location booking", async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    const slot: TimeSlot = {
      id: 1,
      title: "Test Slot",
      description: "Test",
      location: "IWM",
      startTime: new Date("2025-12-01T09:00:00"),
      endTime: new Date("2025-12-01T10:00:00"),
      maxBookings: 1,
      currentBookings: 0,
      isActive: 1,
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const booking = {
      parentName: "John Doe",
      childName: "Jane Doe",
      childAge: 8,
      userEmail: "john@example.com",
      userPhone: "+1234567890",
      notes: "Test booking",
    };

    const result = await sendBookingNotifications({ booking, slot });

    expect(result.adminEmail).toBe("m.su@iwm-tuebingen.de");
    expect(result.participantEmail).toBe("john@example.com");
    expect(result.sent).toBe(true);
    
    // Check that emails were sent (console warnings when AWS not configured)
    expect(consoleSpy).toHaveBeenCalled();
    // Verify the function returns correct admin email
    expect(result.adminEmail).toBe("m.su@iwm-tuebingen.de");
    
    consoleSpy.mockRestore();
  });

  it("sends notifications for Saarland location booking", async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    
    const slot: TimeSlot = {
      id: 2,
      title: "Test Slot",
      description: "Test",
      location: "Saarland",
      startTime: new Date("2025-12-01T10:00:00"),
      endTime: new Date("2025-12-01T11:00:00"),
      maxBookings: 1,
      currentBookings: 0,
      isActive: 1,
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const booking = {
      parentName: "Alice Smith",
      childName: "Bob Smith",
      childAge: 7,
      userEmail: "alice@example.com",
    };

    const result = await sendBookingNotifications({ booking, slot });

    expect(result.adminEmail).toBe("wuzekun@cs.uni-saarland.de");
    expect(result.participantEmail).toBe("alice@example.com");
    expect(result.sent).toBe(true);
    
    // Check that emails were sent (console warnings when AWS not configured)
    expect(consoleSpy).toHaveBeenCalled();
    // Verify the function returns correct admin email
    expect(result.adminEmail).toBe("wuzekun@cs.uni-saarland.de");
    
    consoleSpy.mockRestore();
  });
});
