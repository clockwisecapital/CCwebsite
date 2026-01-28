# Scenario Testing - Complete Metrics Source Mapping

## Page 1: Test Results Modal
**Component:** `TestResultsModal` → Uses `PortfolioTab`
**Location:** `src/components/features/community/TestResultsModal.tsx`

### Header Metrics

| Metric | Value Example | Data Source | Calculation |
|--------|---------------|-------------|-------------|
| Historical Period | "2000-2008" | `kronosResponse.analogPeriod` | Kronos analog date range |
| Analog Name | "Peak & Crash (2000-2008)" | `kronosResponse.analogName` | Kronos analog selection |
| SPY Benchmark | "-19.3%" | `comparisonData.userPortfolio.benchmarkReturn` | Yahoo Finance historical SPY return for analog period |
| SPY Best | "+8.8%" | `comparisonData.userPortfolio.benchmarkBestYear` | Monte Carlo 95th percentile of SPY for analog |
| SPY Worst | "-38.9%" | `comparisonData.userPortfolio.benchmarkWorstYear` | Monte Carlo 5th percentile of SPY for analog |

### Portfolio Cards (Each of 3 Portfolios)

**Data Flow:** Modal receives `comparisonData` from session storage → Passes to `PortfolioTab`

| Metric | Component Path | Data Source |
|--------|----------------|-------------|
| Portfolio Name | `PortfolioTab` header | `comparisonData.userPortfolio.name` or "Your Portfolio" |
| Expected Return | "Expected Return (1yr)" | `portfolioComparison.userPortfolio.expectedReturn` |
| Expected Best Year | "Expected Best Year (1yr)" | `portfolioComparison.userPortfolio.upside` |
| Expected Worst Year | "Expected Worst Year (1yr)" | `portfolioComparison.userPortfolio.downside` |
| Asset Class Percentages | Under "ASSET CLASSES" | Aggregated from holdings via `convertToAssetClassIfClockwise()` |

**Expected Return Calculation:**
- Source: Kronos scoring engine
- Process: Weighted average of asset class returns during analog period
- Location: `src/lib/kronos/scoring.ts` → `calculatePortfolioReturn()`

**Best/Worst Year Calculation:**
- Source: Monte Carlo simulation
- Process: 5,000 simulations, extract 95th (best) and 5th (worst) percentiles
- Location: `src/lib/services/monte-carlo-portfolio.ts` → `runPortfolioMonteCarloSimulation()`

**Asset Class Aggregation:**
- Source: Holdings ticker-to-asset-class mapping
- Process: Groups tickers by asset class, sums weights
- Location: `src/lib/asset-class-aggregation.ts` → `aggregateHoldingsByAssetClass()`

---

## Page 2: Top Portfolios Leaderboard
**Component:** `TopPortfoliosPage`
**Location:** `src/app/scenario-testing/[questionId]/top-portfolios/page.tsx`

### Header Section

| Metric | Value Example | API Source | Database Field |
|--------|---------------|------------|----------------|
| Question Title | "What happens if the market goes through a correction" | `/api/community/questions/${questionId}` | `scenario_questions.question_text` |
| Analog Info | "Based on 2000-2008 (Peak & Crash (2000-2008))" | Same API | `scenario_questions.historical_period` array |
| Period Label | "2000-2008" | From `historical_period[0]` | `{start: "2000", end: "2008"}` |
| SPY Benchmark | "-19.3%" | From `scenario_questions.metadata` | `metadata.sp500_avg_return` |
| SPY Best | "+7.2%" | From `scenario_questions.metadata` | `metadata.spy_best_year` |
| SPY Worst | "-38.8%" | From `scenario_questions.metadata` | `metadata.spy_worst_year` |

**SPY Metadata Calculation:**
- When: After each test submission
- Process: Fetches all tests for question, averages benchmark returns
- Location: `src/app/api/community/questions/[id]/test-results/route.ts` → `updateSP500Average()`
- Formula: `avgReturn = sum(all benchmarkReturns) / count(tests)`

### Leaderboard Entries

**API:** `/api/community/questions/${questionId}/test-results?limit=10`

