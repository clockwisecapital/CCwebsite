# Manual Cache Refresh Guide (Development)

## Overview

In development mode, the automated cron schedules for cache refresh are **disabled** to prevent them from running on dev server startup. This means you'll need to manually trigger cache refreshes during development.

## Cache Types

### 1. TIME Portfolio Cache
- **What it does**: Pre-computes Monte Carlo simulations and analysis for the TIME portfolio (30+ tickers)
- **Production schedule**: Every 6 hours (1am, 7am, 1pm, 7pm UTC / 8pm, 2am, 8am, 2pm EST)
- **Cache TTL**: 6 hours
- **Processing time**: ~4-5 minutes
- **Recommended dev refresh**: Once daily, ideally in the morning

### 2. Volatility Cache
- **What it does**: Pre-computes historical volatility for common tickers (TIME holdings + popular ETFs)
- **Production schedule**: Daily at 6am UTC (1am EST)
- **Cache TTL**: 24 hours
- **Processing time**: ~2-3 minutes
- **Recommended dev refresh**: Once daily, ideally in the morning

---

## Daily Refresh Routine

### Option 1: Using Admin API (Recommended)

**Prerequisites:**
- Set `ADMIN_API_KEY` in your `.env.local` file
- Dev server must be running

**Refresh Both Caches:**
```bash
curl -X POST http://localhost:3000/api/admin/refresh-cache \
  -H "Content-Type: application/json" \
  -d '{"cacheType": "all", "adminKey": "YOUR_ADMIN_KEY_HERE"}'
```

**Refresh TIME Portfolio Only:**
```bash
curl -X POST http://localhost:3000/api/admin/refresh-cache \
  -H "Content-Type: application/json" \
  -d '{"cacheType": "time-portfolio", "adminKey": "YOUR_ADMIN_KEY_HERE"}'
```

**Refresh Volatility Only:**
```bash
curl -X POST http://localhost:3000/api/admin/refresh-cache \
  -H "Content-Type: application/json" \
  -d '{"cacheType": "volatility", "adminKey": "YOUR_ADMIN_KEY_HERE"}'
```

### Option 2: Using Postman/Insomnia

**Endpoint:** `POST http://localhost:3000/api/admin/refresh-cache`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "cacheType": "all",
  "adminKey": "YOUR_ADMIN_KEY_HERE"
}
```

### Option 3: Using Cache Status Endpoint (No Auth Required)

```bash
# Refresh TIME portfolio
curl -X POST http://localhost:3000/api/cache/status \
  -H "Content-Type: application/json" \
  -d '{"type": "time-portfolio"}'

# Refresh volatility
curl -X POST http://localhost:3000/api/cache/status \
  -H "Content-Type: application/json" \
  -d '{"type": "volatility"}'

# Refresh both
curl -X POST http://localhost:3000/api/cache/status \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'
```

---

## When to Refresh

### Morning Routine (Recommended)
Run this command once each morning when you start development:
```bash
curl -X POST http://localhost:3000/api/admin/refresh-cache \
  -H "Content-Type: application/json" \
  -d '{"cacheType": "all", "adminKey": "YOUR_ADMIN_KEY_HERE"}'
```

### Check Cache Status
To see cache age and status:
```bash
curl http://localhost:3000/api/cache/status
```

**Response example:**
```json
{
  "timePortfolio": {
    "exists": true,
    "ageMinutes": 45,
    "ttlMinutes": 360,
    "isValid": true
  },
  "volatilityCache": {
    "cachedTickers": 45,
    "averageAgeHours": 12
  }
}
```

---

## Why Manual Refresh is Needed

1. **Prevents dev server slowdowns** - Automatic cron jobs were running on startup, causing 4-5 minute delays
2. **Keeps data fresh** - Stock prices and analysis change daily
3. **Matches production behavior** - Ensures your dev environment reflects real-world cache patterns
4. **API rate limits** - Manual control prevents excessive API calls to Yahoo Finance

---

## Troubleshooting

### Cache Refresh Fails
**Symptoms:** API returns 500 error or timeout

**Solutions:**
1. Check if dev server is running
2. Verify API keys are set in `.env.local`:
   - `YAHOO_FINANCE_API_KEY` (if used)
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Check terminal logs for specific error messages
4. Try refreshing one cache at a time instead of "all"

### Cache Not Being Used
**Symptoms:** Portfolio analysis is slow despite cache

**Check cache validity:**
```bash
curl http://localhost:3000/api/cache/status
```

If `isValid: false`, the cache is expired and needs refresh.

### Monitor Refresh Progress
Watch the terminal where your dev server is running. You'll see:
```
🔄 Starting TIME portfolio cache refresh...
📊 Fetched 30 TIME portfolio holdings
📊 Fetched prices for 30 tickers
🎲 Running Monte Carlo for 30 tickers...
✅ Monte Carlo complete
✅ TIME portfolio cache saved
✅ TIME portfolio cache refresh complete in 245s
```

---

## Production Notes

In production, these caches refresh automatically:
- **TIME Portfolio**: Every 6 hours (1am, 7am, 1pm, 7pm UTC)
- **Volatility**: Daily at 6am UTC

No manual intervention needed in production.

---

## Quick Reference Commands

**Morning routine (start here):**
```bash
# 1. Start dev server
npm run dev

# 2. Wait for server to start, then refresh caches (in a new terminal)
curl -X POST http://localhost:3000/api/admin/refresh-cache \
  -H "Content-Type: application/json" \
  -d '{"cacheType": "all", "adminKey": "YOUR_ADMIN_KEY_HERE"}'

# 3. Check status (optional)
curl http://localhost:3000/api/cache/status
```

**Create a bash alias (optional):**
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
alias refresh-cache='curl -X POST http://localhost:3000/api/admin/refresh-cache -H "Content-Type: application/json" -d "{\"cacheType\": \"all\", \"adminKey\": \"YOUR_ADMIN_KEY_HERE\"}"'
```

Then simply run: `refresh-cache`

---

## Related Files

- Implementation: `src/inngest/functions.ts`
- Cache service: `src/lib/services/time-portfolio-cache.ts`
- Admin endpoint: `src/app/api/admin/refresh-cache/route.ts`
- Status endpoint: `src/app/api/cache/status/route.ts`
