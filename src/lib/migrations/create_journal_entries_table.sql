-- Create journal_entries table for AWS RDS PostgreSQL
-- This table stores daily journal entries for users

CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    entry_date DATE NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint (assuming users table exists)
    CONSTRAINT fk_user_uid FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE,
    
    -- Ensure one entry per user per day
    CONSTRAINT unique_user_date UNIQUE (user_uid, entry_date)
);

-- Create index on user_uid for fast lookups
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_uid ON journal_entries(user_uid);

-- Create index on entry_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);

-- Create composite index for user + date lookups
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_uid, entry_date DESC);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: The update_updated_at_column function should already exist from users table migration

