-- Delete all time slots before January 25, 2026
-- Run this SQL script directly in your database

DELETE FROM timeSlots 
WHERE startTime < '2026-01-25 00:00:00';

-- To see how many will be deleted first, run:
-- SELECT COUNT(*) FROM timeSlots WHERE startTime < '2026-01-25 00:00:00';
