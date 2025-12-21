/**
 * Monte Carlo Simulation Service
 * 
 * Performs Monte Carlo simulations using a BLENDED approach:
 * - Year 1: Uses PRE-CALCULATED return (from Clockwise/FactSet/short formula)
 *           Volatility from Yahoo Finance historical data (cached for 24h)
 * - Years 2+: Uses long-term asset class averages with typical volatilities
 * 
 * Key features:
 * - Uses Geometric Brownian Motion with volatility drag correction
 * - Tracks discrete annual periods to find best/worst year
 * - Returns upside (best year) and downside (worst year) over the time horizon
 * - Caches volatility data to reduce Yahoo Finance API calls
 */

import type { MonteCarloResult, HistoricalPrice } from '@/types/portfolio';
import { getCachedVolatility, setCachedVolatility } from '@/lib/services/time-portfolio-cache';

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const SIMULATIONS = 5000;  // Reduced from 10K - still statistically valid, 2x faster
const TRADING_DAYS_PER_YEAR = 252;
const CONCURRENCY_LIMIT = 5; // Max concurrent Yahoo Finance requests to avoid rate limiting

// Long-term asset class averages (NOMINAL returns - not inflation-adjusted)
// Based on 100+ years of historical data (Ibbotson/Morningstar)
const ASSET_CLASS_RETURNS = {
  stocks: 0.10,       // 10% nominal (vs 7% real)
  bonds: 0.05,        // 5% nominal (vs 2% real)
  realEstate: 0.08,   // 8% nominal (vs 5% real)
  commodities: 0.04,  // 4% nominal (vs 1% real)
  cash: 0.03,         // 3% nominal (vs 0% real)
  alternatives: 0.08  // 8% nominal (vs 5% real)
} as const;

// Typical annual volatilities for each asset class
const ASSET_CLASS_VOLATILITIES = {
  stocks: 0.18,       // 18%
  bonds: 0.06,        // 6%
  realEstate: 0.15,   // 15%
  commodities: 0.20,  // 20%
  cash: 0.01,         // 1%
  alternatives: 0.12  // 12%
} as const;

// Map proxy ETFs to their asset classes
const TICKER_TO_ASSET_CLASS: Record<string, keyof typeof ASSET_CLASS_RETURNS> = {
  'SPY': 'stocks',
  'AGG': 'bonds',
  'VNQ': 'realEstate',
  'GLD': 'commodities',
  'QQQ': 'stocks',      // Tech is still stocks
  'CASH': 'cash'
};

export type AssetClass = keyof typeof ASSET_CLASS_RETURNS;

/**
 * Portfolio-level Monte Carlo result
 */
export interface PortfolioMonteCarloResult {
  upside: number;      // 95th percentile of annual returns (diversified)
  downside: number;    // 5th percentile of annual returns (diversified)
  median: number;      // 50th percentile annualized return
  simulations: number;
}

/**
 * Fetch historical price data from Yahoo Finance
 */
export async function fetchHistoricalPrices(
  ticker: string,
  period: '1y' | '2y' = '2y'
): Promise<HistoricalPrice[]> {
  try {
    const url = `${YAHOO_FINANCE_API}/${ticker}?range=${period}&interval=1d`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
      throw new Error('Invalid response format from Yahoo Finance');
    }

    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;

    const prices: HistoricalPrice[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined) {
        prices.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: closes[i]
        });
      }
    }

    return prices;
  } catch (error) {
    console.error(`Error fetching historical prices for ${ticker}:`, error);
    return [];
  }
}

/**
 * Calculate daily returns from price history
 * Filters out extreme outliers (likely stock splits or data errors)
 */
function calculateDailyReturns(prices: HistoricalPrice[]): number[] {
  const returns: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const return_ = (prices[i].close - prices[i - 1].close) / prices[i - 1].close;
    
    // Filter out extreme outliers (> 50% single-day move = likely split/error)
    if (Math.abs(return_) < 0.5) {
      returns.push(return_);
    } else {
      console.warn(`⚠️ Filtered extreme return: ${(return_ * 100).toFixed(1)}% on ${prices[i].date}`);
    }
  }
  
  return returns;
}

/**
 * Calculate mean of an array
 */
