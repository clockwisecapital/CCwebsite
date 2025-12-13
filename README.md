# Clockwise Portfolio Analyzer

A Python library for calculating portfolio performance and risk metrics using industry-standard methodology (Morningstar/Kwanti compatible).

## Features

- **Multi-portfolio support**: Analyze up to 4+ portfolios from a single CSV
- **Two view modes**: Combined comparison + Individual Kwanti-style reports
- **Cumulative return charts**: Kwanti-style charts starting from 0% for easy visualization
- **Industry-standard methodology**: Matches Morningstar/Kwanti calculations
- **API-ready**: FastAPI integration for Vercel deployment

## Quick Start

### Single Portfolio
```python
from portfolio_analyzer import PortfolioAnalyzer

analyzer = PortfolioAnalyzer()
result = analyzer.analyze_from_csv(
    "portfolio.csv",
    portfolio_name="My Portfolio",
    as_of_date="2025-12-05"
)
print(result.to_json())
```

### Multi-Portfolio
```python
from portfolio_analyzer import PortfolioAnalyzer

analyzer = PortfolioAnalyzer()
result = analyzer.analyze_multi_portfolio(
    "clockwise_portfolios.csv",
    as_of_date="2025-12-05"
)

# Combined comparison view
print(result.comparison)

# Individual portfolio (Kwanti-style)
max_growth = result.get_individual("Clockwise Max Growth")
print(max_growth.to_json())
```

### Command Line
```bash
# Single portfolio
python portfolio_analyzer.py path/to/file.csv 2025-12-05

# Multi-portfolio
python portfolio_analyzer.py path/to/file.csv 2025-12-05 --multi
```

## Installation

```bash
pip install pandas numpy yfinance
```

For API deployment:
```bash
pip install fastapi uvicorn python-multipart
```

## Files

| File | Description |
|------|-------------|
| `portfolio_analyzer.py` | Main library - import this |
| `api_example.py` | FastAPI integration for Vercel |
| `Clockwise Portfolios.csv` | Sample multi-portfolio data |

## CSV Format

### Multi-Portfolio (recommended)
```csv
Date,Max Growth,Moderate,Max Income,Growth
12/09/20,"100,000","100,000","100,000","100,000"
12/10/20,"101,244","100,529","100,063","100,667"
...
```

### Single Portfolio
```csv
Date,Portfolio_Value
12/09/20,"100,000"
12/10/20,"101,244"
...
```

**Required columns:**
- Column 1: Date (MM/DD/YY or YYYY-MM-DD format)
- Column 2+: Portfolio Value(s) (numeric, can include commas)

**NOT required:**
- Benchmark data (fetched from Yahoo Finance)
- Return/cumul columns (calculated automatically)

## API Endpoints

### Main Endpoint: Multi-Portfolio Analysis
```
POST /api/analyze/multi
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| file | File | CSV file (required) |
| view | string | `comparison`, `individual`, or `both` (default: both) |
| portfolio | string | Portfolio name (required for individual view) |
| as_of_date | string | Analysis date YYYY-MM-DD (default: latest) |

**Examples:**

```bash
# Combined comparison view
curl -X POST "http://localhost:8000/api/analyze/multi?view=comparison" \
  -F "file=@portfolios.csv"

# Individual portfolio (Kwanti-style)
curl -X POST "http://localhost:8000/api/analyze/multi?view=individual&portfolio=Clockwise%20Max%20Growth" \
  -F "file=@portfolios.csv"

# Full response (both views)
curl -X POST "http://localhost:8000/api/analyze/multi" \
  -F "file=@portfolios.csv" \
  -F "as_of_date=2025-12-05"
```

### Legacy: Single Portfolio
```
POST /api/analyze/single
```

### Chart Data
```
POST /api/chart
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| file | File | CSV file (required) |
| portfolio | string | Portfolio name (for multi-portfolio CSV) |
| start_date | string | Chart start date YYYY-MM-DD (default: 3 years back) |
| end_date | string | Chart end date YYYY-MM-DD (default: latest) |

