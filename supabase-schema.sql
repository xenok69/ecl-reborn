-- User Activity Tracking Table
-- This table tracks user online status and completed levels

CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- Discord user ID as text (they can be very large)
    last_online TIMESTAMPTZ DEFAULT NOW(),
    online BOOLEAN DEFAULT FALSE,
    completed_levels INTEGER[] DEFAULT '{}', -- Array of level IDs from the levels table
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
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

-- RLS (Row Level Security) policies if needed
-- ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Example policies (uncomment if you want RLS):
-- CREATE POLICY "Users can view their own activity" ON user_activity
--     FOR SELECT USING (auth.uid()::text = user_id::text);

-- CREATE POLICY "Users can update their own activity" ON user_activity
--     FOR UPDATE USING (auth.uid()::text = user_id::text);

-- CREATE POLICY "Users can insert their own activity" ON user_activity
--     FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);