| Metric | Display | Database Source | Calculation Source |
|--------|---------|-----------------|-------------------|
| Rank | Position in list | Sorted by `score DESC` | SQL ORDER BY |
| Portfolio Name | "Long-Term Growth" | `question_tests.metadata.portfolio_name` | User provided |
| User Name | "Anonymous" | `users.first_name + last_name` or `email` | Joined from `users` table |
| Score Badge | "69" + "Moderate" | `question_tests.score` | Kronos scoring (0-100) |
| Expected Return | "-19.3%" | `question_tests.expected_return` | Kronos historical analog return |

**Score Badge Color:**
- 80-100: Green "Excellent"
- 60-79: Yellow "Moderate"  
- 40-59: Orange "Weak"
- 0-39: Red "Poor"
- Location: `src/lib/kronos/constants.ts` → `getScoreLabelForValue()`

---

## Page 3: Portfolio Comparison (Head-to-Head)
**Component:** `PortfolioComparison`
**Location:** `src/app/scenario-testing/[questionId]/top-portfolios/[portfolioId]/page.tsx`

### Header Section

| Metric | Value Example | Source |
|--------|---------------|--------|
| Question Title | "What happens if the market goes through a correction" | `/api/community/questions/${questionId}` → `question_text` |
| Historical Analog | "PEAK & CRASH (2000-2008) (2000-2008)" | From `historical_period` array → formatted label |

### Each Portfolio Card

**Data Source:** `/api/community/questions/${questionId}/test-results`
- Finds specific test by `portfolioId`
- Extracts `comparisonData` from test record

**User Portfolio (Left Card):**

| Metric | Display Location | Data Path |
|--------|------------------|-----------|
| Name | Card header | `portfolioTest.portfolioName` |
| Score | Badge | `portfolioTest.score` |
| Expected Return | Main metric | `portfolioTest.expectedReturn` |
| Expected Best Year | Secondary metric | `portfolioTest.upside` |
| Expected Worst Year | Secondary metric | `portfolioTest.downside` |
| Holdings | "TOP HOLDINGS" section | `portfolioTest.comparisonData.userPortfolio.topPositions` |
| Ticker | Each holding row | `topPositions[i].ticker` |
| Name | Below ticker | `topPositions[i].name` |
| Weight | Right side | `topPositions[i].weight` (converted to % if decimal) |
| Expected Return | Below weight | `topPositions[i].expectedReturn` or `portfolioTest.expectedReturn` |

**TIME Portfolio (Middle Card):**

| Metric | Data Path |
|--------|-----------|
| All metrics | Same structure as user portfolio |
| Source | `portfolioTest.comparisonData.timePortfolio` |
| Holdings | `timePortfolio.topPositions` array |

**Clockwise Portfolios (Right Cards):**

**Primary Source:** `portfolioTest.comparisonData.clockwisePortfolios` array

**Fallback (if not found):** `portfolioTest.comparisonData.timePortfolio` (legacy structure)

| Metric | Data Path | Fallback |
|--------|-----------|----------|
| Portfolio ID | `clockwisePortfolios[i].id` | "time" |
| Name | `clockwisePortfolios[i].name` | "TIME Portfolio" |
| Score | `clockwisePortfolios[i].score` | `timePortfolio.score` or 88 |
| Expected Return | `clockwisePortfolios[i].expectedReturn` | `timePortfolio.expectedReturn` |
| Upside | `clockwisePortfolios[i].upside` | `timePortfolio.upside` or 0.441 |
| Downside | `clockwisePortfolios[i].downside` | `timePortfolio.downside` or -0.171 |
| Holdings | `clockwisePortfolios[i].holdings` | `timePortfolio.topPositions` |

**Holdings Display Logic:**
- Regular portfolios: Show top 5 holdings with tickers
- Clockwise portfolios: Converted to asset classes via `convertToAssetClassIfClockwise()`
- Check: `isClockwisePortfolio(portfolioName)` returns true for "MAX GROWTH", "GROWTH", "MODERATE", "MAX INCOME"

---

## Complete Data Flow Summary

