import * as db from './db';

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface HoldResult {
  success: boolean;
  heldSlots: number[];
  failedSlots: number[];
}

/**
 * Attempt to place holds on multiple time slots
 * Returns which slots were successfully held
 */
export async function placeHolds(slotIds: number[], userEmail: string): Promise<HoldResult> {
  const heldSlots: number[] = [];
  const failedSlots: number[] = [];
  const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS);

  for (const slotId of slotIds) {
    try {
      // Get current slot state
      const slot = await db.getTimeSlotById(slotId);
      
      if (!slot) {
        failedSlots.push(slotId);
        continue;
      }

      // Check if slot is available (not booked and not held by someone else)
      const isAvailable = await isSlotAvailable(slot);
      
      if (!isAvailable) {
        failedSlots.push(slotId);
        continue;
      }

      // Place hold
      await db.updateTimeSlot(slotId, {
        holdBy: userEmail,
        holdExpiresAt,
      });

      heldSlots.push(slotId);
    } catch (error) {
      console.error(`[Hold] Failed to hold slot ${slotId}:`, error);
      failedSlots.push(slotId);
    }
  }

  return {
    success: heldSlots.length > 0,
    heldSlots,
    failedSlots,
  };
}

/**
 * Check if a slot is available (not booked and hold expired or not held)
 */
async function isSlotAvailable(slot: any): Promise<boolean> {
  // Check if fully booked
  if (slot.currentBookings >= slot.maxBookings) {
    return false;
  }

  // Check if not active
  if (slot.isActive !== 1) {
    return false;
  }

  // Check if held by someone else
  if (slot.holdBy && slot.holdExpiresAt) {
    const now = new Date();
    const expiresAt = new Date(slot.holdExpiresAt);
    
    // If hold hasn't expired yet, slot is not available
    if (expiresAt > now) {
      return false;
    }
  }

  return true;
}

/**
 * Release holds on slots
 */
export async function releaseHolds(slotIds: number[]): Promise<void> {
  for (const slotId of slotIds) {
    try {
      await db.updateTimeSlot(slotId, {
        holdBy: null,
        holdExpiresAt: null,
      });
    } catch (error) {
      console.error(`[Hold] Failed to release hold on slot ${slotId}:`, error);
    }
  }
}

/**
 * Select the earliest slot from held slots and book it
 * Returns the booked slot ID
 */
export async function assignEarliestSlot(
  heldSlotIds: number[],
  bookingData: any
): Promise<{ slotId: number; slot: any }> {
  // Get all held slots
  const slots = await Promise.all(
    heldSlotIds.map(id => db.getTimeSlotById(id))
  );

  // Filter out null slots and sort by startTime
  const validSlots = slots
    .filter(slot => slot !== null)
    .sort((a, b) => {
      const timeA = new Date(a!.startTime).getTime();
      const timeB = new Date(b!.startTime).getTime();
      return timeA - timeB;
    });

  if (validSlots.length === 0) {
    throw new Error('No valid slots to assign');
  }

  // Select the earliest slot
  const selectedSlot = validSlots[0]!;

  // Create the booking
  await db.createBooking({
    ...bookingData,
    timeSlotId: selectedSlot.id,
  });

  // Update slot booking count and release hold
  await db.updateTimeSlot(selectedSlot.id, {
    currentBookings: selectedSlot.currentBookings + 1,
    holdBy: null,
    holdExpiresAt: null,
  });

  // Release holds on other slots
  const otherSlotIds = heldSlotIds.filter(id => id !== selectedSlot.id);
  await releaseHolds(otherSlotIds);

  return {
    slotId: selectedSlot.id,
    slot: selectedSlot,
  };
}

/**
 * Clean up expired holds (can be called periodically)
 */
export async function cleanupExpiredHolds(): Promise<void> {
  // This would require a query to find all slots with expired holds
  // For now, expired holds are checked on-demand in isSlotAvailable
  console.log('[Hold] Cleanup expired holds - handled on-demand');
}
