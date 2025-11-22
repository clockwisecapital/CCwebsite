/**
 * Monte Carlo Simulation Service
 * 
 * Performs Monte Carlo simulations using historical price data from Yahoo Finance
 * to calculate expected returns, upside, and downside scenarios
 */

import type { MonteCarloResult, HistoricalPrice } from '@/types/portfolio';

const YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart';
const SIMULATIONS = 10000;
const TRADING_DAYS_PER_YEAR = 252;

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
    
    const median = finalReturns[medianIdx];
    const upside = finalReturns[upsideIdx];
    const downside = finalReturns[downsideIdx];
    
    // Sanity check: if results are extreme, log warning
    if (Math.abs(upside) > 5 || Math.abs(downside) > 1) {
      console.warn(`⚠️ ${ticker} Monte Carlo results seem extreme:`, {
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
 * Run Monte Carlo simulations for multiple tickers in parallel
 */
export async function runBatchMonteCarloSimulations(
  tickers: Array<{ ticker: string; currentPrice: number }>,
  timeHorizon: number = 1
): Promise<Map<string, MonteCarloResult>> {
  const results = new Map<string, MonteCarloResult>();
  
  const promises = tickers.map(({ ticker, currentPrice }) =>
    runMonteCarloSimulation(ticker, currentPrice, timeHorizon)
  );
  
  const simulationResults = await Promise.all(promises);
  
  simulationResults.forEach((result, idx) => {
    if (result) {
      results.set(tickers[idx].ticker, result);
    }
  });
  
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
 * Fetch current prices for multiple tickers
 */
export async function fetchBatchCurrentPrices(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  const promises = tickers.map(ticker => fetchCurrentPrice(ticker));
  const results = await Promise.all(promises);
  
  results.forEach((price, idx) => {
    if (price !== null) {
      prices.set(tickers[idx], price);
    }
  });
  
  return prices;
}

