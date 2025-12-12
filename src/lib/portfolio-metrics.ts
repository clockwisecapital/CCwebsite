/**
 * Portfolio Metrics Calculator
 * 
 * TypeScript port of Kwanti-style portfolio performance and risk metrics.
 * Methodology matches industry standards (Morningstar/Kwanti).
 * 
 * Benchmark: S&P 500 Total Return Index
 * Risk-Free Rate: 3-Month T-Bill historical rates
 * Volatility/Beta/Alpha/Capture: Monthly returns
 * Max Drawdown: Daily data
 */

import { MarketDataPoint } from './market-data';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface PortfolioDataPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface PortfolioSeries {
  name: string;
  data: PortfolioDataPoint[];
}

export interface PeriodMetrics {
  periodName: string;
  startDate: string;
  endDate: string;
  
  // Returns
  portfolioReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  
  // Risk metrics - Portfolio
  portfolioStdDev: number | null;
  portfolioAlpha: number | null;
  portfolioBeta: number | null;
  portfolioSharpeRatio: number | null;
  portfolioMaxDrawdown: number | null;
  portfolioUpCapture: number | null;
  portfolioDownCapture: number | null;
  
  // Risk metrics - Benchmark
  benchmarkStdDev: number | null;
  benchmarkAlpha: number;
  benchmarkBeta: number;
  benchmarkSharpeRatio: number | null;
  benchmarkMaxDrawdown: number | null;
  benchmarkUpCapture: number;
  benchmarkDownCapture: number;
  
  // Context
  riskFreeRate: number;
  numMonths: number;
}

export interface ChartData {
  dates: string[];
  portfolioReturns: number[]; // Cumulative return starting from 0
  benchmarkReturns: number[]; // Cumulative return starting from 0
  portfolioName: string;
  benchmarkName: string;
  startDate: string;
  endDate: string;
}

export interface AnalysisResult {
  portfolioName: string;
  asOfDate: string;
  generatedAt: string;
  dataStartDate: string;
  dataEndDate: string;
  
  periods: PeriodMetrics[];
  cumulative3Y: PeriodMetrics | null;
  chartData: ChartData | null;
  
  methodology: Record<string, string>;
  warnings: string[];
}

export interface MultiPortfolioResult {
  asOfDate: string;
  generatedAt: string;
  dataStartDate: string;
  dataEndDate: string;
  
  portfolios: Record<string, AnalysisResult>;
  comparison: ComparisonData;
  
  methodology: Record<string, string>;
  warnings: string[];
}

export interface ComparisonData {
  portfolioNames: string[];
  periodNames: string[];
  metrics: Record<string, {
    displayName: string;
    byPeriod: Record<string, Record<string, number | null>>;
    benchmark: Record<string, number | null>;
  }>;
  cumulative3Y?: Record<string, {
    return: number;
    stdDev: number | null;
    alpha: number | null;
    beta: number | null;
    sharpe: number | null;
    maxDrawdown: number | null;
  }>;
  chart?: {
    dates: string[];
    benchmarkName: string;
    benchmarkReturns: number[];
    portfolios: Record<string, number[]>;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate mean of an array
 */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate standard deviation of an array
 */
function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculate covariance between two arrays
 */
function covariance(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length || arr1.length < 2) return 0;
  const mean1 = mean(arr1);
  const mean2 = mean(arr2);
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += (arr1[i] - mean1) * (arr2[i] - mean2);
  }
  return sum / (arr1.length - 1);
}

/**
 * Calculate variance of an array
 */
function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return squareDiffs.reduce((a, b) => a + b, 0) / (arr.length - 1);
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get year-month key from date string
 */
function getYearMonth(dateStr: string): string {
  return dateStr.substring(0, 7); // YYYY-MM
}

/**
 * Round to specified decimal places
 */
