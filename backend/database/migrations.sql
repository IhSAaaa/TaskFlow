-- TaskFlow Database Migrations
-- This file contains database migrations for schema updates

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW(),
    description TEXT
);

-- Migration 001: Add missing columns to users table
DO $$ 
BEGIN
    -- Add refresh_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'refresh_token') THEN
        ALTER TABLE users ADD COLUMN refresh_token TEXT;
    END IF;

    -- Add reset_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'reset_token') THEN
        ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
    END IF;

    -- Add reset_token_expiry column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'reset_token_expiry') THEN
        ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
    END IF;

    -- Add role column if it doesn't exist (for backward compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    END IF;

    -- Update existing users to have default role
    UPDATE users SET role = 'user' WHERE role IS NULL;

    -- Ensure all users have username (generate from email if missing)
    UPDATE users 
    SET username = COALESCE(username, SPLIT_PART(email, '@', 1))
    WHERE username IS NULL OR username = '';

    -- Add unique constraint on username if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'users_username_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;

END $$;

-- Migration 002: Add indexes for better performance
DO $$
BEGIN
    -- Add index on refresh_token if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_refresh_token') THEN
        CREATE INDEX idx_users_refresh_token ON users(refresh_token);
    END IF;

    -- Add index on reset_token if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_reset_token') THEN
        CREATE INDEX idx_users_reset_token ON users(reset_token);
    END IF;

    -- Add index on role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role') THEN
        CREATE INDEX idx_users_role ON users(role);
    END IF;

END $$;

-- Migration 003: Update existing data to ensure consistency
DO $$
BEGIN
    -- Ensure all users have proper status
    UPDATE users SET status = 'active' WHERE status IS NULL;
    
    -- Ensure all users have proper timezone
    UPDATE users SET timezone = 'UTC' WHERE timezone IS NULL;
    
    -- Ensure all users have proper language
    UPDATE users SET language = 'en' WHERE language IS NULL;

END $$;

-- Log migration completion
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('001_002_003', NOW())
ON CONFLICT (version) DO NOTHING; 