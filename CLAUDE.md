# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ECL-Reborn is a React-based web application for the Eclipse Challenge List - a community-managed ranking of Geometry Dash's most challenging levels. Users can browse levels, submit completions, and track progress through a leaderboard system.

**Tech Stack:**
- React 19 + Vite (build tool)
- React Router 7 (with loaders/actions pattern for data fetching)
- Supabase (PostgreSQL database via @supabase/supabase-js)
- Discord OAuth for authentication (client-side)
- Deployed on Netlify (with serverless functions in netlify/functions/)
- ESLint for linting

## Development Commands

```bash
# Development
npm run dev              # Start dev server (Vite) at http://localhost:5173
npm run build            # Production build (outputs to dist/)
npm run preview          # Preview production build locally
npm run lint             # Run ESLint

# Deployment
npm run deploy           # Build + deploy to GitHub Pages (uses gh-pages)
```

**Environment Variables** (`.env` file required):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- Discord OAuth credentials (check SubmitRequestRoute for details)

## Architecture Overview

### Authentication & Authorization

**Two-tier system:**
1. **Discord OAuth** - All users authenticate via Discord (stored in localStorage as `ecl-user`)
2. **Admin System** - Uses `src/data/moderators.json` to identify admins by Discord ID

**Implementation:**
- `AuthContext` (`src/components/AuthContext.jsx`) - Global auth state provider
- `useAuth` hook (`src/hooks/useAuth.js`) - Access user, isAuthenticated, isLoading
- `useAdmin` hook (`src/hooks/useAdmin.js`) - Check admin status via moderators.json, returns isAdmin, isCheckingAdmin
- Route protection via `<ProtectedRoute>` and `<AdminProtectedRoute>` wrappers (defined in src/main.jsx)
- User data stored in localStorage as `ecl-user` (persists across sessions)

**Important:** Supabase does NOT use Supabase Auth. Discord OAuth is handled entirely client-side, so Supabase RLS policies must be permissive (security enforced via moderators.json checks).

### Database Architecture (Supabase)

**Primary Tables:**
- `levels` - Level data with placement-based ranking
- `user_activity` - User profiles, completion tracking (JSONB arrays)
- `level_submissions` - Pending submissions (levels + completions) for admin review

**Critical: Placement Management**
- Levels have a `placement` field (1, 2, 3, ..., N) that determines ranking
- Placements must ALWAYS be sequential with no gaps
- **JavaScript handles ALL placement logic** - see `src/lib/supabase.js`
- **Database triggers MUST be removed** - run `drop_placement_triggers.sql` first
- When deleting: manually shift levels up to fill gaps, then auto-repair
- When adding: shift levels down to make room, then auto-repair
- When updating: shift affected levels, then auto-repair
- `autoRepairPlacements()` runs after EVERY operation (add/update/delete)

### Data Flow Patterns

**1. Level Data (Read)**
```
Route Loader → levelUtils.getLevels() → supabaseOperations.getLevels() → Transform to nested structure
```

**2. Submission Workflow (Write)**
```
User submits (SubmitRequestRoute) → submitRequestAction → level_submissions table (status='pending')
→ Admin reviews in /admin/review (AdminReviewRoute)
→ Admin approves → approveSubmission() → Adds to levels/user_activity + auto-creates verifier completion
→ Admin can also directly add levels via /submit (AdminSubmitRoute) - bypasses review queue
```

**3. Enjoyment Ratings**
- Stored as JSONB array in `levels.enjoyment_ratings`
- Required field on ALL submissions (both level + completion)
- Display: Calculate average on-the-fly in components

### Key Files & Their Responsibilities

**`src/lib/supabase.js`**
- All database operations (`supabaseOperations` export)
- Placement shifting logic (add/update/delete)
- Auto-repair system (`autoRepairPlacements()`) - runs after EVERY operation
- User activity tracking
- Fuzzy username matching for auto-verifier completion
- **CRITICAL:** Contains placement management - never bypass this module
- **CRITICAL:** Auto-repair now runs after add, update, AND delete operations

