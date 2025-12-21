import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Time slot management (admin only)
  timeSlots: router({
    // Admin procedures
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        location: z.string().min(1),
        startTime: z.number(),
        endTime: z.number(),
        maxBookings: z.number().min(1).default(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const result = await db.createTimeSlot({
          ...input,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        location: z.string().min(1).optional(),
        startTime: z.number().optional(),
        endTime: z.number().optional(),
        maxBookings: z.number().min(1).optional(),
        isActive: z.number().min(0).max(1).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const { id, ...updates } = input;
        const updateData: any = { ...updates };
        if (updates.startTime) updateData.startTime = new Date(updates.startTime);
        if (updates.endTime) updateData.endTime = new Date(updates.endTime);
        await db.updateTimeSlot(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        await db.deleteTimeSlot(input.id);
        return { success: true };
      }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      // Get admin's location from the admins table
      const adminEmail = ctx.user.email;
      if (!adminEmail) {
        return db.getAllTimeSlots();
      }
      
      const admin = await db.getAdminByEmail(adminEmail);
      if (!admin || !admin.location) {
        // If no location specified, show all slots
        return db.getAllTimeSlots();
      }
      
      // Filter slots by admin's location
      const allSlots = await db.getAllTimeSlots();
      return allSlots.filter(slot => slot.location === admin.location);
    }),

    // Public procedures
    listActive: publicProcedure
      .input(z.object({ location: z.string().optional() }).optional())
      .query(({ input }) => {
        if (input?.location) {
          return db.getActiveTimeSlotsByLocation(input.location);
        }
        return db.getActiveTimeSlots();
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getTimeSlotById(input.id)),
  }),

  // Booking management
  bookings: router({
    create: publicProcedure
      .input(z.object({
        timeSlotIds: z.array(z.number()).min(1).max(3), // Up to 3 slots
        parentName: z.string().min(1),
        childName: z.string().min(1),
        childAge: z.number().min(1).max(18),
        userEmail: z.string().email(),
        userPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { placeHolds, assignEarliestSlot, releaseHolds } = await import('./hold-manager');
        
        // Check if user has already made 3 bookings
        const existingBookings = await db.getBookingsByEmail(input.userEmail);
        if (existingBookings.length >= 3) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'You have reached the maximum limit of 3 bookings per person.' 
          });
        }
        
        console.log(`[Booking] User ${input.userEmail} attempting to book slots:`, input.timeSlotIds);
        
        // Step 1: Place soft-holds on all selected slots
        const holdResult = await placeHolds(input.timeSlotIds, input.userEmail);
        
        if (!holdResult.success || holdResult.heldSlots.length === 0) {
          console.log(`[Booking] No slots could be held. Failed slots:`, holdResult.failedSlots);
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'All selected time slots are no longer available. Please try selecting different slots.' 
          });
        }
        
        console.log(`[Booking] Successfully held ${holdResult.heldSlots.length} slots:`, holdResult.heldSlots);
        
        try {
          // Step 2: Assign the earliest slot and create booking
          const { slotId: assignedSlotId, slot: assignedSlot } = await assignEarliestSlot(
            holdResult.heldSlots,
            {
              parentName: input.parentName,
              childName: input.childName,
              childAge: input.childAge,
              userEmail: input.userEmail,
              userPhone: input.userPhone,
              notes: input.notes,
            }
          );
          
          console.log(`[Booking] Assigned slot ${assignedSlotId} to user ${input.userEmail}`);
          
          // Step 3: Send email notifications with the assigned slot
          try {
            const { sendBookingNotifications } = await import('./email-resend');
            await sendBookingNotifications({
              parentName: input.parentName,
              childName: input.childName,
              childAge: input.childAge,
              userEmail: input.userEmail,
              userPhone: input.userPhone,
              location: assignedSlot.location,
              slotTitle: assignedSlot.title,
              startTime: new Date(assignedSlot.startTime),
              endTime: new Date(assignedSlot.endTime),
            });
          } catch (error) {
            console.error('[Booking] Failed to send email notifications:', error);
            // Don't fail the booking if email sending fails
          }
          
          return { 
            success: true, 
            assignedSlot: {
              id: assignedSlotId,
              title: assignedSlot.title,
              location: assignedSlot.location,
              startTime: assignedSlot.startTime,
              endTime: assignedSlot.endTime,
            }
          };
        } catch (error) {
          // If assignment fails, release all holds
          console.error('[Booking] Assignment failed, releasing holds:', error);
          await releaseHolds(holdResult.heldSlots);
          throw error;
        }
      }),

    listByTimeSlot: publicProcedure
      .input(z.object({ timeSlotId: z.number() }))
      .query(({ input }) => db.getBookingsByTimeSlot(input.timeSlotId)),

    countByEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const bookings = await db.getBookingsByEmail(input.email);
        return { count: bookings.length, bookings };
      }),

    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }
      
      // Get admin's location to filter bookings
      const adminEmail = ctx.user.email;
      if (!adminEmail) {
        return db.getAllBookings();
      }
      
      const admin = await db.getAdminByEmail(adminEmail);
      if (!admin || !admin.location) {
        return db.getAllBookings();
      }
      
      // Get all bookings and filter by location through time slots
      const allBookings = await db.getAllBookings();
      const locationSlots = await db.getActiveTimeSlotsByLocation(admin.location);
      const locationSlotIds = new Set(locationSlots.map(s => s.id));
      
      return allBookings.filter(booking => locationSlotIds.has(booking.timeSlotId));
    }),

    deleteBooking: protectedProcedure
      .input(z.object({ bookingId: z.number(), timeSlotId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        
        // Get the time slot to update booking count
        const slot = await db.getTimeSlotById(input.timeSlotId);
        if (!slot) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Time slot not found' });
        }
        
        // Delete the booking
        await db.deleteBooking(input.bookingId);
        
        // Decrease the booking count
        await db.updateTimeSlot(input.timeSlotId, {
          currentBookings: Math.max(0, slot.currentBookings - 1),
        });
        
        return { success: true };
      }),

    clearByTimeSlot: protectedProcedure
      .input(z.object({ timeSlotId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        
        // Get the time slot to reset booking count
        const slot = await db.getTimeSlotById(input.timeSlotId);
        if (!slot) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Time slot not found' });
        }
        
        // Clear all bookings for this time slot
        await db.clearBookingsByTimeSlot(input.timeSlotId);
        
        // Reset the booking count to 0
        await db.updateTimeSlot(input.timeSlotId, {
          currentBookings: 0,
        });
        
        return { success: true };
      }),
  }),

  // Admin authentication (email/password)
  admin: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const bcrypt = await import('bcryptjs');
        const { sdk } = await import('./_core/sdk');
        const { getSessionCookieOptions } = await import('./_core/cookies');
        const { ONE_YEAR_MS } = await import('@shared/const');
        
        // @ts-ignore - getAdminByEmail exists but TypeScript cache is stale
        const admin = await db.getAdminByEmail(input.email);
        
        if (!admin || !admin.password) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(input.password, admin.password);
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }

        // Create or update user record for admin
        const adminOpenId = `admin-${admin.email}`;
        const adminName = admin.name || admin.email.split('@')[0] || 'Admin';
        await db.upsertUser({
          openId: adminOpenId,
          name: adminName,
          email: admin.email,
          loginMethod: 'email',
          role: 'admin',
          lastSignedIn: new Date(),
        });

        // Create session token
        const sessionToken = await sdk.createSessionToken(adminOpenId, {
          name: adminName,
          expiresInMs: ONE_YEAR_MS,
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
