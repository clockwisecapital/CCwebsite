/**
 * Inngest Functions
 * 
 * Background jobs for cache refresh:
 * 1. TIME Portfolio Cache - refreshed every 6 hours
 * 2. Volatility Cache - refreshed daily
 */

import { inngest } from "./client";
import { 
  setCachedTimePortfolio, 
  batchSetCachedVolatilities,
} from "@/lib/services/time-portfolio-cache";
import { getHoldingWeights, getTgtPrices, getIndexSectorTargets } from "@/lib/supabase/database";
import { 
  fetchBatchCurrentPrices, 
  runBatchMonteCarloSimulations,
  runPortfolioMonteCarloSimulation,
  fetchHistoricalPrices,
} from "@/lib/services/monte-carlo";
import type { AssetClass } from "@/lib/services/monte-carlo";
import { calculateYear1Return } from "@/lib/services/year1-return";
import { LONG_TERM_AVERAGES } from "@/lib/services/goal-probability";
import type { PositionAnalysis } from "@/types/portfolio";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateDailyReturns(prices: Array<{ close: number }>): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1].close > 0) {
      returns.push((prices[i].close - prices[i - 1].close) / prices[i - 1].close);
    }
  }
  return returns;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateWeightedReturn(positions: PositionAnalysis[]): number {
  let totalWeight = 0;
  let weightedReturn = 0;

  positions.forEach(position => {
    if (position.expectedReturn !== null && !isNaN(position.expectedReturn)) {
      weightedReturn += position.expectedReturn * position.weight;
      totalWeight += position.weight;
    }
  });

  const result = totalWeight > 0 ? weightedReturn / 100 : 0;
  return isNaN(result) ? 0 : result;
}

function calculateBlendedReturn(
  year1Return: number,
  longTermReturn: number,
  timeHorizon: number
): number {
  if (timeHorizon <= 1) return year1Return;
  
  const year1Growth = 1 + year1Return;
  const remainingYearsGrowth = Math.pow(1 + longTermReturn, timeHorizon - 1);
  const totalGrowth = year1Growth * remainingYearsGrowth;
  
  return Math.pow(totalGrowth, 1 / timeHorizon) - 1;
}

// ============================================================================
// REFRESH TIME PORTFOLIO CACHE
// Runs every 6 hours to pre-compute TIME portfolio analysis (production only)
// In development, use manual trigger: POST /api/admin/refresh-cache
// ============================================================================

