import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminTokenPayload, isMasterRole } from '@/lib/auth/admin'

// Types for portfolio data
interface DailyValue {
  date: string
  value: number
}

interface PortfolioMetrics {
  portfolioName: string
  return3Y: number | null
  stdDev: number | null
  alpha: number | null
  beta: number | null
  sharpeRatio: number | null
  maxDrawdown: number | null
  upCapture: number | null
  downCapture: number | null
  dailyValues: DailyValue[]
}

interface ParsedCSVData {
  portfolios: Record<string, DailyValue[]>
  asOfDate: string
}

// Parse number from string with commas (e.g., "100,000" -> 100000)
function parseNumber(value: string): number | null {
  if (!value || value === '' || value === '-') return null
  const cleaned = value.replace(/,/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

// Parse date from MM/DD/YY or MM/DD/YYYY format
function parseDate(dateStr: string): string {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return dateStr
  
  let year = parts[2]
  if (year.length === 2) {
    // Convert 2-digit year to 4-digit
    const yearNum = parseInt(year)
    year = yearNum < 50 ? `20${year}` : `19${year}`
  }
  
  const month = parts[0].padStart(2, '0')
  const day = parts[1].padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// Parse CSV content
function parseCSV(content: string): ParsedCSVData {
  const lines = content.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row')
  }
  
  // Parse header to get portfolio names
  const header = lines[0].split(',').map(h => h.trim())
  const portfolioNames = header.slice(1) // Skip 'Date' column
  
  // Initialize portfolios
  const portfolios: Record<string, DailyValue[]> = {}
  for (const name of portfolioNames) {
    if (name) {
      portfolios[name] = []
    }
  }
  
  let latestDate = ''
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Handle CSV with quoted values containing commas
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.replace(/"/g, '').trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.replace(/"/g, '').trim())
    
    const date = parseDate(values[0])
    
    // Update latest date
    if (date > latestDate) {
      latestDate = date
    }
    
    // Add values to each portfolio
    portfolioNames.forEach((name, idx) => {
      if (name && portfolios[name]) {
        const value = parseNumber(values[idx + 1])
        if (value !== null) {
          portfolios[name].push({ date, value })
        }
      }
    })
  }
  
  // Sort each portfolio by date
  for (const name of Object.keys(portfolios)) {
    portfolios[name].sort((a, b) => a.date.localeCompare(b.date))
  }
  
  return {
    portfolios,
    asOfDate: latestDate
  }
}

// Calculate daily returns from values
function calculateDailyReturns(values: DailyValue[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < values.length; i++) {
    const prevValue = values[i - 1].value
    const currValue = values[i].value
    if (prevValue > 0) {
      returns.push((currValue - prevValue) / prevValue)
    }
  }
  return returns
}

// Calculate standard deviation
function calculateStdDev(returns: number[]): number {
  if (returns.length === 0) return 0
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length
  return Math.sqrt(avgSquaredDiff) * Math.sqrt(252) // Annualize
}