function round(value: number | null, decimals: number): number | null {
  if (value === null || isNaN(value) || !isFinite(value)) return null;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// =============================================================================
// CORE CALCULATIONS
// =============================================================================

interface MergedDataPoint {
  date: string;
  portfolioValue: number;
  portfolioReturn: number;
  spxValue: number;
  spxReturn: number;
  tbRate: number;
}

interface MonthlyDataPoint {
  yearMonth: string;
  portfolioValue: number;
  spxValue: number;
  tbRate: number;
  portReturn: number;
  spxReturn: number;
  rfMonthly: number;
  portExcess: number;
  spxExcess: number;
}

/**
 * Merge portfolio data with market data
 */
function mergeData(
  portfolioData: PortfolioDataPoint[],
  marketData: MarketDataPoint[]
): MergedDataPoint[] {
  // Create market data map
  const marketMap = new Map<string, MarketDataPoint>();
  marketData.forEach(m => marketMap.set(m.date, m));
  
  // Get first SPX value for normalization
  const firstMarket = marketData.find(m => 
    portfolioData.some(p => p.date === m.date)
  );
  const spxStart = firstMarket?.spxClose || marketData[0]?.spxClose || 1;
  const portStart = portfolioData[0]?.value || 100000;
  
  const merged: MergedDataPoint[] = [];
  let prevPortValue: number | null = null;
  let prevSpxClose: number | null = null;
  let lastTbRate = 0.05;
  
  for (const port of portfolioData) {
    const market = marketMap.get(port.date);
    
    // Get SPX value (normalized to portfolio start)
    let spxClose = market?.spxClose;
    let tbRate = market?.tbRate ?? lastTbRate;
    
    if (spxClose !== undefined) {
      lastTbRate = tbRate;
    } else {
      // Try to find nearest market data
      continue; // Skip days without market data
    }
    
    const spxValue = (spxClose / spxStart) * portStart;
    
    // Calculate daily returns
    const portReturn = prevPortValue !== null 
      ? (port.value / prevPortValue) - 1 
      : 0;
    const spxReturn = prevSpxClose !== null 
      ? (spxClose / prevSpxClose) - 1 
      : 0;
    
    merged.push({
      date: port.date,
      portfolioValue: port.value,
      portfolioReturn: portReturn,
      spxValue: spxValue,
      spxReturn: spxReturn,
      tbRate: tbRate
    });
    
    prevPortValue = port.value;
    prevSpxClose = spxClose;
  }
  
  return merged;
}

/**
 * Resample to monthly data
 */
function toMonthlyData(dailyData: MergedDataPoint[]): MonthlyDataPoint[] {
  // Group by year-month
  const byMonth = new Map<string, MergedDataPoint[]>();
  
  for (const d of dailyData) {
    const ym = getYearMonth(d.date);
    if (!byMonth.has(ym)) {
      byMonth.set(ym, []);
    }
    byMonth.get(ym)!.push(d);
  }
  
  // Get last day of each month
  const monthly: MonthlyDataPoint[] = [];
  const sortedMonths = Array.from(byMonth.keys()).sort();
  
  let prevPortValue: number | null = null;
  let prevSpxValue: number | null = null;
  
  for (const ym of sortedMonths) {
    const monthData = byMonth.get(ym)!;
    const lastDay = monthData[monthData.length - 1];
    const avgTbRate = mean(monthData.map(d => d.tbRate));
    
    const portReturn = prevPortValue !== null 
      ? (lastDay.portfolioValue / prevPortValue) - 1 
      : 0;
    const spxReturn = prevSpxValue !== null 
      ? (lastDay.spxValue / prevSpxValue) - 1 
      : 0;
    const rfMonthly = avgTbRate / 12;
    
    monthly.push({
      yearMonth: ym,
      portfolioValue: lastDay.portfolioValue,
      spxValue: lastDay.spxValue,
      tbRate: avgTbRate,
      portReturn: portReturn,
      spxReturn: spxReturn,
      rfMonthly: rfMonthly,
      portExcess: portReturn - rfMonthly,
      spxExcess: spxReturn - rfMonthly
    });
    
    prevPortValue = lastDay.portfolioValue;
    prevSpxValue = lastDay.spxValue;
  }
  
  return monthly;
}

/**
 * Filter data for a specific period
 */
function filterPeriod(
  data: MergedDataPoint[],
  startDate: string,
  endDate: string
): MergedDataPoint[] {
  return data.filter(d => d.date >= startDate && d.date <= endDate);
}

/**
 * Calculate max drawdown from daily data
 */
function calculateMaxDrawdown(values: number[]): number {
  if (values.length === 0) return 0;
  
  let peak = values[0];
  let maxDD = 0;
  
  for (const value of values) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = (value / peak) - 1;
    if (drawdown < maxDD) {
      maxDD = drawdown;
    }
  }
  
  return maxDD;
}

