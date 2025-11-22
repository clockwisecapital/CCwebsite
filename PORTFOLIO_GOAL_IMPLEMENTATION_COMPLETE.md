# Portfolio & Goal Tab Implementation - Complete ✅

## Overview
Successfully implemented side-by-side portfolio comparison with TIME portfolio, real target price calculations, and Monte Carlo simulations using Yahoo Finance data.

---

## 🎯 What Was Implemented

### 1. Type Definitions ✅
**File:** `src/types/portfolio.ts`

Created comprehensive TypeScript interfaces:
- `TgtPrice` - Target price data structure
- `HoldingWeight` - TIME portfolio holdings
- `MonteCarloResult` - Simulation results with percentiles
- `PositionAnalysis` - Individual position metrics
- `PortfolioComparison` - Side-by-side comparison structure
- `YahooFinanceQuote` & `HistoricalPrice` - Yahoo Finance data types
- `PriceUpdateResult` - Price update tracking

### 2. Monte Carlo Simulation Service ✅
**File:** `src/lib/services/monte-carlo.ts`

**Key Features:**
- Fetches 1-2 years of historical data from Yahoo Finance
- Calculates volatility and daily returns
- Runs 10,000 simulations using Geometric Brownian Motion
- Returns 5th percentile (downside), 50th percentile (median), 95th percentile (upside)
- Batch processing for multiple tickers
- Current price fetching from Yahoo Finance

**Functions:**
```typescript
runMonteCarloSimulation(ticker, currentPrice, timeHorizon)
runBatchMonteCarloSimulations(tickers, timeHorizon)
fetchHistoricalPrices(ticker, period)
fetchCurrentPrice(ticker)
fetchBatchCurrentPrices(tickers)
```

### 3. Database Functions ✅
**File:** `src/lib/supabase/database.ts`

**New Functions:**
- `getTgtPrices(tickers)` - Query tgt_price table (parses text to number)
- `getHoldingWeights()` - Fetch TIME portfolio positions
- `updateHoldingPrice(ticker, price)` - Update single position price
- `batchUpdateHoldingPrices(updates)` - Batch update prices

**Database Tables Used:**
- `tgt_price` - Target prices (Ticker, Consensus Tgt Price)
- `holding_weights` - TIME portfolio (StockTicker, SecurityName, Shares, Price, MarketValue, Weightings)

### 4. Yahoo Finance Price Update API ✅
**File:** `src/app/api/portfolio/update-prices/route.ts`

**Endpoints:**
- `POST /api/portfolio/update-prices` - Updates all TIME portfolio prices from Yahoo Finance
- `GET /api/portfolio/update-prices` - Returns current holdings with prices

**Usage:**
```bash
# Update all prices
curl -X POST http://localhost:3000/api/portfolio/update-prices

# Check current prices
curl http://localhost:3000/api/portfolio/update-prices
```

### 5. Portfolio Data Fetching API ✅
**File:** `src/app/api/portfolio/get-portfolio-data/route.ts`

**Endpoint:** `POST /api/portfolio/get-portfolio-data`

**Process:**
1. Receives user holdings (ticker, name, percentage)
2. Fetches TIME portfolio from holding_weights
3. Gets current prices from Yahoo Finance
4. Gets target prices from tgt_price table
5. Runs Monte Carlo simulations for all positions
6. Calculates expected returns: `(CurrentPrice - TgtPrice) / CurrentPrice`
7. Calculates weighted averages
8. Returns top 5 positions for each portfolio

**Request Body:**
```json
{
  "userHoldings": [
    { "ticker": "SPY", "name": "SPDR S&P 500", "percentage": 50 },
    { "ticker": "TSLA", "name": "Tesla Inc", "percentage": 50 }
  ],
  "portfolioValue": 500000,
  "timeHorizon": 1
}
```

### 6. Dashboard Analysis API Enhancement ✅
**File:** `src/app/api/portfolio/analyze-dashboard/route.ts`

**Changes:**
- Detects if user has specific holdings
- Calls `get-portfolio-data` endpoint
- Includes `portfolioComparison` in analysis results
- Non-blocking - continues if comparison fails

