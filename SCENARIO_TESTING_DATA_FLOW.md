# Scenario Testing - Data Flow & Calculations

## Overview
Two main pages display scenario testing results:
1. **Results Page** (`/scenario-testing/[questionId]/results`) - Shows user vs TIME comparison
2. **Top Portfolios Page** (`/scenario-testing/[questionId]/top-portfolios/[portfolioId]`) - Shows user vs all Clockwise portfolios

---

## Results Page Component
**Location:** `src/app/scenario-testing/[questionId]/results/page.tsx`

### Data Sources (Priority Order)

**1. Session Storage (Fresh Test Results)**
- Key: `latestTestResult`
- Contains: Complete `portfolioComparison` object from Kronos API
- Cleared after use

**2. Database (Test History)**
- API: `/api/community/questions/${questionId}/test-results`
- Returns: `topPortfolios` array with `comparisonData` field
- Finds user's test by `testId`, `portfolioId`, or `userId`

**3. Fallback (Mock Data)**
- Generated if no session/database data exists

### Portfolio Comparison Structure

**Component Used:** `PortfolioTab`

**Data Passed:**
```
portfolioComparison = {
  userPortfolio: {
    totalValue: number (starting portfolio value)
    expectedReturn: number (scenario-based return from Kronos)
    upside: number (Monte Carlo 95th percentile best year)
    downside: number (Monte Carlo 5th percentile worst year)
    score: number (Kronos score 0-100)
    topPositions: array (top 5 holdings with weights & returns)
  },
  timePortfolio: {
    totalValue: number
    expectedReturn: number
    upside: number
    downside: number
    score: number
    topPositions: array
  },
  timeHorizon: number (default 1 year)
}
```

### Calculations in PortfolioTab

**Ending Value:**
```
endingValue = totalValue × (1 + expectedReturn)^timeHorizon
```

**Expected Return:**
- Source: Kronos scoring engine (historical analog return)
- Display: Formatted as percentage

**Expected Best/Worst Year:**
- Source: Monte Carlo simulation (portfolio-level)
- Best Year: 95th percentile of annual returns
- Worst Year: 5th percentile of annual returns

**Position-Level Display:**
- For single-holding portfolios (100% one ticker): Uses portfolio-level metrics
- For multi-holding portfolios: Shows individual position expected returns

**Asset Class Aggregation:**
- Clockwise portfolios converted from tickers to asset classes
- Uses `convertToAssetClassIfClockwise()` helper

---

## Top Portfolios Page Component
**Location:** `src/app/scenario-testing/[questionId]/top-portfolios/[portfolioId]/page.tsx`

### Data Source

**API:** `/api/community/questions/${questionId}/test-results`

**Returns:** 
- User's portfolio test with `comparisonData`
- Question details with historical period info

### Portfolio Card Structure

**Component Used:** `PortfolioCard`

**Data Per Portfolio:**
```
{
  id: string
  name: string
  score: number (Kronos score 0-100)
  expectedReturn: number (scenario return)
  expectedBestYear: number (upside from Monte Carlo)
  expectedWorstYear: number (downside from Monte Carlo)
  topPositions: array (holdings with weights & returns)
}
```

### User Portfolio Extraction

**Holdings Source:**
- From `comparisonData.userPortfolio.topPositions` (if available)
- Fallback: From `holdings` array in test data

**Weight Normalization:**
- Weights < 1 are assumed decimal (0.5 = 50%)
- Weights > 1 are multiplied by 100

### Clockwise Portfolios

**Primary Source:** `comparisonData.clockwisePortfolios` array

**Fallback (Legacy):** `comparisonData.timePortfolio` (TIME only)

**Holdings Format:**
```
{
  ticker: string
  weight: number (converted to percentage if needed)
  expectedReturn: number (portfolio-level)
}
```

---

## Backend Calculation Flow

### 1. Kronos Scoring
**Location:** `src/lib/kronos/scoring.ts`

**Input:** User question + portfolio holdings

