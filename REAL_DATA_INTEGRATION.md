# Real Data Integration Guide

## Overview

This guide shows how to fetch real market data and integrate it with AI analysis for the cycle analysis feature.

---

## 1. Market Cycle (S&P 500) - Real Data

### Data Sources

**Yahoo Finance API** (Free)
- S&P 500 historical prices
- Current price, volume, market cap
- Real-time data

**Alternative: Alpha Vantage API** (Free tier available)
- Similar data to Yahoo Finance
- More structured API

### Implementation

```python
# backend/services/market_data.py

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def get_sp500_data():
    """Fetch real S&P 500 data"""
    spy = yf.Ticker("SPY")
    
    # Get current price
    current_price = spy.info['currentPrice']
    
    # Get historical data (5 years for cycle analysis)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=5*365)
    hist_data = spy.history(start=start_date, end=end_date)
    
    # Calculate key metrics
    current_pe = spy.info.get('trailingPE', None)
    year_high = hist_data['High'].rolling(window=252).max().iloc[-1]
    year_low = hist_data['Low'].rolling(window=252).min().iloc[-1]
    current_from_high = (current_price - year_high) / year_high
    
    # Calculate volatility (annualized)
    returns = hist_data['Close'].pct_change()
    volatility = returns.std() * (252 ** 0.5)
    
    # Determine bull/bear market (simple heuristic)
    sma_200 = hist_data['Close'].rolling(window=200).mean().iloc[-1]
    above_sma = current_price > sma_200
    
    return {
        'current_price': current_price,
        'pe_ratio': current_pe,
        'from_52w_high': current_from_high,
        'volatility': volatility,
        'above_200sma': above_sma,
        'year_high': year_high,
        'year_low': year_low,
        'historical_data': hist_data
    }

def calculate_market_cycle_phase(market_data):
    """
    Use real data to estimate market cycle phase
    Returns: phase name, percentage through cycle
    """
    
    # Simple heuristic (can be enhanced with AI)
    pe_ratio = market_data['pe_ratio']
    volatility = market_data['volatility']
    from_high = market_data['from_52w_high']
    
    # Determine phase based on metrics
    if from_high > -0.05 and volatility < 0.15:
        phase = "Late Bull"
        # High valuations + low vol = late stage
        phase_percent = 85
    elif from_high < -0.20 and volatility > 0.25:
        phase = "Bear Market"
        phase_percent = 95
    elif from_high < -0.10 and volatility > 0.20:
        phase = "Early Bear"
        phase_percent = 90
    elif market_data['above_200sma'] and volatility < 0.18:
        phase = "Mid Bull"
        phase_percent = 60
    else:
        phase = "Early Bull"
        phase_percent = 30
    
    return phase, phase_percent

def backtest_sp500_returns(market_data, phase_percent):
    """
    Run Monte Carlo simulation using REAL historical data
    """
    hist_data = market_data['historical_data']
    returns = hist_data['Close'].pct_change().dropna()
    
    # Use similar historical periods (similar volatility regime)
    current_vol = returns.tail(60).std()
    
    # Find historical periods with similar volatility
    rolling_vol = returns.rolling(60).std()
    similar_periods = rolling_vol[
        (rolling_vol > current_vol * 0.8) & 
        (rolling_vol < current_vol * 1.2)
    ]
    
    # Extract returns from those periods
    similar_returns = []
    for idx in similar_periods.index:
        period_returns = returns.loc[idx:idx+pd.Timedelta(days=252)]
        if len(period_returns) >= 200:
            similar_returns.append(period_returns)
    
    # Monte Carlo simulation
    n_simulations = 10000
    n_days = 252  # 1 year
    
    all_returns = pd.concat(similar_returns) if similar_returns else returns
    
    simulated_returns = np.random.choice(
        all_returns.values, 
        size=(n_simulations, n_days)
    )
    
    final_returns = (1 + simulated_returns).prod(axis=1) - 1
    
    return {
        'expectedUpside': np.percentile(final_returns, 95),
        'expectedReturn': np.percentile(final_returns, 50),
        'expectedDownside': np.percentile(final_returns, 5)
    }
```

