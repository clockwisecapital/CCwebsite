# Scenario Testing - Real Data Integration Plan

## Overview
This document outlines what needs to be implemented to connect real logic to the stats divs and portfolio rankings on the scenario testing pages.

---

## 1. S&P 500 Historical Returns by Period

### Current State
- Mock data: `+4.0%` hardcoded
- Need: Real S&P 500 returns for each historical period

### Implementation Steps

#### A. Create Historical Returns Calculator API

**File:** `src/app/api/community/questions/calculate-sp500-return/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Historical S&P 500 annual returns by period
const HISTORICAL_SP500_RETURNS: Record<string, number> = {
  // Format: "START-END": annualized_return
  "1945-1965": 0.124,  // Easy Money Era
  "1965-1980": 0.038,  // Stagflation
  "1980-2000": 0.176,  // Bubble Phase
  "1995-2000": 0.286,  // Dot-Com Boom
  "2000-2002": -0.145, // Dot-Com Bust
  "2003-2007": 0.098,  // Pre-GFC
  "2007-2009": -0.285, // Financial Crisis
  "2009-2020": 0.134,  // Recovery & Bull Market
  "2020-2021": 0.185,  // COVID Recovery
  "2022-2023": 0.042,  // Rate Hike Era
};

export async function POST(request: NextRequest) {
  try {
    const { startYear, endYear } = await request.json();
    
    const key = `${startYear}-${endYear}`;
    const sp500Return = HISTORICAL_SP500_RETURNS[key];
    
    if (sp500Return !== undefined) {
      return NextResponse.json({
        success: true,
        sp500Return,
        period: { start: startYear, end: endYear }
      });
    }
    
    // If exact match not found, calculate from closest period
    // Or use default
    return NextResponse.json({
      success: true,
      sp500Return: 0.08, // Default market return
      period: { start: startYear, end: endYear },
      note: 'Using estimated return'
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to calculate S&P 500 return', details: error.message },
      { status: 500 }
    );
  }
}
```

#### B. Update Question Creation to Store S&P 500 Return

**File:** `src/components/features/community/CreateQuestionModal.tsx`

When AI enriches the question, also fetch the S&P 500 return for that period:

```typescript
// After getting AI enrichment result
const sp500Response = await fetch('/api/community/questions/calculate-sp500-return', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startYear: aiEnrichment.historicalPeriod.start,
    endYear: aiEnrichment.historicalPeriod.end
  })
});

const sp500Data = await sp500Response.json();

// Store in question metadata
await onSubmit({
  title: aiEnrichment.title,
  description: aiEnrichment.description,
  question_text: questionText.trim(),
  historical_period: [aiEnrichment.historicalPeriod],
  tags: aiEnrichment.tags,
  metadata: {
    sp500_return: sp500Data.sp500Return
  }
});
```

#### C. Update Database Schema

**File:** `supabase/migrations/XXX_add_question_metadata.sql`

```sql
-- Add metadata column to scenario_questions if it doesn't exist
ALTER TABLE scenario_questions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_scenario_questions_metadata 
ON scenario_questions USING gin(metadata);
```

---

## 2. Portfolio Rankings - Real Leaderboard Logic

### Current State
- Leaderboard fetches from API but shows sample data if empty
- Need: Real portfolio test results with proper scoring

### Implementation Steps

#### A. Ensure Test Results Are Being Saved

**File:** `src/app/api/community/questions/[id]/test-results/route.ts`

Already exists! Verify it's working:

```typescript
// POST endpoint saves test results
// GET endpoint retrieves top portfolios
```

#### B. Update Top Portfolios Page to Use Real Data

**File:** `src/app/scenario-testing/[questionId]/top-portfolios/page.tsx`

Current implementation already fetches real data:

```typescript
const response = await fetch(`/api/community/questions/${questionId}/test-results?limit=10`, { headers });
```

**Issue:** Falls back to sample data if no results. This is fine for now, but we should:

1. Show empty state instead of sample data
2. Encourage users to be the first to test

```typescript
// Replace getSampleLeaderboard with empty state
if (response.ok && data.success && data.topPortfolios.length > 0) {
  setLeaderboard(transformedData);
} else {
  setLeaderboard([]); // Show empty state instead of samples
}
```

---

## 3. Stats Calculations - Real-Time Updates