### Initial Test Execution
1. User submits portfolio via scenario testing UI
2. Calls `runScenarioTest()` from `src/lib/kronos/integration.ts`
3. Fetches holdings from portfolio via `getPortfolioHoldings()`
4. Sends to `/api/kronos/score` with question text

### Kronos API Processing
**Location:** `src/app/api/kronos/score/route.ts`

**Steps:**
1. Classifies tickers to asset classes (AI or static mapping)
2. Calls `scorePortfolio()` from scoring engine
3. Gets TIME portfolio from database (`holding_weights` table)
4. Scores both portfolios against scenario
5. Fetches cached Clockwise scores for analog
6. Runs Monte Carlo for user & TIME portfolios
7. Returns complete comparison object

### Response Structure
```
{
  userPortfolio: {
    score: [Kronos score 0-100],
    portfolioReturn: [Historical analog return],
    benchmarkReturn: [SPY return for analog],
    upside: [Monte Carlo 95th percentile],
    downside: [Monte Carlo 5th percentile]
  },
  timePortfolio: { same structure },
  clockwisePortfolios: [
    { id, name, score, expectedReturn, upside, downside, holdings }
  ],
  scenarioId: [Matched scenario],
  analogName: [Selected historical period],
  analogPeriod: [Date range string]
}
```

### Database Storage
**Table:** `question_tests`

**Saved via:** `/api/community/questions/[id]/test-results` POST

**Fields:**
- `score` ← `userPortfolio.score`
- `expected_return` ← `userPortfolio.portfolioReturn`
- `upside` ← Monte Carlo 95th percentile
- `downside` ← Monte Carlo 5th percentile
- `comparison_data` ← Entire portfolioComparison object (JSONB)
- `metadata` ← `{ portfolio_name, updated_at }`

### Session Storage
**Key:** `latestTestResult`

**Structure:**
```
{
  questionId: string,
  portfolioName: string,
  portfolioComparison: { full comparison object },
  kronosResponse: { full API response }
}
```

**Lifecycle:**
- Set: After test completes
- Read: On results page load
- Cleared: After reading once

---

## Metric Calculation Details

### Score (0-100)
**Formula:** `(returnScore + drawdownScore) / 2`

**Return Score:** `50 + (outperformance × 200)`
- outperformance = portfolioReturn - benchmarkReturn

**Drawdown Score:** `50 + (protection × 200)`
- protection = benchmarkDrawdown - portfolioDrawdown

**Location:** `src/lib/kronos/scoring.ts` → `calculateScore()`

### Expected Return
**Process:**
1. Map question to scenario (keyword/AI)
2. Select historical analog (e.g., COVID, dot-com bust)
3. Fetch asset class returns for that period
4. Calculate weighted average: `Σ(weight × assetReturn)`

**Location:** `src/lib/kronos/scoring.ts` → `calculatePortfolioReturn()`

### Monte Carlo Best/Worst Year
**Process:**
1. Run 5,000 simulations
2. For each simulation:
   - Year 1: Use Kronos scenario return
   - Years 2+: Use long-term asset class averages
   - Apply log-normal distribution with volatility
3. Collect all annual returns across simulations
4. Sort and extract percentiles:
   - Upside = 95th percentile
   - Downside = 5th percentile
   - Median = 50th percentile

**Location:** `src/lib/services/monte-carlo-portfolio.ts` → `runPortfolioMonteCarloSimulation()`

**Volatility Sources:**
- Stocks: 17%
- Bonds: 6%
- Real Estate: 15%
- Commodities: 20%
- Cash: 1%
- Alternatives: 12%

### SPY Benchmark Metrics
**Average Return:**
- Calculated: After each test submission
- Method: Average all `benchmarkReturn` values from all tests for question
- Stored: `scenario_questions.metadata.sp500_avg_return`

**Best/Worst Year:**
- Source: First test's Monte Carlo simulation for SPY
- Assumption: Same for all tests (same historical period)
- Stored: `metadata.spy_best_year`, `metadata.spy_worst_year`

**Location:** `src/app/api/community/questions/[id]/test-results/route.ts` → `updateSP500Average()`

