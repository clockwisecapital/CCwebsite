# Scenario Testing & Authentication Integration Analysis

**Date:** January 2026  
**Status:** Analysis Phase - Pre-Implementation  
**Branch:** `scenario-testing` (merged with `feature/user-authentication`)

---

## Executive Summary

The authentication layer and scenario testing UI are now in the same branch and perfectly positioned for integration. The database schema already supports the data structures needed for scenario testing, requiring only minor extensions to link the two systems.

---

## Current State

### Authentication Layer (Phase 1 Complete)
✅ Database tables: `users`, `portfolios`, `portfolio_rankings`  
✅ User signup/signin flow  
✅ Portfolio saving after analysis  
✅ Row Level Security (RLS)  
✅ AuthContext for global state  

### Scenario Testing UI (Phase 1 Complete)
✅ Questions list page  
✅ Top portfolios leaderboard page  
✅ Reusable card components  
✅ Kronos dashboard integration  
✅ Mock data (5 scenarios, 5 portfolios each)  
⚠️ **No backend connection yet - all static data**

---

## Database Schema Analysis

### Current `portfolios` Table Structure
```sql
CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  conversation_id UUID,
  
  name TEXT,                     -- ✅ Can be scenario-specific
  description TEXT,              -- ✅ Can include scenario details
  
  portfolio_data JSONB,          -- ✅ Stores allocation
  intake_data JSONB,             -- ✅ Stores full intake
  analysis_results JSONB,        -- ✅ Stores analysis + scenario results
  
  portfolio_score NUMERIC,       -- ✅ Maps to scenario score
  goal_probability NUMERIC,
  risk_score NUMERIC,
  cycle_score NUMERIC,
  
  is_public BOOLEAN,             -- ✅ Controls leaderboard visibility
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  tested_at TIMESTAMP,
  
  metadata JSONB                 -- 🔑 KEY: Can store scenario_id here!
);
```

### Current `portfolio_rankings` Table Structure
```sql
CREATE TABLE public.portfolio_rankings (
  id UUID PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id),
  
  rank INTEGER,                  -- ✅ Rank in leaderboard
  score NUMERIC,                 -- ✅ Scenario test score
  period TEXT,                   -- ✅ 'weekly', 'monthly', 'all-time'
  category TEXT,                 -- 🔑 Can be scenario_id!
  
  calculated_at TIMESTAMP
);
```

### 🎯 Perfect Fit!

The existing schema can support scenario testing with **zero schema changes** by using:
- `portfolios.metadata` → Store `scenario_id`, `scenario_name`, `scenario_results`
- `portfolio_rankings.category` → Store `scenario_id` (e.g., 'late-cycle', 'ai-supercycle')

---

## Integration Architecture

```
User Journey:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. User completes Kronos intake → Gets portfolio analysis     │
│                                                                 │
│  2. User navigates to Scenarios tab or /scenario-testing       │
│                                                                 │
│  3. Selects scenario question (e.g., "Late Cycle")             │
│                                                                 │
│  4. System runs scenario-specific analysis:                    │
│     - Uses their portfolio allocation                          │
│     - Tests against historical scenario data                   │
│     - Calculates scenario score                                │
│                                                                 │
│  5. Results shown with comparison to TIME portfolio            │
│                                                                 │
│  6. If authenticated:                                          │
│     ✅ Save portfolio with scenario metadata                   │
│     ✅ Add to scenario-specific leaderboard                    │
│     ✅ Show user's rank for this scenario                      │
│                                                                 │
│  7. If NOT authenticated:                                      │
│     → Show CreatePasswordModal                                 │
│     → "Sign up to save your scenario test and see ranking"    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Mapping

### Scenario Test → Database

```typescript
// When user tests portfolio against scenario
const scenarioTestResult = {
  // From existing portfolio
  portfolio_data: {
    stocks: 60,
    bonds: 30,
    cash: 10,
    // ... user's allocation
  },
  
  // From intake form
  intake_data: {
    age: 35,
    riskTolerance: 'medium',
    goalAmount: 500000,
    // ... all intake data
  },
  
  // New: Scenario-specific analysis
  analysis_results: {
    // Existing analysis fields
    portfolioComparison: { ... },
    cycleAnalysis: { ... },
    
    // NEW: Scenario results
    scenarioAnalysis: {
      scenario_id: 'late-cycle',
      scenario_name: 'Late Cycle',
      scenario_description: '2006-2008 Pre-GFC Late Cycle',
      test_date: '2026-01-12T...',
      
      performance: {
        expected_return: 5.2,
        upside: 18.4,
        downside: -8.2,
        volatility: 12.3,
        max_drawdown: -15.2
      },
      
      comparison_to_benchmark: {
        time_portfolio_return: 9.4,
        time_portfolio_upside: 44.5,
        time_portfolio_downside: -17.1,
        outperformance: -4.2  // negative = underperformed
      },
      
      score: 89  // Composite score for this scenario
    }
  },
  
  // Scenario score stored at top level
  portfolio_score: 89,
  
  // Metadata with scenario info
  metadata: {
    scenario_id: 'late-cycle',
    scenario_category: 'recession-defense',
    is_scenario_test: true,
    test_number: 1  // User's nth test of this scenario
  },
  
  // Visibility
  is_public: true,  // User can opt-in to leaderboard
  
  // Auto-generated name
  name: 'Late Cycle Test - Jan 2026'
};
```

### Database → Leaderboard UI

```typescript
// Query for top portfolios in scenario
const topPortfolios = await supabase
  .from('portfolio_rankings')
  .select(`
    *,
    portfolio:portfolios(
      id,
      user_id,
      name,
      portfolio_score,
      analysis_results,
      created_at,
      user:users(first_name, last_name)
    )
  `)
  .eq('category', 'late-cycle')  // Filter by scenario
  .eq('period', 'all-time')      // or 'weekly', 'monthly'
  .order('rank', { ascending: true })
  .limit(10);

