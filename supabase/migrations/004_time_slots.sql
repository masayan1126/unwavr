-- Add timeSlots column to tasks table for calendar time scheduling
-- timeSlots stores array of time slots: [{date: number, startTime: "HH:MM", endTime: "HH:MM"}]

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "timeSlots" JSONB DEFAULT '[]';

-- Create GIN index for efficient querying of timeSlots
CREATE INDEX IF NOT EXISTS idx_tasks_time_slots ON tasks USING GIN ("timeSlots");

COMMENT ON COLUMN tasks."timeSlots" IS 'Array of time slots for calendar scheduling: [{date: UTC timestamp, startTime: "HH:MM", endTime: "HH:MM"}]';
