/**
 * Next.js API Route: /api/methodology
 * =====================================
 * Returns calculation methodology documentation.
 *
 * Usage:
 *   GET /api/methodology
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    benchmark: {
      name: 'S&P 500 Total Return Index',
      ticker: '^SP500TR',
      description: 'Includes dividends reinvested for apples-to-apples comparison',
    },
    risk_free_rate: {
      name: '3-Month Treasury Bill',
      ticker: '^IRX',
      description: 'Historical daily rates, averaged per period',
    },
    data_frequency: {
      ytd: 'Weekly (matches Kwanti methodology)',
      full_years: 'Monthly',
      max_drawdown: 'Daily (captures true peak-to-trough)',
    },
    metrics: {
      returns: 'Calculated from portfolio values (cumulative)',
      std_dev: 'Period Std Dev × sqrt(annualize_factor) where factor=52 weekly, 12 monthly',
      beta: 'Cov(Portfolio Excess, Benchmark Excess) / Var(Benchmark Excess)',
      alpha: "Jensen's Alpha, annualized (× annualize_factor)",
      sharpe:
        '(Avg Period Excess × annualize_factor) / Annualized Std Dev - arithmetic method',
      max_drawdown: 'Daily peak-to-trough decline',
      up_capture: 'Compound return in up periods / Benchmark compound return in up periods',
      down_capture:
        'Compound return in down periods / Benchmark compound return in down periods',
    },
    chart_data:
      'Cumulative returns starting from 0% (Kwanti-style) with final_return for legends',
    data_source: 'Yahoo Finance (yahoo-finance2)',
    sample_size_warning: '36+ months recommended for statistical reliability',
    annualization: {
      weekly_factor: 52,
      monthly_factor: 12,
      note: 'YTD uses weekly data for ~48 data points; full years use monthly data',
    },
  });
}
