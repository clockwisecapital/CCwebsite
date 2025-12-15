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

// Fetch S&P 500 Total Return data from Yahoo Finance
async function fetchSP500TRData(startDate: string, endDate: string): Promise<DailyValue[]> {
  try {
    // Convert dates to Unix timestamps
    const start = Math.floor(new Date(startDate).getTime() / 1000)
    const end = Math.floor(new Date(endDate).getTime() / 1000) + 86400 // Add one day buffer
    
    // Yahoo Finance API endpoint for ^SP500TR (S&P 500 Total Return - includes dividends)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5ESP500TR?period1=${start}&period2=${end}&interval=1d`
    
    console.log('📈 Fetching S&P 500 Total Return (^SP500TR)...')
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.error('Yahoo Finance API error:', response.status)
      return []
    }
    
    const data = await response.json()
    
    const timestamps = data.chart?.result?.[0]?.timestamp || []
    const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    
    const values: DailyValue[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined) {
        const date = new Date(timestamps[i] * 1000)
        values.push({
          date: date.toISOString().split('T')[0],
          value: closes[i]
        })
      }
    }
    
    console.log(`✅ Retrieved ${values.length} days of S&P 500 TR data`)
    return values.sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Error fetching S&P 500 TR data:', error)
    return []
  }
}

// Fetch 3-Month T-Bill rates from Yahoo Finance
async function fetchTBillRates(startDate: string, endDate: string): Promise<Map<string, number>> {
  try {
    const start = Math.floor(new Date(startDate).getTime() / 1000)
    const end = Math.floor(new Date(endDate).getTime() / 1000) + 86400
    
    // Yahoo Finance API endpoint for ^IRX (3-Month T-Bill)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EIRX?period1=${start}&period2=${end}&interval=1d`
    
    console.log('📈 Fetching T-Bill rates (^IRX)...')
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.error('Yahoo Finance T-Bill API error:', response.status)
      return new Map()
    }
    
    const data = await response.json()
    
    const timestamps = data.chart?.result?.[0]?.timestamp || []
    const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    
    const rates = new Map<string, number>()
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined) {
        const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
        rates.set(date, closes[i] / 100) // Convert from percentage to decimal
      }
    }
    
    console.log(`✅ Retrieved ${rates.size} T-Bill rate observations`)
    return rates
  } catch (error) {
    console.error('Error fetching T-Bill rates:', error)
    return new Map()
  }
}

// Calculate Beta using EXCESS returns (Morningstar methodology)
// Beta = Cov(Portfolio Excess, Benchmark Excess) / Var(Benchmark Excess)
function calculateBeta(
  portfolioExcessReturns: number[], 
  benchmarkExcessReturns: number[]
): number {
  if (portfolioExcessReturns.length !== benchmarkExcessReturns.length || portfolioExcessReturns.length < 3) {
    return 1 // Default to 1 if not enough data
  }
  
  const n = portfolioExcessReturns.length
  const meanP = portfolioExcessReturns.reduce((a, b) => a + b, 0) / n
  const meanB = benchmarkExcessReturns.reduce((a, b) => a + b, 0) / n
  
  let covariance = 0
  let variance = 0
  
  for (let i = 0; i < n; i++) {
    covariance += (portfolioExcessReturns[i] - meanP) * (benchmarkExcessReturns[i] - meanB)
    variance += Math.pow(benchmarkExcessReturns[i] - meanB, 2)
  }
  
  // Use sample covariance/variance (n-1)
  covariance /= (n - 1)
  variance /= (n - 1)
  
  if (variance === 0) return 1
  return covariance / variance
}

// Calculate Alpha (Morningstar methodology)
// Alpha = (avg_portfolio_excess - beta * avg_benchmark_excess) * 12
function calculateAlpha(
  portfolioExcessReturns: number[],
  benchmarkExcessReturns: number[],
  beta: number
): number {
  if (portfolioExcessReturns.length === 0) return 0
  
  const avgPortfolioExcess = portfolioExcessReturns.reduce((a, b) => a + b, 0) / portfolioExcessReturns.length
  const avgBenchmarkExcess = benchmarkExcessReturns.reduce((a, b) => a + b, 0) / benchmarkExcessReturns.length
  
  // Annualize by multiplying by 12 (monthly data)
  return (avgPortfolioExcess - beta * avgBenchmarkExcess) * 12
}

