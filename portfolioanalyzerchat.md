/**
 * Next.js API Route: /api/chart
 * ==============================
 * Get cumulative return chart data for portfolio vs S&P 500.
 *
 * Usage:
 *   POST /api/chart
 *   - Body: FormData with 'file' (CSV file)
 *   - Query params: portfolio, start_date, end_date
 *
 * Returns Kwanti-style cumulative return data starting from 0%.
 */

import { NextRequest, NextResponse } from 'next/server';
// Adjust this import path based on where you place portfolio_analyzer.ts
import { PortfolioAnalyzer } from '@/lib/portfolio_analyzer';

export async function POST(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const portfolio = searchParams.get('portfolio');
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;

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

    // Run analysis to get chart data
    const analyzer = new PortfolioAnalyzer(true);
    const result = await analyzer.analyzeMultiPortfolio(csvContent, undefined, endDate);

    // If specific portfolio requested, return just that one
    if (portfolio && result.portfolios[portfolio]) {
      const portResult = result.portfolios[portfolio];
      if (portResult.chart_data) {
        return NextResponse.json(portResult.chart_data);
      }
      return NextResponse.json(
        { error: `No chart data available for portfolio '${portfolio}'` },
        { status: 400 }
      );
    }

    // Return comparison chart data (all portfolios)
    if (result.comparison.chart) {
      return NextResponse.json(result.comparison.chart);
    }

    return NextResponse.json({ error: 'No chart data available' }, { status: 400 });
  } catch (error) {
    console.error('Chart generation error:', error);
    return NextResponse.json(
      { error: `Chart generation failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// Handle GET requests with helpful message
export async function GET() {
  return NextResponse.json({
    message: 'Clockwise Portfolio Chart API',
    usage: 'POST a CSV file to get cumulative return chart data',
    query_params: {
      portfolio: 'Specific portfolio name (optional, returns all if not specified)',
      start_date: 'Chart start date (YYYY-MM-DD, default: 3 years back)',
      end_date: 'Chart end date (YYYY-MM-DD, default: latest in data)',
    },
    response_format: {
      dates: ['2022-12-09', '2022-12-12', '...'],
      portfolio_returns: [0.0, 0.0115, '...', 1.1074],
      benchmark_returns: [0.0, 0.0143, '...', 0.8155],
      portfolio_name: 'Max Growth',
      benchmark_name: 'S&P 500 TR',
      start_date: '2022-12-09',
      end_date: '2025-12-09',
      portfolio_final_return: 1.1074,
      benchmark_final_return: 0.8155,
      chart_title: '3-Year Cumulative Returns vs S&P 500 TR',
    },
    notes: [
      'Values are cumulative returns starting from 0',
      'Multiply by 100 for percentage display (1.1074 = +110.74%)',
      'Use final_return values for legend labels',
    ],
  });
}
