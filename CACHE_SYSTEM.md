# Clockwise Portfolio Cache System

## What It Does
Pre-computes scores for the 4 standard Clockwise portfolios (Max Growth, Growth, Moderate, Max Income) against all historical scenarios. Reduces scenario testing time from ~50s to ~35s.

## When to Regenerate Cache

Regenerate when:
- Portfolio allocations change
- New historical scenarios are added
- Scoring logic is modified

## Commands

```bash
# Generate/update cache
npm run generate-cache

# Test cache lookup
npm run test-cache
```

## Portfolio Allocations

| Asset Class | Max Growth | Growth | Moderate | Max Income |
|------------|-----------|---------|----------|------------|
| Stocks | 83.5% | 75.6% | 60.7% | 51.8% |
| Equity Hedges | 4.3% | 3.5% | 2.6% | 1.7% |
| Bonds | 5.0% | 14.0% | 31.0% | 41.0% |
| Commodities | 5.0% | 5.0% | 4.0% | 4.0% |
| Cash | 2.2% | 2.0% | 1.7% | 1.5% |

## Key Files

- `src/lib/clockwise-portfolios.ts` - Portfolio definitions
- `scripts/generate-clockwise-cache.ts` - Cache generation script
- `src/lib/kronos/cache-utils.ts` - Cache read/write utilities
- `src/app/api/kronos/cached-clockwise-scores/route.ts` - Cache lookup API
- `supabase/migrations/024_clockwise_portfolio_cache.sql` - Database schema

## Database

Table: `clockwise_portfolio_cache`
- Stores: portfolio_id, analog_id, score, returns, holdings
- Version: `1` (increment when cache structure changes)

## Environment Variables

Required in `.env` or `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```
