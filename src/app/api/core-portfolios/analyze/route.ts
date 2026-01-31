/**
 * API Endpoint: Analyze Core Portfolios
 * 
 * Runs all 5 Clockwise Core Portfolios through the REAL Kronos analyzer
 * Includes: TIME, Max Growth, Growth, Moderate, and Max Income
 * Uses the same logic as the Kronos dashboard for consistent calculations
 * 
 * CACHING: Results cached in Supabase for 24 hours since allocations don't change daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { ASSET_ALLOCATION_PORTFOLIOS, TIME_PORTFOLIO } from '@/lib/clockwise-portfolios';
import {
  getAllCachedCorePortfolios,
  batchSetCachedCorePortfolios,
  isCorePortfoliosCacheValid,
} from '@/lib/services/core-portfolios-cache';
import { getCachedTimePortfolio } from '@/lib/services/time-portfolio-cache';

// Cache configuration - revalidate every 24 hours
export const revalidate = 86400; // 24 hours in seconds

const TIME_HORIZON_YEARS = 1; // 12 months

// Define portfolio order: TIME, Max Growth, Growth, Moderate, Max Income
const PORTFOLIO_ORDER = ['time', 'max-growth', 'growth', 'moderate', 'max-income'];

/**
 * Convert Clockwise allocation to Kronos portfolio format
 * CRITICAL FIX: Equity hedges are SHORT positions that REDUCE equity exposure AND returns
 * 
 * The problem: If we add hedges to cash, cash (SHV) has ~4-5% positive return, which incorrectly
 * boosts the portfolio return. Hedges should REDUCE returns, not add to them.
 * 
 * Solution: Add hedge allocation to bonds instead of cash. Bonds have lower returns than stocks,
 * which better models the risk-reduction effect of hedging without artificially boosting returns.
 */
function convertToKronosPortfolio(portfolio: typeof ASSET_ALLOCATION_PORTFOLIOS[0]) {
  // Calculate net equity exposure (stocks - hedges)
  // Hedges are short positions that offset long equity exposure
  const netEquity = portfolio.allocations.stocks - portfolio.allocations.equityHedges;
  
  // Add hedge allocation to bonds (conservative, lower-return asset)
  // This models the risk-reduction effect without the artificial boost from cash returns
  const adjustedBonds = portfolio.allocations.bonds + portfolio.allocations.equityHedges;
  
  console.log(`  🔧 ${portfolio.name} conversion:`, {
    grossStocks: `${(portfolio.allocations.stocks * 100).toFixed(1)}%`,
    hedges: `${(portfolio.allocations.equityHedges * 100).toFixed(1)}%`,
    netEquity: `${(netEquity * 100).toFixed(1)}%`,
    adjustedBonds: `${(adjustedBonds * 100).toFixed(1)}%`
  });
  
  return {
    stocks: netEquity * 100, // Net equity exposure after hedges
    bonds: adjustedBonds * 100, // Bonds + hedge allocation (models risk reduction)
    cash: portfolio.allocations.cash * 100, // Keep cash as-is
    realEstate: portfolio.allocations.realEstate * 100,
    commodities: portfolio.allocations.commodities * 100,
    alternatives: 0
  };
}

/**
 * Analyze the TIME portfolio using cached data
 */
async function analyzeTimePortfolio() {
  try {
    console.log(`  📊 Analyzing TIME Portfolio...`);
    
    // Check for cached TIME portfolio data
    const cachedTime = await getCachedTimePortfolio();
    
    if (!cachedTime) {
      console.error(`  ❌ No cached TIME portfolio data available`);
      // Return fallback data - TIME portfolio needs to be cached by the refresh job
      return {
        id: TIME_PORTFOLIO.id,
        name: TIME_PORTFOLIO.name,
        description: TIME_PORTFOLIO.description,
        riskLevel: TIME_PORTFOLIO.riskLevel,
        expectedReturn: 0,
        expectedBestYear: 0,
        expectedWorstYear: 0,
      upside: 0,
      downside: 0,
      volatility: 0,
      topPositions: [],
      allocations: {}, // Empty object for DB compatibility
      error: 'TIME portfolio cache not available. Please refresh the cache.'
    };
    }

    // Use cached TIME portfolio data
    const topPositions = cachedTime.topPositions.map(pos => ({
      ticker: pos.ticker,
      name: pos.name,
      weight: pos.weight,
      expectedReturn: pos.expectedReturn || 0
    }));

    console.log(`  ✅ TIME Portfolio: ${(cachedTime.expectedReturn * 100).toFixed(1)}% expected return (from cache)`);

    return {
      id: TIME_PORTFOLIO.id,
      name: TIME_PORTFOLIO.name,
      description: TIME_PORTFOLIO.description,
      riskLevel: TIME_PORTFOLIO.riskLevel,
      expectedReturn: cachedTime.expectedReturn,
      expectedBestYear: cachedTime.portfolioMonteCarlo.upside,
      expectedWorstYear: cachedTime.portfolioMonteCarlo.downside,
      upside: cachedTime.portfolioMonteCarlo.upside,
      downside: cachedTime.portfolioMonteCarlo.downside,
      volatility: cachedTime.portfolioMonteCarlo.volatility,
      topPositions,
      allocations: {}, // TIME uses specific holdings, not asset allocations (empty object for DB compatibility)
      kronosData: {
        positions: cachedTime.positions.length,
        totalWeight: 100
      }
    };
  } catch (error) {
    console.error(`  ❌ Failed to analyze TIME Portfolio:`, error);
    return {
      id: TIME_PORTFOLIO.id,
      name: TIME_PORTFOLIO.name,
      description: TIME_PORTFOLIO.description,
      riskLevel: TIME_PORTFOLIO.riskLevel,
      expectedReturn: 0,
      expectedBestYear: 0,
      expectedWorstYear: 0,
      upside: 0,
      downside: 0,
      volatility: 0,
      topPositions: [],
      allocations: {}, // Empty object for DB compatibility
      error: error instanceof Error ? error.message : 'TIME portfolio analysis failed'
    };
  }
}

