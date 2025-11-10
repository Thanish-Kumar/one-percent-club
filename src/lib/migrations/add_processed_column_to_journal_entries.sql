-- Add is_processed_for_solutions column to journal_entries table
-- This column tracks whether a journal entry has been processed for solutions API

ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS is_processed_for_solutions BOOLEAN DEFAULT FALSE;

-- Create index for querying unprocessed entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_processed 
ON journal_entries(is_processed_for_solutions, entry_date);

-- Add comment to explain the column
COMMENT ON COLUMN journal_entries.is_processed_for_solutions IS 
'Indicates if this journal entry has been processed and sent to the both-crews API';



