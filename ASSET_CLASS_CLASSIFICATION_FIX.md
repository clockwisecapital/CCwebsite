# Asset Class Classification System - Unified Implementation

## Problem Summary

The system had **two different classification methods** causing inconsistent results:

### Before Fix:
1. **TIME Portfolio** (cached): Used AI classification → AAPL = `tech-sector` → -28% return
2. **User Portfolios** (live tests): Used static mapping → AAPL = `us-large-cap` → -18% return
3. **Result**: Same stock, different returns, inconsistent scores

### Root Cause:
- `portfolio-extractor.ts` used synchronous `mapTickerToKronosAssetClass()` which defaulted unknown tickers to `us-large-cap`
- Cache generation used async `mapTickerToKronosAssetClassAsync()` which used AI for sector-specific classification
- AI correctly identifies AAPL as tech, static mapper defaulted to generic large-cap

---

## Solution Implemented

### Unified AI Classification System

**All portfolios now use the same 3-tier classification:**

1. **Tier 1**: Static ETF mappings (instant)
   - SPY → us-large-cap
   - QQQ → tech-sector
   - AGG → aggregate-bonds

2. **Tier 2**: Database cache (fast, 30-day TTL)
   - Previously classified tickers stored in Supabase
   - Avoids repeated AI calls

3. **Tier 3**: AI classification (slower, cached after first use)
   - Claude Sonnet 4 classifies unknown tickers
   - Prioritizes sector-specific over generic classifications
   - Example: AAPL → tech-sector (not us-large-cap)

---

## Files Changed

### 1. `src/lib/kronos/portfolio-extractor.ts` (Client-Safe)
**Changed:**
- ✅ Uses **static mappings only** (no server-only imports)
- ✅ Safe to import in both client and server code
- ✅ Kept `async` for compatibility
- ✅ Base extraction logic without AI classification

**Impact:**
- No build errors from client components
- Can be safely imported anywhere

### 2. `src/lib/kronos/portfolio-extractor-server.ts` (NEW - Server-Only)
**Created:**
- ✅ Wraps `portfolio-extractor.ts` with AI classification
- ✅ Imports `ticker-classifier.ts` (server-only)
- ✅ Re-classifies holdings with AI after extraction
- ✅ **ONLY use in API routes and Server Components**

**Impact:**
- Server code gets AI classification
- Client code can't accidentally import server-only modules

### 3. `src/lib/kronos/integration.ts`
**Changed:**
- ✅ Imports from `portfolio-extractor-server.ts` instead
- ✅ Uses `extractHoldingsWithAI()` for AI classification

### 4. `src/app/api/community/questions/[id]/tests/route.ts`
**Changed:**
- ✅ Imports from `portfolio-extractor-server.ts` instead
- ✅ Uses `extractHoldingsWithAI()` for AI classification

---

## Behavior After Fix

### Example: Portfolio with AAPL during Dot-Com Bust

**Before:**
```
User Portfolio:
  AAPL → us-large-cap → -18.4% (wrong, generic)
  
TIME Portfolio:
  AAPL → tech-sector → -28.1% (correct, sector-specific)
  
Result: Inconsistent!
```

**After:**
```
User Portfolio:
  AAPL → tech-sector → -28.1% ✅
  
TIME Portfolio:
  AAPL → tech-sector → -28.1% ✅
  
Result: Consistent! Both use AI classification
```

---

## Asset Class Returns (Dot-Com Bust 2000-2002)

| Asset Class | Cumulative | Annualized |
|-------------|-----------|------------|
| us-large-cap (SPY) | -40.9% | -18.4% |
| tech-sector | -79.0% | -37.0% |
| healthcare | -10.6% | -4.2% |
| financials | -1.0% | -0.4% |
| energy | -21.1% | -8.7% |

**Why this matters:** Tech stocks crashed much harder than the broad market during Dot-Com Bust. Using sector-specific classification captures this reality.

---

## Classification Examples

| Ticker | Static Mapping | AI Classification | Asset Class |
|--------|---------------|-------------------|-------------|
| SPY | ✅ us-large-cap | (skipped) | us-large-cap |
| AAPL | ❌ us-large-cap | ✅ tech-sector | tech-sector |
| JPM | ❌ us-large-cap | ✅ financials | financials |
| D | ❌ us-large-cap | ✅ energy | energy |
| NVDA | ❌ us-large-cap | ✅ tech-sector | tech-sector |
| NEM | ❌ us-large-cap | ✅ gold | gold |

---

## Testing

### Verify Fix:
1. Create portfolio with AAPL, JPM, D
2. Test against "AI Boom Preparation" (Dot-Com Bust)
3. Check breakdown in console logs:
   ```
   AAPL: tech-sector return
   JPM: financials return  
   D: energy return
   ```
4. Verify portfolio return ≠ SPY return (should be different now)

### Expected Results:
- User portfolios and TIME portfolio now show **same returns** for same holdings
- Breakdown shows **sector-specific** classifications
- No more defaulting to us-large-cap

---

## Future Enhancements

### Phase 2: Individual Stock Returns (Not Yet Implemented)
- Fetch actual AAPL price data from 2000-2002
- Use stock-specific returns instead of sector averages
- Even more accurate than sector classification
- Fallback to sector if stock didn't exist during period

### Current System (Phase 1):
- ✅ Sector-specific classification (AAPL = tech)
- ✅ Uses sector average returns
- ✅ Consistent across all portfolios

---

## Architecture

### Two-File System for Client/Server Safety

```
┌─────────────────────────────────────┐
│  Client Components                  │
│  ❌ Cannot import server-only code  │
└───────────────┬─────────────────────┘
                │
                │ (if needed, uses static)
                ▼
┌─────────────────────────────────────┐
│  portfolio-extractor.ts             │
│  ✅ Client-safe                     │
│  ✅ Static mappings only            │
│  ✅ No server-only imports          │
└─────────────────────────────────────┘
                ▲
                │ imports
                │
┌─────────────────────────────────────┐
│  portfolio-extractor-server.ts      │
│  🔒 Server-only                     │
│  ✅ Wraps extractor + adds AI       │
│  ✅ Imports ticker-classifier       │
└───────────────┬─────────────────────┘
                ▲
                │ imports
                │
┌─────────────────────────────────────┐
│  API Routes / Server Components     │
│  ✅ Use extractHoldingsWithAI()     │
└─────────────────────────────────────┘
```

## Key Principle

**"One robust system working correctly the first time"**

- ✅ Single classification method (AI with caching) for server
- ✅ Used universally across all server-side portfolio types
- ✅ Consistent results for same holdings
- ✅ No more sync vs async inconsistencies
- ✅ Client-safe extraction available when needed

---

## Notes

- Core Clockwise Portfolios still use asset class allocations (SPY, AGG, etc.)
- TIME Portfolio and User Portfolios use AI classification for individual stocks
- Classification results cached for 30 days to avoid repeated AI calls
- System gracefully falls back to us-large-cap if AI unavailable
