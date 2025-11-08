-- Add is_queued column to journal_entries table
-- This column tracks whether a journal entry is currently queued/being processed by both-crews API

ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS is_queued BOOLEAN DEFAULT FALSE;

-- Create an index for efficient lookups of queued entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_is_queued ON journal_entries(is_queued);

-- Add a comment to document the column
COMMENT ON COLUMN journal_entries.is_queued IS 'Indicates if the entry is currently queued or being processed by both-crews API. Set to TRUE when processing starts, FALSE when processing completes or fails.';

