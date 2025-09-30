# Debug User Activity Tracking

I've added extensive debugging to help identify why the user activity tracking isn't working. Here's what to do:

## 🔧 Changes Made

1. **Enhanced logging** - Added detailed console logs with emojis to trace execution
2. **Fixed data type** - Changed user_id from BIGINT to TEXT in schema (Discord IDs can be very large)
3. **Added test function** - You can manually test the table connection

## 🧪 Testing Steps

### 1. Update Your Database Schema
Run this updated SQL in your Supabase dashboard:

```sql
-- Drop the old table if it exists with wrong data type
DROP TABLE IF EXISTS user_activity;

-- Create the corrected table
CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE, -- Discord user ID as text
    last_online TIMESTAMPTZ DEFAULT NOW(),
    online BOOLEAN DEFAULT FALSE,
    completed_levels INTEGER[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_online ON user_activity(online);
CREATE INDEX idx_user_activity_last_online ON user_activity(last_online);

-- Recreate the update trigger
CREATE OR REPLACE FUNCTION update_user_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_user_activity_updated_at
    BEFORE UPDATE ON user_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_user_activity_updated_at();
```

### 2. Test the Connection
After deploying the changes, open your browser console and run:

```javascript
// Import the test function
import { supabaseOperations } from './src/lib/supabase.js';

// Test if the table exists and is accessible
await supabaseOperations.testUserActivityTable();
```

### 3. Watch Console Logs
When you log in, you should see these logs:

- 🚀 **New user login** or 🔄 **Returning user** detected
- 🔄 **updateUserActivity called** with your Discord user ID
- 📊 **Attempting to upsert** user activity data
- ✅ **User activity updated successfully** (if it works)
- ❌ **Error details** (if it fails)

## 🔍 Common Issues to Check

### Issue 1: Table Doesn't Exist
**Look for:** "relation 'user_activity' does not exist"
**Fix:** Run the updated SQL schema above

### Issue 2: Permission Error
**Look for:** "permission denied" or RLS errors
**Fix:** Make sure your table has the right permissions, or disable RLS for testing:
```sql
ALTER TABLE user_activity DISABLE ROW LEVEL SECURITY;
```

### Issue 3: Data Type Mismatch
**Look for:** Type conversion errors
**Fix:** The updated schema uses TEXT for user_id instead of BIGINT

### Issue 4: Supabase Not Configured
**Look for:** "⚠️ Supabase not configured"
**Check:** Your environment variables are set correctly

## 🐛 Manual Testing

You can also manually test by running this in the browser console:

```javascript
// Test with a fake user ID
await supabaseOperations.updateUserActivity('123456789', { test: true });
```

## 📋 What the Logs Should Show

Successful execution should look like:
```
🚀 New user login detected, updating activity for user: 1234567890
🔄 updateUserActivity called with userId: 1234567890 activityData: {}
📊 Attempting to upsert user activity data: {user_id: "1234567890", last_online: "2025-01-15T...", online: true}
✅ User activity updated successfully: [{id: 1, user_id: "1234567890", ...}]
```

Failed execution will show detailed error information including the specific database error.