function mean(arr: number[]): number {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(arr: number[]): number {
  const avg = mean(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Generate random number from normal distribution (Box-Muller transform)
 */
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Determine asset class for a ticker
 * Known proxy ETFs are mapped directly; others default to stocks
 */
function getAssetClass(ticker: string): AssetClass {
  return TICKER_TO_ASSET_CLASS[ticker.toUpperCase()] || 'stocks';
}

/**
 * Run Monte Carlo simulation for a single ticker
 * 
 * BLENDED APPROACH:
 * - Year 1: Uses PRE-CALCULATED return (required parameter) + historical volatility
 * - Years 2+: Uses long-term asset class averages
 * 
 * @param ticker - Stock/ETF ticker symbol
 * @param currentPrice - Current market price
 * @param year1Return - REQUIRED: Pre-calculated Year 1 expected return 
 *                      (from Clockwise targets, FactSet, or short formula)
 * @param timeHorizon - Investment horizon in years (default: 1)
 * 
 * Returns:
 * - median: Expected annualized return (50th percentile of final returns)
 * - upside: Best annual return that could occur (95th percentile)
 * - downside: Worst annual return that could occur (5th percentile)
 */
export async function runMonteCarloSimulation(
  ticker: string,
  currentPrice: number,
  year1Return: number, // REQUIRED - pre-calculated from Clockwise/FactSet/short formula
  timeHorizon: number = 1 // years
): Promise<MonteCarloResult | null> {
  try {
    let year1AnnualVol: number;
    let year1DailyVol: number;
    
    // Check volatility cache first (Supabase-backed, 24-hour TTL)
    const cachedVol = await getCachedVolatility(ticker);
    
    if (cachedVol !== null) {
      // Use cached volatility
      year1AnnualVol = cachedVol;
      year1DailyVol = year1AnnualVol / Math.sqrt(TRADING_DAYS_PER_YEAR);
      console.log(`📦 Using cached volatility for ${ticker}: ${(year1AnnualVol * 100).toFixed(1)}%`);
    } else {
      // Fetch historical prices for VOLATILITY calculation only
      const historicalPrices = await fetchHistoricalPrices(ticker, '2y');
      
      if (historicalPrices.length < 50) {
        console.warn(`Insufficient historical data for ${ticker}`);
        return null;
      }

      // Calculate Year 1 VOLATILITY from historical data
      const dailyReturns = calculateDailyReturns(historicalPrices);
      year1DailyVol = standardDeviation(dailyReturns);
      year1AnnualVol = year1DailyVol * Math.sqrt(TRADING_DAYS_PER_YEAR);
      
      // Cache the volatility for future requests (Supabase)
      await setCachedVolatility(ticker, year1AnnualVol);
      console.log(`📊 Computed and cached volatility for ${ticker}: ${(year1AnnualVol * 100).toFixed(1)}%`);
    }
    
    // Get asset class for this ticker (for Years 2+ parameters)
    const assetClass = getAssetClass(ticker);
    const longTermReturn = ASSET_CLASS_RETURNS[assetClass];
    const longTermVol = ASSET_CLASS_VOLATILITIES[assetClass];
    
    // Year 1: Use PRE-CALCULATED return with historical volatility
    // Convert annual return to daily and apply volatility drag correction
    const year1DailyReturn = year1Return / TRADING_DAYS_PER_YEAR;
    const year1DailyDrift = year1DailyReturn - 0.5 * year1DailyVol * year1DailyVol;
    
    // Convert long-term annual stats to daily (Years 2+)
    const longTermDailyReturn = longTermReturn / TRADING_DAYS_PER_YEAR;
    const longTermDailyVol = longTermVol / Math.sqrt(TRADING_DAYS_PER_YEAR);
    const longTermDailyDrift = longTermDailyReturn - 0.5 * longTermDailyVol * longTermDailyVol;
    
    console.log(`📊 ${ticker} blended statistics:`, {
      assetClass,
      year1Return: (year1Return * 100).toFixed(1) + '% (pre-calculated)',
      year1AnnualVol: (year1AnnualVol * 100).toFixed(1) + '% (from Yahoo)',
      longTermReturn: (longTermReturn * 100).toFixed(1) + '%',
      longTermVol: (longTermVol * 100).toFixed(1) + '%',
      timeHorizon: timeHorizon + ' years'
    });
    
    // Arrays to collect results across all simulations
    const finalReturns: number[] = [];
    const singleYearReturns: number[] = [];  // All single-year returns for upside/downside
    
    const totalYears = Math.ceil(timeHorizon);
    
    for (let sim = 0; sim < SIMULATIONS; sim++) {
      let price = currentPrice;
      
      // Simulate each year
      for (let year = 0; year < totalYears; year++) {
        const yearStartPrice = price;
        
        // Determine which parameters to use
        // Year 1 (year === 0): Use historical data (capped volatility)
        // Years 2+: Use asset class averages
        const dailyDrift = year === 0 ? year1DailyDrift : longTermDailyDrift;
        const dailyVol = year === 0 ? year1DailyVol : longTermDailyVol;
        
        // Determine days for this year (handle partial final year)
        const isLastYear = year === totalYears - 1;
        const fractionalPart = timeHorizon - Math.floor(timeHorizon);
        const daysThisYear = isLastYear && fractionalPart > 0 
          ? Math.round(fractionalPart * TRADING_DAYS_PER_YEAR)
          : TRADING_DAYS_PER_YEAR;
        
        // Simulate this year
        for (let day = 0; day < daysThisYear; day++) {
          const z = randomNormal(0, 1);
          const dailyReturn = Math.exp(dailyDrift + dailyVol * z);
          price = price * dailyReturn;
        }
        
        // Calculate annual return
        let yearReturn = (price - yearStartPrice) / yearStartPrice;
        
        // If partial year, annualize it for fair comparison
        if (isLastYear && fractionalPart > 0 && fractionalPart < 1) {
          yearReturn = Math.pow(1 + yearReturn, 1 / fractionalPart) - 1;
        }
        
        // Collect ALL single-year returns (not just best/worst)
        // This gives us a distribution of what any single year could look like
        singleYearReturns.push(yearReturn);
      }
      
      // Calculate final return for median calculation
      const finalReturn = (price - currentPrice) / currentPrice;
      finalReturns.push(finalReturn);
    }
    
    // Sort arrays to find percentiles
    finalReturns.sort((a, b) => a - b);
    singleYearReturns.sort((a, b) => a - b);
    
    // Percentile helper
    const percentile = (arr: number[], p: number): number => {
      const idx = Math.floor(arr.length * p);
      return arr[Math.min(idx, arr.length - 1)];
    };
    
    // Median of final returns (annualized)
    const totalMedian = percentile(finalReturns, 0.50);
    const annualizeReturn = (totalReturn: number, years: number): number => {
      if (years <= 1) return totalReturn;
      const growthFactor = 1 + totalReturn;
      if (growthFactor <= 0) return -0.99;
      return Math.pow(growthFactor, 1 / years) - 1;
    };
    const median = annualizeReturn(totalMedian, timeHorizon);
    
    // Upside: 95th percentile of ANY single year return
    // This answers: "What does a good year look like?"
    const upside = percentile(singleYearReturns, 0.95);
    
    // Downside: 5th percentile of ANY single year return
    // This answers: "What does a bad year look like?"
    const downside = percentile(singleYearReturns, 0.05);
    
    console.log(`📊 ${ticker} Monte Carlo (${timeHorizon}yr blended):`, {
      medianAnnualized: (median * 100).toFixed(1) + '%',
      upside: (upside * 100).toFixed(1) + '%',
      downside: (downside * 100).toFixed(1) + '%'
    });
    
    // Sanity check - log extreme results for debugging
    if (upside > 1.0 || downside < -0.70) {
      console.warn(`⚠️ ${ticker} Monte Carlo results are extreme (high vol stock):`, {
        upside: (upside * 100).toFixed(1) + '%',
        downside: (downside * 100).toFixed(1) + '%',
        year1Vol: (year1AnnualVol * 100).toFixed(1) + '%'
      });
    }
    
    return {
      ticker,
      median,
      upside,
      downside,
      volatility: year1AnnualVol, // Report capped Year 1 volatility
      simulations: SIMULATIONS
    };
  } catch (error) {
    console.error(`Monte Carlo simulation failed for ${ticker}:`, error);
    return null;
  }
}

/**
 * Run Monte Carlo simulations with controlled concurrency
 * Processes tickers in batches to avoid overwhelming Yahoo Finance API
 * 
 * @param tickers - Array of ticker info including pre-calculated Year 1 return
 * @param timeHorizon - Investment horizon in years
 */
export async function runBatchMonteCarloSimulations(
  tickers: Array<{ ticker: string; currentPrice: number; year1Return: number }>,
  timeHorizon: number = 1
): Promise<Map<string, MonteCarloResult>> {
  const results = new Map<string, MonteCarloResult>();
  const totalTickers = tickers.length;
  
  console.log(`🚀 Starting Monte Carlo for ${totalTickers} tickers (batches of ${CONCURRENCY_LIMIT})`);
  const startTime = Date.now();
  
  // Process in batches with concurrency limit
  for (let i = 0; i < totalTickers; i += CONCURRENCY_LIMIT) {
    const batch = tickers.slice(i, i + CONCURRENCY_LIMIT);
    const batchNum = Math.floor(i / CONCURRENCY_LIMIT) + 1;
    const totalBatches = Math.ceil(totalTickers / CONCURRENCY_LIMIT);
    
    console.log(`📊 Processing batch ${batchNum}/${totalBatches}: ${batch.map(t => t.ticker).join(', ')}`);
    
    // Process this batch in parallel - now passing year1Return
    const batchPromises = batch.map(({ ticker, currentPrice, year1Return }) =>
      runMonteCarloSimulation(ticker, currentPrice, year1Return, timeHorizon)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Store results
    batchResults.forEach((result, idx) => {
      if (result) {
        results.set(batch[idx].ticker, result);
      }
    });
    
    // Small delay between batches to be nice to Yahoo Finance API
    if (i + CONCURRENCY_LIMIT < totalTickers) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Monte Carlo complete: ${results.size}/${totalTickers} tickers in ${elapsed}s`);
  
  return results;
}

/**
 * Fetch current price from Yahoo Finance
 */
export async function fetchCurrentPrice(ticker: string): Promise<number | null> {
  try {
    const url = `${YAHOO_FINANCE_API}/${ticker}?range=1d&interval=1m`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    
    if (!meta || meta.regularMarketPrice === null || meta.regularMarketPrice === undefined) {
      throw new Error('Price not found in response');
    }

    return meta.regularMarketPrice;
  } catch (error) {
    console.error(`Error fetching current price for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch current prices for multiple tickers with controlled concurrency
 */
export async function fetchBatchCurrentPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  const totalTickers = tickers.length;
  
  console.log(`💰 Fetching prices for ${totalTickers} tickers (batches of ${CONCURRENCY_LIMIT})`);
  const startTime = Date.now();
  
  // Process in batches
  for (let i = 0; i < totalTickers; i += CONCURRENCY_LIMIT) {
    const batch = tickers.slice(i, i + CONCURRENCY_LIMIT);
    
    const batchPromises = batch.map(ticker => fetchCurrentPrice(ticker));
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach((price, idx) => {
      if (price !== null) {
        prices.set(batch[idx], price);
      }
    });
    
    // Small delay between batches
    if (i + CONCURRENCY_LIMIT < totalTickers) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Prices fetched: ${prices.size}/${totalTickers} in ${elapsed}s`);
  
  return prices;
}

/**
 * Run Monte Carlo simulation at the PORTFOLIO level
 * 
 * Uses ASSET CLASS WEIGHTED AVERAGES for both return and volatility.
 * This is simple, accurate, and captures diversification automatically:
 * - Stocks: 18% volatility, 7% long-term return
 * - Bonds: 6% volatility, 2% long-term return
 * - A 60/40 portfolio: ~13% volatility, ~5% long-term return
 * 
 * Year 1: Uses Clockwise/FactSet targets for return, asset class volatility
 * Years 2+: Uses asset class averages for both return and volatility
 * 
 * @param positions - Array of positions with weights and parameters
 * @param timeHorizon - Investment horizon in years
 * @returns Portfolio-level upside, downside, and median
 */
export function runPortfolioMonteCarloSimulation(
  positions: Array<{
    weight: number;           // As decimal (0.08 for 8%)
    year1Return: number;      // Pre-calculated Year 1 expected return
    year1Volatility: number;  // Not used - kept for interface compatibility
    assetClass: AssetClass;   // Determines volatility and long-term return
  }>,
  timeHorizon: number = 1
): PortfolioMonteCarloResult {
  const allPortfolioAnnualReturns: number[] = [];
  const finalPortfolioReturns: number[] = [];
  
  const totalYears = Math.ceil(timeHorizon);
  
  // ============================================
  // SIMPLE APPROACH: Asset Class Weighted Averages
  // ============================================
  let year1PortfolioReturn = 0;
  let portfolioVolatility = 0;
  let longTermReturn = 0;
  
  for (const position of positions) {
    // Year 1 return: weighted average of position-specific returns (Clockwise/FactSet targets)
    year1PortfolioReturn += position.weight * position.year1Return;
    
    // Volatility: weighted average of ASSET CLASS volatilities
    // This automatically captures diversification (stocks=18%, bonds=6%, etc.)
    portfolioVolatility += position.weight * ASSET_CLASS_VOLATILITIES[position.assetClass];
    
    // Long-term return (Years 2+): weighted average of ASSET CLASS returns
    longTermReturn += position.weight * ASSET_CLASS_RETURNS[position.assetClass];
  }
  
  console.log(`📊 Running portfolio-level Monte Carlo:`, {
    positions: positions.length,
    year1Return: (year1PortfolioReturn * 100).toFixed(1) + '%',
    longTermReturn: (longTermReturn * 100).toFixed(1) + '%',
    portfolioVol: (portfolioVolatility * 100).toFixed(1) + '%',
    timeHorizon: timeHorizon + ' years',
    simulations: SIMULATIONS
  });
  
  for (let sim = 0; sim < SIMULATIONS; sim++) {
    let portfolioValue = 1.0;
    
    for (let year = 0; year < totalYears; year++) {
      // Year 1: Use Clockwise/FactSet target returns
      // Years 2+: Use long-term ASSET CLASS average returns
      const expectedReturn = year === 0 ? year1PortfolioReturn : longTermReturn;
      
      // Volatility: Use asset class weighted volatility for ALL years
      const volatility = portfolioVolatility;
      
      // Single random shock for the portfolio
      const z = randomNormal(0, 1);
      
      // Calculate portfolio annual return using log-normal with volatility drag
      const annualDrift = expectedReturn - 0.5 * volatility * volatility;
      const portfolioYearReturn = Math.exp(annualDrift + volatility * z) - 1;
      
      // Collect this year's portfolio return
      allPortfolioAnnualReturns.push(portfolioYearReturn);
      
      // Update portfolio value
      portfolioValue *= (1 + portfolioYearReturn);
    }
    
    // Collect final portfolio return
    finalPortfolioReturns.push(portfolioValue - 1);
  }
  
  // Sort to find percentiles
  allPortfolioAnnualReturns.sort((a, b) => a - b);
  finalPortfolioReturns.sort((a, b) => a - b);
  
  // Percentile helper
  const percentile = (arr: number[], p: number): number => {
    const idx = Math.floor(arr.length * p);
    return arr[Math.min(idx, arr.length - 1)];
  };
  
  // Annualize the median final return
  const totalMedian = percentile(finalPortfolioReturns, 0.50);
  const annualizeReturn = (totalReturn: number, years: number): number => {
    if (years <= 1) return totalReturn;
    const growthFactor = 1 + totalReturn;
    if (growthFactor <= 0) return -0.99;
    return Math.pow(growthFactor, 1 / years) - 1;
  };
  const median = annualizeReturn(totalMedian, timeHorizon);
  
  const upside = percentile(allPortfolioAnnualReturns, 0.95);
  const downside = percentile(allPortfolioAnnualReturns, 0.05);
  
  console.log(`📊 Portfolio Monte Carlo results:`, {
    upside: (upside * 100).toFixed(1) + '%',
    downside: (downside * 100).toFixed(1) + '%',
    median: (median * 100).toFixed(1) + '%',
    totalAnnualReturns: allPortfolioAnnualReturns.length
  });
  
  return {
    upside,
    downside,
    median,
    simulations: SIMULATIONS
  };
}