// Calculate maximum drawdown
function calculateMaxDrawdown(values: DailyValue[]): number {
  let maxDrawdown = 0
  let peak = values[0]?.value || 0
  
  for (const { value } of values) {
    if (value > peak) {
      peak = value
    }
    const drawdown = (peak - value) / peak
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  
  return -maxDrawdown // Return as negative
}

// Calculate Sharpe ratio (assuming risk-free rate of 4%)
function calculateSharpeRatio(returns: number[]): number {
  if (returns.length === 0) return 0
  const annualizedReturn = returns.reduce((a, b) => a + b, 0) / returns.length * 252
  const annualizedStdDev = calculateStdDev(returns)
  const riskFreeRate = 0.04
  
  if (annualizedStdDev === 0) return 0
  return (annualizedReturn - riskFreeRate) / annualizedStdDev
}

// Calculate total return over period
function calculateTotalReturn(values: DailyValue[]): number {
  if (values.length < 2) return 0
  const startValue = values[0].value
  const endValue = values[values.length - 1].value
  return (endValue - startValue) / startValue
}

// Get values for the last N years
function getLastNYearsValues(values: DailyValue[], years: number): DailyValue[] {
  if (values.length === 0) return []
  
  const lastDate = new Date(values[values.length - 1].date)
  const cutoffDate = new Date(lastDate)
  cutoffDate.setFullYear(cutoffDate.getFullYear() - years)
  
  return values.filter(v => new Date(v.date) >= cutoffDate)
}

// Calculate metrics for a portfolio
function calculatePortfolioMetrics(name: string, values: DailyValue[]): PortfolioMetrics {
  // Get last 3 years of data
  const last3YValues = getLastNYearsValues(values, 3)
  
  const returns = calculateDailyReturns(last3YValues)
  
  return {
    portfolioName: name,
    return3Y: last3YValues.length >= 2 ? calculateTotalReturn(last3YValues) : null,
    stdDev: returns.length > 0 ? calculateStdDev(returns) : null,
    alpha: null, // Would need benchmark data
    beta: null, // Would need benchmark data
    sharpeRatio: returns.length > 0 ? calculateSharpeRatio(returns) : null,
    maxDrawdown: last3YValues.length > 0 ? calculateMaxDrawdown(last3YValues) : null,
    upCapture: null, // Would need benchmark data
    downCapture: null, // Would need benchmark data
    dailyValues: values
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication using JWT token
    const tokenResult = await getAdminTokenPayload(req)
    
    if (!tokenResult.isAuthenticated || !tokenResult.payload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    
    // Only master can upload
    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json({ success: false, message: 'Only master admin can upload portfolios' }, { status: 403 })
    }
    
    const session = tokenResult.payload
    
    // Parse the multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }
    
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ success: false, message: 'File must be a CSV' }, { status: 400 })
    }
    
    // Read file content
    const content = await file.text()
    
    // Parse CSV
    const parsedData = parseCSV(content)
    
    if (Object.keys(parsedData.portfolios).length === 0) {
      return NextResponse.json({ success: false, message: 'No portfolio data found in CSV' }, { status: 400 })
    }
    
    // Calculate metrics for each portfolio
    const portfolioMetrics: PortfolioMetrics[] = []
    for (const [name, values] of Object.entries(parsedData.portfolios)) {
      if (values.length > 0) {
        portfolioMetrics.push(calculatePortfolioMetrics(name, values))
      }
    }
    
    // Save to database using service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, message: 'Database configuration error' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
    
    // Upsert each portfolio using the correct column schema
    for (const metrics of portfolioMetrics) {
      // Map portfolio name to database name format
      const dbName = metrics.portfolioName.replace('Clockwise ', '')
      
      const { error } = await supabase
        .from('clockwise_portfolios')
        .upsert({
          name: dbName,
          return_3y: metrics.return3Y,
          std_dev: metrics.stdDev,
          alpha: metrics.alpha,
          beta: metrics.beta,
          sharpe_ratio: metrics.sharpeRatio,
          max_drawdown: metrics.maxDrawdown,
          up_capture: metrics.upCapture,
          down_capture: metrics.downCapture,
          is_benchmark: false,
          updated_by: session.username
        }, { 
          onConflict: 'name'
        })
      
      if (error) {
        console.error('Error saving portfolio:', metrics.portfolioName, error)
      }
    }
    
    // Also store the daily values in a separate table for historical reference (if table exists)
    // This allows us to recalculate metrics later if needed
    try {
      const { error: valuesError } = await supabase
        .from('clockwise_portfolio_daily_values')
        .upsert({
          as_of_date: parsedData.asOfDate,
          data: parsedData.portfolios,
          uploaded_at: new Date().toISOString(),
          uploaded_by: session.username
        }, {
          onConflict: 'as_of_date'
        })
      
      if (valuesError) {
        // Table might not exist yet, that's okay
        console.log('Note: Daily values table not available:', valuesError.message)
      }
    } catch {
      // Ignore errors for the optional daily values table
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${portfolioMetrics.length} portfolios`,
      data: {
        portfolioCount: portfolioMetrics.length,
        asOfDate: parsedData.asOfDate,
        portfolioNames: portfolioMetrics.map(p => p.portfolioName)
      }
    })
    
  } catch (e) {
    console.error('CSV upload error:', e)
    return NextResponse.json({ 
      success: false, 
      message: e instanceof Error ? e.message : 'Failed to process CSV file' 
    }, { status: 500 })
  }
}