**`src/lib/levelUtils.js`**
- High-level level operations (uses supabase.js internally)
- Points calculation (linear formula: 150 points @ #1 → 1 point @ #150)
- Data transformation (flat Supabase → nested structure with tags)

**`src/data/moderators.json`**
- Source of truth for admin permissions
- Structure: `[{"id": "discord_id", "role": "...", "username": "..."}]`
- Used by `useAdmin` hook

**`src/main.jsx`**
- Router configuration (React Router 7)
- Route protection setup (ProtectedRoute, AdminProtectedRoute)
- Defines all loaders and actions for routes

**`src/App.jsx`**
- Root component with AuthProvider and LoadingProvider context
- Exposes `window.supabaseDebug` for debugging (direct access to supabaseOperations)

**`src/hooks/useAuth.js` & `src/hooks/useAdmin.js`**
- `useAuth` - Access global auth state (user, isAuthenticated, isLoading)
- `useAdmin` - Check admin status by cross-referencing user.id with moderators.json

### Routing Structure

**Public Routes:**
- `/` - Home (HomeRoute)
- `/signin` - Discord OAuth sign-in (SignInRoute)
- `/challenges/` - Main list, placements 1-100 (ChallengesRoute + challengesLoader)
- `/challenges/extended` - Extended, 101-150 (ChallengesRoute + challengesLoader)
- `/challenges/legacy` - Legacy, 151+ (ChallengesRoute + challengesLoader)
- `/level/:placement` - Individual level details (LevelDataRoute + levelDataLoader)
- `/leaderboard/` - Player rankings (LeaderboardRoute + leaderboardLoader)
- `/search` - Search levels (SearchRoute)
- `/about/` - About page (AboutRoute)

**Authenticated Routes** (requires Discord login via ProtectedRoute):
- `/submit-request` - Submit levels/completions for review (SubmitRequestRoute + submitRequestAction)
- `/my-submissions` - View own submission status (MySubmissionsRoute)
- `/profile/:userId` - User profiles (UserProfileRoute + userProfileLoader)

**Admin Routes** (requires admin status via AdminProtectedRoute):
- `/submit` - Direct level add, bypasses review (AdminSubmitRoute + adminSubmitAction)
- `/edit/:id` - Edit existing levels (AdminSubmitRoute + editLevelLoader + adminSubmitAction)
- `/admin/completions` - Manage user completions (AdminCompletionsRoute + adminCompletionsAction)
- `/admin/review` - Review pending submissions (AdminReviewRoute)

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
- Access via browser console: `window.supabaseDebug` (exposed in App.jsx)
- Example usage:
  ```javascript
  // Diagnose issues
  await window.supabaseDebug.diagnosePlacements()

  // Dry run (show what would be fixed)
  await window.supabaseDebug.repairPlacements(true)

  // Actually fix placements
  await window.supabaseDebug.repairPlacements(false)
  ```
- Use for debugging only, not in production code

## Database Setup

Run SQL migrations in this order:
1. Main table creation (see `SUPABASE_SETUP.md`)
2. `migration_add_enjoyment.sql` - Adds enjoyment rating system (if needed)
3. `drop_placement_triggers.sql` - **CRITICAL:** Removes ALL database triggers

**Why drop triggers?**
- JavaScript code in `supabase.js` handles ALL placement logic
- Database triggers interfere and cause levels to swap unexpectedly
- Auto-repair system (`autoRepairPlacements()`) ensures consistency after every operation
- Triggers and JavaScript logic conflict, causing race conditions and data corruption

**IMPORTANT:** If you experience unexpected level swapping, run `drop_placement_triggers.sql` immediately.

## Common Gotchas

1. **Placement Swapping or Unexpected Movement:**
   - Cause: Database triggers conflicting with JS code
   - Fix: Run `drop_placement_triggers.sql` to remove ALL triggers
   - Verify: Check browser console - should see "Auto-repair completed" messages
   - Emergency: Run `window.supabaseDebug.repairPlacements(false)` in browser console

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
