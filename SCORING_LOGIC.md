# Portfolio Scoring Logic

## How Scores Work

Portfolios are scored **0-100** based on how they perform vs S&P 500 in historical scenarios.

## Score Formula

```
Final Score = (Return Score × 50%) + (Drawdown Score × 50%)
```

### Return Score (50%)
Measures portfolio return vs benchmark return.

```
Return Score = 50 + (Portfolio Return - Benchmark Return) × 100
```

**Example:**
- Portfolio: -18.4%/yr
- Benchmark: -17.3%/yr  
- Outperformance: -1.1%/yr
- Return Score: 50 + (-1.1 × 100) = **39**

### Drawdown Score (50%)
Measures maximum loss vs benchmark maximum loss.

```
Drawdown Score = 100 × (1 - Portfolio Drawdown / Benchmark Drawdown)
```

**Example:**
- Portfolio Max Loss: -28.3%
- Benchmark Max Loss: -46.2%
- Ratio: 28.3 / 46.2 = 0.612
- Drawdown Score: 100 × (1 - 0.612) = **39**

## Score Labels

| Score | Label | Color |
|-------|-------|-------|
| 80-100 | Strong | Teal |
| 60-79 | Moderate | Amber |
| 0-59 | Weak | Red |

## Portfolio Return Calculation

For each holding:
```
Holding Return = Weight × Asset Class Return
Portfolio Return = Sum of all Holding Returns
```

**Example (Dot-Com Bust):**
- Tech: 60% × -79% = -47.4%
- Bonds: 30% × +16% = +4.8%
- Cash: 10% × +9% = +0.9%
- **Total: -41.7%**

## Annualization

Scenarios vary in length, so returns are annualized:

```
Annualized Return = ((1 + Cumulative Return) ^ (1/Years)) - 1
```

**Example:**
- Cumulative: -40.9% over 2.58 years
- Annualized: -18.4%/yr

## What Gets Scored

- **User Portfolio** - Your actual holdings
- **TIME Portfolio** - Clockwise's live portfolio (31 positions)
- **4 Clockwise Portfolios** - Max Growth, Growth, Moderate, Max Income (cached)

## Key Files

- `src/lib/kronos/scoring.ts` - Core scoring algorithm
- `src/lib/kronos/asset-allocation-scoring.ts` - Clockwise portfolio scoring
- `src/lib/kronos/portfolio-extractor.ts` - User portfolio extraction
- `src/app/api/kronos/score/route.ts` - Main scoring endpoint