// Calculate Up/Down Capture ratios (Morningstar methodology)
// Uses compounded returns: (1+r1)(1+r2)...(1+rn) - 1
function calculateCaptureRatios(
  portfolioReturns: number[],
  benchmarkReturns: number[]
): { upCapture: number; downCapture: number } {
  if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 3) {
    return { upCapture: 1, downCapture: 1 }
  }
  
  // Up periods: when benchmark > 0
  let upPortfolioProduct = 1
  let upBenchmarkProduct = 1
  
  // Down periods: when benchmark < 0
  let downPortfolioProduct = 1
  let downBenchmarkProduct = 1
  
  for (let i = 0; i < benchmarkReturns.length; i++) {
    if (benchmarkReturns[i] > 0) {
      // Up period - compound returns
      upPortfolioProduct *= (1 + portfolioReturns[i])
      upBenchmarkProduct *= (1 + benchmarkReturns[i])
    } else if (benchmarkReturns[i] < 0) {
      // Down period - compound returns
      downPortfolioProduct *= (1 + portfolioReturns[i])
      downBenchmarkProduct *= (1 + benchmarkReturns[i])
    }
  }
  
  // Capture = compounded portfolio return / compounded benchmark return
  const upPortfolioReturn = upPortfolioProduct - 1
  const upBenchmarkReturn = upBenchmarkProduct - 1
  const downPortfolioReturn = downPortfolioProduct - 1
  const downBenchmarkReturn = downBenchmarkProduct - 1
  
  const upCapture = upBenchmarkReturn !== 0 ? upPortfolioReturn / upBenchmarkReturn : 1
  const downCapture = downBenchmarkReturn !== 0 ? downPortfolioReturn / downBenchmarkReturn : 1
  
  return { upCapture, downCapture }
}

// Monthly data structure with excess returns
interface MonthlyData {
  month: string
  portfolioReturn: number
  benchmarkReturn: number
  riskFreeRate: number
  portfolioExcess: number
  benchmarkExcess: number
}

// Calculate monthly returns from daily values with T-Bill rates
function calculateMonthlyData(
  portfolioValues: DailyValue[],
  benchmarkValues: DailyValue[],
  tbillRates: Map<string, number>
): MonthlyData[] {
  if (portfolioValues.length < 2 || benchmarkValues.length < 2) return []
  
  // Group portfolio values by month (YYYY-MM), take last value of each month
  const portfolioMonthly = new Map<string, number>()
  for (const v of portfolioValues) {
    const monthKey = v.date.substring(0, 7)
    portfolioMonthly.set(monthKey, v.value) // Last value wins
  }
  
  // Group benchmark values by month
  const benchmarkMonthly = new Map<string, number>()
  for (const v of benchmarkValues) {
    const monthKey = v.date.substring(0, 7)
    benchmarkMonthly.set(monthKey, v.value)
  }
  
  // Get average T-Bill rate per month
  const tbillMonthly = new Map<string, { sum: number; count: number }>()
  for (const [date, rate] of tbillRates) {
    const monthKey = date.substring(0, 7)
    const existing = tbillMonthly.get(monthKey)
    if (existing) {
      existing.sum += rate
      existing.count++
    } else {
      tbillMonthly.set(monthKey, { sum: rate, count: 1 })
    }
  }
  
  // Get sorted months that exist in both datasets
  const allMonths = [...portfolioMonthly.keys()].filter(m => benchmarkMonthly.has(m)).sort()
  
  // Calculate monthly returns
  const monthlyData: MonthlyData[] = []
  
  for (let i = 1; i < allMonths.length; i++) {
    const prevMonth = allMonths[i - 1]
    const currMonth = allMonths[i]
    
    const prevPortfolio = portfolioMonthly.get(prevMonth)!
    const currPortfolio = portfolioMonthly.get(currMonth)!
    const prevBenchmark = benchmarkMonthly.get(prevMonth)!
    const currBenchmark = benchmarkMonthly.get(currMonth)!
    
    if (prevPortfolio > 0 && prevBenchmark > 0) {
      const portfolioReturn = (currPortfolio - prevPortfolio) / prevPortfolio
      const benchmarkReturn = (currBenchmark - prevBenchmark) / prevBenchmark
      
      // Get monthly risk-free rate (T-Bill annual rate / 12)
      const tbillData = tbillMonthly.get(currMonth)
      const annualRate = tbillData ? tbillData.sum / tbillData.count : 0.04 // Default to 4% if no data
      const monthlyRiskFree = annualRate / 12
      
      monthlyData.push({
        month: currMonth,
        portfolioReturn,
        benchmarkReturn,
        riskFreeRate: monthlyRiskFree,
        portfolioExcess: portfolioReturn - monthlyRiskFree,
        benchmarkExcess: benchmarkReturn - monthlyRiskFree
      })
    }
  }
  
  return monthlyData
}