/**
 * Calculate capture ratio
 */
function calculateCaptureRatio(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  isUp: boolean
): number | null {
  if (portfolioReturns.length !== benchmarkReturns.length) return null;
  
  const filteredPort: number[] = [];
  const filteredBench: number[] = [];
  
  for (let i = 0; i < benchmarkReturns.length; i++) {
    if (isUp ? benchmarkReturns[i] > 0 : benchmarkReturns[i] < 0) {
      filteredPort.push(portfolioReturns[i]);
      filteredBench.push(benchmarkReturns[i]);
    }
  }
  
  if (filteredBench.length === 0) return null;
  
  // Compound returns
  const portCompound = filteredPort.reduce((acc, r) => acc * (1 + r), 1) - 1;
  const benchCompound = filteredBench.reduce((acc, r) => acc * (1 + r), 1) - 1;
  
  if (benchCompound === 0) return null;
  return portCompound / benchCompound;
}

/**
 * Calculate all metrics for a single period
 */
function calculatePeriodMetrics(
  dailyData: MergedDataPoint[],
  periodName: string,
  startDate: string,
  endDate: string
): PeriodMetrics {
  const periodDaily = filterPeriod(dailyData, startDate, endDate);
  
  if (periodDaily.length < 2) {
    throw new Error(`Insufficient data for period ${periodName}`);
  }
  
  // Filter monthly data for this period
  const allMonthly = toMonthlyData(dailyData);
  const startYM = getYearMonth(startDate);
  const endYM = getYearMonth(endDate);
  const periodMonthly = allMonthly.filter(m => 
    m.yearMonth >= startYM && m.yearMonth <= endYM
  );
  
  // Period returns
  const portReturn = (periodDaily[periodDaily.length - 1].portfolioValue / 
                      periodDaily[0].portfolioValue) - 1;
  const spxReturn = (periodDaily[periodDaily.length - 1].spxValue / 
                     periodDaily[0].spxValue) - 1;
  
  // Risk-free rate (average for period)
  const rfAnnual = mean(periodMonthly.map(m => m.tbRate));
  
  // Get monthly returns (excluding first month which has no return)
  const monthlyPortReturns = periodMonthly.slice(1).map(m => m.portReturn);
  const monthlySpxReturns = periodMonthly.slice(1).map(m => m.spxReturn);
  const monthlyPortExcess = periodMonthly.slice(1).map(m => m.portExcess);
  const monthlySpxExcess = periodMonthly.slice(1).map(m => m.spxExcess);
  
  // Standard deviation (annualized from monthly)
  const portStd = monthlyPortReturns.length >= 2 
    ? stdDev(monthlyPortReturns) * Math.sqrt(12) 
    : null;
  const spxStd = monthlySpxReturns.length >= 2 
    ? stdDev(monthlySpxReturns) * Math.sqrt(12) 
    : null;
  
  // Beta - Portfolio vs Benchmark
  let portBeta: number | null = null;
  if (monthlyPortExcess.length >= 3) {
    const cov = covariance(monthlyPortExcess, monthlySpxExcess);
    const benchVar = variance(monthlySpxExcess);
    portBeta = benchVar !== 0 ? cov / benchVar : null;
  }
  
  // Alpha (annualized)
  let portAlpha: number | null = null;
  if (monthlyPortExcess.length >= 3 && portBeta !== null) {
    const avgPortExcess = mean(monthlyPortExcess);
    const avgSpxExcess = mean(monthlySpxExcess);
    portAlpha = (avgPortExcess - portBeta * avgSpxExcess) * 12;
  }
  
  // Sharpe ratios
  const portSharpe = portStd !== null && portStd > 0 
    ? (portReturn - rfAnnual) / portStd 
    : null;
  const spxSharpe = spxStd !== null && spxStd > 0 
    ? (spxReturn - rfAnnual) / spxStd 
    : null;
  
  // Max drawdown (daily)
  const portMaxDD = calculateMaxDrawdown(periodDaily.map(d => d.portfolioValue));
  const spxMaxDD = calculateMaxDrawdown(periodDaily.map(d => d.spxValue));
  
  // Capture ratios
  const portUpCapture = calculateCaptureRatio(
    monthlyPortReturns, monthlySpxReturns, true
  );
  const portDownCapture = calculateCaptureRatio(
    monthlyPortReturns, monthlySpxReturns, false
  );
  
  return {
    periodName,
    startDate,
    endDate,
    portfolioReturn: round(portReturn, 4)!,
    benchmarkReturn: round(spxReturn, 4)!,
    excessReturn: round(portReturn - spxReturn, 4)!,
    // Portfolio metrics
    portfolioStdDev: round(portStd, 4),
    portfolioAlpha: round(portAlpha, 4),
    portfolioBeta: round(portBeta, 2),
    portfolioSharpeRatio: round(portSharpe, 2),
    portfolioMaxDrawdown: round(portMaxDD, 4),
    portfolioUpCapture: round(portUpCapture, 2),
    portfolioDownCapture: round(portDownCapture, 2),
    // Benchmark metrics
    benchmarkStdDev: round(spxStd, 4),
    benchmarkAlpha: 0, // Benchmark alpha vs itself is 0
    benchmarkBeta: 1, // Benchmark beta vs itself is 1
    benchmarkSharpeRatio: round(spxSharpe, 2),
    benchmarkMaxDrawdown: round(spxMaxDD, 4),
    benchmarkUpCapture: 1, // 100% capture
    benchmarkDownCapture: 1, // 100% capture
    // Context
    riskFreeRate: round(rfAnnual, 4)!,
    numMonths: monthlyPortReturns.length
  };
}