export const refreshTimePortfolioCache = inngest.createFunction(
  { 
    id: "refresh-time-portfolio-cache",
    retries: 2,
  },
  [
    // Only enable cron in production to avoid running on dev server startup
    ...(process.env.NODE_ENV === 'production' ? [{ cron: "0 1,7,13,19 * * *" }] : []), // 8pm, 2am, 8am, 2pm EST (1am, 7am, 1pm, 7pm UTC) - off-peak hours
    { event: "app/refresh.time-portfolio" } // Manual trigger support (works in all environments)
  ],
  async ({ step }) => {
    const startTime = Date.now();
    console.log("🔄 Starting TIME portfolio cache refresh...");
    
    // Step 1: Fetch TIME portfolio holdings
    const timeHoldings = await step.run("fetch-holdings", async () => {
      const holdings = await getHoldingWeights();
      console.log(`📊 Fetched ${holdings.length} TIME portfolio holdings`);
      return holdings;
    });
    
    const timeTickers = timeHoldings
      .filter(h => !h.stockTicker.toLowerCase().includes('cash') && !h.stockTicker.toLowerCase().includes('other'))
      .map(h => h.stockTicker);
    
    // Step 2: Fetch all price data
    const priceData = await step.run("fetch-prices", async () => {
      const [indexTargets, targetPrices, currentPrices] = await Promise.all([
        getIndexSectorTargets(),
        getTgtPrices(timeTickers),
        fetchBatchCurrentPrices(timeTickers),
      ]);
      
      console.log(`📊 Fetched prices for ${currentPrices.size} tickers`);
      
      return {
        indexTargets: Object.fromEntries(indexTargets),
        targetPrices: Object.fromEntries(targetPrices),
        currentPrices: Object.fromEntries(currentPrices),
      };
    });
    
    // Reconstruct Maps
    const indexTargets = new Map(Object.entries(priceData.indexTargets).map(([k, v]) => [k, Number(v)]));
    const targetPrices = new Map(Object.entries(priceData.targetPrices).map(([k, v]) => [k, Number(v)]));
    const currentPrices = new Map(Object.entries(priceData.currentPrices).map(([k, v]) => [k, Number(v)]));
    
    // Step 3: Calculate Year 1 returns
    const year1ReturnsObj = await step.run("calc-year1-returns", async () => {
      const returns: Record<string, number> = {};
      
      for (const ticker of timeTickers) {
        const currentPrice = currentPrices.get(ticker) || 0;
        const factsetTarget = targetPrices.get(ticker) || null;
        
        const result = await calculateYear1Return(
          ticker,
          currentPrice,
          factsetTarget,
          indexTargets,
          currentPrices,
          'stocks'
        );
        
        returns[ticker] = result.return;
      }
      
      console.log(`📊 Calculated Year 1 returns for ${Object.keys(returns).length} tickers`);
      return returns;
    });
    
    // Step 4: Run Monte Carlo simulations
    const mcResultsObj = await step.run("run-monte-carlo", async () => {
      const tickersForMC = timeTickers
        .filter(ticker => currentPrices.has(ticker) && year1ReturnsObj[ticker] !== undefined)
        .map(ticker => ({ 
          ticker, 
          currentPrice: currentPrices.get(ticker)!,
          year1Return: year1ReturnsObj[ticker]
        }));
      
      console.log(`🎲 Running Monte Carlo for ${tickersForMC.length} tickers...`);
      const results = await runBatchMonteCarloSimulations(tickersForMC, 10);
      console.log(`✅ Monte Carlo complete`);
      
      // Convert to plain object
      const serialized: Record<string, { median: number; upside: number; downside: number; volatility: number; simulations: number }> = {};
      results.forEach((result, ticker) => {
        serialized[ticker] = {
          median: result.median,
          upside: result.upside,
          downside: result.downside,
          volatility: result.volatility,
          simulations: result.simulations,
        };
      });
      
      return serialized;
    });
    
    // Step 5: Build and cache TIME portfolio
    await step.run("save-cache", async () => {
      const totalTimeWeight = timeHoldings.reduce((sum, h) => sum + h.weightings, 0);
      
      const positions: PositionAnalysis[] = timeHoldings
        .filter(h => !h.stockTicker.toLowerCase().includes('cash') && !h.stockTicker.toLowerCase().includes('other'))
        .map(holding => {
          const currentPrice = currentPrices.get(holding.stockTicker) || holding.price || 0;
          const targetPrice = targetPrices.get(holding.stockTicker) || indexTargets.get(holding.stockTicker) || null;
          const expectedReturn = year1ReturnsObj[holding.stockTicker] ?? null;
          const mc = mcResultsObj[holding.stockTicker];
          const normalizedWeight = totalTimeWeight > 0 ? (holding.weightings / totalTimeWeight) * 100 : 0;

          return {
            ticker: holding.stockTicker,
            name: holding.securityName,
            weight: normalizedWeight,
            currentPrice,
            targetPrice,
            expectedReturn,
            monteCarlo: mc ? {
              ticker: holding.stockTicker,
              median: mc.median,
              upside: mc.upside,
              downside: mc.downside,
              volatility: mc.volatility,
              simulations: mc.simulations,
            } : null,
          };
        });
      
      const topPositions = [...positions]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5);
      
      const year1Return = calculateWeightedReturn(positions);
      const expectedReturn = calculateBlendedReturn(year1Return, LONG_TERM_AVERAGES.stocks, 10);
      
      // Portfolio-level Monte Carlo
      const portfolioMCPositions = positions
        .filter(p => p.monteCarlo)
        .map(p => ({
          weight: p.weight / 100,
          year1Return: year1ReturnsObj[p.ticker] || 0,
          year1Volatility: p.monteCarlo!.volatility,
          assetClass: 'stocks' as AssetClass,
        }));
      
      const portfolioMC = portfolioMCPositions.length > 0
        ? runPortfolioMonteCarloSimulation(portfolioMCPositions, 10)
        : { upside: 0, downside: 0, median: 0, volatility: 0 };
      
      await setCachedTimePortfolio({
        positions,
        topPositions,
        expectedReturn,
        year1Return,
        portfolioMonteCarlo: portfolioMC,
        timeHorizon: 10,
      });
      
      console.log("✅ TIME portfolio cache saved");
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ TIME portfolio cache refresh complete in ${Math.round(duration / 1000)}s`);
    
    return { success: true, durationMs: duration };
  }
);

// ============================================================================
// REFRESH VOLATILITY CACHE
// Runs daily at midnight to pre-compute volatility for common tickers (production only)
// In development, use manual trigger: POST /api/admin/refresh-cache
// ============================================================================

export const refreshVolatilityCache = inngest.createFunction(
  { 
    id: "refresh-volatility-cache",
    retries: 2,
  },
  [
    // Only enable cron in production to avoid running on dev server startup
    ...(process.env.NODE_ENV === 'production' ? [{ cron: "0 6 * * *" }] : []), // Daily at 1am EST (6am UTC) - off-peak hours
    { event: "app/refresh.volatility" } // Manual trigger support (works in all environments)
  ],
  async ({ step }) => {
    const startTime = Date.now();
    console.log("🔄 Starting volatility cache refresh...");
    
    // Step 1: Get all tickers
    const allTickers = await step.run("get-tickers", async () => {
      const timeHoldings = await getHoldingWeights();
      const timeTickers = timeHoldings
        .filter(h => !h.stockTicker.toLowerCase().includes('cash') && !h.stockTicker.toLowerCase().includes('other'))
        .map(h => h.stockTicker);
      
      // Common ETFs users might hold
      const commonETFs = [
        'SPY', 'QQQ', 'VTI', 'VOO', 'DIA', 'IWM',
        'AGG', 'BND', 'TLT', 'LQD',
        'VNQ', 'GLD', 'SLV',
      ];
      
      return [...new Set([...timeTickers, ...commonETFs])];
    });
    
    console.log(`📊 Refreshing volatility for ${allTickers.length} tickers`);
    
    // Step 2: Calculate volatilities (in batches)
    const volatilities = await step.run("calc-volatilities", async () => {
      const results: Array<{ ticker: string; volatility: number }> = [];
      const TRADING_DAYS_PER_YEAR = 252;
      const batchSize = 5;
      
      for (let i = 0; i < allTickers.length; i += batchSize) {
        const batch = allTickers.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (ticker) => {
          try {
            const prices = await fetchHistoricalPrices(ticker, '2y');
            if (prices.length < 50) return;
            
            const dailyReturns = calculateDailyReturns(prices);
            const dailyVol = standardDeviation(dailyReturns);
            const annualVol = dailyVol * Math.sqrt(TRADING_DAYS_PER_YEAR);
            
            results.push({ ticker, volatility: annualVol });
          } catch (error) {
            console.error(`Failed for ${ticker}:`, error);
          }
        }));
        
        // Rate limiting delay
        if (i + batchSize < allTickers.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return results;
    });
    
    // Step 3: Save to cache
    await step.run("save-cache", async () => {
      const { success, failed } = await batchSetCachedVolatilities(volatilities);
      console.log(`✅ Cached ${success} volatilities (${failed} failed)`);
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Volatility cache refresh complete in ${Math.round(duration / 1000)}s`);
    
    return { success: true, tickersProcessed: volatilities.length, durationMs: duration };
  }
);

