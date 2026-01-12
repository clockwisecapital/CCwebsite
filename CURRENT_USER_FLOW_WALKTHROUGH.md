# Current User Flow Walkthrough

**Branch:** `scenario-testing`  
**Status:** Authentication + Scenario Testing UI Merged  
**Last Updated:** January 2026

---

## Overview

This document walks through the complete user journey with both authentication and scenario testing features merged. Each flow shows what the user sees, what happens in the backend, and where authentication gates exist.

---

## Flow 1: Anonymous User - First Time Visitor

### Entry Points
User can arrive via:
- Landing page (`/scenario-testing-lab`)
- Direct to Kronos (`/kronos`)
- Direct to scenarios (`/scenario-testing/questions`)

---

### Path A: Landing Page → Kronos → Scenario Testing

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Landing Page (/scenario-testing-lab)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User sees:                                                     │
│  - Hero section "What Time Is It?"                            │
│  - Statistics cards (47+ cycles, 1000+ scenarios)             │
│  - Portfolio comparison preview                                │
│  - Two CTA buttons                                             │
│                                                                 │
│  Actions available:                                            │
│  [Explore Questions] → Goes to /scenario-testing/questions    │
│  [Test My Portfolio] → Goes to /kronos                        │
│                                                                 │
│  Backend:                                                      │
│  - No auth check                                               │
│  - Static page                                                 │
│  - No API calls                                                │
│                                                                 │
│  Auth State: user = null ❌                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  User clicks [Test My Portfolio]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Kronos Intake Tab (/kronos)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User sees:                                                     │
│  - Tab navigation: [1 Intake] [2 Review] [3 Analysis] [4 Scenarios] │
│  - Intake form (3 tabs inactive/grayed out)                    │
│                                                                 │
│  User fills out:                                               │
│  1. Personal Info:                                             │
│     - First Name: "John"                                       │
│     - Last Name: "Doe"                                         │
│     - Email: "john@example.com"                                │
│     - Age: 35                                                  │
│     - Risk Tolerance: Medium                                   │
│                                                                 │
│  2. Financial Goals:                                           │
│     - Goal Amount: $500,000                                    │
│     - Time Horizon: 10 years                                   │
│     - Monthly Contribution: $1,000                             │
│                                                                 │
│  3. Portfolio:                                                 │
│     - Total Value: $100,000                                    │
│     - Stocks: 60%                                              │
│     - Bonds: 30%                                               │
│     - Cash: 10%                                                │
│                                                                 │
│  [Submit for Analysis] button                                  │
│                                                                 │
│  Backend:                                                      │
│  - Form validation only                                        │
│  - No database writes yet                                      │
│  - Email stored in component state                             │
│                                                                 │
│  Auth State: user = null ❌                                    │
│  Email captured: "john@example.com" ✅                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  User clicks [Submit for Analysis]
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Analysis Processing (Loading State)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User sees:                                                     │
│  - Loading spinner                                             │
│  - "Analyzing your portfolio..."                               │
│  - Progress indicators                                         │
│                                                                 │
│  Backend Processing:                                           │
│  Phase 1 (Fast - ~5 seconds):                                 │
│    POST /api/portfolio/analyze-dashboard                      │
│    POST /api/portfolio/analyze-goal                           │
│    → Returns: Portfolio comparison + Goal analysis            │
│                                                                 │
│  Phase 2 (Slow - ~60-90 seconds):                            │
│    POST /api/portfolio/analyze-cycles                         │
│    → Returns: 6 market cycle analyses                         │
│                                                                 │
│  Database:                                                     │
│  - Creates conversation record (anonymous)                     │
│  - Stores: intake data, analysis results                      │
│  - conversation_id generated                                   │
│                                                                 │
│  Auth State: user = null ❌                                    │
│  Conversation: TEMP-xxx (anonymous) ⚠️                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  Analysis Phase 1 completes
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Review Tab - Analysis Results                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User sees:                                                     │
│  - Tab automatically switches to [2 Review]                   │
│  - Three analysis tabs: [Goal] [Portfolio] [Market]          │
│  - Goal tab shown first (already complete)                    │
│  - Market tab shows "Loading..." (Phase 2 in progress)        │
│                                                                 │
│  Goal Tab Content:                                             │
│  - Probability of reaching goal: 68%                          │
│  - Projected value carousel                                    │
│  - Monte Carlo simulation results                             │
│                                                                 │
│  Portfolio Tab Content:                                        │
│  - Side-by-side comparison:                                    │
│    * Your Portfolio vs TIME Portfolio                          │
│    * Expected returns, upside, downside                        │
│    * Top 5 positions                                           │
│  - "Match me with advisor" CTA                                │
│                                                                 │
│  Market Tab Status:                                            │
│  - Shows loading spinner                                       │
│  - "Analyzing 6 market cycles..." (60-90 seconds)            │
│                                                                 │
│  Backend:                                                      │
│  - Cycles API still processing in background                   │
│  - Video generation initiated                                  │
│                                                                 │
│  Auth State: user = null ❌                                    │
│  Data exists but NOT saved to user account ⚠️                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  Wait 2 seconds after analysis complete
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: CreatePasswordModal Appears 🔑                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Modal overlays screen with:                                   │
│  ┌───────────────────────────────────────────────────┐        │
│  │  🔒 Secure Your Analysis Results                  │        │
│  │                                                    │        │
│  │  Email: john@example.com (pre-filled, locked)    │        │
│  │                                                    │        │
│  │  Create Password: [____________]                  │        │
│  │  👁️ Show password toggle                          │        │
│  │                                                    │        │
│  │  Requirements:                                     │        │
│  │  ✓ At least 8 characters                         │        │
│  │  ✓ One uppercase letter                          │        │
│  │  ✓ One lowercase letter                          │        │
│  │  ✓ One number                                     │        │
│  │                                                    │        │
│  │  [Create Account & Save Results]                 │        │
│  │  [Skip for now]                                   │        │
│  └───────────────────────────────────────────────────┘        │
│                                                                 │
│  Why this appears:                                             │
│  - 2 seconds after analysis completes                         │
│  - Only shows if user NOT authenticated                       │
│  - Purpose: Convert anonymous → authenticated user            │
│                                                                 │
│  User Options:                                                 │
│  1. Create account → Go to Step 6A                           │
│  2. Skip → Go to Step 6B                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 6A: User Creates Account ✅

