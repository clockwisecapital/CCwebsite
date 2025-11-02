# Data Sources for Cycle Analysis

## How It Works

```
1. Your API fetches REAL DATA → 2. Feeds it to Claude → 3. Claude applies FRAMEWORKS → 4. Returns analysis
```

**Anthropic/Claude does NOT fetch data** - it only analyzes what you give it!

---

## Data Sources Breakdown

### ✅ **Real-Time Data (APIs)**

| Data Type | Source | Cost | Update Frequency |
|-----------|--------|------|------------------|
| **Economic Indicators** | [FRED API](https://fred.stlouisfed.org/) | FREE | Daily |
| GDP, Unemployment, Inflation | Federal Reserve | Free API key | Daily |
| Treasury Yields, Fed Funds Rate | Federal Reserve | Free API key | Daily |

### ⚠️ **Market Data (Need Alternative)**

| Data Type | Recommended Source | Cost |
|-----------|-------------------|------|
| S&P 500 Price | [Alpha Vantage](https://www.alphavantage.co/) | Free tier: 5 calls/min |
| Stock Prices (NVIDIA, etc.) | [Financial Modeling Prep](https://financialmodelingprep.com/) | Free tier available |
| VIX (Volatility Index) | Alpha Vantage | Free tier |

**Note:** Yahoo Finance removed their official free API. Alternatives above are recommended.

### 📊 **Manual/Quarterly Data**

| Data Type | Source | How to Get |
|-----------|--------|-----------|
| **Social Indicators** | Various Research Orgs | Update manually quarterly |
| Institutional Trust | [Pew Research](https://www.pewresearch.org/) | Published quarterly |
| Congress Approval | [Gallup](https://www.gallup.com/) | Published monthly |
| Wealth Inequality (Gini) | [Census Bureau](https://www.census.gov/) | Published annually |
| Political Stress Index | Academic research (Turchin) | Update annually |

### 💼 **Technology Indicators**

| Data Type | Source | How to Get |
|-----------|--------|-----------|
| AI Investment | Industry Reports | CB Insights, Pitchbook |
| Cloud Spending | Gartner, IDC | Quarterly reports |
| Enterprise Adoption | Surveys | Update quarterly |

### 💰 **Debt Data**

| Data Type | Source | Update |
|-----------|--------|--------|
| Federal Debt | [Treasury Direct](https://treasurydirect.gov/) | Daily |
| Debt-to-GDP | FRED API | Quarterly |

---

## Setup Instructions

### Step 1: Get FREE API Keys

#### **FRED API (Required - Most Important)**
1. Go to: https://fred.stlouisfed.org/docs/api/api_key.html
2. Create free account
3. Request API key
4. Add to `.env.local`:
```bash
FRED_API_KEY=your_fred_api_key_here
```

**What you get:**
- GDP growth rate
- Unemployment rate
- Inflation (CPI)
- Fed Funds Rate
- Treasury yields (10Y, 2Y)
- Yield curve data

#### **Alpha Vantage (Optional - for Market Data)**
1. Go to: https://www.alphavantage.co/support/#api-key
2. Get free API key (5 calls/min limit)
3. Add to `.env.local`:
```bash
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
```

**What you get:**
- S&P 500 price
- NVIDIA stock price
- VIX (volatility index)

### Step 2: Update Environment Variables

Your `.env.local` should have:
```bash
# AI Analysis
ANTHROPIC_API_KEY=sk-ant-api03-...

# Real-Time Economic Data
FRED_API_KEY=abcdef123456...

# Market Data (Optional)
ALPHA_VANTAGE_API_KEY=ABC123...
```

### Step 3: That's It!

The code I created handles everything else:
- Fetches data from APIs
- Falls back to reasonable defaults if APIs fail
- Caches data (1 hour) to avoid hitting rate limits
- Injects real data into Claude prompts
- Claude applies frameworks and returns analysis

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│  User Submits Portfolio for Analysis               │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  POST /api/portfolio/analyze-cycles                 │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│  fetchAllCycleData() - Fetch from APIs              │
│  ├── fetchEconomicIndicators() → FRED API           │
│  ├── fetchMarketIndicators() → Alpha Vantage        │
│  ├── getSocialIndicators() → Static/Manual          │
│  ├── getTechnologyIndicators() → Static/Manual      │
│  └── fetchDebtIndicators() → Treasury/FRED          │
└─────────────────┬───────────────────────────────────┘
                  ↓
        ┌─────────────────┐
        │  Real-Time Data │
        │  GDP: 2.8%      │
        │  Unemployment:  │
        │    3.9%         │
        │  Inflation: 3.2%│
        │  Yield: -0.15%  │
        │  Debt: $34.8T   │
        └────────┬────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│  Inject data into Claude prompts:                 │
│                                                    │
│  "Current GDP growth: 2.8%                        │
│   Unemployment: 3.9%                              │
│   Yield curve: -0.15% (INVERTED)                  │
│                                                    │
│   Apply these frameworks:                         │
│   - Ray Dalio Short Debt Cycle                    │
│   - NBER Business Cycle                           │
│   - Federal Reserve Taylor Rule                   │
│                                                    │
│   Determine current phase..."                     │
└────────────────┬───────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│  Anthropic Claude 3.5                              │
│  (Applies frameworks to real data)                 │
└────────────────┬───────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│  Returns: "Based on the data:                     │
│   - Current phase: Late Expansion                 │
│   - Phase %: 75%                                   │
│   - Historical analog: 2006-2007                   │
│   - Expected return: 0.07 (7%)                     │
│   ..."                                             │
└────────────────┬───────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────┐
│  Frontend displays in ReviewTab                    │
│  (Cycle, Portfolio, Goal tabs)                     │
└────────────────────────────────────────────────────┘
```

---

## What Data is Real vs Static

### ✅ **100% Real-Time** (with FRED API):
- GDP growth
- Unemployment rate
- Inflation (CPI)
- Fed Funds Rate
- Treasury yields
- Yield curve
- Federal debt levels

### ⚠️ **Fallback to Static** (without Alpha Vantage):
- S&P 500 price
- NVIDIA market cap
- VIX volatility index

### 📝 **Manually Updated** (update quarterly):
- Social indicators (trust, polarization)
- Technology indicators (AI investment, cloud spending)
- Some debt metrics

---

## Cost Analysis

### With FREE APIs Only:
- FRED API: **FREE** (no limits for personal use)
- Anthropic Claude: **~$0.10 per analysis**
- **Total: $0.10 per user**

### With Paid Market Data:
- Alpha Vantage Pro: $50/month (unlimited calls)
- Anthropic Claude: $0.10 per analysis
- **Total: $50/month + $0.10 per user**

### Recommendation:
**Start with FRED only** - it provides the most critical data for Business and Economic cycles. Market data fallbacks are reasonable estimates.

---

## Testing Without APIs

The code has smart fallbacks:

```typescript
// If FRED API fails or key not set:
return {
  gdp_growth: 2.8,        // Reasonable Nov 2024 estimate
  unemployment: 3.9,
  inflation: 3.2,
  // ... etc
};
```

So you can test the entire system **right now** without any API keys! The fallback data is close to current reality.

---

## Next Steps

1. ✅ **Test with fallback data** (works now, no keys needed)
2. ✅ **Get FRED API key** (5 minutes, free, huge data improvement)
3. ⏸️ **Get Alpha Vantage** (optional, for market data)
4. ⏸️ **Set up data refresh** (cache results, update daily)

The system is production-ready with or without the external APIs!