### 7. Portfolio Tab UI - Side-by-Side View ✅
**File:** `src/components/features/portfolio/dashboard/PortfolioTab.tsx`

**New Features:**
- **Conditional Rendering:** Shows comparison view if portfolio data available
- **Left Column:** User Portfolio
  - Total value
  - Weighted average expected return
  - Top 5 positions with ticker, weight, expected return, upside, downside
- **Right Column:** TIME Portfolio (highlighted in teal)
  - Same metrics as user portfolio
  - Clockwise branding
- **Fallback:** Original view if no comparison data

**Visual Design:**
- Side-by-side grid layout (responsive)
- Color-coded metrics (green for positive, red for negative)
- Clean card-based UI matching existing design system

### 8. Goal Tab Enhancement ✅
**File:** `src/components/features/portfolio/dashboard/GoalTab.tsx`

**Changes:**
- Added note about Monte Carlo usage
- Documented pending enhancement: Long-term historical averages (awaiting client data)
- Already uses Monte Carlo simulations from cycle analysis

---

## 📊 Data Flow

```
User enters holdings → IntakeTab
         ↓
analyze-dashboard API called
         ↓
Checks for specificHoldings + totalValue
         ↓
Calls get-portfolio-data API
         ↓
├─ Fetches current prices (Yahoo Finance)
├─ Fetches target prices (Supabase)
├─ Fetches TIME portfolio (Supabase)
├─ Runs Monte Carlo simulations
└─ Calculates expected returns
         ↓
Returns portfolioComparison
         ↓
ReviewTab → PortfolioTab
         ↓
Renders side-by-side comparison
```

---

## 🧪 Testing Instructions

### 1. Database Setup
Ensure these tables exist in Supabase:
```sql
-- tgt_price table (already exists)
SELECT * FROM tgt_price LIMIT 5;

-- holding_weights table
SELECT * FROM holding_weights LIMIT 5;
```

### 2. Update TIME Portfolio Prices
```bash
# Run price update endpoint
curl -X POST http://localhost:3000/api/portfolio/update-prices
```

Expected response:
```json
{
  "success": true,
  "message": "Updated 28 prices successfully",
  "summary": {
    "total": 28,
    "updated": 28,
    "failed": 0
  }
}
```

### 3. Test Portfolio Data Endpoint
```bash
curl -X POST http://localhost:3000/api/portfolio/get-portfolio-data \
  -H "Content-Type: application/json" \
  -d '{
    "userHoldings": [
      {"ticker": "SPY", "name": "SPDR S&P 500", "percentage": 50},
      {"ticker": "TSLA", "name": "Tesla", "percentage": 50}
    ],
    "portfolioValue": 500000,
    "timeHorizon": 1
  }'
```

### 4. Test Full User Flow

**Step 1:** Navigate to Portfolio page (`/portfolio`)

**Step 2:** Fill out Intake Form with:
- Personal info (name, email, age, experience)
- Goals (goal amount, time horizon, monthly contribution)
- Portfolio value: $500,000
- Asset allocation percentages
- **Specific Holdings:**
  - SPY - 50%
  - TSLA - 50%

**Step 3:** Submit and wait for analysis

**Step 4:** Review Tab should appear with 3 sub-tabs:
- Goal Tab (probability, projected values)
- **Portfolio Tab** ← Should show side-by-side comparison
- Market Tab (cycle analysis)

**Step 5:** Check Portfolio Tab displays:
- User Portfolio (left side)
- TIME Portfolio (right side, teal theme)
- Top 5 positions for each
- Expected returns, upside, downside for each position

### 5. Test Fallback Scenario

Test with user who doesn't provide specific holdings:
- Should show original Portfolio Tab view (no comparison)
- No errors should occur

---

## 📐 Formulas Used

### Expected Return
```
Expected Return = (Current Price - Target Price) / Current Price
```

Example:
- Current Price: $100
- Target Price: $90
- Expected Return: (100 - 90) / 100 = 0.10 = +10%

### Weighted Average Return
```
Portfolio Return = Σ (Position Weight × Position Expected Return)
```

