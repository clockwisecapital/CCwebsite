/**
 * Portfolio Periods API
 * 
 * GET /api/admin/portfolio-periods - Fetch stored yearly portfolio data
 * 
 * Reconstructs MultiPortfolioResult from database for persistent display
 * on the Admin Dashboard without requiring CSV re-upload.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sortPortfolioNames } from '@/lib/portfolio-order'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import type { MultiPortfolioResult, AnalysisResult, PeriodMetrics } from '@/lib/portfolio-metrics'

interface DBPeriod {
  portfolio_name: string
  period_name: string
  start_date: string
  end_date: string
  portfolio_return: number | null
  benchmark_return: number | null
  excess_return: number | null
  portfolio_std_dev: number | null
  portfolio_alpha: number | null
  portfolio_beta: number | null
  portfolio_sharpe_ratio: number | null
  portfolio_max_drawdown: number | null
  portfolio_up_capture: number | null
  portfolio_down_capture: number | null
  benchmark_std_dev: number | null
  benchmark_sharpe_ratio: number | null
  benchmark_max_drawdown: number | null
  risk_free_rate: number | null
  num_months: number | null
  as_of_date: string | null
  data_start_date: string | null
  data_end_date: string | null
  generated_at: string
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Fetch all period data
    const { data: periods, error } = await supabase
      .from('clockwise_portfolio_periods')
      .select('*')
      .order('portfolio_name', { ascending: true })
      .order('start_date', { ascending: false })
    
    if (error) {
      console.error('Supabase error fetching portfolio periods:', error)
      throw error
    }
    
    if (!periods || periods.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No portfolio data found. Upload a CSV to get started.',
        data: null
      })
    }
    
    // Group periods by portfolio
    const portfolioMap = new Map<string, PeriodMetrics[]>()
    let globalAsOfDate = periods[0]?.as_of_date || new Date().toISOString().split('T')[0]
    let globalDataStartDate = periods[0]?.data_start_date || ''
    let globalDataEndDate = periods[0]?.data_end_date || ''
    
    for (const period of periods as DBPeriod[]) {
      if (!portfolioMap.has(period.portfolio_name)) {
        portfolioMap.set(period.portfolio_name, [])
      }
      
      portfolioMap.get(period.portfolio_name)!.push({
        periodName: period.period_name,
        startDate: period.start_date,
        endDate: period.end_date,
        portfolioReturn: period.portfolio_return ?? 0,
        benchmarkReturn: period.benchmark_return ?? 0,
        excessReturn: period.excess_return ?? 0,
        portfolioStdDev: period.portfolio_std_dev,
        portfolioAlpha: period.portfolio_alpha,
        portfolioBeta: period.portfolio_beta,
        portfolioSharpeRatio: period.portfolio_sharpe_ratio,
        portfolioMaxDrawdown: period.portfolio_max_drawdown,
        portfolioUpCapture: period.portfolio_up_capture,
        portfolioDownCapture: period.portfolio_down_capture,
        benchmarkStdDev: period.benchmark_std_dev,
        benchmarkAlpha: 0, // Always 0 for benchmark
        benchmarkBeta: 1, // Always 1 for benchmark
        benchmarkSharpeRatio: period.benchmark_sharpe_ratio,
        benchmarkMaxDrawdown: period.benchmark_max_drawdown,
        benchmarkUpCapture: 1, // Always 1 for benchmark
        benchmarkDownCapture: 1, // Always 1 for benchmark
        riskFreeRate: period.risk_free_rate ?? 0,
        numMonths: period.num_months ?? 0,
      })
    }
    
    // Construct portfolios object
    const portfolios: Record<string, AnalysisResult> = {}
    
    for (const [portfolioName, periodsList] of portfolioMap.entries()) {
      portfolios[portfolioName] = {
        portfolioName,
        asOfDate: globalAsOfDate,
        generatedAt: new Date().toISOString(),
        dataStartDate: globalDataStartDate,
        dataEndDate: globalDataEndDate,
        periods: periodsList,
        cumulative3Y: periodsList.find(p => p.periodName === '3Y') || null,
        chartData: null, // Chart data not stored in DB (can be regenerated if needed)
        methodology: {
          benchmark: 'S&P 500 Total Return Index',
          riskFree: '3-Month T-Bill',
          source: 'Database (from CSV upload)',
        },
        warnings: [],
      }
    }
    
    // Construct comparison data
    const portfolioNames = sortPortfolioNames(Array.from(portfolioMap.keys()))
    const allPeriodNames = [...new Set(periods.map((p: DBPeriod) => p.period_name))]
    
    const metrics: Record<string, any> = {
      return: {
        displayName: 'Returns',
        byPeriod: {},
        benchmark: {},
      },
      stdDev: {
        displayName: 'Risk (Std Dev)',
        byPeriod: {},
        benchmark: {},
      },
      alpha: {
        displayName: 'Alpha',
        byPeriod: {},
        benchmark: {},
      },
      beta: {
        displayName: 'Beta',
        byPeriod: {},
        benchmark: {},
      },
      sharpe: {
        displayName: 'Sharpe Ratio',
        byPeriod: {},
        benchmark: {},
      },
      maxDrawdown: {
        displayName: 'Max Drawdown',
        byPeriod: {},
        benchmark: {},
      },
      upCapture: {
        displayName: 'Up Capture',
        byPeriod: {},
        benchmark: {},
      },
      downCapture: {
        displayName: 'Down Capture',
        byPeriod: {},
        benchmark: {},
      },
    }
    
    // Populate comparison metrics
    for (const periodName of allPeriodNames) {
      metrics.return.byPeriod[periodName] = {}
      metrics.stdDev.byPeriod[periodName] = {}
      metrics.alpha.byPeriod[periodName] = {}
      metrics.beta.byPeriod[periodName] = {}
      metrics.sharpe.byPeriod[periodName] = {}
      metrics.maxDrawdown.byPeriod[periodName] = {}
      metrics.upCapture.byPeriod[periodName] = {}
      metrics.downCapture.byPeriod[periodName] = {}
      
      // Get benchmark values for this period (from any portfolio's data)
      const samplePeriod = periods.find((p: DBPeriod) => p.period_name === periodName)
      if (samplePeriod) {
        metrics.return.benchmark[periodName] = samplePeriod.benchmark_return
        metrics.stdDev.benchmark[periodName] = samplePeriod.benchmark_std_dev
        metrics.alpha.benchmark[periodName] = 0
        metrics.beta.benchmark[periodName] = 1
        metrics.sharpe.benchmark[periodName] = samplePeriod.benchmark_sharpe_ratio
        metrics.maxDrawdown.benchmark[periodName] = samplePeriod.benchmark_max_drawdown
        metrics.upCapture.benchmark[periodName] = 1
        metrics.downCapture.benchmark[periodName] = 1
      }
      
      for (const portfolioName of portfolioNames) {
        const period = portfolioMap.get(portfolioName)?.find(p => p.periodName === periodName)
        if (period) {
          metrics.return.byPeriod[periodName][portfolioName] = period.portfolioReturn
          metrics.stdDev.byPeriod[periodName][portfolioName] = period.portfolioStdDev
          metrics.alpha.byPeriod[periodName][portfolioName] = period.portfolioAlpha
          metrics.beta.byPeriod[periodName][portfolioName] = period.portfolioBeta
          metrics.sharpe.byPeriod[periodName][portfolioName] = period.portfolioSharpeRatio
          metrics.maxDrawdown.byPeriod[periodName][portfolioName] = period.portfolioMaxDrawdown
          metrics.upCapture.byPeriod[periodName][portfolioName] = period.portfolioUpCapture
          metrics.downCapture.byPeriod[periodName][portfolioName] = period.portfolioDownCapture
        }
      }
    }
    
  // Fetch daily values for chart data
  let chartData = undefined
  try {
    console.log('📊 Fetching daily values for chart data...')
    const { data: dailyValuesResult, error: dailyError } = await supabase
      .from('clockwise_portfolio_daily_values')
      .select('*')
      .order('as_of_date', { ascending: false })
      .limit(1)
    
    if (dailyError) {
      console.error('Error fetching daily values:', dailyError)
    } else if (!dailyValuesResult || dailyValuesResult.length === 0) {
      console.log('⚠️ No daily values found in database')
    } else {
      const dailyValuesData = dailyValuesResult[0]
      console.log('✓ Found daily values, as_of_date:', dailyValuesData.as_of_date)
      
      if (dailyValuesData && dailyValuesData.data) {
        // Reconstruct chart data from daily values
        const portfoliosData = dailyValuesData.data as Record<string, Array<{date: string, value: number}>>
        console.log('📈 Portfolio data keys:', Object.keys(portfoliosData))
        
        // Find benchmark data (usually S&P 500 or SSPX)
        const benchmarkKey = Object.keys(portfoliosData).find(key => 
          key.includes('S&P') || key.includes('$SPX') || key.includes('SSPX') || key.toLowerCase().includes('benchmark')
        ) || Object.keys(portfoliosData).find(key => key.includes('SPX'))
        
        console.log('🎯 Benchmark key found:', benchmarkKey)
        
        if (benchmarkKey && portfoliosData[benchmarkKey]) {
          const benchmarkValues = portfoliosData[benchmarkKey]
          console.log('✓ Benchmark has', benchmarkValues.length, 'data points')
          
          // Filter to last 3 years only (matching table calculation)
          const lastDate = new Date(benchmarkValues[benchmarkValues.length - 1].date)
          const cutoffDate = new Date(lastDate)
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 3)
          
          const last3YBenchmark = benchmarkValues.filter((v: {date: string}) => new Date(v.date) >= cutoffDate)
          console.log('✓ Filtered to last 3 years:', last3YBenchmark.length, 'data points')
          
          const dates = last3YBenchmark.map((d: {date: string}) => d.date)
          
          // Calculate cumulative returns for benchmark (3Y only)
          const benchmarkReturns = last3YBenchmark.map((d: {value: number}, i: number) => {
            if (i === 0) return 0
            return (d.value - last3YBenchmark[0].value) / last3YBenchmark[0].value
          })
          
          // Calculate cumulative returns for each portfolio (3Y only)
          const chartPortfolios: Record<string, { returns: number[]; finalReturn: number }> = {}
          
          for (const [portName, values] of Object.entries(portfoliosData)) {
            if (portName === benchmarkKey) continue // Skip benchmark
            
            // Filter this portfolio to last 3 years too
            const portValues = (values as Array<{date: string; value: number}>).filter(v => new Date(v.date) >= cutoffDate)
            const returns = portValues.map((d, i) => {
              if (i === 0) return 0
              return (d.value - portValues[0].value) / portValues[0].value
            })
            
            chartPortfolios[portName] = {
              returns,
              finalReturn: returns[returns.length - 1]
            }
          }
          
          console.log('✓ Built chart data for', Object.keys(chartPortfolios).length, 'portfolios')
          
          chartData = {
            dates,
            benchmarkName: benchmarkKey.replace(/Clockwise\s+/gi, '').replace('$', ''),
            benchmarkReturns,
            benchmarkFinalReturn: benchmarkReturns[benchmarkReturns.length - 1],
            portfolios: chartPortfolios,
            chartTitle: '3-Year Cumulative Returns vs S&P 500 TR'
          }
        } else {
          console.log('⚠️ No benchmark key found in portfolio data')
        }
      }
    }
  } catch (chartError) {
    console.error('❌ Error loading chart data:', chartError)
    // Continue without chart data
  }
  
  const result: MultiPortfolioResult = {
    asOfDate: globalAsOfDate,
    generatedAt: new Date().toISOString(),
    dataStartDate: globalDataStartDate,
    dataEndDate: globalDataEndDate,
    portfolios,
    comparison: {
      portfolioNames,
      periodNames: allPeriodNames,
      metrics,
      chart: chartData,
    },
    methodology: {
      benchmark: 'S&P 500 Total Return Index',
      riskFree: '3-Month T-Bill',
      source: 'Database (from CSV upload)',
    },
    warnings: [],
  }
  
  return NextResponse.json({ 
    success: true, 
    data: result,
    message: `Loaded data for ${portfolioNames.length} portfolio(s)`
  })
    
  } catch (error) {
    console.error('Error fetching portfolio periods:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch portfolio data',
        data: null
      },
      { status: 500 }
    )
  }
}