### Current State
- `tests_count`: From database (✅ Working)
- `averageReturn`: Calculated from leaderboard (✅ Working)
- `leaderboard.length`: From API (✅ Working)
- `sp500_return`: From question metadata (✅ Will work after step 1)
- `historical_period`: From question data (✅ Working)

### Implementation Steps

#### A. Update Question Tests Count in Real-Time

**File:** `src/app/api/community/questions/[id]/test-results/route.ts`

When saving a test result, increment the question's `tests_count`:

```typescript
// In POST handler, after saving test result
await supabase
  .from('scenario_questions')
  .update({ 
    tests_count: question.tests_count + 1,
    last_activity_at: new Date().toISOString()
  })
  .eq('id', questionId);
```

#### B. Refresh Stats After Test Completion

**File:** `src/app/scenario-testing/[questionId]/top-portfolios/page.tsx`

After a user completes a test, refresh the page data:

```typescript
const handlePortfolioSelect = async (portfolioId: string, portfolioName: string) => {
  // ... existing test logic ...
  
  // After test completes and saves to leaderboard
  // Refresh the question and leaderboard data
  await Promise.all([
    fetchQuestionDetails(),
    fetchLeaderboard()
  ]);
  
  // Navigate to results
  router.push(`/scenario-testing/${questionId}/results?portfolioId=${portfolioId}`);
};
```

---

## 4. Enhanced Leaderboard Features

### A. Add User's Rank Indicator

Show where the current user's portfolio ranks:

```typescript
// In TopPortfoliosPage component
const [userRank, setUserRank] = useState<number | null>(null);

useEffect(() => {
  if (user && leaderboard.length > 0) {
    const userEntry = leaderboard.find(entry => entry.user_id === user.id);
    if (userEntry) {
      setUserRank(userEntry.rank);
    }
  }
}, [user, leaderboard]);

// Display in UI
{userRank && (
  <div className="mb-4 p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl">
    <p className="text-sm text-teal-400">
      🏆 Your portfolio ranks #{userRank} for this scenario
    </p>
  </div>
)}
```

### B. Add Filtering Options

```typescript
// Filter by score tier
const [filterTier, setFilterTier] = useState<'all' | 'excellent' | 'strong' | 'moderate' | 'weak'>('all');

const filteredLeaderboard = useMemo(() => {
  if (filterTier === 'all') return leaderboard;
  
  return leaderboard.filter(entry => {
    const tier = getScoreTier(entry.score);
    return tier.label.toLowerCase() === filterTier;
  });
}, [leaderboard, filterTier]);
```

---

## 5. Real-Time Kronos Integration

### Current State
- Tests run real Kronos scoring (✅ Working)
- Results saved to database (✅ Working)
- Need: Ensure consistency and accuracy

### Verification Steps

#### A. Test the Full Flow

1. Create a question with AI
2. Verify S&P 500 return is stored in metadata
3. Test a portfolio against the question
4. Verify result appears in leaderboard
5. Verify stats update correctly

#### B. Add Logging for Debugging

```typescript
// In handlePortfolioSelect
console.log('🎯 Starting test:', {
  questionId,
  portfolioId,
  portfolioName,
  questionTitle: question.title
});

// After Kronos test
console.log('✅ Test complete:', {
  score: result.testResult.score,
  expectedReturn: result.testResult.expectedReturn,
  scenario: result.kronosResponse.scenarioName
});

// After saving to leaderboard
console.log('💾 Saved to leaderboard:', {
  questionId,
  portfolioId,
  rank: 'TBD' // Will be calculated by backend
});
```

---

## 6. Database Indexes for Performance

### Add Indexes for Fast Queries

**File:** `supabase/migrations/XXX_add_leaderboard_indexes.sql`

```sql
-- Index for fetching top portfolios by question
CREATE INDEX IF NOT EXISTS idx_question_test_results_score 
ON question_test_results(question_id, score DESC, created_at DESC);

-- Index for user's tests
CREATE INDEX IF NOT EXISTS idx_question_test_results_user 
ON question_test_results(user_id, question_id, created_at DESC);

-- Index for public tests only
CREATE INDEX IF NOT EXISTS idx_question_test_results_public 
ON question_test_results(question_id, is_public, score DESC) 
WHERE is_public = true;
```

---