**Example:**
```bash
curl -X POST "http://localhost:8000/api/chart?portfolio=Clockwise%20Max%20Growth" \
  -F "file=@portfolios.csv"
```

### Methodology Documentation
```
GET /api/methodology
```

## Output Structure

### Comparison View
```json
{
  "view": "comparison",
  "as_of_date": "2025-12-05",
  "portfolio_names": ["Max Growth", "Moderate", "Max Income", "Growth"],
  "period_names": ["YTD", "2024", "2023", "2022", "2021"],
  "metrics": {
    "return": {
      "display_name": "Returns",
      "by_period": {
        "2024": {
          "Max Growth": 0.3081,
          "Moderate": 0.1670,
          "Max Income": 0.0972,
          "Growth": 0.2400
        }
      },
      "benchmark": { "2024": 0.2502 }
    },
    "std_dev": { ... },
    "alpha": { ... },
    "beta": { ... },
    "sharpe": { ... },
    "max_drawdown": { ... },
    "up_capture": { ... },
    "down_capture": { ... }
  },
  "cumulative_3y": {
    "Max Growth": { "return": 1.1043, "sharpe": 6.52, ... }
  },
  "chart": {
    "dates": ["2022-12-09", "2022-12-12", ...],
    "benchmark_returns": [0.0, 0.0143, ..., 0.8155],
    "portfolios": {
      "Max Growth": [0.0, 0.0115, ..., 1.1074],
      "Moderate": [0.0, 0.0079, ..., 0.5535]
    }
  }
}
```

### Individual View (Kwanti-style)
```json
{
  "view": "individual",
  "portfolio_name": "Clockwise Max Growth",
  "as_of_date": "2025-12-05",
  "periods": [
    {
      "period_name": "2024",
      "portfolio_return": 0.3081,
      "benchmark_return": 0.2502,
      "excess_return": 0.0579,
      "portfolio_std_dev": 0.171,
      "portfolio_alpha": -0.025,
      "portfolio_beta": 1.44,
      "portfolio_sharpe_ratio": 1.51,
      "portfolio_max_drawdown": -0.112,
      "portfolio_up_capture": 1.29,
      "portfolio_down_capture": 1.35,
      "benchmark_std_dev": 0.107,
      "benchmark_alpha": 0.0,
      "benchmark_beta": 1.0,
      "benchmark_sharpe_ratio": 1.88,
      "benchmark_max_drawdown": -0.085,
      "benchmark_up_capture": 1.0,
      "benchmark_down_capture": 1.0,
      "risk_free_rate": 0.0497,
      "num_months": 12
    }
  ],
  "cumulative_3y": { ... },
  "chart_data": {
    "dates": ["2022-12-09", ...],
    "portfolio_returns": [0.0, 0.0115, ..., 1.1074],
    "benchmark_returns": [0.0, 0.0143, ..., 0.8155],
    "portfolio_name": "Clockwise Max Growth",
    "benchmark_name": "S&P 500 TR"
  },
  "methodology": { ... },
  "warnings": [ ... ]
}
```

### Chart Data Format
```json
{
  "dates": ["2022-12-09", "2022-12-12", ...],
  "portfolio_returns": [0.0, 0.0115, 0.0183, ..., 1.1074],
  "benchmark_returns": [0.0, 0.0143, 0.0217, ..., 0.8155],
  "portfolio_name": "Clockwise Max Growth",
  "benchmark_name": "S&P 500 TR",
  "start_date": "2022-12-09",
  "end_date": "2025-12-09"
}
```

**Note**: Values are cumulative returns starting from 0 (Kwanti-style).
- `0.0` = 0% return (start)
- `1.1074` = +110.74% cumulative return
- Multiply by 100 for percentage display

## Methodology

### Benchmark
- **S&P 500 Total Return Index** (^SP500TR)
- Includes dividends reinvested
- Fetched from Yahoo Finance

### Risk-Free Rate
- **3-Month Treasury Bill** (^IRX)
- Historical daily rates, averaged monthly
- Used for excess returns, alpha, Sharpe ratio