Example:
- SPY: 50% weight, +10% return → 0.5 × 0.10 = 0.05
- TSLA: 50% weight, +15% return → 0.5 × 0.15 = 0.075
- Portfolio Return: 0.05 + 0.075 = 0.125 = +12.5%

### Monte Carlo Simulation
Uses Geometric Brownian Motion:
```
S(t+1) = S(t) × (1 + r)
where r ~ Normal(μ, σ)
μ = average daily return
σ = standard deviation of daily returns
```

---

## 🔧 Configuration

### Environment Variables
No additional env vars needed. Uses existing:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_BASE_URL` (optional, defaults to localhost:3000)

### Yahoo Finance API
- **Free, no auth required**
- Rate limits: ~2,000 requests/hour
- Historical data: Up to 10 years
- Real-time quotes with ~15 minute delay

---

## 🚀 Deployment Notes

### Price Update Automation
Consider setting up a cron job to update prices daily:

**Option 1:** Vercel Cron (recommended)
```typescript
// app/api/cron/update-prices/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Call price update endpoint
  await fetch('http://localhost:3000/api/portfolio/update-prices', {
    method: 'POST'
  });
  
  return Response.json({ success: true });
}
```

**Option 2:** External cron service
```bash
# Add to crontab (runs daily at 4 PM EST after market close)
0 16 * * 1-5 curl -X POST https://your-domain.com/api/portfolio/update-prices
```

### CSV Upload for TGT Prices
Manual process (existing):
1. Export target prices to CSV
2. Upload to Supabase tgt_price table
3. Ensure format: Ticker, Consensus Tgt Price

---

## 🎯 Long-Term Historical Averages (UPDATED)

**Now Integrated!** Goal probability calculations use client-provided long-term averages:

| Asset Class | Long-Term Return (Nominal) |
|------------|---------------------------|
| Stocks | 10% |
| Bonds | 5% |
| Real Estate | 10% |
| Commodities | 5% |
| Cash | 3% |
| Alternatives | 8% (estimated blend) |

**Implementation:** `src/lib/services/goal-probability.ts`

**Formula:**
```
Expected Return = Σ (Asset Allocation % × Long-Term Average Return)

Example:
60% Stocks × 10% + 30% Bonds × 5% + 10% Cash × 3%
= 6% + 1.5% + 0.3% = 7.8% expected return
```

**Probability Calculation:**
- Runs 10,000 Monte Carlo simulations using expected return
- Accounts for volatility based on asset mix
- Includes monthly contributions in projections
- Returns 5th, 50th, and 95th percentiles

## ⚠️ Known Limitations

1. **Cash Positions:** Excluded from portfolio comparison Monte Carlo (no price data)
2. **Yahoo Finance Delays:** Prices may be delayed 15-20 minutes during trading hours
3. **Missing Target Prices:** Some tickers may not have target price data - shows "N/A"
4. **API Rate Limits:** Yahoo Finance limits ~2,000 requests/hour
5. **Volatility Estimates:** Portfolio volatility estimated from asset mix, not calculated from correlation matrix

---

## 🔮 Future Enhancements

1. **Real-time Price Updates:** WebSocket connection for live prices
2. **Historical Performance Charts:** Line graphs showing portfolio performance over time
3. **Correlation Matrix:** Visual heatmap of position correlations
4. **Risk Metrics:** Sharpe ratio, max drawdown, beta calculations
5. **What-If Analysis:** Interactive sliders to adjust allocations
6. **Long-term Averages Integration:** Once client provides asset class data
7. **Sector Analysis:** Breakdown by sector concentration
8. **Dividend Yield:** Include dividend data in calculations

---

## 📞 Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify database tables have data
3. Test API endpoints individually
4. Check Yahoo Finance API status

---

## ✅ Implementation Complete

All planned features have been successfully implemented:
- ✅ Type definitions
- ✅ Monte Carlo simulation service
- ✅ Database functions
- ✅ Yahoo Finance price update API
- ✅ Portfolio data fetching API
- ✅ Dashboard analysis integration
- ✅ Side-by-side Portfolio Tab UI
- ✅ Goal Tab enhancement notes
- ✅ Zero linter errors
- ✅ Full documentation

**Status:** Ready for testing and deployment! 🚀