```
┌─────────────────────────────────────────────────────────────────┐
│ User enters password: "MyPassword123"                          │
│ Clicks [Create Account & Save Results]                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Backend Process:                                              │
│  1. POST /api/auth/signup (via Supabase)                      │
│     - Creates auth.users record                                │
│     - Returns user session + JWT token                         │
│                                                                 │
│  2. Trigger: handle_new_user()                                │
│     - Auto-creates public.users record                         │
│     - Links to auth.users.id                                   │
│                                                                 │
│  3. POST /api/portfolios/save                                 │
│     {                                                          │
│       user_id: "new-user-uuid",                               │
│       conversation_id: "conversation-uuid",                    │
│       intake_data: { age: 35, ... },                          │
│       portfolio_data: { stocks: 60, ... },                    │
│       analysis_results: { ... },                              │
│       portfolio_score: 72,                                     │
│       goal_probability: 0.68,                                  │
│       is_public: false                                         │
│     }                                                          │
│                                                                 │
│  4. Database Updates:                                          │
│     - portfolios table: New record created                     │
│     - conversations table: Updated with user_email             │
│     - users table: last_login timestamp updated                │
│                                                                 │
│  Result:                                                       │
│  ✅ User authenticated                                         │
│  ✅ Portfolio saved                                            │
│  ✅ Session established                                        │
│  ✅ JWT token stored (httpOnly cookie)                        │
│                                                                 │
│  User sees:                                                    │
│  - Modal closes                                                │
│  - Success message: "Account created! Results saved."         │
│  - Header updates to show "Sign Out" button                   │
│                                                                 │
│  Auth State: user = { id, email, ... } ✅                     │
│  Portfolio: Saved to database ✅                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 6B: User Skips Account Creation ⏭️

```
┌─────────────────────────────────────────────────────────────────┐
│ User clicks [Skip for now]                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What happens:                                                 │
│  - Modal closes                                                │
│  - User continues viewing results                              │
│  - No database save to portfolios table                       │
│  - Conversation exists but not linked to user account         │
│                                                                 │
│  Limitations:                                                  │
│  ❌ Cannot access results later                                │
│  ❌ Cannot appear on leaderboards                              │
│  ❌ Cannot save to scenario tests                              │
│  ❌ Results lost if page refreshed/closed                      │
│                                                                 │
│  User can still:                                               │
│  ✅ View current results                                       │
│  ✅ Click "Sign In" in header to authenticate later           │
│  ✅ Navigate to scenarios (but can't save tests)              │
│                                                                 │
│  Auth State: user = null ❌                                    │
│  Portfolio: NOT saved (ephemeral) ⚠️                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 7: User Explores Scenario Testing

```
┌─────────────────────────────────────────────────────────────────┐
│ OPTION 1: Via Kronos Dashboard Tab                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks tab [4 Scenarios] in Kronos                      │
│                                                                 │
│  Sees:                                                         │
│  - Scenario Testing Lab header                                 │
│  - "Test your portfolio against real-world scenarios"         │
│  - Top 3 scenario questions preview                           │
│  - [Explore All Scenarios] button                             │
│                                                                 │
│  Can click:                                                    │
│  - Any question card → Goes to portfolios page                │
│  - [Explore All Scenarios] → Goes to /scenario-testing/questions │
│                                                                 │
│  Auth Gate: None (can view everything)                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                            OR
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ OPTION 2: Direct to Scenarios Page                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Navigate to: /scenario-testing/questions                     │
│                                                                 │
│  User sees:                                                    │
│  - "Explore Portfolio Testing" header                         │
│  - Tab navigation: [Top Questions ✓] [Top Portfolios]        │
│  - Dropdown: "Select New Question to Test"                    │
│  - Ranked list of 5 scenario questions:                       │
│                                                                │
│    1. Late Cycle - "Prepared for late stage cycle?"          │
│       ↑ 15% • 24w • 5,102 investors                          │
│       Winner: Fortress Defense (89) →                         │
│                                                                │
│    2. AI Supercycle - "Is AI bubble or supercycle?"          │
│       ↑ 18% • 16w • 6,210 investors                          │
│       Winner: Anti-Mag7 (72) →                               │
│                                                                │
│    [... 3 more questions ...]                                 │
│                                                                │
│  - [Submit Portfolio] button at bottom                        │
│                                                                │
│  Actions:                                                      │
│  - Click any question → View top portfolios                   │
│  - Click dropdown → Quick navigation                          │
│  - Click [Submit Portfolio] → Go to /kronos                  │
│                                                                │
│  Backend:                                                      │
│  - Currently: Static mock data                                │
│  - Future: GET /api/scenarios/list                           │
│                                                                │
│  Auth Gate: None (public viewing) ✅                          │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  Click "Late Cycle" question
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Top Portfolios for Scenario                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  URL: /scenario-testing/late-cycle                            │
│                                                                 │
│  User sees:                                                    │
│  - [← Back to Questions]                                      │
│  - Collapsible scenario header:                               │
│    🕐 Late Cycle                                              │
│    2006-2008 • Pre-GFC Late Cycle                            │
│                                                                │
│  - "Top Portfolios in 'Late Cycle'"                          │
│  - "12-mo return estimates • historical analog"              │
│  - Ranked portfolio leaderboard:                              │
│                                                                │
│    1. 🛡️ Fortress Defense                                    │
│       Top Defender • 12w streak                               │
│       ↑ 1,124  5.2%  12-mo est.  score 89 →                 │
│                                                                │
│    2. 🌙 Sleep Well Tonight                                   │
│       Steady Hand • 15w streak                                │
│       ↑ 1,042  5.6%  12-mo est.  score 86 →                 │
│                                                                │
│    [... 3 more portfolios ...]                                │
│                                                                │
│  - [Submit Portfolio] button                                   │
│                                                                │
│  Actions:                                                      │
│  - Click portfolio → Goes to /kronos (future: comparison)    │
│  - Click [Submit Portfolio] → Goes to /kronos                │
│                                                                │
│  Backend:                                                      │
│  - Currently: Static mock data                                │
│  - Future: GET /api/scenarios/late-cycle/leaderboard         │
│                                                                │
│  Auth Gate: None (viewing) ✅                                 │
│  Auth Required: To submit/save test ❌                        │
│                                                                │
│  IF AUTHENTICATED:                                             │
│  - Shows user's rank: "Your Rank: #12" 🏆                    │
│  - Shows "Test Again" option                                  │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 2: Returning User - Already Has Account

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Arrives at Site                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User navigates to any page                                    │
│                                                                 │
│  AuthContext checks:                                           │
│  - Reads httpOnly cookie                                       │
│  - Finds existing session                                      │
│  - Validates JWT token                                         │
│  - Fetches user profile                                        │
│                                                                 │
│  Result:                                                       │
│  ✅ user = { id, email, first_name, last_name, ... }          │
│  ✅ session = { access_token, refresh_token, ... }            │
│                                                                 │
│  Header shows:                                                 │
│  - "John Doe" (if name exists)                                │
│  - [Sign Out] button                                          │
│  - No [Sign In] button                                        │
│                                                                 │
│  Auth State: AUTHENTICATED ✅                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                User wants to test new portfolio
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Kronos Intake (Authenticated User)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Same as anonymous user but:                                   │
│  - Email field auto-filled from user.email                     │
│  - Name fields auto-filled if previously provided              │
│                                                                 │
│  User completes intake form and submits                        │
│                                                                 │
│  Auth State: user = {...} ✅                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Analysis Completes (Authenticated)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Results displayed in Review tab                               │
│                                                                 │
│  KEY DIFFERENCE:                                               │
│  ❌ CreatePasswordModal does NOT appear                       │
│     (user already authenticated)                               │
│                                                                 │
│  ✅ Portfolio automatically saved:                             │
│     POST /api/portfolios/save                                 │
│     - Linked to user_id                                       │
│     - Stored in database                                       │
│     - Available in user's history                             │
│                                                                 │
│  User sees:                                                    │
│  - "✓ Portfolio saved" notification                           │
│  - Can navigate freely                                         │
│  - Results persist across sessions                            │
│                                                                 │
│  Auth State: user = {...} ✅                                   │
│  Portfolio: Saved automatically ✅                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
            User navigates to Scenarios tab or page
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Scenario Testing (Authenticated)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Enhanced Experience for Authenticated Users:                  │
│                                                                 │
│  On Questions Page:                                            │
│  ✅ Can see which scenarios they've tested                    │
│  ✅ Shows personal bests/scores                               │
│  ✅ "Test Again" vs "Test for First Time"                    │
│                                                                 │
│  On Leaderboard Page:                                          │
│  ✅ Shows user's current rank highlighted                     │
│  ✅ "Your Rank: #12" badge                                    │
│  ✅ Can see own portfolio in leaderboard                      │
│                                                                 │
│  When Testing Portfolio:                                       │
│  ✅ Results automatically saved                               │
│  ✅ Added to leaderboard (if opted in)                       │
│  ✅ Can compare to previous tests                             │
│                                                                 │
│  Future Features (Phase 2B):                                   │
│  - Personal scenario history dashboard                         │
│  - Edit portfolio names                                        │
│  - Make portfolios public/private                             │
│  - View detailed test history                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flow 3: Sign In from Header

```
┌─────────────────────────────────────────────────────────────────┐
│ User clicks [Sign In] in header                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SignInModal appears:                                          │
│  ┌───────────────────────────────────────────────────┐        │
│  │  Sign In to Your Account                          │        │
│  │                                                    │        │
│  │  Email: [____________________]                    │        │
│  │                                                    │        │
│  │  Password: [____________________]                 │        │
│  │  👁️ Show password                                 │        │
│  │                                                    │        │
│  │  [Sign In]                                        │        │
│  │  [Cancel]                                         │        │
│  │                                                    │        │
│  │  Forgot password? (future feature)               │        │
│  └───────────────────────────────────────────────────┘        │
│                                                                 │
│  User enters credentials and clicks [Sign In]                 │
│                                                                 │
│  Backend:                                                      │
│  - POST to Supabase Auth                                      │
│  - Validates credentials                                       │
│  - Returns session + JWT                                       │
│  - Updates last_login timestamp                                │
│                                                                 │
│  Success:                                                      │
│  ✅ Modal closes                                               │
│  ✅ Header updates (shows name + Sign Out)                    │
│  ✅ User = {...} in context                                   │
│  ✅ Can access all authenticated features                      │
│                                                                 │
│  Failure:                                                      │
│  ❌ Shows error: "Invalid email or password"                  │
│  ❌ Stays on modal                                             │
│  ❌ User can retry                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Gate Summary

### ✅ No Authentication Required:
- Landing page viewing
- Scenario questions browsing
- Leaderboard viewing (public portfolios)
- Kronos intake form
- Viewing analysis results (single session)
- Navigation between pages

### ❌ Authentication Required:
- **Saving portfolio permanently**
- **Appearing on leaderboards**
- **Accessing past test history**
- **Comparing multiple portfolio tests**
- **Making portfolios public**
- **Voting/engaging with others** (Phase 3)

### ⚠️ Prompted but Optional:
- **After completing portfolio analysis**
  - Modal appears suggesting account creation
  - Can skip and continue viewing
  - Results lost after session ends

---

## Session Management

### Session Lifecycle

```
User Creates Account or Signs In
        ↓
JWT Token Issued (expires in 1 hour)
        ↓
Stored in httpOnly Cookie (secure)
        ↓
AuthContext monitors session
        ↓
Auto-refresh before expiration
        ↓
[User actively using site: Session stays alive]
        ↓
[User idle > 1 week: Session expires]
        ↓
Next visit: Requires re-authentication
```

### Token Refresh Flow

```
Every page load:
1. AuthContext checks cookie
2. If token exists → Validate
3. If token expired → Auto-refresh
4. If refresh fails → Logout
5. Update user state
```

---

## Data Persistence

### Anonymous User Data
```
While viewing:
✅ Stored in component state (memory)
✅ Conversation record in database (anonymous)
✅ Analysis results in conversation.metadata

After leaving:
❌ State cleared
❌ Cannot access results again
❌ No user_id linkage
⚠️ Conversation orphaned (but stored)
```

### Authenticated User Data
```
While viewing:
✅ Stored in component state
✅ Saved to portfolios table
✅ Linked to user_id
✅ Conversation linked to user

After leaving:
✅ Can return anytime
✅ Access via /dashboard (future)
✅ Results persist forever
✅ Can view history
```

---

## Mobile vs Desktop Experience

### Desktop
- Full header with Sign In button
- Wide layout for comparisons
- Hover states on cards
- Multiple columns in leaderboards

### Mobile
- Hamburger menu with Sign In
- Stacked layouts
- Touch-friendly buttons (44x44px)
- Single column views
- Collapsible sections

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Error Scenarios

### Network Errors
```
Analysis API fails:
- Shows error message
- "Retry Analysis" button
- Results not saved
- User can retry intake
```

### Auth Errors
```
Account creation fails:
- Shows specific error (email exists, weak password)
- User can correct and retry
- Results preserved in state
- Can skip and continue

Sign in fails:
- Shows "Invalid credentials"
- Can retry unlimited times
- Link to password reset (future)
```

### Session Expired
```
User making authenticated request with expired session:
- Auto-refresh attempted
- If refresh fails → Logout
- Redirect to sign in
- Show: "Session expired, please sign in"
```

---

## Future Enhancements

### Phase 2A (Backend Integration)
- Connect scenario tests to real analysis API
- Save scenario test results
- Generate leaderboard rankings
- Link portfolios to scenarios

### Phase 2B (User Dashboard)
- Personal dashboard at `/dashboard`
- View all saved portfolios
- View scenario test history
- Edit portfolio names
- Make public/private

### Phase 3 (Gamification)
- Upvote/downvote portfolios
- Badges and achievements
- Streak tracking
- Social features
- Portfolio cloning

---

## Summary

### Current State ✅
Both authentication and scenario testing UI are **fully merged** and **ready for use**. The flows are:

1. **Anonymous users** can browse everything, test portfolios, but prompted to create account to save
2. **New users** create accounts after seeing analysis via CreatePasswordModal
3. **Returning users** have seamless authenticated experience
4. **Scenario testing** UI is complete but using mock data (ready for backend)

### Next Step 🚀
**Phase 2A:** Connect scenario testing to backend (estimated 2-3 days)
- Build `/api/scenarios/*` endpoints
- Replace mock data with real database queries
- Enable saving scenario test results
- Populate leaderboards with real user data

---

*Walkthrough completed - January 2026*

