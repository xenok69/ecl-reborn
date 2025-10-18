# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ECL-Reborn is a React-based web application for the Eclipse Challenge List - a community-managed ranking of Geometry Dash's most challenging levels. Users can browse levels, submit completions, and track progress through a leaderboard system.

**Tech Stack:**
- React 19 + Vite
- React Router 7 (with loaders/actions pattern)
- Supabase (PostgreSQL database)
- Discord OAuth for authentication
- Deployed on Netlify

## Development Commands

```bash
# Development
npm run dev              # Start dev server (Vite)
npm run build            # Production build
npm run preview          # Preview production build locally
npm run lint             # Run ESLint

# Deployment
npm run deploy           # Deploy to GitHub Pages (uses gh-pages)
```

## Architecture Overview

### Authentication & Authorization

**Two-tier system:**
1. **Discord OAuth** - All users authenticate via Discord (stored in localStorage as `ecl-user`)
2. **Admin System** - Uses `src/data/moderators.json` to identify admins by Discord ID

**Implementation:**
- `AuthContext` (`src/components/AuthContext.jsx`) - Global auth state
- `useAuth` hook - Access user, isAuthenticated
- `useAdmin` hook - Check admin status via moderators.json
- Route protection via `<ProtectedRoute>` and `<AdminProtectedRoute>` wrappers

**Important:** Supabase does NOT use Supabase Auth. Discord OAuth is handled entirely client-side, so Supabase RLS policies must be permissive (security enforced via moderators.json checks).

### Database Architecture (Supabase)

**Primary Tables:**
- `levels` - Level data with placement-based ranking
- `user_activity` - User profiles, completion tracking (JSONB arrays)
- `level_submissions` - Pending submissions (levels + completions) for admin review

**Critical: Placement Management**
- Levels have a `placement` field (1, 2, 3, ..., N) that determines ranking
- Placements must ALWAYS be sequential with no gaps
- **JavaScript handles all placement logic** - see `src/lib/supabase.js`
- **DO NOT use database triggers** for placement management (causes conflicts)
- When deleting: manually shift levels up to fill gaps
- When adding: shift levels down to make room
- `autoRepairPlacements()` runs after add/update operations (but NOT delete)

### Data Flow Patterns

**1. Level Data (Read)**
```
Route Loader → levelUtils.getLevels() → supabaseOperations.getLevels() → Transform to nested structure
```

**2. Submission Workflow (Write)**
```
User submits → level_submissions table (status='pending')
→ Admin reviews in /admin/review
→ Admin approves → approveSubmission() → Adds to levels/user_activity + auto-creates verifier completion
```

**3. Enjoyment Ratings**
- Stored as JSONB array in `levels.enjoyment_ratings`
- Required field on ALL submissions (both level + completion)
- Display: Calculate average on-the-fly in components

### Key Files & Their Responsibilities

**`src/lib/supabase.js`**
- All database operations (`supabaseOperations` export)
- Placement shifting logic (add/update/delete)
- User activity tracking
- Fuzzy username matching for auto-verifier completion
- **CRITICAL:** Contains placement management - never bypass this module

**`src/lib/levelUtils.js`**
- High-level level operations (uses supabase.js internally)
- Points calculation (linear formula: 150 points @ #1 → 1 point @ #150)
- Data transformation (flat Supabase → nested structure with tags)

**`src/data/moderators.json`**
- Source of truth for admin permissions
- Structure: `[{"id": "discord_id", "role": "...", "username": "..."}]`
- Used by `useAdmin` hook

**`src/main.jsx`**
- Router configuration
- Route protection setup (ProtectedRoute, AdminProtectedRoute)

### Routing Structure

**Public Routes:**
- `/` - Home
- `/challenges/` - Main list (placements 1-100)
- `/challenges/extended` - Extended (101-150)
- `/challenges/legacy` - Legacy (151+)
- `/level/:placement` - Individual level details
- `/leaderboard/` - Player rankings
- `/about/` - About page

**Authenticated Routes:**
- `/submit-request` - Submit levels/completions for review
- `/my-submissions` - View own submission status
- `/profile/:userId` - User profiles

**Admin Routes:**
- `/submit` - Direct level add (bypasses review)
- `/edit/:id` - Edit existing levels
- `/admin/completions` - Manage user completions
- `/admin/review` - Review pending submissions

### Important Patterns

**Route Loaders vs Actions:**
- Loaders: Fetch data before route renders (e.g., `challengesLoader`)
- Actions: Handle form submissions (e.g., `submitRequestAction`)
- Both use React Router 7's data API

**User Activity Tracking:**
- Automatically updates `user_activity` table on login (username, avatar, last_online, online status)
- Completed levels stored as JSONB array: `{lvl, yt, completedAt, verifier}`
- Use `addCompletedLevel()` / `removeCompletedLevel()` - handles array manipulation

**Placement Repair Utility:**
- `src/utils/repairPlacements.js` - Diagnostic/repair tool for placement issues
- Run via browser console: `window.supabaseDebug` (exposed in App.jsx)
- Use for debugging only, not in production code

## Database Setup

Run SQL migrations in this order:
1. Main table creation (see `SUPABASE_SETUP.md`)
2. `migration_add_enjoyment.sql` - Adds enjoyment rating system
3. `drop_placement_triggers.sql` - **CRITICAL:** Removes any database triggers

**Why drop triggers?** JavaScript code in `supabase.js` handles all placement logic. Database triggers interfere and cause levels to swap unexpectedly.

## Common Gotchas

1. **Placement Swapping After Delete:**
   - Cause: Database triggers conflicting with JS code
   - Fix: Run `drop_placement_triggers.sql`, ensure `autoRepairPlacements()` NOT called in `deleteLevel()`

2. **RLS Policy Errors:**
   - Supabase RLS must allow all operations (uses Discord OAuth, not Supabase Auth)
   - Security enforced client-side via `moderators.json`

3. **Enjoyment Ratings:**
   - ALWAYS required on submissions (validate 0-10 with decimals)
   - Display "0" when no ratings exist (both cards and detail page)
   - Format: "7.5 (12)" on cards, "7.5/10 (12 ratings)" on detail page

4. **Level IDs:**
   - Level ID = Geometry Dash level ID (numeric string)
   - Not auto-generated, user-provided

5. **Auto-Verifier Completion:**
   - On level submission approval, fuzzy-matches verifier username → auto-adds completion with `verifier: true`
   - 80% similarity threshold (Levenshtein distance)
   - Skips gracefully if no match found

## Points System

Linear scaling: `points = 150 - ((placement - 1) * (149 / (maxScoringPlacement - 1)))`
- Placement 1: 150 points
- Placement 150: 1 point
- Placement > 150: 0 points (legacy)

Leaderboard ranks users by total points from completed levels.