/**
 * Auto-generate analysis periods based on available data
 */
function autoGeneratePeriods(
  data: MergedDataPoint[],
  asOfDate: string
): Record<string, [string, string]> {
  const periods: Record<string, [string, string]> = {};
  const asOf = parseDate(asOfDate);
  const dataStart = parseDate(data[0].date);
  
  // YTD
  const ytdStart = new Date(asOf.getFullYear(), 0, 1);
  if (dataStart <= ytdStart) {
    // Find last trading day of previous year
    const prevYearEnd = data.filter(d => parseDate(d.date) < ytdStart)
      .pop()?.date;
    if (prevYearEnd) {
      periods['YTD'] = [prevYearEnd, asOfDate];
    }
  }
  
  // Previous full years
  for (let year = asOf.getFullYear() - 1; year >= asOf.getFullYear() - 4; year--) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    
    if (dataStart <= yearStart) {
      // Find trading day boundaries
      const prevYearEnd = data.filter(d => parseDate(d.date) < yearStart)
        .pop()?.date;
      const currYearEnd = data.filter(d => parseDate(d.date) <= yearEnd)
        .pop()?.date;
      
      if (prevYearEnd && currYearEnd) {
        periods[String(year)] = [prevYearEnd, currYearEnd];
      }
    }
  }
  
  return periods;
}

/**
 * Generate cumulative return chart data
 */
function generateChartData(
  dailyData: MergedDataPoint[],
  portfolioName: string,
  yearsBack: number = 3
): ChartData | null {
  if (dailyData.length === 0) return null;
  
  // Determine start date (3 years back or data start)
  const endDate = parseDate(dailyData[dailyData.length - 1].date);
  const threeYearsBack = new Date(endDate);
  threeYearsBack.setFullYear(threeYearsBack.getFullYear() - yearsBack);
  
  const dataStart = parseDate(dailyData[0].date);
  const chartStart = threeYearsBack > dataStart ? threeYearsBack : dataStart;
  
  // Filter to chart period
  const chartData = dailyData.filter(d => parseDate(d.date) >= chartStart);
  
  if (chartData.length === 0) return null;
  
  // Calculate cumulative returns from 0 (Kwanti style)
  const portStart = chartData[0].portfolioValue;
  const spxStart = chartData[0].spxValue;
  
  return {
    dates: chartData.map(d => d.date),
    portfolioReturns: chartData.map(d => 
      round((d.portfolioValue / portStart) - 1, 4)!
    ),
    benchmarkReturns: chartData.map(d => 
      round((d.spxValue / spxStart) - 1, 4)!
    ),
    portfolioName,
    benchmarkName: 'S&P 500 TR',
    startDate: chartData[0].date,
    endDate: chartData[chartData.length - 1].date
  };
}

// =============================================================================
// MAIN ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze a single portfolio
 */