// Maps to UI component:
{
  rank: 1,
  name: "Fortress Defense",  // From portfolio.name or user-generated
  subtitle: "John D. • 12w streak",
  icon: "FiShield",
  metrics: {
    votes: portfolio.metadata.upvote_count || 0,
    expectedReturn: portfolio.analysis_results.scenarioAnalysis.performance.expected_return,
    timePeriod: "12-mo est.",
    score: portfolio.portfolio_score
  }
}
```

---

## Required Schema Extensions

### Option 1: Minimal (Recommended) ✅
**Use existing fields creatively - zero migration needed**

```sql
-- No schema changes required!

-- Store scenario info in metadata JSONB:
UPDATE portfolios 
SET metadata = metadata || jsonb_build_object(
  'scenario_id', 'late-cycle',
  'scenario_name', 'Late Cycle',
  'is_scenario_test', true,
  'upvote_count', 0,
  'streak_weeks', 12
);

-- Use category field for scenario filtering:
INSERT INTO portfolio_rankings (portfolio_id, rank, score, period, category)
VALUES (
  'portfolio-uuid',
  1,
  89,
  'all-time',
  'late-cycle'  -- Store scenario_id in category
);
```

**Pros:**
- No migration needed
- Works immediately
- Flexible JSONB structure
- Already deployed schema

**Cons:**
- Less structured
- Harder to query efficiently
- No foreign key constraints

---

### Option 2: Dedicated Tables (Future Phase) 📋

```sql
-- NEW TABLE: Scenario definitions
CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,  -- 'late-cycle', 'ai-supercycle'
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  historical_period TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NEW TABLE: Scenario test results
CREATE TABLE scenario_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  portfolio_id UUID REFERENCES portfolios(id),
  scenario_id TEXT REFERENCES scenarios(id),
  
  score NUMERIC NOT NULL,
  performance_metrics JSONB,
  comparison_results JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- MODIFY: Add scenario reference to portfolios
ALTER TABLE portfolios
ADD COLUMN scenario_id TEXT REFERENCES scenarios(id);

-- Indexes for performance
CREATE INDEX idx_scenario_tests_scenario ON scenario_tests(scenario_id);
CREATE INDEX idx_scenario_tests_score ON scenario_tests(score DESC);
CREATE INDEX idx_portfolios_scenario ON portfolios(scenario_id);
```

**Pros:**
- Strongly typed
- Better query performance
- Foreign key constraints
- Easier to maintain

**Cons:**
- Requires migration
- More tables to manage
- Overkill for MVP

---

## API Endpoints Needed

### 1. Test Portfolio Against Scenario
```typescript
POST /api/scenarios/test

Request:
{
  scenario_id: 'late-cycle',
  portfolio_data: { stocks: 60, bonds: 30, ... },
  intake_data: { age: 35, riskTolerance: 'medium', ... }
}

Response:
{
  scenario_results: {
    score: 89,
    performance: { expected_return: 5.2, ... },
    comparison: { ... },
    rank: 12  // User's rank if saved
  },
  saved: true,  // If user authenticated
  portfolio_id: 'uuid'
}
```

### 2. Get Scenario Leaderboard
```typescript
GET /api/scenarios/[scenario_id]/leaderboard?period=all-time&limit=10

