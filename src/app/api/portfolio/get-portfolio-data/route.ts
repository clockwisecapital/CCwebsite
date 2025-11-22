import { NextRequest, NextResponse } from 'next/server';
import { getTgtPrices, getHoldingWeights } from '@/lib/supabase/database';
import { fetchBatchCurrentPrices, runBatchMonteCarloSimulations } from '@/lib/services/monte-carlo';
import { createProxyPortfolio, getProxyMessage, REPRESENTATIVE_ETFS } from '@/lib/services/proxy-portfolio';
import type { PortfolioComparison, PositionAnalysis } from '@/types/portfolio';

interface RequestBody {
  userHoldings?: Array<{
    ticker: string;
    name: string;
    percentage: number;  // Percentage of portfolio
  }>;
  portfolioAllocation?: {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    alternatives: number;
  };
  portfolioValue: number;
  timeHorizon?: number;  // Years for Monte Carlo simulation
}

/**
 * Get comprehensive portfolio data for comparison view
 * Fetches user portfolio data, TIME portfolio data, target prices, and runs Monte Carlo simulations
 */
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { userHoldings, portfolioAllocation, portfolioValue, timeHorizon = 1 } = body;

    // Determine if using actual holdings or proxy ETFs
    const isUsingProxy = !userHoldings || userHoldings.length === 0;
    let finalUserHoldings: Array<{ ticker: string; name: string; percentage: number }>;

    if (isUsingProxy && portfolioAllocation) {
      // Create proxy portfolio from allocations
      console.log('📊 Creating proxy portfolio from asset allocations');
      const proxyHoldings = createProxyPortfolio(portfolioAllocation);
      finalUserHoldings = proxyHoldings.map(h => ({
        ticker: h.ticker,
        name: h.name,
        percentage: h.percentage
      }));
      console.log(`✅ Created ${finalUserHoldings.length} proxy positions`);
    } else if (userHoldings && userHoldings.length > 0) {
      // Use actual holdings
      finalUserHoldings = userHoldings;
      console.log(`📊 Using ${finalUserHoldings.length} actual user positions`);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Must provide either user holdings or portfolio allocation',
      }, { status: 400 });
    }

    // 1. Get all tickers (user + TIME portfolio)
    const userTickers = finalUserHoldings.map(h => h.ticker).filter(t => t !== 'CASH');
    const timeHoldings = await getHoldingWeights();
    const timeTickers = timeHoldings
      .filter(h => !h.stockTicker.toLowerCase().includes('cash') && !h.stockTicker.toLowerCase().includes('other'))
      .map(h => h.stockTicker);

    const allTickers = [...new Set([...userTickers, ...timeTickers])];

    // 2. Fetch current prices for all tickers
    console.log('Fetching current prices...');
    const currentPrices = await fetchBatchCurrentPrices(allTickers);

    // 3. Fetch target prices
    console.log('Fetching target prices...');
    const targetPrices = await getTgtPrices(allTickers);

    // 4. Run Monte Carlo simulations
    console.log('Running Monte Carlo simulations...');
    const tickersForMC = allTickers
      .filter(ticker => currentPrices.has(ticker))
      .map(ticker => ({ ticker, currentPrice: currentPrices.get(ticker)! }));
    
    const monteCarloResults = await runBatchMonteCarloSimulations(tickersForMC, timeHorizon);

    // 5. Build User Portfolio Analysis
    const userPositions: PositionAnalysis[] = finalUserHoldings.map(holding => {
      // Handle cash separately (no price data needed)
      if (holding.ticker === 'CASH') {
        return {
          ticker: holding.ticker,
          name: holding.name,
          weight: holding.percentage,
          currentPrice: 1.0,
          targetPrice: null,
          expectedReturn: 0.03, // 3% cash return
          monteCarlo: null,
          isProxy: isUsingProxy,
          assetClass: 'Cash'
        };
      }

      const currentPrice = currentPrices.get(holding.ticker) || 0;
      const targetPrice = targetPrices.get(holding.ticker) || null;
      const expectedReturn = targetPrice && currentPrice > 0
        ? (targetPrice - currentPrice) / currentPrice
        : null;
      const monteCarlo = monteCarloResults.get(holding.ticker) || null;
      
      // Log Monte Carlo results for debugging
      if (monteCarlo) {
        console.log(`📊 ${holding.ticker} Monte Carlo:`, {
          upside: (monteCarlo.upside * 100).toFixed(1) + '%',
          median: (monteCarlo.median * 100).toFixed(1) + '%',
          downside: (monteCarlo.downside * 100).toFixed(1) + '%',
          volatility: (monteCarlo.volatility * 100).toFixed(1) + '%'
        });
      }

      // Determine asset class if proxy
      let assetClass: string | undefined;
      if (isUsingProxy) {
        const proxyEntry = Object.entries(REPRESENTATIVE_ETFS).find(
          ([, value]) => value.ticker === holding.ticker
        );
        assetClass = proxyEntry ? proxyEntry[1].description : undefined;
      }

      return {
        ticker: holding.ticker,
        name: holding.name,
        weight: holding.percentage,
        currentPrice,
        targetPrice,
        expectedReturn,
        monteCarlo,
        isProxy: isUsingProxy,
        assetClass
      };
    });

    // Calculate weighted average expected return for user portfolio
    const userExpectedReturn = calculateWeightedReturn(userPositions);

    // Get top 5 user positions by weight
    const userTopPositions = [...userPositions]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    // 6. Build TIME Portfolio Analysis
    const totalTimeWeight = timeHoldings.reduce((sum, h) => sum + h.weightings, 0);
    
    const timePositions: PositionAnalysis[] = timeHoldings
      .filter(h => !h.stockTicker.toLowerCase().includes('cash') && !h.stockTicker.toLowerCase().includes('other'))
      .map(holding => {
        const currentPrice = currentPrices.get(holding.stockTicker) || holding.price || 0;
        const targetPrice = targetPrices.get(holding.stockTicker) || null;
        const expectedReturn = targetPrice && currentPrice > 0
          ? (targetPrice - currentPrice) / currentPrice
          : null;
        const monteCarlo = monteCarloResults.get(holding.stockTicker) || null;
        const normalizedWeight = totalTimeWeight > 0 ? (holding.weightings / totalTimeWeight) * 100 : 0;

        return {
          ticker: holding.stockTicker,
          name: holding.securityName,
          weight: normalizedWeight,
          currentPrice,
          targetPrice,
          expectedReturn,
          monteCarlo
        };
      });

    // Calculate weighted average expected return for TIME portfolio
    const timeExpectedReturn = calculateWeightedReturn(timePositions);

    // Get top 5 TIME positions by weight
    const timeTopPositions = [...timePositions]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    // Calculate TIME portfolio value (same as user's for comparison)
    const timePortfolioValue = portfolioValue;

    // 7. Build response
    const comparison: PortfolioComparison = {
      userPortfolio: {
        totalValue: portfolioValue,
        expectedReturn: userExpectedReturn,
        positions: userPositions,
        topPositions: userTopPositions,
        isUsingProxy: isUsingProxy,
        proxyMessage: getProxyMessage(isUsingProxy)
      },
      timePortfolio: {
        totalValue: timePortfolioValue,
        expectedReturn: timeExpectedReturn,
        positions: timePositions,
        topPositions: timeTopPositions
      }
    };

    console.log('✅ Portfolio data fetched successfully');

    return NextResponse.json({
      success: true,
      comparison,
      metadata: {
        userPositionsCount: userPositions.length,
        timePositionsCount: timePositions.length,
        pricesFetched: currentPrices.size,
        targetPricesFetched: targetPrices.size,
        monteCarloCompleted: monteCarloResults.size,
        timeHorizon
      }
    });
  } catch (error) {
    console.error('❌ Portfolio data fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio data' 
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate weighted average expected return for a portfolio
 */
function calculateWeightedReturn(positions: PositionAnalysis[]): number {
  let totalWeight = 0;
  let weightedReturn = 0;

  positions.forEach(position => {
    if (position.expectedReturn !== null) {
      weightedReturn += position.expectedReturn * position.weight;
      totalWeight += position.weight;
    }
  });

  return totalWeight > 0 ? weightedReturn / 100 : 0;
}