---

## 2. Company Cycle - Real Data

### Data Sources

**Yahoo Finance / Financial Modeling Prep**
- Company fundamentals
- Revenue growth
- Profit margins
- Cash flow

### Implementation

```python
# backend/services/company_data.py

import yfinance as yf

def get_company_lifecycle_data(ticker):
    """Fetch real company data to determine lifecycle stage"""
    company = yf.Ticker(ticker)
    info = company.info
    
    # Get financials
    financials = company.financials
    
    # Key metrics
    revenue_growth = info.get('revenueGrowth', 0)
    profit_margin = info.get('profitMargins', 0)
    free_cashflow = info.get('freeCashflow', 0)
    roe = info.get('returnOnEquity', 0)
    
    # Determine lifecycle stage
    if revenue_growth > 0.30 and profit_margin < 0.10:
        stage = "Growth"
        stage_percent = 40
    elif revenue_growth > 0.15 and profit_margin > 0.15:
        stage = "Rapid Growth"
        stage_percent = 50
    elif revenue_growth < 0.10 and profit_margin > 0.20 and free_cashflow > 0:
        stage = "Maturity"
        stage_percent = 70
    elif revenue_growth < 0 or profit_margin < 0:
        stage = "Decline"
        stage_percent = 90
    else:
        stage = "Startup/Early"
        stage_percent = 20
    
    return {
        'stage': stage,
        'stage_percent': stage_percent,
        'revenue_growth': revenue_growth,
        'profit_margin': profit_margin,
        'roe': roe
    }

def analyze_portfolio_companies(holdings):
    """
    Analyze all companies in portfolio
    Returns weighted average lifecycle stage
    """
    total_value = sum(h['shares'] * h['price'] for h in holdings)
    weighted_stage = 0
    
    for holding in holdings:
        if holding['ticker'] not in ['SPY', 'AGG', 'VNQ']:  # Skip ETFs
            company_data = get_company_lifecycle_data(holding['ticker'])
            weight = (holding['shares'] * holding['price']) / total_value
            weighted_stage += company_data['stage_percent'] * weight
    
    return {
        'weighted_stage_percent': weighted_stage,
        'dominant_stage': determine_stage_from_percent(weighted_stage)
    }
```

---

## 3. Economic Indicators - Real Data (FRED API)

### Data Sources

**Federal Reserve Economic Data (FRED)** - Free API

Key indicators:
- GDP growth
- Unemployment rate
- Inflation (CPI)
- Interest rates
- Yield curve

### Implementation

```python
# backend/services/economic_data.py

import requests
from datetime import datetime, timedelta

FRED_API_KEY = "your_fred_api_key"  # Get free at https://fred.stlouisfed.org/

def get_fred_data(series_id, days_back=365):
    """Fetch data from FRED API"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    url = f"https://api.stlouisfed.org/fred/series/observations"
    params = {
        'series_id': series_id,
        'api_key': FRED_API_KEY,
        'file_type': 'json',
        'observation_start': start_date.strftime('%Y-%m-%d'),
        'observation_end': end_date.strftime('%Y-%m-%d')
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if 'observations' in data:
        latest = data['observations'][-1]['value']
        return float(latest)
    return None

def get_economic_indicators():
    """Fetch all key economic indicators"""
    
    indicators = {
        'gdp_growth': get_fred_data('A191RL1Q225SBEA'),  # Real GDP
        'unemployment': get_fred_data('UNRATE'),          # Unemployment rate
        'inflation': get_fred_data('CPIAUCSL'),          # CPI
        'fed_funds_rate': get_fred_data('FEDFUNDS'),    # Fed funds rate
        'yield_curve': (
            get_fred_data('GS10') - get_fred_data('GS2')  # 10Y-2Y spread
        )
    }
    
    return indicators

def determine_business_cycle_phase(indicators):
    """
    Use real economic data to determine business cycle phase
    """
    unemployment = indicators['unemployment']
    inflation = indicators['inflation']
    yield_curve = indicators['yield_curve']
    
    # Simple heuristic
    if yield_curve < 0:
        # Inverted yield curve = late cycle / recession risk
        phase = "Late Expansion"
        phase_percent = 85
    elif unemployment < 4.0 and inflation > 3.0:
        # Low unemployment + high inflation = late cycle
        phase = "Late Expansion"
        phase_percent = 75
    elif unemployment > 6.0:
        # High unemployment = recession/downturn
        phase = "Downturn"
        phase_percent = 95
    elif unemployment < 6.0 and indicators['gdp_growth'] > 2.5:
        # Moderate unemployment + good growth = mid expansion
        phase = "Mid Expansion"
        phase_percent = 50
    else:
        # Recovery phase
        phase = "Early Expansion"
        phase_percent = 25
    
    return phase, phase_percent
```

