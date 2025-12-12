/**
 * Portfolio Analysis API
 * 
 * POST /api/admin/portfolio-analyze - Analyze portfolio performance
 * 
 * Accepts CSV file upload with multi-portfolio data and returns
 * Kwanti-style risk metrics compared against S&P 500 TR benchmark.
 * 
 * Master role only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenPayload, isMasterRole } from '@/lib/auth/admin'
import { fetchMarketData, getMarketDataSafe } from '@/lib/market-data'
import { 
  analyzeMultiplePortfolios, 
  PortfolioSeries, 
  PortfolioDataPoint,
  MultiPortfolioResult 
} from '@/lib/portfolio-metrics'

// =============================================================================
// CSV PARSING
// =============================================================================

interface ParsedCSV {
  portfolios: PortfolioSeries[];
  startDate: string;
  endDate: string;
  warnings: string[];
}

/**
 * Parse date from various formats (MM/DD/YY, MM/DD/YYYY, YYYY-MM-DD)
 */
function parseCSVDate(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  
  // Try MM/DD/YY or MM/DD/YYYY format
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    const fullYear = year.length === 2 
      ? (parseInt(year) > 50 ? '19' + year : '20' + year)
      : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try YYYY-MM-DD format
  const dashMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dashMatch) {
    return trimmed;
  }
  
  return null;
}

/**
 * Parse numeric value from CSV (handles commas, $, quotes, etc.)
 */
function parseCSVValue(valueStr: string): number | null {
  const trimmed = valueStr.trim();
  
  // Handle empty or dash values
  if (!trimmed || trimmed === '-' || trimmed === '') {
    return null;
  }
  
  // Remove quotes and common formatting
  const cleaned = trimmed
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/[$,]/g, '')        // Remove $ and , (thousand separators)
    .replace(/\s/g, '');         // Remove whitespace
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse a CSV line respecting quoted fields
 * Handles: value,"value with, comma",value
 */
function parseCSVLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Toggle quote state (handle escaped quotes "")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Don't forget the last field
  result.push(current.trim());
  
  return result;
}

/**
 * Parse multi-portfolio CSV content
 * Expected format:
 * Date,Portfolio1,Portfolio2,...
 * 12/09/20,100000,100000,...
 */
function parseMultiPortfolioCSV(csvContent: string): ParsedCSV {
  const warnings: string[] = [];
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }
  
  // Parse header
  const headerLine = lines[0];
  // Handle both comma and tab delimiters
  const delimiter = headerLine.includes('\t') ? '\t' : ',';
  const headers = parseCSVLine(headerLine, delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());
  
  if (headers.length < 2) {
    throw new Error('CSV must have at least Date and one portfolio column');
  }
  
  // First column is Date, rest are portfolio names
  const portfolioNames = headers.slice(1);
  
  // Initialize portfolio data structures
  const portfolioData: Map<string, PortfolioDataPoint[]> = new Map();
  for (const name of portfolioNames) {
    portfolioData.set(name, []);
  }
  
  // Parse data rows
  let validRows = 0;
  let skippedRows = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line, delimiter);
    
    // Parse date
    const dateStr = parseCSVDate(values[0] || '');
    if (!dateStr) {
      skippedRows++;
      continue;
    }
    
    // Parse each portfolio value
    let hasValidValue = false;
    for (let j = 1; j < values.length && j <= portfolioNames.length; j++) {
      const portfolioName = portfolioNames[j - 1];
      const value = parseCSVValue(values[j] || '');
      
      if (value !== null && value > 0) {
        portfolioData.get(portfolioName)!.push({
          date: dateStr,
          value: value
        });
        hasValidValue = true;
      }
    }
    
    if (hasValidValue) {
      validRows++;
    }
  }
  
  if (skippedRows > 0) {
    warnings.push(`Skipped ${skippedRows} rows with invalid dates`);
  }
  
  if (validRows < 10) {
    throw new Error(`Insufficient data: only ${validRows} valid rows found`);
  }
  
  // Convert to PortfolioSeries array
  const portfolios: PortfolioSeries[] = [];
  
  for (const [name, data] of portfolioData) {
    if (data.length > 0) {
      // Sort by date
      data.sort((a, b) => a.date.localeCompare(b.date));
      portfolios.push({ name, data });
    } else {
      warnings.push(`Portfolio "${name}" has no valid data`);
    }
  }
  
  if (portfolios.length === 0) {
    throw new Error('No valid portfolio data found in CSV');
  }
  
  // Get date range
  const allDates = portfolios.flatMap(p => p.data.map(d => d.date));
  const startDate = allDates.reduce((a, b) => a < b ? a : b);
  const endDate = allDates.reduce((a, b) => a > b ? a : b);
  
  return {
    portfolios,
    startDate,
    endDate,
    warnings
  };
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const tokenResult = await getAdminTokenPayload(request)
    if (!tokenResult.isAuthenticated || !tokenResult.payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only master role can access portfolio analysis
    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Master role required.' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const asOfDate = formData.get('asOfDate') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Read file content
    const csvContent = await file.text()
    
    console.log(`📊 Portfolio Analysis: Processing file "${file.name}" (${csvContent.length} bytes)`)

    // Parse CSV
    let parsedCSV: ParsedCSV
    try {
      parsedCSV = parseMultiPortfolioCSV(csvContent)
      console.log(`✓ Parsed ${parsedCSV.portfolios.length} portfolios from CSV`)
      console.log(`  Date range: ${parsedCSV.startDate} to ${parsedCSV.endDate}`)
      parsedCSV.portfolios.forEach(p => {
        console.log(`  - ${p.name}: ${p.data.length} data points`)
      })
    } catch (e) {
      return NextResponse.json(
        { 
          success: false, 
          message: `CSV parsing error: ${e instanceof Error ? e.message : 'Unknown error'}` 
        },
        { status: 400 }
      )
    }

    // Fetch market data
    console.log('📈 Fetching market data from Yahoo Finance...')
    const marketDataResult = await getMarketDataSafe(
      parsedCSV.startDate,
      parsedCSV.endDate
    )

    if (marketDataResult.warning) {
      parsedCSV.warnings.push(marketDataResult.warning)
    }

    if (marketDataResult.data.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Could not fetch market data from Yahoo Finance. Please try again later.' 
        },
        { status: 503 }
      )
    }

    console.log(`✓ Fetched ${marketDataResult.data.length} market data points`)

    // Run analysis
    console.log('🧮 Calculating portfolio metrics...')
    let result: MultiPortfolioResult
    try {
      result = analyzeMultiplePortfolios(
        parsedCSV.portfolios,
        marketDataResult.data,
        asOfDate || undefined
      )
      
      // Add CSV parsing warnings
      result.warnings = [...parsedCSV.warnings, ...result.warnings]
      
      console.log(`✓ Analysis complete for ${Object.keys(result.portfolios).length} portfolios`)
    } catch (e) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Analysis error: ${e instanceof Error ? e.message : 'Unknown error'}` 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Portfolio analysis error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for testing/health check
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const tokenResult = await getAdminTokenPayload(request)
  if (!tokenResult.isAuthenticated || !tokenResult.payload) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (!isMasterRole(tokenResult.payload)) {
    return NextResponse.json(
      { success: false, message: 'Access denied. Master role required.' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Portfolio Analysis API is ready',
    endpoints: {
      'POST /api/admin/portfolio-analyze': 'Upload CSV file for analysis'
    },
    expectedFormat: {
      description: 'Multi-portfolio CSV with daily values',
      example: 'Date,Portfolio1,Portfolio2\n12/09/20,100000,100000\n...'
    }
  })
}

