# Cycle Analysis Implementation Guide

## ✅ What's Been Built (Frontend)

I've created a complete frontend implementation for the Cycle Analysis feature with three main tabs:

### 1. **Cycle Tab** (`CycleTab.tsx`)
- Displays all 6 economic cycles with selectable tabs
- Interactive dial showing percentage through each cycle
- Cycle timeline with phase breakdowns
- S&P 500 historical backtest results (95th/50th/5th percentiles)
- Historical analog period with AI-generated descriptions
- Lists frameworks used in analysis

**6 Cycles Included:**
1. Country Cycle (Strauss-Howe, Turchin, Toynbee, etc.)
2. Technology Cycle (Carlota Perez, Kondratiev, Schumpeter, etc.)
3. Economic Cycle (Ray Dalio, Kondratiev, Minsky, etc.)
4. Business Cycle (Ray Dalio, NBER, Fed models, etc.)
5. Market/S&P 500 Cycle (Clockwise + analyst frameworks)
6. Company Cycle (Clockwise + academic frameworks)

### 2. **Portfolio Tab** (`PortfolioTab.tsx`)
- Overall portfolio performance summary
- Monte Carlo simulation results for each cycle
- Cycle-by-cycle impact analysis
- Comparison table across all cycles
- Expected upside/downside/return for next 12 months

### 3. **Goal Tab** (`GoalTab.tsx`)
- Goal achievement probability (median/upside/downside)
- Projected portfolio values
- Shortfall/surplus calculations
- AI-powered recommendations
- Visual progress indicators

### Supporting Files Created:
- `src/types/cycleAnalysis.ts` - TypeScript interfaces
- `src/utils/mockCycleData.ts` - Mock data for testing
- `src/components/features/portfolio/dashboard/ReviewTab_New.tsx` - New tab structure

---

## 🔄 Integration Steps

### Step 1: Replace Old ReviewTab

Rename the files:
```bash
# Backup old file
mv src/components/features/portfolio/dashboard/ReviewTab.tsx src/components/features/portfolio/dashboard/ReviewTab_Old.tsx

# Use new file
mv src/components/features/portfolio/dashboard/ReviewTab_New.tsx src/components/features/portfolio/dashboard/ReviewTab.tsx
```

### Step 2: Update AnalysisResult Interface

Add to `src/components/features/portfolio/dashboard/PortfolioDashboard.tsx`:

```typescript
import type { CycleAnalysisResult } from '@/types/cycleAnalysis';

export interface AnalysisResult {
  // ... existing fields ...
  
  // Add this:
  cycleAnalysis?: CycleAnalysisResult;
}
```

---

## 🤖 AI Backend Implementation Required

You need to build an AI-powered analysis endpoint that returns cycle analysis data. Here's what's needed:

### API Endpoint Structure

```typescript
POST /api/portfolio/analyze-cycles

Request:
{
  intakeData: {
    portfolio: { stocks: 60, bonds: 30, ... },
    goals: { amount: 1000000, timeHorizon: 10, ... },
    specificHoldings: [...]  // If collected
  }
}

Response: CycleAnalysisResult  // See type definition
```

### Required AI Analysis Steps

#### 1. **Cycle Phase Determination** (For each of 6 cycles)

Use AI (Claude/GPT-4) to analyze:

**Prompt Template:**
```
Based on the following frameworks: [List frameworks for this cycle]

And current economic data:
- Date: {current_date}
- S&P 500: {current_sp500}
- Fed Funds Rate: {fed_rate}
- Inflation: {inflation_rate}
- Unemployment: {unemployment}
- [Other relevant metrics]

Determine:
1. Current phase of the {cycle_name}
2. Percentage through the cycle (0-100%)
3. When this cycle started
4. Average lifecycle duration
5. Timeline breakdown with phases and descriptions

Return as structured JSON.
```

#### 2. **Historical Backtest** (Monte Carlo Simulation)

For each cycle, you need to:

```python
def backtest_sp500_for_cycle(cycle_type, phase_percent):
    # 1. Find historical periods with similar cycle characteristics
    similar_periods = find_similar_historical_periods(cycle_type, phase_percent)
    
    # 2. Extract S&P 500 returns from those periods
    historical_returns = get_sp500_returns(similar_periods)
    
    # 3. Run Monte Carlo simulation
    results = run_monte_carlo(
        historical_returns=historical_returns,
        n_simulations=10000,
        time_horizon_months=12
    )
    
    return {
        'expectedUpside': results.percentile_95,
        'expectedDownside': results.percentile_5,
        'expectedReturn': results.median
    }
```

**Data Sources You Can Use:**
- Yahoo Finance API (for S&P 500 historical data)
- FRED API (Federal Reserve Economic Data)
- Historical databases with cycle annotations

#### 3. **Historical Analog Matching**

Use AI to find the best historical match:

**Prompt Template:**
```
Given the current {cycle_name} phase:
- Phase: {current_phase}
- Percentage: {phase_percent}%
- Key characteristics: {characteristics}

Search through history and identify the period that most closely matches the current conditions.

Provide:
1. Time period (e.g., "1945-1950")
2. Detailed description of similarities
3. Key events from that period
4. Similarity score

Return as JSON.
```

