# User Activity Tracking Setup

This document explains how to set up and use the user activity tracking feature in your Supabase database.

## Database Setup

### 1. Create the Table

Run the SQL schema in your Supabase dashboard's SQL editor:

```sql
-- Copy and paste the contents of supabase-schema.sql
```

The table will track:
- `user_id`: Discord user ID (BigInt)
- `last_online`: Timestamp of last activity
- `online`: Boolean indicating current online status
- `completed_levels`: Array of completed level IDs
- `created_at`/`updated_at`: Timestamps

### 2. Configure Environment Variables

Make sure your `.env` file has:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How It Works

### Automatic Tracking
The system automatically:
- ✅ Updates user activity when someone logs in
- ✅ Sets online status to `true` and updates `last_online` timestamp
- ✅ Works for both new logins and returning users with saved credentials
- ✅ Sets user offline when they explicitly sign out

### Manual Tracking
You can also manually track user activity:

```javascript
import { supabaseOperations } from './src/lib/supabase.js';

// Update user activity (sets online = true)
await supabaseOperations.updateUserActivity(userId);

// Set user offline
await supabaseOperations.setUserOffline(userId);

// Add a completed level
await supabaseOperations.addCompletedLevel(userId, levelId);

// Get user activity data
const activity = await supabaseOperations.getUserActivity(userId);
```

## Usage Examples

### Track Level Completion
```javascript
// In your level completion logic:
if (user && levelCompleted) {
  try {
    await supabaseOperations.addCompletedLevel(user.id, levelId);
  } catch (error) {
    console.warn('Could not track level completion:', error);
  }
}
```

### Display User Stats
```javascript
const activity = await supabaseOperations.getUserActivity(userId);
if (activity) {
  console.log(`User completed ${activity.completed_levels.length} levels`);
  console.log(`Last online: ${activity.last_online}`);
  console.log(`Currently online: ${activity.online}`);
}
```

## Data Structure

The `user_activity` table contains:

```typescript
interface UserActivity {
  id: number;
  user_id: string;           // Discord user ID
  last_online: string;       // ISO timestamp
  online: boolean;           // Current online status
  completed_levels: number[]; // Array of level IDs
  created_at: string;        // ISO timestamp
  updated_at: string;        // ISO timestamp (auto-updated)
}
```

## Error Handling

All operations include error handling:
- Failed database operations are logged but won't break the user experience
- Graceful fallbacks when Supabase is not configured
- Duplicate level completions are automatically prevented

## Notes

- The system uses Discord user IDs (BigInt) as the primary identifier
- User activity is updated on every login/page refresh while logged in
- The `completed_levels` array prevents duplicate entries automatically
- All timestamps use ISO format with timezone information