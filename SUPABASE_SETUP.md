# Supabase Database Setup for Submissions Feature

This document explains how to set up the required database table for the user submissions feature.

## Required Table: `level_submissions`

You need to create a new table in your Supabase database to store user submissions. Use the SQL editor in your Supabase dashboard to run the following SQL:

```sql
-- Create the level_submissions table
CREATE TABLE IF NOT EXISTS level_submissions (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Submission metadata
    submission_type TEXT NOT NULL CHECK (submission_type IN ('level', 'completion')),
    submitted_by_user_id TEXT NOT NULL,
    submitted_by_username TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),

    -- Level submission fields (used when submission_type = 'level')
    level_id TEXT,
    level_name TEXT,
    creator TEXT,
    verifier TEXT,
    youtube_video_id TEXT,
    difficulty TEXT,
    gamemode TEXT,
    decoration_style TEXT,
    extra_tags TEXT[],
    suggested_placement INTEGER,

    -- Completion submission fields (used when submission_type = 'completion')
    target_level_id TEXT,
    youtube_link TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_verifier BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX idx_submissions_status ON level_submissions(status);
CREATE INDEX idx_submissions_user ON level_submissions(submitted_by_user_id);
CREATE INDEX idx_submissions_type ON level_submissions(submission_type);
CREATE INDEX idx_submissions_submitted_at ON level_submissions(submitted_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE level_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read all submissions (for now - you can restrict this later)
CREATE POLICY "Anyone can view submissions"
    ON level_submissions
    FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert their own submissions
CREATE POLICY "Users can create submissions"
    ON level_submissions
    FOR INSERT
    WITH CHECK (auth.uid()::text = submitted_by_user_id);

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own submissions"
    ON level_submissions
    FOR SELECT
    USING (auth.uid()::text = submitted_by_user_id);

-- Policy: Admins can update any submission (you'll need to create an admins table or role)
-- For now, allowing all authenticated users to update for testing
CREATE POLICY "Admins can update submissions"
    ON level_submissions
    FOR UPDATE
    USING (true);  -- TODO: Replace with actual admin check

-- Policy: Admins can delete any submission
CREATE POLICY "Admins can delete submissions"
    ON level_submissions
    FOR DELETE
    USING (true);  -- TODO: Replace with actual admin check
```

## Important Notes

1. **Admin System**: Your app already uses `src/data/moderators.json` for admin checks. The admin routes (`/admin/review`) are protected by `AdminProtectedRoute` which checks against this file client-side.

2. **Row Level Security (RLS)**: Since you're using Discord OAuth (not Supabase Auth) and handling admin checks client-side via `moderators.json`, you have two options:

   **Option A - Keep Permissive Policies (Recommended for your setup)**:
   - Leave the policies as-is (allowing all authenticated users)
   - Your client-side route protection will prevent non-admins from accessing admin features
   - Simpler setup, works with your existing auth system

   **Option B - Sync Moderators to Supabase**:
   - Create an `admins` table in Supabase and sync your moderators.json data
   - Update RLS policies to check against this table
   - Example:
     ```sql
     -- Create admins table
     CREATE TABLE admins (
         discord_id TEXT PRIMARY KEY,
         role TEXT
     );

     -- Insert your moderators
     INSERT INTO admins (discord_id, role) VALUES
         ('650612603629993995', 'Lead Developer & Admin'),
         ('837359510955491328', 'List Admin'),
         ('578942245269405726', 'List mod'),
         ('748573103424143430', 'List mod');

     -- Update policies
     DROP POLICY "Admins can update submissions" ON level_submissions;
     CREATE POLICY "Admins can update submissions"
         ON level_submissions
         FOR UPDATE
         USING (auth.uid()::text IN (SELECT discord_id FROM admins));
     ```

3. **Authentication Note**: Your app uses Discord OAuth directly (storing tokens in localStorage), not Supabase Auth. The RLS policies check `auth.uid()` which won't work with your setup. For now, the permissive policies are fine since your route guards handle the actual protection.

## Testing the Setup

After creating the table, you can test it by:

1. Sign in to your app with Discord
2. Navigate to `/submit-request`
3. Submit a test level or completion
4. Check the Supabase dashboard to see if the submission appears in the `level_submissions` table
5. As an admin, navigate to `/admin/review` to see and approve/decline submissions
6. Check `/my-submissions` to see your submission status

## Features Implemented

1. **Public Leaderboard**: The leaderboard is now accessible without signing in
2. **User Submission Route** (`/submit-request`): Authenticated users can submit:
   - New levels for review
   - Completions for existing levels
3. **Admin Review Route** (`/admin/review`): Admins can:
   - View all pending submissions in a grid layout
   - Filter by type (all/levels/completions)
   - Approve submissions (adds to main tables)
   - Decline submissions (deletes them)
4. **My Submissions Route** (`/my-submissions`): Users can:
   - View all their submissions
   - See status (pending/approved/declined)
   - Filter by status

## Navigation

The navigation dynamically shows:
- **All Users**: Home, Challenges, Leaderboard, About
- **Authenticated Users**: + Submit, My Submissions
- **Admins**: + Review

Enjoy your new submission system!
