# Core Portfolios Database Cache System

## Overview

Migrated from **in-memory caching** to **Supabase database-backed caching** for Core Portfolio analysis results. This provides:

- ✅ **Persistent cache** across server restarts
- ✅ **Distributed cache** shared across all instances
- ✅ **24-hour TTL** with automatic expiration
- ✅ **Cache statistics** and monitoring
- ✅ **Performance boost**: 8-12s → 0.2s per request

## Architecture

### Database Layer
**Table**: `core_portfolios_cache`
- Stores pre-computed Kronos analysis for all 4 Core Portfolios
- TTL: 24 hours (portfolios don't change frequently)
- Includes: returns, upside/downside, volatility, asset allocation, holdings

**Migration**: `supabase/migrations/026_core_portfolios_cache.sql`

### Service Layer
**File**: `src/lib/services/core-portfolios-cache.ts`

Key functions:
```typescript
// Check if cache is valid (all portfolios cached and within TTL)
await isCorePortfoliosCacheValid(): Promise<boolean>

// Get all cached portfolios
await getAllCachedCorePortfolios(): Promise<CachedCorePortfolio[] | null>

// Get specific portfolio
await getCachedCorePortfolio(portfolioId: string): Promise<CachedCorePortfolio | null>

// Save single portfolio
await setCachedCorePortfolio(portfolio: {...}): Promise<boolean>

// Save multiple portfolios (batch)
await batchSetCachedCorePortfolios(portfolios: [...]): Promise<{success, failed}>

// Clear entire cache
await clearCorePortfoliosCache(): Promise<void>

// Clear specific portfolio
await clearCorePortfolioCache(portfolioId: string): Promise<void>

// Get cache statistics
await getCorePortfoliosCacheStats(): Promise<{...}>
```

### API Layer
**Endpoint**: `/api/core-portfolios/analyze`

**Flow**:
1. Check if Supabase cache is valid
2. If valid → return cached data (0.2s response)
3. If invalid → run Kronos analysis + save to DB cache (8-12s)

## Setup Instructions

### 1. Run the Migration

```bash
# Connect to Supabase
npx supabase migration up

# Or apply specific migration
psql YOUR_DATABASE_URL -f supabase/migrations/026_core_portfolios_cache.sql
```

### 2. Verify Table Creation

```sql
-- Check table exists
SELECT * FROM core_portfolios_cache;

-- Check cache stats view
SELECT * FROM core_portfolios_cache_stats;
```

### 3. Test the API

```bash
# First request: cache miss (slow, ~8-12s)
curl -X POST http://localhost:3000/api/core-portfolios/analyze

# Second request: cache hit (fast, ~0.2s)
curl -X POST http://localhost:3000/api/core-portfolios/analyze
```

## Cache Behavior

### Cache Hit (Fast Path)
```
1. Check isCorePortfoliosCacheValid() → TRUE
2. Fetch getAllCachedCorePortfolios() from Supabase
3. Return cached data immediately
4. Response includes: cached: true, cacheAge: "X minutes"
```

### Cache Miss (Slow Path)
```
1. Check isCorePortfoliosCacheValid() → FALSE
2. Run Kronos analysis for all 4 portfolios (parallel)
3. Save results via batchSetCachedCorePortfolios()
4. Return fresh data
5. Response includes: cached: false
```

### Cache Invalidation
Cache automatically expires after **24 hours**. Manual invalidation:

```typescript
// Clear all Core Portfolios
import { clearCorePortfoliosCache } from '@/lib/services/core-portfolios-cache';
await clearCorePortfoliosCache();

// Clear specific portfolio
import { clearCorePortfolioCache } from '@/lib/services/core-portfolios-cache';
await clearCorePortfolioCache('max-growth');
```

## Data Structure

### Cached Portfolio Object
```typescript
{
  id: 'max-growth',
  name: 'Max Growth',
  description: 'Aggressive growth portfolio...',
  riskLevel: 'aggressive',
  allocations: {
    stocks: 0.835,
    bonds: 0.050,
    cash: 0.022,
    realEstate: 0.000,
    commodities: 0.050,
    equityHedges: 0.043
  },
  expectedReturn: 0.094,        // 9.4% expected return
  expectedBestYear: 0.445,      // 44.5% best case (95th percentile)
  expectedWorstYear: -0.171,    // -17.1% worst case (5th percentile)
  upside: 0.445,
  downside: -0.171,
  volatility: 0.15,
  assetAllocation: {
    'Stocks': 0.835,
    'Bonds': 0.050,
    // ...
  },
  topPositions: [
    { ticker: 'Stocks', name: 'Equities', weight: 83.5, expectedReturn: 0.07 },
    // ...
  ],
  timeHorizon: 1,               // 1 year (12 months)
  updatedAt: Date                // Cache timestamp
}
```

## Monitoring

### Cache Statistics View
```sql
SELECT * FROM core_portfolios_cache_stats;
```

Returns:
- `total_portfolios`: Number of cached portfolios (expect 4)
- `unique_risk_levels`: Number of different risk levels
- `avg_expected_return_pct`: Average expected return across portfolios
- `oldest_cache`: Timestamp of oldest cache entry
- `newest_cache`: Timestamp of newest cache entry
- `oldest_age_hours`: Age of oldest cache in hours

### Programmatic Stats
```typescript
import { getCorePortfoliosCacheStats } from '@/lib/services/core-portfolios-cache';

const stats = await getCorePortfoliosCacheStats();
// {
//   totalPortfolios: 4,
//   oldestCacheAge: 120,  // minutes
//   newestCacheAge: 118,
//   isValid: true
// }
```

## Performance Metrics

### Before (In-Memory Cache)
- ❌ Cache lost on server restart
- ❌ Not shared across instances
- ❌ No persistence layer
- ⚠️ First request after restart: 8-12s

### After (Database Cache)
- ✅ Cache persists across restarts
- ✅ Shared cache for all instances
- ✅ Durable storage in Supabase
- ✅ Monitoring and statistics
- ✅ Subsequent requests: ~0.2s

## Related Files

### New Files
- `supabase/migrations/026_core_portfolios_cache.sql` - Database schema
- `src/lib/services/core-portfolios-cache.ts` - Cache service layer
- `CORE_PORTFOLIOS_CACHE_SYSTEM.md` - This documentation

### Modified Files
- `src/app/api/core-portfolios/analyze/route.ts` - Updated to use DB cache

### Related Systems
- `src/lib/services/time-portfolio-cache.ts` - Similar pattern for TIME Portfolio
- `supabase/migrations/025_scenario_testing_caches.sql` - TIME Portfolio cache tables

## Best Practices

### When to Clear Cache
- After updating Core Portfolio allocations in `src/lib/clockwise-portfolios.ts`
- After major changes to Kronos analyzer logic
- When market data is stale or incorrect

### Cache Warming
You can pre-populate the cache during deployment:

```typescript
// In a deployment script or API endpoint
import { POST } from '@/app/api/core-portfolios/analyze/route';

// Trigger analysis to warm cache
await POST(new NextRequest('http://localhost:3000/api/core-portfolios/analyze', {
  method: 'POST'
}));
```

## Troubleshooting

### Cache Not Working
```typescript
// Check cache validity
import { isCorePortfoliosCacheValid } from '@/lib/services/core-portfolios-cache';
const isValid = await isCorePortfoliosCacheValid();
console.log('Cache valid:', isValid);

// Check what's in cache
import { getAllCachedCorePortfolios } from '@/lib/services/core-portfolios-cache';
const cached = await getAllCachedCorePortfolios();
console.log('Cached portfolios:', cached?.length);
```

### Stale Data
```typescript
// Force cache refresh
import { clearCorePortfoliosCache } from '@/lib/services/core-portfolios-cache';
await clearCorePortfoliosCache();

// Next request will trigger fresh analysis
```

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check Supabase connection in your environment
- Ensure migration was applied successfully

## Future Enhancements

- [ ] Add cache versioning for breaking changes
- [ ] Implement cache warming via scheduled jobs (Inngest)
- [ ] Add cache metrics to admin dashboard
- [ ] Support multiple time horizons (1yr, 3yr, 5yr)
- [ ] Implement cache preheating on portfolio allocation updates
