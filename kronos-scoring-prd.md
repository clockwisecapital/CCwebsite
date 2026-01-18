# Kronos Portfolio Scoring Engine - PRD

## What We're Building

A scoring system that answers: **"How well would this portfolio perform if [scenario] happens?"**

It takes a user's portfolio + their question, finds a historical period that matches that concern, simulates how their portfolio would have performed, and returns a 0-100 score.

---

## The 5-Step Logic (This Is Your Blueprint)

### Step 1: Map Question → Scenario

User asks a question. You classify it into one of 6 scenarios:

| User Question Contains | Scenario ID | Primary Risk |
|------------------------|-------------|--------------|
| "volatility", "crash", "correction" | `market-volatility` | Equity Drawdown |
| "AI", "bubble", "supercycle" | `ai-supercycle` | Sector Concentration |
| "cash", "duration", "bonds" | `cash-vs-bonds` | Interest Rate |
| "concentrated", "tech heavy", "Mag 7" | `tech-concentration` | Momentum Reversal |
| "inflation", "purchasing power" | `inflation-hedge` | Purchasing Power |
| "recession", "stagflation" | `recession-risk` | Economic Contraction |

**Output:** `scenarioId: string`

---

### Step 2: Map Scenario → Historical Analog

Each scenario has a "worst case" historical period we test against:

| Scenario ID | Historical Analog | Date Range |
|-------------|-------------------|------------|
| `market-volatility` | COVID Crash | Feb-Mar 2020 |
| `ai-supercycle` | Dot-Com Bust | 2000-2002 |
| `cash-vs-bonds` | Rate Shock | 2022 |
| `tech-concentration` | Dot-Com Bust | 2000-2002 |
| `inflation-hedge` | Stagflation | 1973-1974 |
| `recession-risk` | Stagflation | 1973-1974 |

**Output:** `analogId: string`

---

### Step 3: Look Up Asset Class Returns

Each historical analog has a return table. Here's COVID Crash as an example:

```typescript
const COVID_CRASH_RETURNS = {
  // Equities
  'us-large-cap': -33.9,
  'us-growth': -32.1,
  'us-value': -36.8,
  'us-small-cap': -41.2,
  'international': -32.8,
  'emerging-markets': -31.1,
  'tech-sector': -28.4,
  'healthcare': -22.8,
  'financials': -42.1,
  'energy': -52.4,
  
  // Fixed Income
  'long-treasuries': 21.4,
  'intermediate-treasuries': 5.2,
  'short-treasuries': 2.8,
  'tips': 1.8,
  'aggregate-bonds': 3.2,
  'corporate-ig': -6.8,
  'high-yield': -20.4,
  
  // Alternatives
  'gold': 4.8,
  'commodities': -28.6,
  'cash': 0.4
}
```

You'll need to create similar objects for: `DOT_COM_RETURNS`, `RATE_SHOCK_RETURNS`, `STAGFLATION_RETURNS`

**Output:** `assetReturns: Record<string, number>`

---

### Step 4: Calculate Portfolio Return

User's portfolio is an array of holdings. Each holding has a ticker that maps to an asset class.

**Input:**
```typescript
interface Holding {
  ticker: string;
  weight: number; // decimal, e.g., 0.30 = 30%
  assetClass: string; // maps to our return keys
}
```

**Calculation:**
```
Portfolio Return = Σ (holding.weight × assetReturns[holding.assetClass])
```

**Example:**
| Ticker | Asset Class | Weight | Period Return | Contribution |
|--------|-------------|--------|---------------|--------------|
| VTI | us-large-cap | 0.30 | -33.9% | -10.17% |
| TLT | long-treasuries | 0.40 | +21.4% | +8.56% |
| IEF | intermediate-treasuries | 0.15 | +5.2% | +0.78% |
| GLD | gold | 0.075 | +4.8% | +0.36% |
| DBC | commodities | 0.075 | -28.6% | -2.15% |
| **TOTAL** | | **1.00** | | **-2.62%** |

**Output:** `portfolioReturn: number`

---

### Step 5: Calculate Final Score