// Calculate metrics for a portfolio with benchmark comparison (Morningstar methodology)
function calculatePortfolioMetricsWithBenchmark(
  name: string,
  values: DailyValue[],
  benchmarkValues: DailyValue[],
  tbillRates: Map<string, number>
): PortfolioMetrics {
  // Get last 3 years of data
  const last3YValues = getLastNYearsValues(values, 3)
  const last3YBenchmark = getLastNYearsValues(benchmarkValues, 3)
  
  const dailyReturns = calculateDailyReturns(last3YValues)
  const totalReturn = last3YValues.length >= 2 ? calculateTotalReturn(last3YValues) : null
  const benchmarkTotalReturn = last3YBenchmark.length >= 2 ? calculateTotalReturn(last3YBenchmark) : null
  
  // Calculate monthly data with excess returns (Morningstar methodology)
  const monthlyData = calculateMonthlyData(last3YValues, last3YBenchmark, tbillRates)
  
  let alpha: number | null = null
  let beta: number | null = null
  let upCapture: number | null = null
  let downCapture: number | null = null
  
  // Need at least 12 months of data for meaningful calculations
  if (monthlyData.length >= 12) {
    // Extract arrays for calculations
    const portfolioExcess = monthlyData.map(m => m.portfolioExcess)
    const benchmarkExcess = monthlyData.map(m => m.benchmarkExcess)
    const portfolioReturns = monthlyData.map(m => m.portfolioReturn)
    const benchmarkReturns = monthlyData.map(m => m.benchmarkReturn)
    
    // Calculate Beta using EXCESS returns
    beta = calculateBeta(portfolioExcess, benchmarkExcess)
    
    // Calculate Alpha using Morningstar formula
    alpha = calculateAlpha(portfolioExcess, benchmarkExcess, beta)
    
    // Calculate capture ratios using raw returns
    const captureRatios = calculateCaptureRatios(portfolioReturns, benchmarkReturns)
    upCapture = captureRatios.upCapture
    downCapture = captureRatios.downCapture
    
    console.log(`  ${name}: Beta=${beta.toFixed(2)}, Alpha=${(alpha*100).toFixed(1)}%, Up=${upCapture.toFixed(2)}, Down=${downCapture.toFixed(2)} (${monthlyData.length} months)`)
  }
  
  return {
    portfolioName: name,
    return3Y: totalReturn,
    stdDev: dailyReturns.length > 0 ? calculateStdDev(dailyReturns) : null,
    alpha,
    beta,
    sharpeRatio: dailyReturns.length > 0 ? calculateSharpeRatio(dailyReturns) : null,
    maxDrawdown: last3YValues.length > 0 ? calculateMaxDrawdown(last3YValues) : null,
    upCapture,
    downCapture,
    dailyValues: values
  }
}