#### 4. **Portfolio Impact Simulation**

For the user's portfolio across each cycle:

```python
def simulate_portfolio_by_cycles(holdings, user_portfolio_data):
    results = {}
    
    for cycle in ['country', 'technology', 'economic', 'business', 'market', 'company']:
        # Calculate how aligned the portfolio is with this cycle
        alignment_score = calculate_cycle_alignment(holdings, cycle)
        
        # Get historical returns for this cycle phase
        cycle_returns = get_cycle_historical_returns(cycle)
        
        # Adjust returns based on portfolio alignment
        adjusted_returns = adjust_for_alignment(cycle_returns, alignment_score)
        
        # Run Monte Carlo
        simulation = run_monte_carlo(adjusted_returns)
        
        results[cycle] = {
            'expectedUpside': simulation.percentile_95,
            'expectedDownside': simulation.percentile_5,
            'expectedReturn': simulation.median,
            'maxDrawdown': simulation.max_drawdown
        }
    
    return results
```

#### 5. **Goal Probability Calculation**

```python
def calculate_goal_probability(current_value, goal_amount, time_horizon, portfolio_results):
    # Average across all cycle scenarios
    avg_return_median = mean([r['expectedReturn'] for r in portfolio_results.values()])
    avg_return_upside = mean([r['expectedUpside'] for r in portfolio_results.values()])
    avg_return_downside = mean([r['expectedDownside'] for r in portfolio_results.values()])
    
    # Project forward
    final_value_median = project_value(current_value, avg_return_median, time_horizon)
    final_value_upside = project_value(current_value, avg_return_upside, time_horizon)
    final_value_downside = project_value(current_value, avg_return_downside, time_horizon)
    
    return {
        'probabilityOfSuccess': {
            'median': calculate_probability(final_value_median, goal_amount),
            'upside': calculate_probability(final_value_upside, goal_amount),
            'downside': calculate_probability(final_value_downside, goal_amount)
        },
        'projectedValues': {
            'median': final_value_median,
            'upside': final_value_upside,
            'downside': final_value_downside
        }
    }
```

#### 6. **AI Recommendation Generation**

Final AI call to generate personalized recommendation:

**Prompt Template:**
```
Given this goal analysis:
- Goal: ${goal_amount} in {time_horizon} years
- Current: ${current_value}
- Success probability: {probability}%
- Shortfall: ${shortfall}
- Portfolio cycle alignment scores: {cycle_scores}

Generate a personalized, actionable recommendation (2-3 sentences) that:
1. Assesses likelihood of success
2. Suggests 2-3 specific actions to improve odds
3. References relevant cycle opportunities

Be direct, professional, and specific.
```

---

## 📊 Data Flow

```
User Submits Intake Form
         ↓
Backend receives data
         ↓
AI analyzes 6 cycles → Phase determination
         ↓
Historical backtest → Monte Carlo simulations
         ↓
Portfolio impact → Cycle-by-cycle analysis
         ↓
Goal probability → Success likelihood
         ↓
AI generates recommendation
         ↓
Return CycleAnalysisResult JSON
         ↓
Frontend displays in 3 tabs
```

---

## 🧪 Testing with Mock Data

The frontend is already wired up with mock data, so you can:

1. **Test immediately**: The new ReviewTab uses `mockCycleAnalysisData` by default
2. **Verify UI/UX**: Click through all tabs, test interactions
3. **Iterate on design**: Adjust layouts, colors, content

Once your AI backend is ready, simply update `ReviewTab_New.tsx`:

```typescript
// Replace this:
const cycleData = mockCycleAnalysisData.cycles;

// With this:
const cycleData = analysisResult.cycleAnalysis?.cycles || mockCycleAnalysisData.cycles;
```

---

## 🔑 Key Implementation Notes

### 1. **Frameworks Are Public Knowledge**
As your client mentioned, all the frameworks (Strauss-Howe, Ray Dalio, etc.) are documented publicly. Your AI should:
- Reference these frameworks in the analysis
- Combine multiple perspectives
- Provide citations

### 2. **Historical Data Requirements**
You'll need access to:
- S&P 500 historical prices (1950-present minimum)
- Economic indicators (Fed data, inflation, etc.)
- Ability to segment data by time periods

### 3. **Monte Carlo Simulation**
The simulation logic is straightforward:
- 10,000 paths
- 12-month horizon
- Use historical return distributions
- Extract percentiles (5th, 50th, 95th)

### 4. **Performance Optimization**
- Cache cycle phase determinations (they don't change frequently)
- Pre-compute historical backtests for common scenarios
- Use streaming for AI generation to show progress

---

## 📝 Next Steps

1. **Test the frontend** with mock data
2. **Build AI backend** following the structure above
3. **Integrate** by updating `AnalysisResult` type
4. **Deploy and iterate** based on real user feedback

---

## 🆘 Questions or Issues?

The frontend is production-ready and fully functional with mock data. Focus your development effort on:
1. AI prompt engineering for cycle analysis
2. Historical data collection and organization
3. Monte Carlo simulation accuracy
4. Recommendation quality

All TypeScript interfaces are defined in `src/types/cycleAnalysis.ts` - use these as your backend contracts.