export function analyzePortfolio(
  portfolioData: PortfolioDataPoint[],
  marketData: MarketDataPoint[],
  portfolioName: string,
  asOfDate?: string
): AnalysisResult {
  const warnings: string[] = [];
  
  // Merge data
  const merged = mergeData(portfolioData, marketData);
  
  if (merged.length === 0) {
    throw new Error('No overlapping data between portfolio and market');
  }
  
  // Set as-of date
  const effectiveAsOf = asOfDate || merged[merged.length - 1].date;
  
  // Auto-generate periods
  const periods = autoGeneratePeriods(merged, effectiveAsOf);
  
  // Calculate metrics for each period
  const periodResults: PeriodMetrics[] = [];
  
  for (const [periodName, [start, end]] of Object.entries(periods)) {
    try {
      const metrics = calculatePeriodMetrics(merged, periodName, start, end);
      periodResults.push(metrics);
      
      // Add sample size warning
      if (metrics.numMonths < 12) {
        warnings.push(
          `${periodName}: Only ${metrics.numMonths} months of data. Results may be unreliable.`
        );
      } else if (metrics.numMonths < 36) {
        warnings.push(
          `${periodName}: ${metrics.numMonths} months is below the recommended 36 months for statistical reliability.`
        );
      }
    } catch (e) {
      warnings.push(`${periodName}: Could not calculate - ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  
  // Calculate 3-year cumulative
  let cumulative3Y: PeriodMetrics | null = null;
  const threeYearStart = new Date(effectiveAsOf);
  threeYearStart.setFullYear(threeYearStart.getFullYear() - 3);
  const threeYearStartStr = formatDate(threeYearStart);
  
  if (parseDate(merged[0].date) <= threeYearStart) {
    try {
      // Find actual trading day at or after 3 years ago
      const startData = merged.find(d => d.date >= threeYearStartStr);
      if (startData) {
        cumulative3Y = calculatePeriodMetrics(
          merged, '3Y Cumulative', startData.date, effectiveAsOf
        );
      }
    } catch (e) {
      warnings.push(`3Y Cumulative: Could not calculate - ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  
  // Generate chart data
  let chartData: ChartData | null = null;
  try {
    chartData = generateChartData(merged, portfolioName);
  } catch (e) {
    warnings.push(`Chart data: Could not generate - ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  
  return {
    portfolioName,
    asOfDate: effectiveAsOf,
    generatedAt: new Date().toISOString(),
    dataStartDate: merged[0].date,
    dataEndDate: merged[merged.length - 1].date,
    periods: periodResults,
    cumulative3Y,
    chartData,
    methodology: getMethodology(),
    warnings
  };
}

/**
 * Analyze multiple portfolios from parsed CSV data
 */
export function analyzeMultiplePortfolios(
  portfolios: PortfolioSeries[],
  marketData: MarketDataPoint[],
  asOfDate?: string
): MultiPortfolioResult {
  const allWarnings: string[] = [];
  const portfolioResults: Record<string, AnalysisResult> = {};
  
  // Analyze each portfolio
  for (const portfolio of portfolios) {
    try {
      const result = analyzePortfolio(
        portfolio.data,
        marketData,
        portfolio.name,
        asOfDate
      );
      portfolioResults[portfolio.name] = result;
      
      // Collect warnings with portfolio prefix
      for (const w of result.warnings) {
        allWarnings.push(`[${portfolio.name}] ${w}`);
      }
    } catch (e) {
      allWarnings.push(`[${portfolio.name}] Analysis failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }
  
  const portfolioNames = Object.keys(portfolioResults);
  if (portfolioNames.length === 0) {
    throw new Error('No portfolios could be analyzed');
  }
  
  const firstResult = portfolioResults[portfolioNames[0]];
  const effectiveAsOf = asOfDate || firstResult.asOfDate;
  
  // Build comparison data
  const comparison = buildComparison(portfolioResults);
  
  return {
    asOfDate: effectiveAsOf,
    generatedAt: new Date().toISOString(),
    dataStartDate: firstResult.dataStartDate,
    dataEndDate: firstResult.dataEndDate,
    portfolios: portfolioResults,
    comparison,
    methodology: getMethodology(),
    warnings: allWarnings
  };
}

/**
 * Build comparison data structure for side-by-side view
 */
function buildComparison(
  portfolioResults: Record<string, AnalysisResult>
): ComparisonData {
  const portfolioNames = Object.keys(portfolioResults);
  const firstResult = portfolioResults[portfolioNames[0]];
  const periodNames = firstResult.periods.map(p => p.periodName);
  
  const comparison: ComparisonData = {
    portfolioNames,
    periodNames,
    metrics: {}
  };
  
  // Define metrics to compare
  const metricsConfig: Array<[string, keyof PeriodMetrics, string]> = [
    ['return', 'portfolioReturn', 'Returns'],
    ['stdDev', 'portfolioStdDev', 'Risk (Std Dev)'],
    ['alpha', 'portfolioAlpha', 'Alpha'],
    ['beta', 'portfolioBeta', 'Beta'],
    ['sharpe', 'portfolioSharpeRatio', 'Sharpe Ratio'],
    ['maxDrawdown', 'portfolioMaxDrawdown', 'Max Drawdown'],
    ['upCapture', 'portfolioUpCapture', 'Up Capture'],
    ['downCapture', 'portfolioDownCapture', 'Down Capture']
  ];
  
  for (const [metricKey, attrName, displayName] of metricsConfig) {
    comparison.metrics[metricKey] = {
      displayName,
      byPeriod: {},
      benchmark: {}
    };
    
    for (const periodName of periodNames) {
      comparison.metrics[metricKey].byPeriod[periodName] = {};
      
      for (const portName of portfolioNames) {
        const result = portfolioResults[portName];
        const period = result.periods.find(p => p.periodName === periodName);
        if (period) {
          comparison.metrics[metricKey].byPeriod[periodName][portName] = 
            period[attrName] as number | null;
        }
      }
    }
    
    // Add benchmark values
    const benchmarkAttr = attrName.replace('portfolio', 'benchmark') as keyof PeriodMetrics;
    for (const periodName of periodNames) {
      const period = firstResult.periods.find(p => p.periodName === periodName);
      if (period) {
        comparison.metrics[metricKey].benchmark[periodName] = 
          period[benchmarkAttr] as number | null;
      }
    }
  }
  
  // Add 3Y cumulative comparison
  if (firstResult.cumulative3Y) {
    comparison.cumulative3Y = {};
    for (const portName of portfolioNames) {
      const result = portfolioResults[portName];
      if (result.cumulative3Y) {
        comparison.cumulative3Y[portName] = {
          return: result.cumulative3Y.portfolioReturn,
          stdDev: result.cumulative3Y.portfolioStdDev,
          alpha: result.cumulative3Y.portfolioAlpha,
          beta: result.cumulative3Y.portfolioBeta,
          sharpe: result.cumulative3Y.portfolioSharpeRatio,
          maxDrawdown: result.cumulative3Y.portfolioMaxDrawdown
        };
      }
    }
  }
  
  // Add combined chart data
  if (firstResult.chartData) {
    comparison.chart = {
      dates: firstResult.chartData.dates,
      benchmarkName: firstResult.chartData.benchmarkName,
      benchmarkReturns: firstResult.chartData.benchmarkReturns,
      portfolios: {}
    };
    
    for (const portName of portfolioNames) {
      const result = portfolioResults[portName];
      if (result.chartData) {
        comparison.chart.portfolios[portName] = result.chartData.portfolioReturns;
      }
    }
  }
  
  return comparison;
}

/**
 * Get methodology documentation
 */
function getMethodology(): Record<string, string> {
  return {
    benchmark: 'S&P 500 Total Return Index (^SP500TR) - includes dividends',
    riskFreeRate: '3-Month Treasury Bill (^IRX) - historical rates',
    returnFrequency: 'Monthly returns for Std Dev, Beta, Alpha, Capture; Daily for Max Drawdown',
    stdDevAnnualization: 'Monthly Std Dev × sqrt(12)',
    alphaAnnualization: 'Monthly Alpha × 12',
    betaFormula: 'Cov(Portfolio Excess, Benchmark Excess) / Var(Benchmark Excess)',
    sharpeFormula: '(Return - Risk Free Rate) / Std Dev',
    captureFormula: 'Compound return in up/down months divided by benchmark',
    dataSource: 'Yahoo Finance (^SP500TR, ^IRX)'
  };
}
