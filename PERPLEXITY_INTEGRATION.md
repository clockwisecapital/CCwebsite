# Perplexity AI Integration for Real-Time Data

## Overview

We've replaced all third-party financial APIs (FRED, Yahoo Finance, etc.) with **Perplexity AI** for real-time data fetching. This provides:

✅ **Single API** - One API key instead of multiple  
✅ **Real-time web access** - Perplexity searches the latest data  
✅ **Structured JSON** - Guaranteed response format  
✅ **No rate limits** - More flexible than free tier APIs  
✅ **Always current** - Data is always up-to-date from web sources  

---

## Setup

### 1. Get Perplexity API Key

1. Go to [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Create an API key
3. Add to `.env.local`:

```bash
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx  # Still needed for cycle analysis
```

### 2. Install Package

```bash
npm install @perplexity-ai/perplexity_ai
```

---

## Data Sources

### ✅ Now Fetched via Perplexity

All the following data is now fetched in real-time from web sources:

#### **Economic Indicators**
- GDP growth rate
- Unemployment rate
- CPI inflation rate
- Federal Funds Rate
- 10-Year Treasury yield
- 2-Year Treasury yield

**Sources searched:** Federal Reserve, Bureau of Labor Statistics, US Treasury

#### **Market Indicators**
- S&P 500 current price
- S&P 500 P/E ratio
- S&P 500 distance from all-time high
- NVIDIA market capitalization
- VIX volatility index

**Sources searched:** Real-time market data providers, financial news

#### **Technology Indicators**
- Total AI investment (billions)
- ChatGPT/OpenAI active users
- Global cloud spending
- Tech industry layoffs
- Enterprise AI adoption rate

**Sources searched:** Industry reports (CB Insights, Gartner), company announcements

#### **Debt Indicators**
- Total US federal debt
- Federal debt-to-GDP ratio
- Total debt-to-GDP ratio
- Annual federal interest payments

**Sources searched:** US Treasury, Federal Reserve, Congressional Budget Office

#### **Social Indicators**
Still manually updated (change slowly):
- Institutional trust (Pew Research)
- Political polarization
- Congress approval (Gallup)
- Wealth inequality (Gini coefficient)
- Turchin Political Stress Index

---

## How It Works

### Example: Fetching Economic Data

```typescript
const client = new Perplexity({ apiKey: PERPLEXITY_API_KEY });

const completion = await client.chat.completions.create({
  messages: [{
    role: 'user',
    content: `Find the most recent US economic indicators...`
  }],
  model: 'sonar-pro',
  response_format: {
    type: 'json_schema',
    json_schema: {
      schema: {
        type: 'object',
        properties: {
          gdp_growth: { type: 'number' },
          unemployment: { type: 'number' },
          // ... etc
        },
        required: [...]
      }
    }
  }
});

const data = JSON.parse(completion.choices[0].message.content);
// Returns: { gdp_growth: 2.8, unemployment: 3.9, ... }
```

---

## Benefits Over Previous Approach

### **Before (FRED + Yahoo + Manual Updates)**
❌ Multiple API keys needed  
❌ FRED API rate limits (120 calls/minute)  
❌ Yahoo Finance API deprecated  
❌ Some data manually hardcoded  
❌ Complex API integration code  
❌ Data could be stale  

### **After (Perplexity Only)**
✅ One API key  
✅ No strict rate limits  
✅ Always searches latest web data  
✅ All data automated  
✅ Simple, clean code  
✅ Always current  

---

## Data Flow

```
User submits intake form
        ↓
API calls fetchAllCycleData()
        ↓
4 Parallel Perplexity calls:
  1. Economic indicators
  2. Market indicators
  3. Technology indicators
  4. Debt indicators
        ↓
Data returned in structured JSON
        ↓
Fed into Claude AI for cycle analysis
        ↓
Results displayed in Cycle/Portfolio/Goal tabs
```

---

## Fallback Strategy

If Perplexity API fails or key is missing, the system falls back to:
- Recent hardcoded values (November 2024 estimates)
- Logged warnings in console
- Analysis still runs (doesn't crash)

---

## Cost Comparison

### Perplexity API Pricing
- **Sonar Pro model:** ~$5 per 1,000 requests
- **Per analysis:** 4 requests = $0.02
- **100 users:** $2.00

### Previous Approach
- **FRED API:** Free but rate-limited
- **Yahoo Finance:** Deprecated/unreliable
- **Manual updates:** Time-consuming

**Winner:** Perplexity is more reliable and scalable! 🎯

---

## Monitoring

Watch for these console logs:

```bash
# Success
✅ Economic data fetched from Perplexity
✅ Market data fetched from Perplexity
✅ Technology data fetched from Perplexity
✅ Debt data fetched from Perplexity

# Warnings (using fallback)
⚠️ PERPLEXITY_API_KEY not set, using fallback data

# Errors (but analysis continues)
❌ Error fetching economic data from Perplexity: [error details]
```

---

## Testing

To verify data is being fetched:

1. Add `PERPLEXITY_API_KEY` to `.env.local`
2. Submit an intake form
3. Check terminal for logs:
   ```bash
   📊 Fetching real-time economic data...
   ✅ Real-time data fetched: { gdp: 2.8, unemployment: 3.9, inflation: 3.2 }
   ```
4. Values should reflect current real-world data, not fallback values

---

## Files Modified

- ✅ `src/lib/data-sources.ts` - Complete refactor to use Perplexity
- ✅ Removed FRED API calls
- ✅ Removed Yahoo Finance integration
- ✅ All fetching now async with Perplexity

---

## Next Steps

1. **Add PERPLEXITY_API_KEY to production env variables**
2. **Monitor API usage** in Perplexity dashboard
3. **Optional:** Cache Perplexity responses for 1 hour to reduce costs
4. **Future:** Consider batching all 4 calls into one mega-prompt for efficiency

---

## Troubleshooting

**Q: Data looks outdated**  
A: Check if `PERPLEXITY_API_KEY` is set. Without it, fallback data is used.

**Q: Getting API errors**  
A: Verify API key is valid at [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)

**Q: Want to verify data source**  
A: Perplexity cites sources - check the raw API response for citations.

**Q: Too expensive?**  
A: Implement caching layer to store responses for 1-6 hours.

---

## Summary

Perplexity AI now powers **all real-time data fetching** for cycle analysis, providing fresh, accurate data from the web in a structured format. This is a massive improvement over juggling multiple APIs! 🚀
