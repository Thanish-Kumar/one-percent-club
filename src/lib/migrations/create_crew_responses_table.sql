-- Create crew_responses table for storing API responses from the crew service
-- This table stores responses for each user's crew API calls

CREATE TABLE IF NOT EXISTS crew_responses (
    id SERIAL PRIMARY KEY,
    user_uid VARCHAR(255) NOT NULL,
    request_context TEXT,
    request_goal TEXT,
    response_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    CONSTRAINT fk_user_uid FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- Create index on user_uid for fast lookups
CREATE INDEX IF NOT EXISTS idx_crew_responses_user_uid ON crew_responses(user_uid);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_crew_responses_created_at ON crew_responses(created_at DESC);

-- Create composite index for user-specific time queries
CREATE INDEX IF NOT EXISTS idx_crew_responses_user_time ON crew_responses(user_uid, created_at DESC);