Response:
{
  scenario: {
    id: 'late-cycle',
    title: 'Late Cycle',
    description: '...'
  },
  leaderboard: [
    {
      rank: 1,
      portfolio_id: 'uuid',
      name: 'Fortress Defense',
      score: 89,
      user: { first_name: 'John', public: true },
      performance: { ... },
      created_at: '2026-01-01'
    },
    // ... top 10
  ],
  user_rank: 12,  // If authenticated
  total_participants: 5102
}
```

### 3. Get User's Scenario Tests
```typescript
GET /api/scenarios/my-tests

Response:
{
  tests: [
    {
      scenario_id: 'late-cycle',
      scenario_name: 'Late Cycle',
      score: 89,
      rank: 12,
      tested_at: '2026-01-12',
      portfolio_id: 'uuid'
    },
    // ... all user's tests
  ]
}
```

### 4. Save Scenario Test (Authenticated Only)
```typescript
POST /api/scenarios/save

Request:
{
  scenario_id: 'late-cycle',
  portfolio_id: 'uuid',  // From existing portfolio
  score: 89,
  performance_metrics: { ... },
  make_public: true  // Opt-in to leaderboard
}

Response:
{
  saved: true,
  rank: 12,
  leaderboard_url: '/scenario-testing/late-cycle'
}
```

---

## UI Integration Points

### 1. Questions Page Updates
**Current:** Static mock data  
**Needed:** Fetch from API

```typescript
// src/app/scenario-testing/questions/page.tsx
const { data: questions } = await fetch('/api/scenarios/list');

// Add real investor counts from database
stats: {
  investorCount: scenario.total_tests,  // Real count
  percentageBadge: `↑ ${scenario.growth_percentage}%`,
  timePeriod: `${scenario.trending_weeks}w`
}
```

### 2. Top Portfolios Page Updates
**Current:** Static mock data  
**Needed:** Fetch leaderboard from API

```typescript
// src/app/scenario-testing/[questionId]/page.tsx
const { data: leaderboard } = await fetch(
  `/api/scenarios/${questionId}/leaderboard?period=all-time`
);

// Show user's rank if authenticated
{user && (
  <div className="my-ranking">
    Your Rank: #{leaderboard.user_rank}
  </div>
)}
```

### 3. Kronos Dashboard Integration
**Add "Test This Portfolio" Button**

```typescript
// In PortfolioTab after portfolio comparison
<button onClick={() => router.push('/scenario-testing/questions')}>
  Test This Portfolio Against Scenarios
</button>

// Or modal to select scenario directly
<ScenarioSelectionModal 
  portfolioData={portfolioComparison}
  onSelect={handleScenarioTest}
/>
```

### 4. Save to Leaderboard Modal
**After scenario test completes**

```typescript
{!user ? (
  <CreatePasswordModal 
    message="Sign up to save your score and compete on the leaderboard!"
  />
) : (
  <SaveToLeaderboardModal
    score={89}
    rank={12}
    scenario="Late Cycle"
    onSave={() => saveToLeaderboard(true)}
  />
)}
```

---

## Authentication Flow Integration

### Anonymous User
```
1. Browse scenarios → OK
2. View leaderboards → OK
3. Test portfolio → OK
4. See results → OK
5. Save to leaderboard → ❌ Prompt to sign up
6. View personal history → ❌ Sign in required
```

### Authenticated User
```
1. Browse scenarios → ✅
2. View leaderboards → ✅ (with their rank shown)
3. Test portfolio → ✅
4. See results → ✅
5. Auto-save to leaderboard → ✅ (with opt-in)
6. View personal history → ✅ Dashboard link
7. Edit portfolio names → ✅
8. Make public/private → ✅
```

---

## Gamification Opportunities

### Already Supported by Schema
✅ **Rankings:** `portfolio_rankings` table with periods  
✅ **Scoring:** Composite scores stored per test  
✅ **Visibility:** Public/private toggle  
✅ **User profiles:** Names, preferences  

### Easy Additions via `metadata` JSONB
```typescript
// In portfolios.metadata
{
  upvote_count: 142,
  downvote_count: 12,
  streak_weeks: 12,
  badges: ['top-defender', 'consistent-performer'],
  achievements: ['first-test', '10-tests', 'top-10'],
  last_rank: 12,
  best_rank: 5,
  tests_count: 24
}
```

### Future Phase 3 Features
- Voting system (upvotes/downvotes)
- Badges and achievements
- Streak tracking
- Portfolio nicknames/themes
- Social sharing
- Comments/discussions
- Portfolio cloning
- Head-to-head comparisons

---

## Implementation Phases

### Phase 2A: Basic Integration (Immediate)
**Estimated:** 2-3 days

1. ✅ Create `/api/scenarios/test` endpoint
2. ✅ Connect questions page to real scenario data
3. ✅ Connect leaderboard to `portfolio_rankings`
4. ✅ Use `portfolios.metadata` for scenario info
5. ✅ Show CreatePasswordModal after scenario test
6. ✅ Auto-save authenticated users

**No schema changes required - uses existing tables!**

---

### Phase 2B: Enhanced Features (1 week later)
**Estimated:** 3-4 days

1. Add user's rank display
2. Personal scenario history page
3. Make public/private toggle
4. Portfolio naming system
5. Filtering by time period
6. Mobile optimization
7. Loading states and error handling

---

### Phase 3: Gamification (Future)
**Estimated:** 1-2 weeks

1. Voting system
2. Badges and achievements
3. Social features
4. Portfolio cloning
5. Advanced analytics
6. Comparison tools

---

## Testing Strategy

### Manual Testing Flow
```
1. Anonymous user:
   - Browse scenarios ✓
   - View leaderboard ✓
   - Test portfolio ✓
   - Prompted to sign up ✓

