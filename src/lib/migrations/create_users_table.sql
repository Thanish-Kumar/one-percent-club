-- Create users table for AWS RDS PostgreSQL
-- This table stores user information synced from Firebase Auth

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    photo_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    use_case VARCHAR(50) CHECK (use_case IN ('Personal', 'Professional', 'Business')),
    goal VARCHAR(50) CHECK (goal IN ('Sustainable growth', 'Rapid growth')),
    context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_use_case CHECK (use_case IS NULL OR use_case IN ('Personal', 'Professional', 'Business')),
    CONSTRAINT chk_goal CHECK (goal IS NULL OR goal IN ('Sustainable growth', 'Rapid growth'))
);

-- Create index on uid for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

