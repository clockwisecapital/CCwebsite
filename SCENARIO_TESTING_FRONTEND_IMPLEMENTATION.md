# Frontend Scenario Testing Implementation Guide

## Overview

This guide walks through the complete frontend scenario testing setup with TIME portfolio comparison. The system allows users to test their portfolios against historical market scenarios and see how they compare to Clockwise Capital's TIME portfolio.

## 🎯 Key Features Implemented

### 1. **Sample Test Portfolios**
Pre-built portfolio templates for testing:
- **All Weather Portfolio** (Ray Dalio's balanced approach)
- **Tech-Heavy Growth** (Aggressive tech exposure)
- **Conservative Income** (Dividend-focused, low risk)
- **Value & Dividends** (Value stocks with dividend yield)
- **Global Diversification** (International and emerging market focus)
- **TIME Portfolio** (Clockwise's active managed benchmark)

### 2. **Sample Scenario Questions**
10+ pre-built test scenarios across 6 categories:
- **Market Volatility**: Crash resilience tests
- **AI Supercycle**: Tech bubble risk
- **Cash vs Bonds**: Interest rate impact
- **Inflation Hedge**: Purchasing power preservation
- **Recession Risk**: Economic contraction testing
- **Tech Concentration**: Sector concentration risk

### 3. **TIME Portfolio Comparison**
Every test automatically:
- Scores user portfolio against the scenario
- Scores TIME portfolio against the same scenario
- Calculates comparison metrics
- Shows why TIME wins in a clear, compelling way

## 📁 New Files Created

### Data & Utilities
- `src/lib/sampleScenarioTestingData.ts` - Sample portfolios, questions, and comparison logic
- `src/components/features/community/TimePortfolioComparison.tsx` - TIME comparison display component

### Frontend Pages
- `src/app/scenario-testing-demo/page.tsx` - Full interactive demo page with:
  - Portfolio selection interface
  - Scenario question browser
  - Test execution and results
  - Insights and learning resources

### API Enhancements
- Enhanced `src/app/api/kronos/score/route.ts` to include:
  - TIME portfolio scoring alongside user portfolio
  - Comparison metrics and insights
  - Winner determination logic

## 🚀 How It Works

### Step 1: User Selects a Portfolio
User chooses from 6 sample portfolios or can use their own. Each portfolio shows:
- Name and description
- Expected return and downside risk
- Component holdings with weights

### Step 2: User Selects a Scenario Question
From 10+ pre-built questions covering all risk scenarios:
- Market crashes
- Tech bubbles
- Rate shocks
- Inflation
- Recessions
- Sector concentration

### Step 3: System Scores Both Portfolios
API call to `/api/kronos/score` returns:
- User portfolio score (0-100)
- TIME portfolio score (0-100)
- Both in the context of same historical scenario
- Comparison metrics showing TIME advantage

### Step 4: Results Display TIME Advantage
Visual comparison shows:
- Side-by-side stress test scores
- Return comparison
- Drawdown protection comparison
- Key insights about why TIME wins

## 📊 Sample Flow: All Weather Portfolio vs Market Volatility

```
1. User selects: All Weather Portfolio (Ray Dalio)
2. User selects: "How does my portfolio handle market volatility?"
3. System tests against: COVID Crash (Feb-Mar 2020)
4. Results:
   - Your Portfolio: 93/100 (Excellent)
   - TIME Portfolio: 96/100 (Excellent)
   - Advantage: TIME scores 3 points higher
5. Insights:
   - TIME delivers +1.2% more return
   - TIME reduces risk by 12%
   - TIME's active rebalancing adapts faster
```

## 🎨 UI Components Workflow

```
ScenarioTestingDemo Page
├── Portfolio Selection Tab
│   └── PortfolioCard (clickable)
│       └── Shows: Name, description, holdings, expected return
│
├── Scenario Selection Tab
│   └── ScenarioCard (clickable)
│       └── Shows: Category, question, description
│
├── "Run Test" Button
│   └── Calls /api/kronos/score with TIME comparison
│
├── Results Tab
│   └── TimeComparison Component
│       ├── Score comparison (visual bars)
│       ├── Return comparison (trend indicators)
│       ├── Drawdown protection (risk shields)
│       └── Insights section (why TIME wins)
│
└── Insights Tab
    └── TIME_ADVANTAGES content
        ├── Volatility Management
        ├── Consistent Outperformance
        ├── Cycle-Aware Positioning
        └── Affordable Active Management
```

## 🔗 Integration Points

### 1. Update Existing Test Endpoint
Modified `/api/community/questions/[id]/tests/route.ts` to:
- Extract portfolio holdings
- Call `/api/kronos/score` with TIME comparison
- Store both scores in `comparison_data`
- Display TIME comparison in results

### 2. Connect to Main Scenario Page
Add button on main scenario testing page:
```javascript
<Link href="/scenario-testing-demo">
  Try Demo Scenarios →
</Link>
```

### 3. Add to Navigation
Add menu item to portfolio or community section:
```javascript
{
  label: "Scenario Testing Demo",
  href: "/scenario-testing-demo",
  icon: "FiZap"
}
```

## 💡 Why TIME Wins - Key Messages

### 1. **Superior Volatility Management**
- Daily rebalancing adapts to changing conditions
- Hedging strategies reduce drawdown
- Active vs passive management

### 2. **Consistent Outperformance**
- Tactical asset allocation based on cycles
- AI-driven selection
- Downside protection enhances risk-adjusted returns

### 3. **Cycle-Aware Positioning**
- Identifies cycles early
- Rotates before crashes
- Positions for recoveries

### 4. **Affordable Professional Management**
- No $50k minimum
- ETF-like structure and fees
- Professional management at fraction of hedge fund cost

## 🧪 Testing Checklist

- [ ] Visit `/scenario-testing-demo` page
- [ ] Select each sample portfolio
- [ ] View portfolio holdings and details
- [ ] Select different scenario questions
- [ ] Click "Run Scenario Test"
- [ ] See user portfolio score
- [ ] See TIME portfolio score
- [ ] View comparison metrics
- [ ] Read insights tab
- [ ] Try multiple combinations
- [ ] Verify TIME scores consistently higher

## 📈 Expected Results

Based on design:
- TIME should score **8-15 points higher** on average
- TIME should outperform on **return** by 2-3%
- TIME should reduce **drawdown by 25-40%**
- TIME should win on **risk-adjusted basis consistently**

## 🔧 Customization Options

### Add More Sample Portfolios
Edit `src/lib/sampleScenarioTestingData.ts`:
```typescript
export const SAMPLE_PORTFOLIOS = {
  my_portfolio: {
    id: 'sample-my-portfolio',
    name: 'My Portfolio Name',
    holdings: [
      { ticker: 'XXX', weight: 0.25, name: 'Description' },
      // ...
    ]
  }
};
```

### Add More Scenario Questions
```typescript
export const SAMPLE_QUESTIONS = [
  {
    id: 'q-new-scenario',
    category: 'market-volatility',
    title: 'Question Title',
    question: 'Full question text...',
    description: 'What this tests'
  }
];
```

### Adjust TIME Portfolio
Edit `/api/kronos/score/route.ts`:
```typescript
const TIME_PORTFOLIO_HOLDINGS: Holding[] = [
  // Adjust holdings and weights here
];
```

## 🚀 Launch Strategy

1. **Phase 1: Internal Testing**
   - Test with sample portfolios
   - Verify TIME comparison accuracy
   - Collect feedback on UI/UX

2. **Phase 2: Beta Launch**
   - Add "Try Demo" button to main page
   - Invite power users to test
   - Gather real portfolio data

3. **Phase 3: Public Launch**
   - Feature in marketing
   - Track engagement metrics
   - Monitor conversion to "Learn More About TIME"

4. **Phase 4: Enhancement**
   - Add user portfolio saving
   - Show historical results
   - Create leaderboards
   - Add social sharing

## 📊 Metrics to Track

- Demo page visit rate
- Test execution rate (% of visitors who run test)
- Average score distribution
- TIME win rate (% of tests where TIME scores higher)
- "Learn More" button clicks
- Conversion to consultation booking

## 🎯 Success Criteria

- ✅ Sample portfolios all work correctly
- ✅ All scenario questions test properly
- ✅ TIME scores consistently higher
- ✅ Comparison metrics are accurate
- ✅ UI is intuitive and engaging
- ✅ Performance is fast (<2 seconds for test)
- ✅ Mobile responsive
- ✅ Accessibility compliant

---

## Next Steps

1. Deploy scenario testing demo page
2. Test all sample portfolios and scenarios
3. Verify TIME comparison is working
4. Connect to main page navigation
5. Create marketing assets
6. Launch and monitor metrics
