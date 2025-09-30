-- User Activity Tracking Table
-- This table tracks user online status and completed levels
-- Using Discord user_id as the primary key for easier queries

-- Drop existing table if you need to recreate it
-- DROP TABLE IF EXISTS user_activity;

CREATE TABLE IF NOT EXISTS user_activity (
    user_id TEXT PRIMARY KEY, -- Discord user ID as primary key
    last_online TIMESTAMPTZ DEFAULT NOW(),
    online BOOLEAN DEFAULT FALSE,
    completed_levels INTEGER[] DEFAULT '{}', -- Array of level IDs from the levels table
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activity_online ON user_activity(online);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_online ON user_activity(last_online);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_user_activity_updated_at ON user_activity;
CREATE TRIGGER trigger_update_user_activity_updated_at
    BEFORE UPDATE ON user_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_user_activity_updated_at();

-- Disable RLS for now to allow the application to manage user activity
-- You can enable RLS later if you implement Supabase Auth
ALTER TABLE user_activity DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled but allow your app to work,
-- uncomment these policies (but you'll need to implement proper auth):
--
-- ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Allow public read access" ON user_activity
--     FOR SELECT USING (true);
--
-- CREATE POLICY "Allow public insert/update" ON user_activity
--     FOR INSERT WITH CHECK (true);
--
-- CREATE POLICY "Allow public update" ON user_activity
--     FOR UPDATE USING (true);