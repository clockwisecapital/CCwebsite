/**
 * Monte Carlo Simulation Service
 * 
 * Performs Monte Carlo simulations using historical price data from Yahoo Finance
 * to calculate expected returns, upside, and downside scenarios
 */

import type { MonteCarloResult, HistoricalPrice } from '@/types/portfolio';

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const SIMULATIONS = 5000;  // Reduced from 10K - still statistically valid, 2x faster
const TRADING_DAYS_PER_YEAR = 252;
const CONCURRENCY_LIMIT = 5; // Max concurrent Yahoo Finance requests to avoid rate limiting

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
 * Run Monte Carlo simulation for a single ticker
 */
export async function runMonteCarloSimulation(
  ticker: string,
  currentPrice: number,
  timeHorizon: number = 1 // years
): Promise<MonteCarloResult | null> {
  try {
    // Fetch historical prices
    const historicalPrices = await fetchHistoricalPrices(ticker, '2y');
    
    if (historicalPrices.length < 50) {
      console.warn(`Insufficient historical data for ${ticker}`);
      return null;
    }

    // Calculate daily returns
    const dailyReturns = calculateDailyReturns(historicalPrices);
    
    // Calculate statistics
    const avgDailyReturn = mean(dailyReturns);
    const dailyVolatility = standardDeviation(dailyReturns);
    const annualizedVolatility = dailyVolatility * Math.sqrt(TRADING_DAYS_PER_YEAR);
    
    console.log(`📊 ${ticker} statistics:`, {
      avgDailyReturn: (avgDailyReturn * 100).toFixed(3) + '%',
      dailyVolatility: (dailyVolatility * 100).toFixed(3) + '%',
      annualizedVolatility: (annualizedVolatility * 100).toFixed(1) + '%',
      dataPoints: dailyReturns.length
    });
    
    // Number of trading days to simulate
    const tradingDays = Math.round(timeHorizon * TRADING_DAYS_PER_YEAR);
    
    // Run simulations
    const finalReturns: number[] = [];
    
    for (let sim = 0; sim < SIMULATIONS; sim++) {
      let price = currentPrice;
      
      // Geometric Brownian Motion
      for (let day = 0; day < tradingDays; day++) {
        const randomReturn = randomNormal(avgDailyReturn, dailyVolatility);
        price = price * (1 + randomReturn);
      }
      
      const totalReturn = (price - currentPrice) / currentPrice;
      finalReturns.push(totalReturn);
    }
    
    // Sort returns to find percentiles
    finalReturns.sort((a, b) => a - b);
    
    const downsideIdx = Math.floor(SIMULATIONS * 0.05); // 5th percentile
    const medianIdx = Math.floor(SIMULATIONS * 0.50);   // 50th percentile
    const upsideIdx = Math.floor(SIMULATIONS * 0.95);   // 95th percentile
    
    // Get total returns at each percentile
    const totalMedian = finalReturns[medianIdx];
    const totalUpside = finalReturns[upsideIdx];
    const totalDownside = finalReturns[downsideIdx];
    
    // ANNUALIZE the returns so they're comparable to expected returns
    // Formula: (1 + totalReturn)^(1/years) - 1
    // Handle negative returns carefully (can't take root of negative)
    const annualizeReturn = (totalReturn: number, years: number): number => {
      if (years <= 1) return totalReturn;
      
      const growthFactor = 1 + totalReturn;
      if (growthFactor <= 0) {
        // Total loss scenario - cap at -99% annualized
        return -0.99;
      }
      return Math.pow(growthFactor, 1 / years) - 1;
    };
    
    const median = annualizeReturn(totalMedian, timeHorizon);
    const upside = annualizeReturn(totalUpside, timeHorizon);
    const downside = annualizeReturn(totalDownside, timeHorizon);
    
    console.log(`📊 ${ticker} Monte Carlo (${timeHorizon}yr):`, {
      totalUpside: (totalUpside * 100).toFixed(1) + '%',
      totalMedian: (totalMedian * 100).toFixed(1) + '%', 
      totalDownside: (totalDownside * 100).toFixed(1) + '%',
      annualizedUpside: (upside * 100).toFixed(1) + '%',
      annualizedMedian: (median * 100).toFixed(1) + '%',
      annualizedDownside: (downside * 100).toFixed(1) + '%'
    });
    
    // Sanity check: if ANNUALIZED results are extreme, log warning
    if (Math.abs(upside) > 0.5 || Math.abs(downside) > 0.5) {
      console.warn(`⚠️ ${ticker} Monte Carlo annualized results seem extreme:`, {
        upside: (upside * 100).toFixed(1) + '%',
        median: (median * 100).toFixed(1) + '%',
        downside: (downside * 100).toFixed(1) + '%',
        avgDailyReturn: (avgDailyReturn * 100).toFixed(3) + '%',
        dailyVolatility: (dailyVolatility * 100).toFixed(3) + '%',
        timeHorizon: `${timeHorizon} year(s)`
      });
    }
    
    return {
      ticker,
      median,
      upside,
      downside,
      volatility: annualizedVolatility,
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
 */
export async function runBatchMonteCarloSimulations(
  tickers: Array<{ ticker: string; currentPrice: number }>,
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
    
    // Process this batch in parallel
    const batchPromises = batch.map(({ ticker, currentPrice }) =>
      runMonteCarloSimulation(ticker, currentPrice, timeHorizon)
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