### Return Frequency
| Metric | Frequency | Rationale |
|--------|-----------|-----------|
| Std Dev | Monthly | Industry standard, reduces noise |
| Beta | Monthly | Regression stability |
| Alpha | Monthly | Derived from beta |
| Capture Ratios | Monthly | Based on up/down months |
| Max Drawdown | Daily | Captures true peak-to-trough |

### Formulas

**Standard Deviation (annualized):**
```
Std Dev = Monthly Std Dev * sqrt(12)
```

**Beta:**
```
Beta = Cov(Portfolio Excess Return, Benchmark Excess Return) / Var(Benchmark Excess Return)
```

**Alpha (annualized):**
```
Alpha = [Avg(Portfolio Excess) - Beta * Avg(Benchmark Excess)] * 12
```

**Sharpe Ratio:**
```
Sharpe = (Return - Risk Free Rate) / Std Dev
```

**Capture Ratios:**
```
Up Capture = Compound return in up months / Benchmark compound return in up months
Down Capture = Compound return in down months / Benchmark compound return in down months
```

## Frontend Integration Guide

### Suggested UI Layout

```
+--------------------------------------------------+
|  [Upload CSV]  [As of Date: 2025-12-05]  [Run]   |
+--------------------------------------------------+
|                                                   |
|  VIEW: [Combined] [Max Growth] [Moderate] [...]  |
|                                                   |
+--------------------------------------------------+
|                                                   |
|  COMBINED VIEW (when selected):                  |
|  +---------------------------------------------+ |
|  | Metric    | Max Gr | Mod  | Income | Growth | |
|  |-----------|--------|------|--------|--------| |
|  | Return    | 30.81% | 16.7%| 9.72%  | 24.00% | |
|  | Std Dev   | 17.1%  | 7.4% | 3.3%   | 12.4%  | |
|  | Sharpe    | 1.51   | 1.58 | 1.43   | 1.54   | |
|  +---------------------------------------------+ |
|                                                   |
|  INDIVIDUAL VIEW (when portfolio selected):      |
|  [Full Kwanti-style report with portfolio vs     |
|   benchmark rows for each metric]                |
|                                                   |
+--------------------------------------------------+
```

### API Integration Flow

```javascript
// 1. Upload file and get full data
const response = await fetch('/api/analyze/multi?view=both', {
  method: 'POST',
  body: formData  // Contains CSV file
});
const data = await response.json();

// 2. Cache the full response
const analysisData = data;

// 3. Render combined view from comparison data
renderComparisonTable(analysisData.comparison);

// 4. Render individual view when portfolio selected
renderIndividualReport(analysisData.portfolios['Clockwise Max Growth']);

// 5. Render cumulative return chart (Kwanti-style)
const chartData = analysisData.comparison.chart;
renderLineChart({
  labels: chartData.dates,
  datasets: [
    { label: 'S&P 500 TR', data: chartData.benchmark_returns.map(v => v * 100) },
    ...Object.entries(chartData.portfolios).map(([name, values]) => ({
      label: name,
      data: values.map(v => v * 100)  // Convert to percentage
    }))
  ]
});
```

## Warnings

The analyzer includes sample size warnings:
- **< 12 months**: Results may be unreliable
- **< 36 months**: Below recommended statistical threshold
- **>= 36 months**: Statistically robust

## Vercel Deployment

1. Create `/api/analyze.py` with the FastAPI endpoint
2. Add `requirements.txt`:
   ```
   fastapi
   pandas
   numpy
   yfinance
   python-multipart
   ```
3. Configure `vercel.json`:
   ```json
   {
     "builds": [
       { "src": "api/*.py", "use": "@vercel/python" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "/api/$1" }
     ]
   }
   ```

## License

Internal use - Clockwise Capital



Updated context from client on how they imagine it being built: 

README.md
# Next.js API Routes for Portfolio Analyzer

These API routes provide the same functionality as `api_example.py` but for Next.js applications.

## Setup Instructions

### 1. Install Dependencies

In your Next.js project:

```bash
npm install yahoo-finance2 papaparse date-fns
npm install -D @types/papaparse
```

### 2. Copy Files