Two sub-scores, averaged together:

#### Return Score
```
outperformance = portfolioReturn - spReturn
returnScore = 50 + (outperformance × 2.0)
returnScore = clamp(returnScore, 0, 100)
```

#### Drawdown Score
```
protection = spDrawdown - portfolioDrawdown
drawdownScore = 50 + (protection × 2.0)
drawdownScore = clamp(drawdownScore, 0, 100)
```

#### Final Score
```
finalScore = (returnScore × 0.5) + (drawdownScore × 0.5)
finalScore = Math.round(finalScore)
```

**S&P 500 Benchmarks by Analog:**
| Analog | S&P Return | S&P Drawdown |
|--------|------------|--------------|
| COVID Crash | -33.9% | 33.9% |
| Dot-Com Bust | -49.1% | 49.1% |
| Rate Shock | -18.1% | 25.4% |
| Stagflation | -48.2% | 48.2% |

**Output:** `score: number` (0-100)

---

## Score Labels

| Score | Label | Hex Color |
|-------|-------|-----------|
| 90-100 | Excellent | `#10b981` |
| 75-89 | Strong | `#2dd4bf` |
| 60-74 | Moderate | `#f59e0b` |
| 0-59 | Weak | `#f87171` |

---

## API Contract

### Request
```typescript
POST /api/kronos/score

{
  question: string;
  portfolio: {
    ticker: string;
    weight: number;
    assetClass: string;
  }[];
}
```

### Response
```typescript
{
  score: number;
  label: 'Excellent' | 'Strong' | 'Moderate' | 'Weak';
  color: string;
  scenarioId: string;
  analogName: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  outperformance: number;
}
```

---

## File Structure

```
/lib/kronos/
  types.ts        # Interfaces defined above
  constants.ts    # Scenario maps, historical returns, S&P benchmarks
  scoring.ts      # The 5 calculation functions
  
/app/api/kronos/score/
  route.ts        # POST handler that orchestrates the 5 steps
```

---

## Acceptance Criteria

Given the "All Weather" portfolio from the example:
- VTI 30%, TLT 40%, IEF 15%, GLD 7.5%, DBC 7.5%

When question = "How do you handle market volatility?"

Then:
- `scenarioId` = `market-volatility`
- `analogName` = `COVID Crash`
- `portfolioReturn` ≈ `-2.8%`
- `benchmarkReturn` = `-33.9%`
- `score` ≈ `97`
- `label` = `Excellent`

---

## Notes

- Portfolio drawdown estimation: For MVP, estimate as `|portfolioReturn| × 0.8` if return is negative, otherwise `5%`
- Weights should sum to 1.0 - validate this
- Unknown asset classes default to `us-large-cap` returns


Here's a quick outline for implementing the Kronos Portfolio Scoring Engine:
File Structure
/lib/kronos/
  constants.ts      # Scenario mappings, historical analogs, asset returns data
  types.ts          # TypeScript interfaces (Scenario, HistoricalAnalog, Portfolio, Score)
  scoring.ts        # Core calculation functions
  
/app/api/kronos/
  score/route.ts    # POST endpoint - receives portfolio + question, returns score
Core Logic Flow (scoring.ts)

mapQuestionToScenario(question: string) → Returns scenario ID based on keyword matching or classification
getHistoricalAnalog(scenarioId: string) → Looks up the corresponding historical period and its asset class returns
calculatePortfolioReturn(holdings: Holding[], analogReturns: AssetReturns) → Weighted sum: Σ(weight × asset return)
calculateScore(portfolioReturn, portfolioDrawdown, spReturn, spDrawdown):

Return Score = 50 + (outperformance × 2.0), capped 0-100
Drawdown Score = 50 + (protection × 2.0), capped 0-100
Final = (Return × 0.5) + (Drawdown × 0.5)


getScoreLabel(score: number) → Returns label/color based on thresholds (90+, 75-89, 60-74, <60)

Data Structure (constants.ts)
Store the historical return tables as objects keyed by analog ID, with each containing all asset class returns from the PDF tables.