### Asset Class Percentages
**Ticker Mapping:**
- Uses regex patterns to classify tickers
- Examples: SPY/VTI → Stocks, TLT/AGG → Bonds, GLD → Commodities
- Location: `src/lib/asset-class-aggregation.ts` → `mapTickerToHighLevelAssetClass()`

**Aggregation:**
1. Map each holding ticker to asset class
2. Sum weights by asset class
3. Sort by weight descending
4. Display as percentages

**Clockwise Portfolio Detection:**
- Checks if name matches: "MAX GROWTH", "GROWTH", "MODERATE", "MAX INCOME"
- If match: Shows asset classes instead of individual tickers
- Location: `src/lib/asset-class-aggregation.ts` → `isClockwisePortfolio()`

### Holdings Weight Normalization
**Issue:** Weights may be stored as decimals (0.5) or percentages (50)

**Detection:** If weight > 1, assume percentage; if < 1, assume decimal

**Conversion:**
```
displayWeight = weight < 1 ? weight * 100 : weight
```

**Location:** Multiple places where holdings are displayed

---

## Component Hierarchy

### Modal Flow
```
TestResultsModal
  └─ PortfolioTab (comparison mode)
      ├─ User Portfolio Section
      │   ├─ Starting/Ending Values
      │   ├─ Expected Return/Best/Worst
      │   └─ Top 5 Positions (or asset classes)
      │
      └─ TIME Portfolio Section
          ├─ Same metrics
          └─ Top 5 Positions (or asset classes)
```

### Top Portfolios Flow
```
TopPortfoliosPage
  ├─ Header (question + SPY benchmark)
  └─ Leaderboard List
      └─ Portfolio Entries (sorted by score)
          ├─ Rank Badge
          ├─ Name + User
          ├─ Score Badge
          └─ Expected Return
```

### Head-to-Head Flow
```
PortfolioComparison
  ├─ Header (question + analog)
  └─ Portfolio Grid
      ├─ PortfolioCard (User)
      │   ├─ Score Badge
      │   ├─ Expected Return
      │   ├─ Best/Worst Year
      │   └─ Holdings List
      │
      ├─ PortfolioCard (TIME)
      │   └─ Same structure
      │
      └─ PortfolioCard[] (Clockwise)
          └─ Same structure (with asset classes)
```

---

## Key Files Reference

| What | File Path |
|------|-----------|
| Modal Component | `src/components/features/community/TestResultsModal.tsx` |
| Top Portfolios Page | `src/app/scenario-testing/[questionId]/top-portfolios/page.tsx` |
| Head-to-Head Page | `src/app/scenario-testing/[questionId]/top-portfolios/[portfolioId]/page.tsx` |
| Results Page | `src/app/scenario-testing/[questionId]/results/page.tsx` |
| Portfolio Card | `src/components/features/community/PortfolioCard.tsx` |
| Portfolio Tab | `src/components/features/portfolio/dashboard/PortfolioTab.tsx` |
| Kronos Integration | `src/lib/kronos/integration.ts` |
| Kronos Scoring | `src/lib/kronos/scoring.ts` |
| Monte Carlo | `src/lib/services/monte-carlo-portfolio.ts` |
| Asset Class Utils | `src/lib/asset-class-aggregation.ts` |
| API: Score | `src/app/api/kronos/score/route.ts` |
| API: Test Results | `src/app/api/community/questions/[id]/test-results/route.ts` |
| API: Questions | `src/app/api/community/questions/[id]/route.ts` |

---

## Database Tables

| Table | Key Fields | Purpose |
|-------|------------|---------|
| `question_tests` | `score`, `expected_return`, `upside`, `downside`, `comparison_data` | Stores all test results |
| `scenario_questions` | `question_text`, `historical_period`, `metadata` | Question definitions + SPY benchmarks |
| `portfolios` | `portfolio_data`, `intake_data` | User portfolio holdings |
| `holding_weights` | `stockTicker`, `weightings` | TIME portfolio holdings |
| `users` | `first_name`, `last_name`, `email` | User info for leaderboard |