```
your-nextjs-project/
├── lib/
│   └── portfolio_analyzer.ts    <- Copy from parent folder
├── app/
│   └── api/
│       ├── analyze/
│       │   └── route.ts         <- Copy from nextjs-api/analyze/
│       ├── chart/
│       │   └── route.ts         <- Copy from nextjs-api/chart/
│       └── methodology/
│           └── route.ts         <- Copy from nextjs-api/methodology/
```

### 3. Update Import Paths

The routes use `@/lib/portfolio_analyzer` by default. If you place the analyzer elsewhere, update the import:

```typescript
// If using /lib folder (recommended):
import { PortfolioAnalyzer } from '@/lib/portfolio_analyzer';

// If using a different location:
import { PortfolioAnalyzer } from '../../../utils/portfolio_analyzer';
```

### 4. Configure tsconfig.json (if needed)

Ensure your `tsconfig.json` has the `@/` path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## API Endpoints

### POST /api/analyze

Main analysis endpoint for multi-portfolio CSV files.

**Query Parameters:**
- `view`: `'comparison'` | `'individual'` | `'both'` (default: `'both'`)
- `portfolio`: Portfolio name (required for `individual` view)
- `as_of_date`: Analysis date as YYYY-MM-DD (default: latest in data)

**Request:**
```javascript
const formData = new FormData();
formData.append('file', csvFile);

const response = await fetch('/api/analyze?view=comparison', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

**Response (comparison view):**
```json
{
  "view": "comparison",
  "as_of_date": "2025-12-05",
  "portfolio_names": ["Max Growth", "Moderate", "Growth"],
  "period_names": ["YTD", "2024", "2023", "2022"],
  "metrics": {
    "return": { "by_period": { "YTD": { "Max Growth": 0.1116 } } },
    "std_dev": { ... },
    "sharpe": { ... }
  },
  "chart": {
    "dates": ["2022-12-09", ...],
    "benchmark_returns": [0, 0.0143, ...],
    "portfolios": {
      "Max Growth": { "returns": [0, 0.0115, ...], "final_return": 1.1074 }
    }
  }
}
```

### POST /api/chart

Get cumulative return chart data only.

**Query Parameters:**
- `portfolio`: Specific portfolio name (optional)
- `start_date`: Chart start date (default: 3 years back)
- `end_date`: Chart end date (default: latest)

**Response:**
```json
{
  "dates": ["2022-12-09", "2022-12-12", ...],
  "portfolio_returns": [0.0, 0.0115, ..., 1.1074],
  "benchmark_returns": [0.0, 0.0143, ..., 0.8155],
  "portfolio_name": "Max Growth",
  "benchmark_name": "S&P 500 TR",
  "portfolio_final_return": 1.1074,
  "benchmark_final_return": 0.8155,
  "chart_title": "3-Year Cumulative Returns vs S&P 500 TR"
}
```

### GET /api/methodology

Returns calculation methodology documentation.

## Frontend Chart Example

```typescript
import { Line } from 'react-chartjs-2';

// After fetching chart data from /api/analyze?view=comparison
const chartData = response.chart;

const config = {
  labels: chartData.dates,
  datasets: [
    {
      label: `S&P 500 TR (+${(chartData.benchmark_final_return * 100).toFixed(1)}%)`,
      data: chartData.benchmark_returns.map(v => v * 100),
      borderColor: '#888',
      borderDash: [5, 5],
    },
    ...Object.entries(chartData.portfolios).map(([name, p]) => ({
      label: `${name} (+${(p.final_return * 100).toFixed(1)}%)`,
      data: p.returns.map(v => v * 100),
    })),
  ],
};

const options = {
  plugins: {
    title: { display: true, text: chartData.chart_title },
  },
  scales: {
    y: { ticks: { callback: (v) => v + '%' } },
  },
};

<Line data={config} options={options} />
```

## CSV Format

```csv
Date, Max Growth, Moderate, Growth
12/09/20, 100000, 100000, 100000
12/10/20, 101244, 100500, 100800
...
```

- First column: Date (various formats supported)
- Remaining columns: Portfolio values (dollar amounts)
- All portfolios should start at same base value