/**
 * Analyze a single asset-allocation portfolio using the real Kronos analyzer
 * NOW USES REAL ETF HOLDINGS instead of simple asset allocation
 */
async function analyzePortfolio(portfolio: typeof ASSET_ALLOCATION_PORTFOLIOS[0]) {
  try {
    console.log(`  📊 Analyzing ${portfolio.name} with real holdings...`);
    
    // Convert holdings to simple format that Kronos expects
    const userHoldings = portfolio.holdings.map(holding => ({
      ticker: holding.ticker,
      name: holding.name,
      percentage: holding.percentage
    }));

    console.log(`  📦 ${portfolio.name} holdings:`, {
      totalHoldings: userHoldings.length,
      tickers: userHoldings.map(h => `${h.ticker}:${h.percentage}%`).join(', ')
    });
    
    // Call the REAL Kronos analyzer (same endpoint used by dashboard)
    console.log(`  🌐 Calling /api/portfolio/get-portfolio-data for ${portfolio.name}...`);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/portfolio/get-portfolio-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userHoldings, // REAL ETF HOLDINGS with ticker + percentage
        portfolioValue: 100000, // Standard $100k for comparison
        timeHorizon: TIME_HORIZON_YEARS
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ HTTP ${response.status} for ${portfolio.name}:`, errorText);
      throw new Error(`Kronos analyzer failed for ${portfolio.name}: HTTP ${response.status} - ${errorText}`);
    }

    console.log(`  ✅ Got response for ${portfolio.name}, parsing JSON...`);
    const data = await response.json();
    console.log(`  ✅ JSON parsed for ${portfolio.name}`);
    
    if (!data.success || !data.comparison || !data.comparison.userPortfolio) {
      console.error(`  ❌ Invalid Kronos response for ${portfolio.name}:`, data);
      throw new Error(`Invalid response from Kronos for ${portfolio.name}`);
    }

    // Extract the analysis results from the comparison object
    const analysis = data.comparison.userPortfolio;
    
    console.log(`  📊 ${portfolio.name} Analysis Results:`, {
      expectedReturn: (analysis.expectedReturn * 100).toFixed(2) + '%',
      upside: (analysis.upside * 100).toFixed(2) + '%',
      downside: (analysis.downside * 100).toFixed(2) + '%',
      positions: analysis.positions?.length || 0
    });
    
    // Group holdings by asset class for display (but use real holdings in background)
    const assetClassGroups: Record<string, { weight: number; tickers: string[] }> = {};
    
    portfolio.holdings.forEach(holding => {
      const assetClassName = 
        holding.assetClass === 'stocks' ? 'Equities' :
        holding.assetClass === 'bonds' ? 'Fixed Income' :
        holding.assetClass === 'commodities' ? 'Commodities & Gold' :
        holding.assetClass === 'alternatives' ? 'Alternatives' :
        'Cash Equivalents';
      
      if (!assetClassGroups[assetClassName]) {
        assetClassGroups[assetClassName] = { weight: 0, tickers: [] };
      }
      
      assetClassGroups[assetClassName].weight += holding.percentage;
      assetClassGroups[assetClassName].tickers.push(holding.ticker);
    });
    
    // Build top positions grouped by asset class (for UI display)
    const topPositions = Object.entries(assetClassGroups).map(([name, data]) => ({
      ticker: name,
      name: name,
      weight: data.weight,
      expectedReturn: 0, // Will be calculated from real holdings
      underlyingTickers: data.tickers // Keep track of real tickers
    }));
    
    console.log(`  📊 Asset Class Breakdown:`, assetClassGroups);

    console.log(`  ✅ ${portfolio.name}: ${(analysis.expectedReturn * 100).toFixed(1)}% expected return`);

    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      riskLevel: portfolio.riskLevel,
      expectedReturn: analysis.expectedReturn || 0,
      expectedBestYear: analysis.upside || 0,
      expectedWorstYear: analysis.downside || 0,
      upside: analysis.upside || 0,
      downside: analysis.downside || 0,
      volatility: analysis.volatility || 0,
      topPositions,
      allocations: portfolio.allocations,
      // Include raw Kronos data for debugging
      kronosData: {
        positions: analysis.positions?.length || 0,
        totalWeight: analysis.totalWeight || 0
      }
    };
  } catch (error) {
    console.error(`  ❌ Failed to analyze ${portfolio.name}:`, error);
    // Return fallback data if Kronos fails
    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      riskLevel: portfolio.riskLevel,
      expectedReturn: 0,
      expectedBestYear: 0,
      expectedWorstYear: 0,
      upside: 0,
      downside: 0,
      volatility: 0,
      topPositions: [],
      allocations: portfolio.allocations,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if we have valid cached data in Supabase
    const isCacheValid = await isCorePortfoliosCacheValid();
    
    if (isCacheValid) {
      console.log('📦 Attempting to serve cached Core Portfolios data from DB...');
      const cachedPortfolios = await getAllCachedCorePortfolios();
      
      if (cachedPortfolios && cachedPortfolios.length > 0) {
        const cacheAge = Math.floor((Date.now() - cachedPortfolios[0].updatedAt.getTime()) / 1000 / 60);
        console.log(`✅ Serving ${cachedPortfolios.length} cached portfolios (${cacheAge} min old)`);
        
        // Transform cached data to match expected format
        const portfolioResults = cachedPortfolios.map(cached => ({
          id: cached.id,
          name: cached.name,
          description: cached.description,
          riskLevel: cached.riskLevel,
          expectedReturn: cached.expectedReturn,
          expectedBestYear: cached.expectedBestYear,
          expectedWorstYear: cached.expectedWorstYear,
          upside: cached.upside,
          downside: cached.downside,
          volatility: cached.volatility,
          topPositions: cached.topPositions || [],
          allocations: cached.allocations,
          assetAllocation: cached.assetAllocation,
          kronosData: cached.kronosData,
        }));
        
        return NextResponse.json({
          success: true,
          portfolios: portfolioResults,
          timeHorizon: `${TIME_HORIZON_YEARS} year`,
          methodology: 'Kronos Portfolio Analyzer with FactSet price targets + Monte Carlo simulations',
          timestamp: cachedPortfolios[0].updatedAt.toISOString(),
          cached: true,
          cacheAge: `${cacheAge} minutes`
        });
      }
    }

    console.log('📊 Analyzing Core Portfolios using Kronos (cache miss or expired)...');

    // Analyze all 5 portfolios: TIME + 4 asset allocation portfolios
    const [timeResult, ...assetAllocationResults] = await Promise.all([
      analyzeTimePortfolio(),
      ...ASSET_ALLOCATION_PORTFOLIOS.map(portfolio => analyzePortfolio(portfolio))
    ]);

    // Combine and sort according to PORTFOLIO_ORDER
    const allResults = [timeResult, ...assetAllocationResults];
    const portfolioResults = allResults.sort((a, b) => {
      const indexA = PORTFOLIO_ORDER.indexOf(a.id);
      const indexB = PORTFOLIO_ORDER.indexOf(b.id);
      return indexA - indexB;
    });

    console.log(`✅ Analyzed ${portfolioResults.length} Core Portfolios (including TIME)`);

    // Save to database cache
    console.log('💾 Saving Core Portfolios to Supabase cache...');
    const cacheData = portfolioResults.map(result => ({
      id: result.id,
      name: result.name,
      description: result.description,
      riskLevel: result.riskLevel,
      allocations: result.allocations,
      expectedReturn: result.expectedReturn,
      expectedBestYear: result.expectedBestYear,
      expectedWorstYear: result.expectedWorstYear,
      upside: result.upside,
      downside: result.downside,
      volatility: result.volatility,
      assetAllocation: result.topPositions?.reduce((acc, pos) => {
        acc[pos.name || pos.ticker] = pos.weight / 100;
        return acc;
      }, {} as Record<string, number>),
      topPositions: result.topPositions,
      kronosData: result.kronosData,
      timeHorizon: TIME_HORIZON_YEARS,
    }));
    
    const cacheResult = await batchSetCachedCorePortfolios(cacheData);
    console.log(`💾 Cached ${cacheResult.success}/${cacheData.length} portfolios to Supabase`);

    const responseData = {
      success: true,
      portfolios: portfolioResults,
      timeHorizon: `${TIME_HORIZON_YEARS} year`,
      methodology: 'Kronos Portfolio Analyzer with FactSet price targets + Monte Carlo simulations',
      timestamp: new Date().toISOString(),
      cached: false
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Core portfolio analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Allow GET requests as well for easier testing
  return POST(request);
}