---

## 4. Integration with AI Analysis

### Combined Approach

```python
# backend/api/analyze_cycles.py

from services.market_data import get_sp500_data, calculate_market_cycle_phase, backtest_sp500_returns
from services.company_data import analyze_portfolio_companies
from services.economic_data import get_economic_indicators, determine_business_cycle_phase
import anthropic  # or openai

async def analyze_cycles_with_real_data(intake_data):
    """
    Step 1: Fetch all real data
    Step 2: Use AI to interpret and enhance
    """
    
    # Fetch real data
    market_data = get_sp500_data()
    economic_data = get_economic_indicators()
    company_data = analyze_portfolio_companies(intake_data['holdings'])
    
    # Calculate phases from real data
    market_phase, market_percent = calculate_market_cycle_phase(market_data)
    business_phase, business_percent = determine_business_cycle_phase(economic_data)
    
    # Run real backtests
    market_backtest = backtest_sp500_returns(market_data, market_percent)
    
    # Use AI to analyze OTHER cycles (Country, Technology, Economic long-term)
    ai_prompt = f"""
    Based on the following REAL economic and market data:
    
    Market Data:
    - S&P 500: ${market_data['current_price']}
    - P/E Ratio: {market_data['pe_ratio']}
    - Volatility: {market_data['volatility']:.2%}
    - Distance from high: {market_data['from_52w_high']:.2%}
    
    Economic Data:
    - GDP Growth: {economic_data['gdp_growth']:.1f}%
    - Unemployment: {economic_data['unemployment']:.1f}%
    - Inflation: {economic_data['inflation']:.1f}%
    - Fed Funds Rate: {economic_data['fed_funds_rate']:.2f}%
    - Yield Curve: {economic_data['yield_curve']:.2f}%
    
    Analyze the following cycles using established frameworks:
    
    1. Country Cycle (Strauss-Howe, Turchin frameworks)
    2. Technology Cycle (Carlota Perez, Kondratiev frameworks)
    3. Economic Cycle - Long Term (Ray Dalio, Kondratiev frameworks)
    
    For each cycle, provide:
    - Current phase name
    - Percentage through cycle (0-100)
    - Average lifecycle duration
    - Timeline breakdown
    - Best historical analog period with description
    
    Return as structured JSON matching the CycleData type definition.
    """
    
    # Call AI (Claude or GPT-4)
    client = anthropic.Anthropic(api_key="your_api_key")
    
    ai_response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4000,
        messages=[{
            "role": "user",
            "content": ai_prompt
        }]
    )
    
    ai_cycles = parse_ai_response(ai_response.content[0].text)
    
    # Combine real data with AI analysis
    return {
        'cycles': {
            'country': ai_cycles['country'],
            'technology': ai_cycles['technology'],
            'economic': ai_cycles['economic'],
            'business': {
                'name': 'Business Cycle',
                'phase': business_phase,
                'phasePercent': business_percent,
                # ... use real economic data
                'sp500Backtest': {
                    'expectedUpside': 0.20,  # Calculate from economic regime
                    'expectedDownside': -0.15,
                    'expectedReturn': 0.07
                }
            },
            'market': {
                'name': 'S&P 500 Cycle',
                'phase': market_phase,
                'phasePercent': market_percent,
                # ... use real market data
                'sp500Backtest': market_backtest  # Real backtest!
            },
            'company': {
                'name': 'Company Cycle',
                'phase': company_data['dominant_stage'],
                'phasePercent': company_data['weighted_stage_percent'],
                # ... use real company data
            }
        }
    }
```