**Process:**
1. Map question to scenario (AI or keyword matching)
2. Find historical analog period (e.g., COVID crash, dot-com bust)
3. Fetch asset class returns for that period
4. Calculate weighted portfolio return
5. Compare to SPY benchmark
6. Generate score (0-100)

**Score Formula:**
```
returnScore = 50 + (outperformance × 200)
drawdownScore = 50 + (protection × 200)
finalScore = (returnScore + drawdownScore) / 2
```

### 2. Monte Carlo Simulation
**Location:** `src/lib/services/monte-carlo-portfolio.ts`

**Input:** Portfolio positions with Year 1 returns

**Process:**
- Run 5,000 simulations
- Year 1: Use Kronos scenario return
- Years 2+: Use long-term asset class averages
- Track all annual returns

**Output:**
- upside: 95th percentile (best expected year)
- downside: 5th percentile (worst expected year)
- median: 50th percentile (expected return)
- volatility: Portfolio standard deviation

### 3. Kronos Integration
**Location:** `src/lib/kronos/integration.ts`

**Function:** `transformKronosToUIComparison()`

**Steps:**
1. Get Kronos scenario returns for user & TIME
2. Run Monte Carlo for both portfolios
3. Build comparison object with upside/downside
4. Add Clockwise portfolios from cache
5. Calculate SPY benchmark best/worst year

**SPY Benchmark Logic:**
- If user portfolio is 100% SPY: Use same Monte Carlo values
- Otherwise: Run separate SPY simulation

### 4. API Response Building
**Location:** `src/app/api/kronos/score/route.ts`

**Clockwise Portfolios:**
- Fetched from cache (pre-scored for each analog)
- Includes TIME + 4 other Clockwise portfolios
- Upside/downside estimated from return ± 2 standard deviations

**Validation:**
- Ensures upside > downside
- Logs errors if invalid

---

## Database Storage

**Table:** `question_tests`

**Saved Fields:**
- `score`: Kronos score
- `expected_return`: Scenario return
- `upside`: Monte Carlo best year
- `downside`: Monte Carlo worst year
- `comparison_data`: Full portfolioComparison object (JSONB)

**SPY Benchmark Average:**
- Calculated from all test results
- Stored in `scenario_questions.metadata`
- Fields: `sp500_avg_return`, `spy_best_year`, `spy_worst_year`

---

## Key Calculation Sources

| Metric | Calculation Source | Location |
|--------|-------------------|----------|
| Portfolio Score | Kronos scoring algorithm | `src/lib/kronos/scoring.ts` |
| Expected Return | Historical analog return | `src/lib/kronos/data-sources.ts` |
| Best Year (Upside) | Monte Carlo 95th percentile | `src/lib/services/monte-carlo-portfolio.ts` |
| Worst Year (Downside) | Monte Carlo 5th percentile | `src/lib/services/monte-carlo-portfolio.ts` |
| Ending Value | Starting × (1 + return)^years | `PortfolioTab.tsx` line 108, 222 |
| SPY Benchmark | Yahoo Finance historical | `src/lib/kronos/data-sources.ts` |
| Asset Class Mapping | Static + AI classification | `src/lib/kronos/asset-class-mappings.ts` |

---

## Display Components

### PortfolioTab
- Shows side-by-side user vs TIME
- Starting/ending values calculated on render
- Expected return, best year, worst year from data
- Top 5 positions with individual or portfolio metrics
- Converts Clockwise portfolios to asset classes

### PortfolioCard
- Compact portfolio display
- Score badge with color coding
- Expected return, best/worst year
- Top holdings with weights
- Expandable/collapsible on mobile
- Converts Clockwise portfolios to asset classes

---

## Data Validation

**Weight Validation:**
- Must sum to ~1.0 (tolerance ±0.05)
- Auto-normalized if outside range

**Monte Carlo Validation:**
- upside must be ≥ downside
- Throws error if invalid
- Logs warning if violated

**Score Clamping:**
- All scores clamped to 0-100 range
- Return/drawdown scores clamped before averaging
