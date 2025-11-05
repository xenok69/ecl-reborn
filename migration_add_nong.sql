-- Migration: Add NONG (Not on Newgrounds) column to levels and level_submissions tables
-- This column stores links to songs that aren't available on Newgrounds
-- Run this migration in your Supabase SQL editor

-- Add nong column to levels table (nullable, for storing song links)
ALTER TABLE levels ADD COLUMN IF NOT EXISTS nong TEXT;

-- Add nong column to level_submissions table (nullable, for storing song links in pending submissions)
ALTER TABLE level_submissions ADD COLUMN IF NOT EXISTS nong TEXT;

-- No RLS policy changes needed - existing policies will cover the new column
