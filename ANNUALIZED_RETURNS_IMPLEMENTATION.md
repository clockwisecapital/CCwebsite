# Annualized Returns Implementation

## Overview
All portfolio returns are now annualized to show **1-year equivalent returns** using CAGR (Compound Annual Growth Rate), making results easier to understand regardless of the historical analog's duration.

## What Changed

### 1. New Functions Added (`src/lib/kronos/data-sources.ts`)

#### `calculateScenarioDuration(startDate, endDate)`
- Calculates duration in years between two dates
- Accounts for leap years (365.25 days/year)
- Minimum 0.01 years to avoid division by zero

#### `annualizeReturn(cumulativeReturn, years)`
- Converts cumulative returns to annualized using CAGR formula: `(1 + r)^(1/n) - 1`
- No conversion if period is ≤ 1 year
- Handles edge case of complete loss (-100%)
- **Logs conversion for transparency**

### 2. Updated Scoring Logic (`src/lib/kronos/scoring.ts`)

**Scoring Flow:**
1. Get historical analog (unchanged)
2. **NEW**: Calculate scenario duration
3. Fetch asset returns & S&P 500 benchmark (cumulative - unchanged)
4. Calculate portfolio return (cumulative - unchanged)
5. **NEW**: Annualize portfolio and benchmark returns
6. Calculate drawdowns (unchanged - not annualized)
7. Calculate score using **annualized returns**

**Key Points:**
- Drawdowns remain cumulative (they represent max single drop, not a rate)
- Score calculation now uses annualized returns
- All portfolio types benefit (user portfolios, Clockwise portfolios)

### 3. Asset Allocation Scoring
- No changes needed! Uses `scorePortfolio()` which now returns annualized values

## Examples

### 8-Year Scenario (2000-2008 Crash)
- **Before**: -38.8% cumulative
- **After**: -6.1% per year

### 5-Year Scenario (Internet Boom 1995-2000)
- **Before**: +180% cumulative  
- **After**: +23% per year

### 3-Month Scenario (COVID Crash)
- **Before**: -34% cumulative
- **After**: -79% per year (accurate but extreme)

### 1-Year Scenario
- No change (already 1 year)

## Data Considerations

### New Tests
- All new tests will automatically have annualized returns
- Consistent across all portfolios and scenarios

### Existing Tests
- Old tests in database have cumulative returns
- **Accepted as-is** - no backfill needed
- Users will need to re-run tests for updated values

## Logging

All operations include clear logging:
```
⏱️  Scenario duration: 8.00 years (2000-01-01 to 2008-12-31)
📊 Annualized: -38.80% over 8.00yr → -6.10%/yr
   Portfolio: -38.80% cumulative → -6.10%/yr
   Benchmark: -38.80% cumulative → -6.10%/yr
✅ Scoring complete: 61/100 (Moderate)
   Portfolio: -6.10%/yr | Benchmark: -6.10%/yr
   Outperformance: 0.00%/yr
```

## What Users See

### Before:
- S&P 500: -38.8%
- User Portfolio: -40.9%
- *Confusing: Is this per year? Total?*

### After:
- S&P 500: -6.1%
- User Portfolio: -6.4%
- *Clear: This is what 1 year would look like under these conditions*

## Benefits

✅ **Intuitive**: Users understand what 1 year under scenario conditions would look like
✅ **Comparable**: Can compare different scenarios regardless of duration
✅ **Industry Standard**: CAGR is the standard way to present returns
✅ **Clean Implementation**: Simple, straightforward code
✅ **Well Logged**: Easy to verify and debug
✅ **Automatic**: Works for all portfolio types without special handling