2. Create account:
   - From scenario results ✓
   - Test auto-saves ✓
   - Appears in leaderboard ✓

3. Authenticated user:
   - Test another scenario ✓
   - View personal history ✓
   - Make portfolio public ✓
   - See rank on leaderboard ✓

4. Return later:
   - Sign in ✓
   - See all past tests ✓
   - Compare performances ✓
```

### Database Testing
```sql
-- Verify scenario data saved
SELECT * FROM portfolios WHERE metadata->>'is_scenario_test' = 'true';

-- Check leaderboard entries
SELECT * FROM portfolio_rankings WHERE category = 'late-cycle';

-- Verify user linkage
SELECT 
  u.email,
  p.name,
  pr.rank,
  pr.score
FROM users u
JOIN portfolios p ON p.user_id = u.id
JOIN portfolio_rankings pr ON pr.portfolio_id = p.id
WHERE pr.category = 'late-cycle';
```

---

## Key Benefits of This Architecture

### ✅ Seamless Integration
- No schema changes needed initially
- Uses existing authentication flow
- Leverages current portfolio saving logic
- Natural user journey

### ✅ Flexible & Scalable
- JSONB metadata allows quick iteration
- Can add structured tables later
- Easy to extend with new scenarios
- Ready for gamification features

### ✅ User Experience
- One account for everything
- Portfolio tests automatically saved
- Leaderboard participation built-in
- Progression tracking over time

### ✅ Performance
- Existing indexes support queries
- RLS policies already in place
- Efficient leaderboard queries
- Cacheable scenario definitions

---

## Recommendations

### Immediate Actions (This Week)
1. ✅ **Start with Option 1 (Minimal)** - Use existing schema
2. ✅ **Build `/api/scenarios/test` endpoint** - Core functionality
3. ✅ **Connect leaderboard to database** - Replace mock data
4. ✅ **Test authentication flow** - Ensure smooth UX

### Short Term (Next 2 Weeks)
1. Add personal scenario history
2. Implement voting system
3. Add portfolio naming
4. Mobile optimization

### Long Term (Phase 3)
1. Migrate to dedicated scenario tables
2. Add advanced gamification
3. Social features
4. Advanced analytics

---

## Risks & Mitigation

### Risk 1: Performance with JSONB Queries
**Mitigation:** 
- Add GIN index on metadata if needed
- Monitor query performance
- Migrate to structured tables if slow

### Risk 2: Leaderboard Manipulation
**Mitigation:**
- RLS policies prevent editing others' scores
- Admin review system for suspicious scores
- Rate limiting on test submissions

### Risk 3: Privacy Concerns
**Mitigation:**
- Default portfolios to private
- Clear opt-in for leaderboards
- Anonymize usernames option
- GDPR compliance built-in

---

## Success Metrics

### Technical Metrics
- ✅ Zero migration needed (Phase 2A)
- ✅ < 200ms API response times
- ✅ 100% RLS coverage
- ✅ Mobile responsive (< 768px)

### User Metrics (Post-Launch)
- Scenario test completion rate
- Sign-up conversion from scenarios
- Leaderboard participation rate
- Repeat testing frequency
- Public portfolio percentage

---

## Conclusion

**The authentication layer and scenario testing UI are perfectly aligned for integration.** The existing database schema supports scenario testing with zero changes required by leveraging JSONB metadata and the `category` field in rankings.

**Recommended Approach:**
1. Start with minimal integration (Option 1)
2. Iterate based on user feedback
3. Migrate to structured schema if needed (Option 2)

**Timeline:**
- Phase 2A (Basic): Ready to build now (2-3 days)
- Phase 2B (Enhanced): 1 week after 2A
- Phase 3 (Gamification): Future roadmap

**Next Step:** Get client approval to proceed with Phase 2A implementation.

---

*Analysis completed - January 2026*

