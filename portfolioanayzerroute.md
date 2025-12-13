/**
 * Next.js API Route: /api/analyze
 * ================================
 * Multi-portfolio analysis endpoint.
 *
 * Usage:
 *   POST /api/analyze
 *   - Body: FormData with 'file' (CSV file)
 *   - Query params: view, portfolio, as_of_date
 *
 * Setup:
 *   1. Copy portfolio_analyzer.ts to your project's /lib/ folder
 *   2. Copy this folder (nextjs-api/*) to /app/api/
 *   3. Install dependencies: npm install yahoo-finance2 papaparse date-fns
 *   4. Install types: npm install -D @types/papaparse
 */

import { NextRequest, NextResponse } from 'next/server';
// Adjust this import path based on where you place portfolio_analyzer.ts
// Common locations: '@/lib/portfolio_analyzer' or '../../../lib/portfolio_analyzer'
import { PortfolioAnalyzer, MultiPortfolioResult } from '@/lib/portfolio_analyzer';

type ViewMode = 'comparison' | 'individual' | 'both';

export async function POST(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const view: ViewMode = (searchParams.get('view') as ViewMode) || 'both';
    const portfolio = searchParams.get('portfolio');
    const asOfDate = searchParams.get('as_of_date') || undefined;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Send CSV as "file" in form data.' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    // Read CSV content
    const csvContent = await file.text();

    // Create analyzer and run analysis
    const analyzer = new PortfolioAnalyzer(true);
    const result: MultiPortfolioResult = await analyzer.analyzeMultiPortfolio(
      csvContent,
      undefined,
      asOfDate
    );

    // Return based on view mode
    if (view === 'comparison') {
      return NextResponse.json({
        view: 'comparison',
        as_of_date: result.as_of_date,
        generated_at: result.generated_at,
        portfolio_names: result.comparison.portfolio_names,
        period_names: result.comparison.period_names,
        metrics: result.comparison.metrics,
        cumulative_3y: result.comparison.cumulative_3y,
        chart: result.comparison.chart,
        methodology: result.methodology,
      });
    }

    if (view === 'individual') {
      if (!portfolio) {
        return NextResponse.json({
          view: 'individual',
          error: "Please specify 'portfolio' parameter",
          available_portfolios: Object.keys(result.portfolios),
        });
      }

      if (!result.portfolios[portfolio]) {
        return NextResponse.json(
          {
            error: `Portfolio '${portfolio}' not found`,
            available_portfolios: Object.keys(result.portfolios),
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        view: 'individual',
        portfolio_name: portfolio,
        ...result.portfolios[portfolio],
      });
    }

    // Default: return full result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: `Analysis failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// Handle GET requests with helpful message
export async function GET() {
  return NextResponse.json({
    message: 'Clockwise Portfolio Analyzer API',
    usage: 'POST a CSV file to this endpoint',
    query_params: {
      view: "View mode: 'comparison', 'individual', or 'both' (default)",
      portfolio: "Portfolio name (required for 'individual' view)",
      as_of_date: 'Analysis date (YYYY-MM-DD, default: latest in data)',
    },
    csv_format: {
      description: 'Date column + one or more portfolio value columns',
      example: 'Date, Max Growth, Moderate, Growth\n12/09/20, 100000, 100000, 100000',
    },
  });
}
