# Clockwise Capital - Portfolio Calculation System

## Return Calculation Flow

### Year 1 Return (Per Position)
| Holding Type | Data Source | Calculation |
|--------------|-------------|-------------|
| **Individual Stocks** | FactSet | `(Target Price / Current Price) - 1` |
| **Index/Sector ETFs** | Clockwise DB | `(Clockwise Target / Current Price) - 1` |
| **Short/Inverse ETFs** | Derived | `Underlying Index Return × Leverage × -1` |
| **Unknown Tickers** | Fallback | Asset class average (7% stocks, 2% bonds, etc.) |

### Years 2+ Return (Long-Term Averages)
| Asset Class | Real Return | Source |
|-------------|-------------|--------|
| Stocks | 7.0% | Historical inflation-adjusted |
| Bonds | 2.0% | Historical inflation-adjusted |
| Real Estate | 5.0% | Historical inflation-adjusted |
| Commodities | 1.0% | Historical inflation-adjusted |
| Cash | 0.0% | Matches inflation |

### Blended Return Formula (Multi-Year)
```
Total Growth = (1 + Year1Return) × (1 + LongTermReturn)^(Years-1)
Annualized Return = TotalGrowth^(1/Years) - 1
```
**Example (QQQ over 10 years):**
- Year 1: -0.2% (Clockwise target)
- Years 2-10: 7.0% (stocks average)
- Blended: `((1 - 0.002) × (1.07)^9)^(1/10) - 1 = 6.3%`

---

## Scenario Handling

| Scenario | Portfolio Return | Position Returns |
|----------|------------------|------------------|
| **Single Holding (100%)** | Blended over timeframe | Same as portfolio |
| **Multiple Holdings** | Weighted blended average | Each position's blended return |
| **Proxy Portfolio** | ETF blended returns | Asset class averages |
| **No Holdings Specified** | Asset class allocation | N/A (proxy used) |

### Asset Class Inference
When user enters tickers without allocation percentages:
```
QQQ 100% → stocks: 100%, bonds: 0%, ...
AAPL 60% + AGG 40% → stocks: 60%, bonds: 40%, ...
```

---

## Monte Carlo Simulation

### What It Calculates
- **Upside (95th percentile):** Best-case annual return
- **Downside (5th percentile):** Worst-case annual return  
- **Median:** Most likely outcome

### Parameters
| Year | Expected Return | Volatility |
|------|-----------------|------------|
| Year 1 | Position's Year 1 return | Historical (from Yahoo) |
| Years 2+ | Asset class average | Asset class average (18% stocks) |

### Simulation Details
- 5,000 simulations per position
- Geometric Brownian Motion with volatility drag correction
- Portfolio-level MC aggregates position results

---

## Caching Strategy

### What's Cached

| Cache | TTL | Storage | What's Stored |
|-------|-----|---------|---------------|
| **TIME Portfolio** | 6 hours | Supabase | Positions, MC results, expected returns |
| **Volatility** | 24 hours | Supabase | Historical volatility per ticker |
| **Cycle Analysis** | 30 min | In-memory | AI-generated cycle phases |

### Cache Effectiveness

| Operation | Without Cache | With Cache | Savings |
|-----------|---------------|------------|---------|
| TIME Portfolio MC | 4-5 minutes | Instant | ~99% |
| Volatility lookup | 2-3s/ticker | 50-100ms | ~95% |
| Full analysis | 5+ minutes | 15-30s | ~90% |

### Why This Works

1. **TIME Portfolio is static** - Same holdings for all users, refreshed via Inngest every 6 hours
2. **Volatility changes slowly** - 24-hour cache is sufficient for daily price swings
3. **User portfolios vary** - Only cache shared data, compute unique holdings fresh

---

## Inngest Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `refresh-time-portfolio-cache` | Every 6 hours | Pre-compute TIME portfolio MC |
| `refresh-volatility-cache` | Daily midnight | Pre-compute volatility for common tickers |

### Flow Diagram
```
User Request
     │
     ▼
┌─────────────────┐
│ Check TIME Cache│─── Hit ──→ Use cached TIME data
└────────┬────────┘
         │ Miss
         ▼
┌─────────────────┐
│ Compute TIME +  │──────────→ Save to Supabase
│ Cache result    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Check Volatility│─── Hit ──→ Use cached volatility
│ Cache           │
└────────┬────────┘
         │ Miss
         ▼
┌─────────────────┐
│ Fetch from Yahoo│──────────→ Save to Supabase
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Run User MC     │──────────→ Return results
│ (always fresh)  │
└─────────────────┘
```

