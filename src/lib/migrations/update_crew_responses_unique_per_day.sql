-- Update crew_responses table to enforce one entry per user per day
-- This migration adds updated_at column and unique constraint

-- Add updated_at column if it doesn't exist
ALTER TABLE crew_responses 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crew_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_crew_responses_updated_at_trigger ON crew_responses;
CREATE TRIGGER update_crew_responses_updated_at_trigger
    BEFORE UPDATE ON crew_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_crew_responses_updated_at();

-- Add unique constraint on user_uid and date (using DATE function on created_at)
-- First, we need to ensure no duplicates exist for the same user on the same day
-- This will keep only the most recent entry per user per day
DELETE FROM crew_responses a USING (
    SELECT user_uid, DATE(created_at) as response_date, MAX(id) as max_id
    FROM crew_responses
    GROUP BY user_uid, DATE(created_at)
    HAVING COUNT(*) > 1
) b
WHERE a.user_uid = b.user_uid 
  AND DATE(a.created_at) = b.response_date 
  AND a.id < b.max_id;

-- Create a unique index on user_uid and date part of created_at
-- This ensures only one entry per user per day
DROP INDEX IF EXISTS idx_crew_responses_user_date_unique;
CREATE UNIQUE INDEX idx_crew_responses_user_date_unique 
ON crew_responses (user_uid, DATE(created_at));

