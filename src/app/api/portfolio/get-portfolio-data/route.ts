import { NextRequest, NextResponse } from 'next/server';
import { getTgtPrices, getHoldingWeights } from '@/lib/supabase/database';
import { fetchBatchCurrentPrices, runBatchMonteCarloSimulations } from '@/lib/services/monte-carlo';
import { createProxyPortfolio, getProxyMessage, REPRESENTATIVE_ETFS } from '@/lib/services/proxy-portfolio';
import { LONG_TERM_AVERAGES } from '@/lib/services/goal-probability';
import type { PortfolioComparison, PositionAnalysis } from '@/types/portfolio';

interface PortfolioAllocation {
  stocks: number;
  bonds: number;
  cash: number;
  realEstate: number;
  commodities: number;
  alternatives: number;
}

interface RequestBody {
  userHoldings?: Array<{
    ticker: string;
    name: string;
    percentage: number;  // Percentage of portfolio
  }>;
  portfolioAllocation?: PortfolioAllocation;
  portfolioValue: number;
  timeHorizon?: number;  // Years for Monte Carlo simulation
}

/**
 * Calculate expected return for years 2+ based on asset allocation and long-term averages
 */
function calculateLongTermReturn(allocation: PortfolioAllocation): number {
  const total = allocation.stocks + allocation.bonds + allocation.cash + 
                allocation.realEstate + allocation.commodities + allocation.alternatives;
  
  if (total === 0) return 0;
  
  const normalize = (value: number) => value / total;
  
  return (
    normalize(allocation.stocks) * LONG_TERM_AVERAGES.stocks +
    normalize(allocation.bonds) * LONG_TERM_AVERAGES.bonds +
    normalize(allocation.cash) * LONG_TERM_AVERAGES.cash +
    normalize(allocation.realEstate) * LONG_TERM_AVERAGES.realEstate +
    normalize(allocation.commodities) * LONG_TERM_AVERAGES.commodities +
    normalize(allocation.alternatives) * LONG_TERM_AVERAGES.alternatives
  );
}

/**
 * Calculate blended return: Year 1 = FactSet target, Years 2+ = long-term asset class average
 * Uses COMPOUND returns (not simple average) for mathematical accuracy
 */
function calculateBlendedReturn(
  factSetReturn: number,
  longTermReturn: number,
  timeHorizon: number
): number {
  if (timeHorizon <= 1) {
    return factSetReturn;
  }
  
  // Compound: (1 + Year1) * (1 + LongTerm)^(Years-1) = Total Growth
  // Then annualize: TotalGrowth^(1/Years) - 1
  const year1Growth = 1 + factSetReturn;
  const remainingYearsGrowth = Math.pow(1 + longTermReturn, timeHorizon - 1);
  const totalGrowth = year1Growth * remainingYearsGrowth;
  
  // Annualize the compounded return
  const annualizedReturn = Math.pow(totalGrowth, 1 / timeHorizon) - 1;
  
  console.log(`📊 Blended return calculation:`, {
    factSetReturn: (factSetReturn * 100).toFixed(1) + '%',
    longTermReturn: (longTermReturn * 100).toFixed(1) + '%',
    timeHorizon: timeHorizon + ' years',
    totalGrowth: (totalGrowth * 100).toFixed(1) + '%',
    annualizedReturn: (annualizedReturn * 100).toFixed(1) + '%'
  });
  
  return annualizedReturn;
}