## 7. Caching Strategy

### A. Cache S&P 500 Returns

Since historical returns don't change, cache them:

```typescript
// In-memory cache
const sp500Cache = new Map<string, number>();

export async function getHistoricalSP500Return(startYear: string, endYear: string): Promise<number> {
  const key = `${startYear}-${endYear}`;
  
  if (sp500Cache.has(key)) {
    return sp500Cache.get(key)!;
  }
  
  const return = calculateReturn(startYear, endYear);
  sp500Cache.set(key, return);
  
  return return;
}
```

### B. Cache Leaderboard for Popular Questions

```typescript
// Use Next.js caching
export const revalidate = 60; // Revalidate every 60 seconds

// Or use React Query for client-side caching
const { data: leaderboard } = useQuery({
  queryKey: ['leaderboard', questionId],
  queryFn: () => fetchLeaderboard(questionId),
  staleTime: 60000, // 1 minute
});
```

---

## 8. Testing Checklist

### Manual Testing

- [ ] Create a new question via AI modal
- [ ] Verify S&P 500 return appears correctly
- [ ] Test a portfolio against the question
- [ ] Verify result appears in top portfolios
- [ ] Verify stats update (tests count, avg return)
- [ ] Test with multiple portfolios
- [ ] Verify ranking order is correct
- [ ] Test with different historical periods
- [ ] Verify empty state when no tests exist

### Automated Testing

```typescript
// tests/scenario-testing-integration.test.ts

describe('Scenario Testing Integration', () => {
  it('should calculate correct S&P 500 returns', async () => {
    const result = await fetch('/api/community/questions/calculate-sp500-return', {
      method: 'POST',
      body: JSON.stringify({ startYear: '1995', endYear: '2000' })
    });
    
    const data = await result.json();
    expect(data.sp500Return).toBeCloseTo(0.286, 2);
  });
  
  it('should save test results to leaderboard', async () => {
    // Test implementation
  });
  
  it('should rank portfolios correctly by score', async () => {
    // Test implementation
  });
});
```

---

## 9. Priority Implementation Order

### Phase 1 (Immediate) ✅ COMPLETED
1. ✅ Create S&P 500 return calculator API
2. ✅ Update AI enrichment to fetch S&P 500 returns
3. ✅ Store S&P 500 return in question metadata
4. ✅ Display real S&P 500 return on top portfolios page
5. ✅ On-the-fly calculation for questions without stored S&P 500 data

### Phase 2 (Next)
5. Remove sample leaderboard data, show empty state
6. Add real-time stats updates after test completion
7. Increment tests_count when test is saved
8. Add database indexes for performance

### Phase 3 (Enhancement)
9. Add user rank indicator
10. Add leaderboard filtering
11. Implement caching strategy
12. Add comprehensive logging

### Phase 4 (Polish)
13. Write automated tests
14. Performance optimization
15. Error handling improvements
16. Analytics tracking

---

## 10. Files to Create/Modify

### New Files
- `src/app/api/community/questions/calculate-sp500-return/route.ts`
- `supabase/migrations/XXX_add_question_metadata.sql`
- `supabase/migrations/XXX_add_leaderboard_indexes.sql`
- `tests/scenario-testing-integration.test.ts`

### Files to Modify
- `src/components/features/community/CreateQuestionModal.tsx`
- `src/app/scenario-testing/[questionId]/top-portfolios/page.tsx`
- `src/app/api/community/questions/[id]/test-results/route.ts`
- `src/types/community.ts` (add metadata field)

---

## Summary

**What's Already Working:**
- ✅ Real Kronos test execution
- ✅ Test results saved to database
- ✅ Leaderboard API fetches real data
- ✅ Stats calculated from real data
- ✅ Portfolio rankings by score

**What Needs Implementation:**
- 🔄 S&P 500 historical returns calculator
- 🔄 Store S&P 500 returns in question metadata
- 🔄 Remove sample data fallbacks
- 🔄 Real-time stats updates
- 🔄 Database indexes
- 🔄 Caching strategy

**Estimated Implementation Time:**
- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 4-5 hours
- Phase 4: 5-6 hours
- **Total: 14-18 hours**

The foundation is solid! Most of the heavy lifting (Kronos integration, database structure, API endpoints) is already done. We just need to connect the remaining pieces and polish the user experience.