// Legacy function without benchmark (fallback)
function calculatePortfolioMetrics(name: string, values: DailyValue[]): PortfolioMetrics {
  // Get last 3 years of data
  const last3YValues = getLastNYearsValues(values, 3)
  
  const returns = calculateDailyReturns(last3YValues)
  
  return {
    portfolioName: name,
    return3Y: last3YValues.length >= 2 ? calculateTotalReturn(last3YValues) : null,
    stdDev: returns.length > 0 ? calculateStdDev(returns) : null,
    alpha: null,
    beta: null,
    sharpeRatio: returns.length > 0 ? calculateSharpeRatio(returns) : null,
    maxDrawdown: last3YValues.length > 0 ? calculateMaxDrawdown(last3YValues) : null,
    upCapture: null,
    downCapture: null,
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
    
    // Get date range from portfolio data
    let earliestDate = ''
    let latestDate = ''
    for (const values of Object.values(parsedData.portfolios)) {
      if (values.length > 0) {
        const firstDate = values[0].date
        const lastDate = values[values.length - 1].date
        if (!earliestDate || firstDate < earliestDate) earliestDate = firstDate
        if (!latestDate || lastDate > latestDate) latestDate = lastDate
      }
    }
    
    // Fetch market data from Yahoo Finance (Morningstar methodology)
    console.log(`📈 Fetching market data (${earliestDate} to ${latestDate})...`)
    
    // Fetch S&P 500 Total Return (includes dividends) and T-Bill rates in parallel
    const [sp500TRData, tbillRates] = await Promise.all([
      fetchSP500TRData(earliestDate, latestDate),
      fetchTBillRates(earliestDate, latestDate)
    ])
    
    // Calculate metrics for each portfolio
    const portfolioMetrics: PortfolioMetrics[] = []
    for (const [name, values] of Object.entries(parsedData.portfolios)) {
      if (values.length > 0) {
        if (sp500TRData.length > 0) {
          // Use S&P 500 TR benchmark with T-Bill rates (Morningstar methodology)
          portfolioMetrics.push(calculatePortfolioMetricsWithBenchmark(name, values, sp500TRData, tbillRates))
        } else {
          // Fallback without benchmark
          portfolioMetrics.push(calculatePortfolioMetrics(name, values))
        }
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
    
    // Upsert each portfolio with all calculated metrics
    for (const metrics of portfolioMetrics) {
      // Map portfolio name to database name format
      const dbName = metrics.portfolioName.replace('Clockwise ', '')
      
      console.log(`📊 Saving ${dbName}: Alpha=${metrics.alpha?.toFixed(4)}, Beta=${metrics.beta?.toFixed(2)}, Up=${metrics.upCapture?.toFixed(2)}, Down=${metrics.downCapture?.toFixed(2)}`)
      
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
    
    // Also save/update S&P 500 benchmark data (using Total Return data)
    if (sp500TRData.length > 0) {
      const last3YSP500 = getLastNYearsValues(sp500TRData, 3)
      const sp500Returns = calculateDailyReturns(last3YSP500)
      
      const sp500Metrics = {
        return3Y: last3YSP500.length >= 2 ? calculateTotalReturn(last3YSP500) : null,
        stdDev: sp500Returns.length > 0 ? calculateStdDev(sp500Returns) : null,
        sharpeRatio: sp500Returns.length > 0 ? calculateSharpeRatio(sp500Returns) : null,
        maxDrawdown: last3YSP500.length > 0 ? calculateMaxDrawdown(last3YSP500) : null
      }
      
      console.log(`📊 S&P 500: Return=${sp500Metrics.return3Y ? (sp500Metrics.return3Y * 100).toFixed(2) : 'N/A'}%`)
      
      const { error: benchmarkError } = await supabase
        .from('clockwise_portfolios')
        .upsert({
          name: 'S&P 500',
          return_3y: sp500Metrics.return3Y,
          std_dev: sp500Metrics.stdDev,
          alpha: 0, // Benchmark alpha is always 0
          beta: 1, // Benchmark beta is always 1
          sharpe_ratio: sp500Metrics.sharpeRatio,
          max_drawdown: sp500Metrics.maxDrawdown,
          up_capture: 1, // Benchmark capture is always 1
          down_capture: 1,
          is_benchmark: true,
          updated_by: session.username
        }, { 
          onConflict: 'name'
        })
      
      if (benchmarkError) {
        console.error('Error saving S&P 500 benchmark:', benchmarkError)
      } else {
        console.log('✅ S&P 500 benchmark data saved')
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

