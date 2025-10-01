-- Migration: Add username and avatar columns to user_activity table
-- Run this in your Supabase SQL Editor

ALTER TABLE user_activity
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Optional: Add index on username for faster searches
CREATE INDEX IF NOT EXISTS idx_user_activity_username ON user_activity(username);