/**
 * Get comprehensive portfolio data for comparison view
 * Fetches user portfolio data, TIME portfolio data, target prices, and runs Monte Carlo simulations
 * 
 * Returns blended expected return:
 * - Year 1: FactSet 12-month price targets
 * - Years 2+: Long-term asset class averages
 */
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { userHoldings, portfolioAllocation, portfolioValue, timeHorizon = 1 } = body;
    
    // Calculate long-term return based on asset allocation (for years 2+)
    const longTermReturn = portfolioAllocation 
      ? calculateLongTermReturn(portfolioAllocation)
      : LONG_TERM_AVERAGES.stocks; // Default to stocks if no allocation provided
    
    console.log(`📊 Time horizon: ${timeHorizon} years, Long-term return: ${(longTermReturn * 100).toFixed(1)}%`);

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
    console.log(`📊 Target prices fetched: ${targetPrices.size} of ${allTickers.length} tickers`);
    console.log('✓ Tickers with target prices:', Array.from(targetPrices.keys()).join(', '));
    
    const missingTargets = allTickers.filter(t => !targetPrices.has(t));
    if (missingTargets.length > 0) {
      console.warn('⚠️ Missing target prices for:', missingTargets.join(', '));
    }

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
    // This is the Year 1 FactSet-based return
    const userYear1Return = calculateWeightedReturn(userPositions);
    
    // For single proxy ETF (e.g., 100% SPY), use the ETF's own return without blending
    // Otherwise, blend Year 1 FactSet with Years 2+ long-term asset class averages
    const isSingleProxy = isUsingProxy && finalUserHoldings.length === 1;
    
    console.log(`🔍 Debug - isUsingProxy: ${isUsingProxy}, finalUserHoldings.length: ${finalUserHoldings.length}, isSingleProxy: ${isSingleProxy}`);
    console.log(`🔍 Debug - userYear1Return: ${(userYear1Return * 100).toFixed(1)}%, longTermReturn: ${(longTermReturn * 100).toFixed(1)}%, timeHorizon: ${timeHorizon}`);
    
    const userExpectedReturn = isSingleProxy 
      ? userYear1Return  // Use ETF's own expected return for all years
      : calculateBlendedReturn(userYear1Return, longTermReturn, timeHorizon);
    
    console.log(`📊 User Portfolio - Year 1: ${(userYear1Return * 100).toFixed(1)}%, ${isSingleProxy ? 'Single proxy' : `Blended (${timeHorizon}yr)`}: ${(userExpectedReturn * 100).toFixed(1)}%`);

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
    // This is the Year 1 FactSet-based return
    const timeYear1Return = calculateWeightedReturn(timePositions);
    
    // TIME portfolio is predominantly stocks, use stocks average for long-term
    const timeLongTermReturn = LONG_TERM_AVERAGES.stocks;
    const timeExpectedReturn = calculateBlendedReturn(timeYear1Return, timeLongTermReturn, timeHorizon);
    
    console.log(`📊 TIME Portfolio - Year 1: ${(timeYear1Return * 100).toFixed(1)}%, Blended (${timeHorizon}yr): ${(timeExpectedReturn * 100).toFixed(1)}%`);
    
    // Log TIME portfolio stats
    const missingTargetPrices = timePositions.filter(p => p.targetPrice === null);
    const validExpectedReturns = timePositions.filter(p => p.expectedReturn !== null && !isNaN(p.expectedReturn));
    
    console.log('📊 TIME Portfolio stats:', {
      totalPositions: timePositions.length,
      withTargetPrice: timePositions.filter(p => p.targetPrice !== null).length,
      withoutTargetPrice: missingTargetPrices.length,
      withValidExpectedReturn: validExpectedReturns.length,
      calculatedReturn: timeExpectedReturn,
      sample: timePositions.slice(0, 3).map(p => ({
        ticker: p.ticker,
        currentPrice: p.currentPrice,
        targetPrice: p.targetPrice,
        expectedReturn: p.expectedReturn
      }))
    });
    
    if (missingTargetPrices.length > 0) {
      console.warn('⚠️ TIME Portfolio missing target prices for:', missingTargetPrices.map(p => p.ticker).join(', '));
    }

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
      },
      timeHorizon // Include time horizon for display labels
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
    if (position.expectedReturn !== null && !isNaN(position.expectedReturn)) {
      weightedReturn += position.expectedReturn * position.weight;
      totalWeight += position.weight;
    }
  });

  const result = totalWeight > 0 ? weightedReturn / 100 : 0;
  
  // Safeguard against NaN
  return isNaN(result) ? 0 : result;
}

