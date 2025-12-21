# Portfolio & Goal Calculation Guide

**Simple explanations of how we calculate your investment projections.**

---

## Table of Contents
1. [Quick Overview](#quick-overview)
2. [The Data Sources](#the-data-sources)
3. [1-Year Goals (Simple)](#1-year-goals-simple)
4. [Multi-Year Goals (2+ years)](#multi-year-goals-2-years)
5. [Portfolio Tab Explained](#portfolio-tab-explained)
6. [Goal Tab Explained](#goal-tab-explained)
7. [Examples](#examples)

---

## Quick Overview

**What we calculate:**
- **Portfolio Tab**: Shows how much money your investments will grow to
- **Goal Tab**: Shows the probability you'll reach a specific dollar goal

**Two time periods, two methods:**
- **1 Year**: Simple, deterministic math (no randomness)
- **2+ Years**: Monte Carlo simulation (includes market ups and downs)

---

## The Data Sources

### Where Year 1 Returns Come From

**ETFs (like SPY, QQQ, etc.):**
- Source: **INDEX VALS Database** (our CSV file with Bull/Expected/Bear scenarios)
- Example: SPY Expected = 6.9% for next year

**Individual Stocks (like AAPL, GOOGL, etc.):**
- Source: **FactSet** (professional analyst target prices)
- Example: AAPL target price = $285, current = $274 → 4.3% return

**If we don't have data:**
- Fallback: 10% (historical stock market average)

### Where Years 2+ Returns Come From

**All investments use the same long-term averages:**
- Stocks: **10% per year** (nominal, not adjusted for inflation)
- Bonds: **5% per year**
- Cash: **3% per year**
- Real Estate: **8% per year**

---

## 1-Year Goals (Simple)

### How It Works

**Step 1: Calculate projected value**
```
Starting Money × (1 + Return) = Ending Money
```

**Step 2: Compare to goal**
```
If Ending Money ≥ Goal → 100% probability
If Ending Money < Goal → 0% probability
```

### Example: SPY for 1 Year

**Your situation:**
- Starting: $750,000
- Return: 6.9% (from INDEX VALS)
- Goal: $800,000

**Calculation:**
```
$750,000 × 1.069 = $801,750
$801,750 ≥ $800,000 ✓
Probability: 100%
```

**Three scenarios (Bull/Expected/Bear):**
- **Bull (9.9%)**: $750k × 1.099 = $824,250 → 100% ✓
- **Expected (6.9%)**: $750k × 1.069 = $801,750 → 100% ✓
- **Bear (-2.1%)**: $750k × 0.979 = $734,250 → 0% ✗

---

## Multi-Year Goals (2+ years)

### How It Works

**Step 1: Year 1 uses specific returns**
```
After Year 1 = Starting Money × (1 + Year 1 Return)
```

**Step 2: Years 2+ use long-term returns**
```
After 10 Years = After Year 1 × (1.10)^9
(Assuming 10% for stocks)
```

**Step 3: Run 10,000 simulations**
- Each simulation adds random market ups and downs (volatility)
- Some simulations do better, some do worse
- We count how many reach your goal

**Step 4: Calculate probability**
```
Probability = (Simulations that reached goal) / 10,000
```

### Example: SPY for 10 Years

**Your situation:**
- Starting: $750,000
- Year 1 Return: 6.9% (from INDEX VALS)
- Years 2-10 Return: 10% per year (long-term average)
- Goal: $1,000,000

**Calculation:**
```
Year 1: $750,000 × 1.069 = $801,750
Years 2-10: $801,750 × (1.10)^9 = $1,895,000

But wait! We run 10,000 simulations with volatility:
- Some simulations: $2.3M (lucky!)
- Some simulations: $1.5M (unlucky)
- Median outcome: $1.9M
```

**Result:**
- Expected Value: $1,900,000
- Probability: 83% (8,300 out of 10,000 simulations reached $1M)

**Why not 100%?**
Even though the median is $1.9M, some unlucky simulation paths (with lots of down years early on) fell short of $1M.

---

## Portfolio Tab Explained

### What It Shows

**Starting Value:** Your portfolio today  
**Ending Value:** What your portfolio will grow to  
**Expected Scenario:** The median return (50th percentile)  
**Bull Scenario:** The optimistic return (95th percentile)  
**Bear Scenario:** The pessimistic return (5th percentile)

### How We Calculate It

**1-Year Portfolio:**
```
Ending Value = Starting Value × (1 + Expected Return)
Example: $750k × 1.069 = $801,750
```

**10-Year Portfolio:**
```
Ending Value = Starting Value × (1 + Expected Return)^10
Example: $750k × (1.084)^10 = $1,680,000

Note: Expected Return is 8.4% (Monte Carlo median, includes volatility drag)
```

### Why Monte Carlo for Multi-Year?

**Volatility drag** means your actual return is less than the arithmetic average:
- Year 1: Up 20% → $100k becomes $120k
- Year 2: Down 20% → $120k becomes $96k
- You lost money even though average = 0%!

Monte Carlo captures this reality.

---

## Goal Tab Explained

### What It Shows

**Expected Probability:** Chance you reach your goal (median scenario)  
**Bull Probability:** Chance you reach your goal (optimistic scenario)  
**Bear Probability:** Chance you reach your goal (pessimistic scenario)

**Projected Values:** Dollar amounts for each scenario  
**Above/Below Goal:** How much you exceed or miss your goal

### How We Calculate It

**1-Year Goal:**
```
Projected Value = Starting × (1 + Return)
Probability = 100% if Projected ≥ Goal, else 0%
```

**Multi-Year Goal:**
```
Run 10,000 Monte Carlo simulations:
1. Each simulation uses Year 1 return (e.g., 6.9%)
2. Each simulation uses Years 2+ return (e.g., 10%)
3. Each simulation adds random volatility (±18% for stocks)
4. Count how many reach your goal
5. Probability = Success Count / 10,000
```

---

## Examples

### Example 1: Conservative 1-Year Goal

**Scenario:**
- Portfolio: $500,000 in SPY
- Goal: $503,000 in 1 year
- SPY Expected Return: 6.9%

**Portfolio Tab:**
- Ending Value: $500k × 1.069 = **$534,500**

**Goal Tab:**
- Bull (9.9%): $549,500 → **100%** ✓
- Expected (6.9%): $534,500 → **100%** ✓
- Bear (-2.1%): $489,500 → **0%** ✗

**Interpretation:** Very likely to hit your goal!

---

### Example 2: Aggressive 10-Year Goal

**Scenario:**
- Portfolio: $750,000 in SPY
- Goal: $2,000,000 in 10 years
- SPY Year 1: 6.9%, Years 2-10: 10%

**Portfolio Tab (Expected):**
- Ending Value: $750k × (1.084)^10 = **$1,680,000**

**Goal Tab:**
- Expected Value: **$1,680,000**
- Probability: **42%** (4,200 out of 10,000 simulations reached $2M)

**Interpretation:** 
- Median outcome falls short by $320k
- You have less than 50/50 odds
- Consider: Lower goal, add contributions, or extend timeline

---

### Example 3: TIME Portfolio vs Your Portfolio

**Your Portfolio: 100% SPY**
- Year 1: 6.9% (INDEX VALS)
- Years 2-10: 10% (long-term)
- 10-Year Expected: **8.4%** (Monte Carlo median)

**TIME Portfolio: 30 Stocks**
- Year 1: 13.7% (weighted average of FactSet targets)
- Years 2-10: 10% (long-term)
- 10-Year Expected: **9.0%** (Monte Carlo median)

**Why TIME is higher:**
- Better Year 1 (13.7% vs 6.9%)
- This advantage compounds over 10 years
- TIME has more individual stock upside

---

## Key Differences: Portfolio Tab vs Goal Tab

| Feature | Portfolio Tab | Goal Tab |
|---------|--------------|----------|
| **Shows** | Dollar amounts | Probabilities |
| **Focus** | "How much will I have?" | "Will I reach my goal?" |
| **1-Year** | Simple math | Simple math |
| **Multi-Year** | Monte Carlo median | Monte Carlo probability |
| **Use Case** | Compare portfolios | Track specific goals |

**Both tabs use the same underlying data and calculations!**

---

## Important Notes

### No Inflation Adjustment

All returns are **nominal** (actual dollars you'll see):
- Year 1: Uses real target prices from analysts
- Years 2+: Uses 10% (historical nominal average)
- Your dollars won't be adjusted for inflation

### Volatility Matters

For multi-year projections, we use **18% volatility** for stocks:
- Some years: +40% returns
- Some years: -20% returns
- This is realistic based on history

### Monthly Contributions

If you add monthly contributions:
```
Each month: Add contribution, then apply monthly return
Over 10 years with $1,000/month = +$120,000 in contributions
Plus growth on those contributions!
```

---

## Questions?

**Q: Why does Goal show 83% but projected value exceeds goal?**  
A: The 83% accounts for market volatility. Even though the median is above your goal, 17% of simulation paths (the unlucky ones) fell short.

**Q: Why does Portfolio Tab show different % than Goal Tab?**  
A: Portfolio shows the **median return** across all simulations. Goal shows the **probability of reaching a specific target**. Different questions, different answers!

**Q: Can I trust these projections?**  
A: These are **estimates** based on historical data and professional analyst forecasts. Markets are unpredictable. Past performance ≠ future results.

---

*Last Updated: December 2024*

