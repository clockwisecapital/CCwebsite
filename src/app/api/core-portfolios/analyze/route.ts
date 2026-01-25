/**
 * API Endpoint: Analyze Core Portfolios
 * 
 * Runs all 4 Clockwise Core Portfolios through the REAL Kronos analyzer
 * Uses the same logic as the Kronos dashboard for consistent calculations
 * 
 * CACHING: Results cached in Supabase for 24 hours since allocations don't change daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { ASSET_ALLOCATION_PORTFOLIOS } from '@/lib/clockwise-portfolios';
import {
  getAllCachedCorePortfolios,
  batchSetCachedCorePortfolios,
  isCorePortfoliosCacheValid,
} from '@/lib/services/core-portfolios-cache';

// Cache configuration - revalidate every 24 hours
export const revalidate = 86400; // 24 hours in seconds

const TIME_HORIZON_YEARS = 1; // 12 months

/**
 * Convert Clockwise allocation to Kronos portfolio format
 */
function convertToKronosPortfolio(portfolio: typeof ASSET_ALLOCATION_PORTFOLIOS[0]) {
  // Clockwise portfolios have equityHedges, but Kronos uses "alternatives"
  // We'll map equityHedges to alternatives for Kronos compatibility
  const alternatives = portfolio.allocations.equityHedges;
  
  return {
    stocks: portfolio.allocations.stocks * 100, // Convert to percentage
    bonds: portfolio.allocations.bonds * 100,
    cash: portfolio.allocations.cash * 100,
    realEstate: portfolio.allocations.realEstate * 100,
    commodities: portfolio.allocations.commodities * 100,
    alternatives: alternatives * 100
  };
}

/**
 * Analyze a single portfolio using the real Kronos analyzer
 */
async function analyzePortfolio(portfolio: typeof ASSET_ALLOCATION_PORTFOLIOS[0]) {
  try {
    console.log(`  📊 Analyzing ${portfolio.name}...`);
    
    // Convert to Kronos format
    const portfolioAllocation = convertToKronosPortfolio(portfolio);
    
    // Call the REAL Kronos analyzer (same endpoint used by dashboard)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/portfolio/get-portfolio-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userHoldings: [], // No specific holdings - using asset allocation proxy
        portfolioAllocation,
        portfolioValue: 100000, // Standard $100k for comparison
        timeHorizon: TIME_HORIZON_YEARS
      })
    });

    if (!response.ok) {
      throw new Error(`Kronos analyzer failed for ${portfolio.name}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.comparison || !data.comparison.userPortfolio) {
      console.error(`  ❌ Invalid Kronos response for ${portfolio.name}:`, data);
      throw new Error(`Invalid response from Kronos for ${portfolio.name}`);
    }

    // Extract the analysis results from the comparison object
    const analysis = data.comparison.userPortfolio;
    
    console.log(`  📊 ${portfolio.name} Analysis Results:`, {
      expectedReturn: analysis.expectedReturn,
      upside: analysis.upside,
      downside: analysis.downside,
      positions: analysis.positions?.length || 0
    });
    
    // Build asset allocation display
    const topPositions = [];
    
    if (portfolio.allocations.stocks > 0) {
      topPositions.push({
        ticker: 'Stocks',
        name: 'Equities',
        weight: portfolio.allocations.stocks * 100,
        expectedReturn: 0.07 // Will be overridden by Kronos data if available
      });
    }
    
    if (portfolio.allocations.bonds > 0) {
      topPositions.push({
        ticker: 'Bonds',
        name: 'Fixed Income',
        weight: portfolio.allocations.bonds * 100,
        expectedReturn: 0.02
      });
    }
    
    if (portfolio.allocations.commodities > 0) {
      topPositions.push({
        ticker: 'Commodities',
        name: 'Commodities & Gold',
        weight: portfolio.allocations.commodities * 100,
        expectedReturn: 0.01
      });
    }
    
    if (portfolio.allocations.realEstate > 0) {
      topPositions.push({
        ticker: 'Real Estate',
        name: 'REITs',
        weight: portfolio.allocations.realEstate * 100,
        expectedReturn: 0.05
      });
    }
    
    if (portfolio.allocations.cash > 0) {
      topPositions.push({
        ticker: 'Cash',
        name: 'Cash Equivalents',
        weight: portfolio.allocations.cash * 100,
        expectedReturn: 0.00
      });
    }
    
    if (portfolio.allocations.equityHedges > 0) {
      topPositions.push({
        ticker: 'Hedges',
        name: 'Equity Hedges',
        weight: portfolio.allocations.equityHedges * 100,
        expectedReturn: -0.02
      });
    }

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

    // Analyze all 4 portfolios using the REAL Kronos analyzer
    const portfolioResults = await Promise.all(
      ASSET_ALLOCATION_PORTFOLIOS.map(portfolio => analyzePortfolio(portfolio))
    );

    console.log(`✅ Analyzed ${portfolioResults.length} Core Portfolios`);

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