---

## 5. API Endpoint

```typescript
// src/app/api/portfolio/analyze-cycles/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { intakeData } = await req.json();
  
  try {
    // Call Python backend (or implement in TypeScript)
    const response = await fetch('http://localhost:8000/api/analyze-cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeData })
    });
    
    const cycleAnalysis = await response.json();
    
    return NextResponse.json({
      success: true,
      cycleAnalysis
    });
    
  } catch (error) {
    console.error('Cycle analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze cycles' },
      { status: 500 }
    );
  }
}
```

---

## 6. Update Frontend to Use Real Data

```typescript
// In PortfolioDashboard.tsx - when analysis completes

const handleAnalyze = async () => {
  setIsAnalyzing(true);
  
  try {
    // Existing analysis
    const analysisResponse = await fetch('/api/portfolio/analyze-dashboard', {
      method: 'POST',
      body: JSON.stringify({ userData, intakeData })
    });
    
    const analysisData = await analysisResponse.json();
    
    // NEW: Fetch cycle analysis with real data
    const cycleResponse = await fetch('/api/portfolio/analyze-cycles', {
      method: 'POST',
      body: JSON.stringify({ intakeData })
    });
    
    const cycleData = await cycleResponse.json();
    
    // Combine both analyses
    setAnalysisResult({
      ...analysisData.analysis,
      cycleAnalysis: cycleData.cycleAnalysis  // Add cycle data
    });
    
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    setIsAnalyzing(false);
  }
};
```

---

## 7. Update ReviewTab to Use Real Data

```typescript
// In ReviewTab.tsx, replace mock data check:

const cycleData = analysisResult.cycleAnalysis?.cycles || mockCycleAnalysisData.cycles;
const portfolioAnalysis = analysisResult.cycleAnalysis?.portfolioAnalysis || mockCycleAnalysisData.portfolioAnalysis;
const goalAnalysis = analysisResult.cycleAnalysis?.goalAnalysis || mockCycleAnalysisData.goalAnalysis;
```

---

## Summary: What Uses Real Data

| Cycle | Real Data Source | AI Enhancement |
|-------|-----------------|----------------|
| **Market (S&P 500)** | ✅ Yahoo Finance | AI for historical analogs |
| **Company** | ✅ Yahoo Finance | AI for lifecycle classification |
| **Business** | ✅ FRED API | AI for interpretation |
| **Country** | ❌ None | ✅ AI analyzes frameworks |
| **Technology** | ❌ None | ✅ AI analyzes frameworks |
| **Economic (Long)** | ⚠️ Partial (FRED) | ✅ AI combines with frameworks |

## Quick Start

1. **Install Python dependencies**:
   ```bash
   pip install yfinance pandas numpy anthropic requests
   ```

2. **Get API Keys**:
   - FRED API: https://fred.stlouisfed.org/docs/api/api_key.html (Free)
   - Anthropic/OpenAI: For AI analysis

3. **Set up backend service** (Flask or FastAPI)

4. **Call from Next.js** as shown above

This approach gives you **real, current data** for market/company/business cycles while using **AI for sophisticated framework analysis** on the longer cycles!
