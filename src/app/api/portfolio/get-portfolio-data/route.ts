import { NextRequest, NextResponse } from 'next/server';
import { getTgtPrices, getHoldingWeights, getIndexSectorTargets, getIndexScenarioReturns } from '@/lib/supabase/database';
import { fetchBatchCurrentPrices, runBatchMonteCarloSimulations, runPortfolioMonteCarloSimulation } from '@/lib/services/monte-carlo';
import type { AssetClass } from '@/lib/services/monte-carlo';
import { createProxyPortfolio, getProxyMessage, REPRESENTATIVE_ETFS } from '@/lib/services/proxy-portfolio';
import { LONG_TERM_AVERAGES, LONG_TERM_NOMINAL } from '@/lib/services/goal-probability';
import { calculateYear1Return, getRequiredUnderlyingTickers } from '@/lib/services/year1-return';
import { getCachedTimePortfolio, setCachedTimePortfolio } from '@/lib/services/time-portfolio-cache';
import type { PortfolioComparison, PositionAnalysis } from '@/types/portfolio';

interface PortfolioAllocation {
  stocks: number;
  bonds: number;
  cash: number;
  realEstate: number;
  commodities: number;
  alternatives: number;
}

// ============================================================================
// ASSET CLASS TICKER MAPPING
// Maps known tickers to their asset classes for allocation inference
// Unknown tickers default to 'stocks'
// ============================================================================

type AssetClassKey = 'stocks' | 'bonds' | 'realEstate' | 'commodities' | 'cash' | 'alternatives';

const KNOWN_ASSET_CLASS_TICKERS: Record<string, AssetClassKey> = {
  // Index/Sector ETFs (Stocks)
  'SPY': 'stocks', 'QQQ': 'stocks', 'VTI': 'stocks', 'VOO': 'stocks', 'IVV': 'stocks',
  'DIA': 'stocks', 'IWM': 'stocks', 'VUG': 'stocks', 'VTV': 'stocks', 'SCHD': 'stocks',
  'XLK': 'stocks', 'XLF': 'stocks', 'XLC': 'stocks', 'XLY': 'stocks', 'XLP': 'stocks',
  'XLE': 'stocks', 'XLV': 'stocks', 'XLI': 'stocks', 'XLB': 'stocks', 'XLRE': 'stocks',
  'XLU': 'stocks', 'ARKK': 'stocks', 'SOXX': 'stocks', 'SMH': 'stocks', 'IGV': 'stocks',
  'ITA': 'stocks',
  
  // TIME Portfolio Individual Stocks
  'AAPL': 'stocks', 'GOOGL': 'stocks', 'NVDA': 'stocks', 'MSFT': 'stocks', 'AVGO': 'stocks',
  'AMZN': 'stocks', 'TSLA': 'stocks', 'D': 'stocks', 'MOH': 'stocks', 'RDDT': 'stocks',
  'META': 'stocks', 'HOOD': 'stocks', 'STZ': 'stocks', 'KO': 'stocks', 'DPZ': 'stocks',
  'CSCO': 'stocks', 'BABA': 'stocks', 'MU': 'stocks', 'MCD': 'stocks', 'TOST': 'stocks',
  'PLTR': 'stocks', 'GEV': 'stocks', 'COP': 'stocks', 'NFLX': 'stocks', 'VZ': 'stocks',
  'COST': 'stocks',
  
  // Short/Inverse ETFs (treat as stocks for allocation purposes)
  'SQQQ': 'stocks', 'QID': 'stocks', 'PSQ': 'stocks', 'SPXU': 'stocks', 'SDS': 'stocks',
  'SH': 'stocks', 'SDOW': 'stocks', 'DXD': 'stocks', 'DOG': 'stocks', 'SOXS': 'stocks',
  'SARK': 'stocks',
  
  // Bond ETFs
  'AGG': 'bonds', 'BND': 'bonds', 'TLT': 'bonds', 'IEF': 'bonds', 'LQD': 'bonds',
  'HYG': 'bonds', 'VCIT': 'bonds', 'VGIT': 'bonds', 'VCSH': 'bonds', 'MUB': 'bonds',
  'TIP': 'bonds',
  
  // Real Estate ETFs
  'VNQ': 'realEstate', 'SCHH': 'realEstate', 'IYR': 'realEstate',
  
  // Commodities
  'GLD': 'commodities', 'SLV': 'commodities', 'IAU': 'commodities', 'USO': 'commodities',
  'DBC': 'commodities', 'DBA': 'commodities', 'NEM': 'commodities', // NEM is gold miner
  
  // Cash/Money Market
  'SGOV': 'cash', 'BIL': 'cash', 'SHV': 'cash', 'FGXXX': 'cash',
};

/**
 * Get asset class for a ticker (defaults to 'stocks' if unknown)
 */
function getAssetClassForTicker(ticker: string): AssetClassKey {
  const upperTicker = ticker.toUpperCase();
  return KNOWN_ASSET_CLASS_TICKERS[upperTicker] || 'stocks';
}

/**
 * Infer portfolio allocation from user holdings
 * Uses the ticker-to-asset-class mapping to determine allocation percentages
 */
function inferAllocationFromHoldings(
  holdings: Array<{ ticker: string; percentage: number }>
): PortfolioAllocation {
  const allocation: PortfolioAllocation = {
    stocks: 0,
    bonds: 0,
    cash: 0,
    realEstate: 0,
    commodities: 0,
    alternatives: 0,
  };
  
  for (const holding of holdings) {
    const assetClass = getAssetClassForTicker(holding.ticker);
    allocation[assetClass] += holding.percentage;
  }
  
  console.log('📊 Inferred allocation from holdings:', {
    holdings: holdings.map(h => `${h.ticker}: ${h.percentage}%`).join(', '),
    inferred: allocation
  });
  
  return allocation;
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
    normalize(allocation.stocks) * LONG_TERM_NOMINAL.stocks +
    normalize(allocation.bonds) * LONG_TERM_NOMINAL.bonds +
    normalize(allocation.cash) * LONG_TERM_NOMINAL.cash +
    normalize(allocation.realEstate) * LONG_TERM_NOMINAL.realEstate +
    normalize(allocation.commodities) * LONG_TERM_NOMINAL.commodities +
    normalize(allocation.alternatives) * LONG_TERM_NOMINAL.alternatives
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
    // If portfolioAllocation is all zeros but user has holdings, infer allocation from holdings
    let longTermReturn: number;
    
    const allocationTotal = portfolioAllocation 
      ? (portfolioAllocation.stocks + portfolioAllocation.bonds + portfolioAllocation.cash + 
         portfolioAllocation.realEstate + portfolioAllocation.commodities + portfolioAllocation.alternatives)
      : 0;
    
    if (allocationTotal === 0 && userHoldings && userHoldings.length > 0) {
      // Infer allocation from user holdings
      console.log('📊 Portfolio allocation is zero - inferring from user holdings...');
      const inferredAllocation = inferAllocationFromHoldings(userHoldings);
      longTermReturn = calculateLongTermReturn(inferredAllocation);
    } else if (portfolioAllocation && allocationTotal > 0) {
      // Use provided allocation
      longTermReturn = calculateLongTermReturn(portfolioAllocation);
    } else {
      // Default to stocks if no allocation and no holdings
      longTermReturn = LONG_TERM_NOMINAL.stocks;
    }
    
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

    // =========================================================================
    // CHECK TIME PORTFOLIO CACHE FIRST (Supabase-backed)
    // =========================================================================
    const cachedTimePortfolio = await getCachedTimePortfolio();
    const useTimeCache = cachedTimePortfolio !== null;
    
    if (useTimeCache) {
      console.log('📦 Using cached TIME portfolio from Supabase (skipping TIME MC simulations)');
    }

    // 1. Get all tickers (user + TIME portfolio if not cached)
    const userTickers = finalUserHoldings.map(h => h.ticker).filter(t => t !== 'CASH');
    const timeHoldings = await getHoldingWeights();
    const timeTickers = timeHoldings
      .filter(h => !h.stockTicker.toLowerCase().includes('cash') && !h.stockTicker.toLowerCase().includes('other'))
      .map(h => h.stockTicker);

    // If TIME is cached, only process user tickers for MC (big speed improvement!)
    const tickersForProcessing = useTimeCache 
      ? userTickers 
      : [...new Set([...userTickers, ...timeTickers])];
    
    // Get underlying indices needed for short ETF calculations
    const underlyingIndices = getRequiredUnderlyingTickers(tickersForProcessing);
    const tickersWithUnderlyings = [...new Set([...tickersForProcessing, ...underlyingIndices])];
    
    console.log(`📊 Processing ${tickersForProcessing.length} tickers for MC (TIME cached: ${useTimeCache})`);
    console.log(`📊 Underlying indices for shorts: ${underlyingIndices.join(', ') || 'none'}`);

    // 2. Fetch Clockwise index/sector targets (for index ETFs and short calculations)
    console.log('Fetching Clockwise index targets...');
    const indexTargets = await getIndexSectorTargets();
    console.log(`✅ Loaded ${indexTargets.size} Clockwise index targets`);

    // 2b. Fetch INDEX VALS scenario returns (for ETFs)
    console.log('Fetching INDEX VALS scenario returns...');
    const indexScenarioReturns = await getIndexScenarioReturns();
    console.log(`✅ Loaded ${indexScenarioReturns.size} INDEX VALS ETF scenarios`);

    // 3. Fetch current prices for tickers we need to process
    console.log('Fetching current prices...');
    const currentPrices = await fetchBatchCurrentPrices(tickersWithUnderlyings);

    // 4. Fetch FactSet target prices (for individual stocks)
    console.log('Fetching FactSet target prices...');
    const targetPrices = await getTgtPrices(tickersForProcessing);
    console.log(`📊 FactSet target prices fetched: ${targetPrices.size} of ${tickersForProcessing.length} tickers`);
    console.log('✓ Tickers with FactSet targets:', Array.from(targetPrices.keys()).join(', '));
    
    const missingTargets = tickersForProcessing.filter(t => !targetPrices.has(t) && !indexTargets.has(t));
    if (missingTargets.length > 0) {
      console.warn('⚠️ Missing target prices for:', missingTargets.join(', '));
    }

    // 5. Calculate Year 1 returns for tickers we're processing
    console.log('Calculating Year 1 returns...');
    const year1Returns = new Map<string, number>();
    
    for (const ticker of tickersForProcessing) {
      if (ticker === 'CASH') continue;
      
      const currentPrice = currentPrices.get(ticker) || 0;
      const factsetTarget = targetPrices.get(ticker) || null;
      
      const result = await calculateYear1Return(
        ticker,
        currentPrice,
        factsetTarget,
        indexTargets,
        currentPrices,
        'stocks', // Default asset class
        indexScenarioReturns // INDEX VALS expected scenarios for ETFs
      );
      
      year1Returns.set(ticker, result.return);
      console.log(`  ${ticker}: ${(result.return * 100).toFixed(1)}% (${result.source})`);
    }

    // 6. Run Monte Carlo simulations ONLY for tickers we need
    // (If TIME is cached, this is just user tickers - HUGE speed improvement!)
    console.log(`Running Monte Carlo simulations for ${tickersForProcessing.length} tickers...`);
    const tickersForMC = tickersForProcessing
      .filter(ticker => currentPrices.has(ticker) && year1Returns.has(ticker))
      .map(ticker => ({ 
        ticker, 
        currentPrice: currentPrices.get(ticker)!,
        year1Return: year1Returns.get(ticker)!
      }));
    
    const monteCarloResults = await runBatchMonteCarloSimulations(tickersForMC, timeHorizon);

    // 7. Build User Portfolio Analysis
    const userPositions: PositionAnalysis[] = finalUserHoldings.map(holding => {
      // Handle cash separately (no price data needed)
      if (holding.ticker === 'CASH') {
        return {
          ticker: holding.ticker,
          name: holding.name,
          weight: holding.percentage,
          currentPrice: 1.0,
          targetPrice: null,
          expectedReturn: 0.00, // 0% real cash return (matches inflation)
          monteCarlo: null,
          isProxy: isUsingProxy,
          assetClass: 'Cash'
        };
      }

      const currentPrice = currentPrices.get(holding.ticker) || 0;
      const targetPrice = targetPrices.get(holding.ticker) || indexTargets.get(holding.ticker) || null;
      const year1Return = year1Returns.get(holding.ticker) ?? null;
      const monteCarlo = monteCarloResults.get(holding.ticker) || null;
      
      // Calculate blended expected return over timeframe (Year 1 + Years 2+ long-term)
      const tickerAssetClass = getAssetClassForTicker(holding.ticker);
      const tickerLongTermReturn = LONG_TERM_NOMINAL[tickerAssetClass] || LONG_TERM_NOMINAL.stocks;
      const expectedReturn = year1Return !== null 
        ? calculateBlendedReturn(year1Return, tickerLongTermReturn, timeHorizon)
        : null;
      
      // Log Monte Carlo results for debugging
      if (monteCarlo) {
        console.log(`📊 ${holding.ticker} Monte Carlo:`, {
          median: (monteCarlo.median * 100).toFixed(1) + '%',
          maxGain: (monteCarlo.upside * 100).toFixed(1) + '%',
          maxLoss: (monteCarlo.downside * 100).toFixed(1) + '%',
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

    // Calculate weighted average Year 1 return for user portfolio
    // Use year1Returns map directly since position.expectedReturn is now blended
    let userYear1Return = 0;
    let totalYear1Weight = 0;
    for (const holding of finalUserHoldings) {
      const y1Return = year1Returns.get(holding.ticker);
      if (y1Return !== undefined && !isNaN(y1Return)) {
        userYear1Return += y1Return * holding.percentage;
        totalYear1Weight += holding.percentage;
      }
    }
    userYear1Return = totalYear1Weight > 0 ? userYear1Return / 100 : 0; // Normalize to decimal
    
    // ALWAYS blend Year 1 FactSet with Years 2+ long-term asset class averages for multi-year horizons
    // This ensures consistent methodology across all portfolios
    console.log(`🔍 Debug - isUsingProxy: ${isUsingProxy}, finalUserHoldings.length: ${finalUserHoldings.length}`);
    console.log(`🔍 Debug - userYear1Return: ${(userYear1Return * 100).toFixed(1)}%, longTermReturn: ${(longTermReturn * 100).toFixed(1)}%, timeHorizon: ${timeHorizon}`);
    
    const userExpectedReturn = calculateBlendedReturn(userYear1Return, longTermReturn, timeHorizon);
    
    console.log(`📊 User Portfolio - Year 1: ${(userYear1Return * 100).toFixed(1)}%, Blended (${timeHorizon}yr): ${(userExpectedReturn * 100).toFixed(1)}%`);

    // Get top 5 user positions by weight
    const userTopPositions = [...userPositions]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    // Run Portfolio-Level Monte Carlo for User Portfolio (captures diversification)
    const userPortfolioMCPositions = userPositions
      .filter(p => p.monteCarlo && p.ticker !== 'CASH')
      .map(p => ({
        weight: p.weight / 100, // Convert to decimal
        year1Return: year1Returns.get(p.ticker) || 0,
        year1Volatility: p.monteCarlo!.volatility,
        assetClass: (p.assetClass?.toLowerCase().includes('bond') ? 'bonds' :
                    p.assetClass?.toLowerCase().includes('real') ? 'realEstate' :
                    p.assetClass?.toLowerCase().includes('cash') ? 'cash' :
                    'stocks') as AssetClass
      }));
    
    const userPortfolioMC = userPortfolioMCPositions.length > 0
      ? runPortfolioMonteCarloSimulation(userPortfolioMCPositions, timeHorizon)
      : { upside: 0, downside: 0, median: 0, volatility: 0, simulations: 0 };
    
    console.log(`📊 User Portfolio-Level Monte Carlo:`, {
      upside: (userPortfolioMC.upside * 100).toFixed(1) + '%',
      downside: (userPortfolioMC.downside * 100).toFixed(1) + '%',
      volatility: (userPortfolioMC.volatility * 100).toFixed(1) + '%'
    });
    
    // For multi-year portfolios (2+), use Monte Carlo median instead of deterministic expected return
    // Use cumulative median directly (not annualized)
    const userFinalExpectedReturn = timeHorizon >= 2 
      ? userPortfolioMC.median
      : userExpectedReturn;
    console.log(`📊 User Portfolio Final Expected Return (${timeHorizon}yr): ${(userFinalExpectedReturn * 100).toFixed(1)}%${timeHorizon >= 2 ? ' (MC median, cumulative)' : ' (deterministic)'}`);

    // For 1-year timeframes, use INDEX VALS scenario returns (bull/bear) instead of Monte Carlo
    let userFinalUpside: number;
    let userFinalDownside: number;
    
    if (timeHorizon === 1) {
      // Calculate weighted average of bull/bear scenarios from INDEX VALS CSV
      // For stocks without INDEX VALS, use a conservative ±15% spread around expected return
      let bullWeightedReturn = 0;
      let bearWeightedReturn = 0;
      let totalWeight = 0;
      
      for (const position of userPositions) {
        if (position.ticker === 'CASH') continue;
        
        const weight = position.weight / 100; // Convert to decimal
        const scenarios = indexScenarioReturns.get(position.ticker);
        
        if (scenarios) {
          // Use INDEX VALS bull/bear for ETFs (Row 7 and Row 12 from CSV)
          bullWeightedReturn += weight * scenarios.bull;
          bearWeightedReturn += weight * scenarios.bear;
          totalWeight += weight;
        } else {
          // For individual stocks without INDEX VALS: use expected return ± 15% spread
          // This is more realistic for 1-year scenarios than Monte Carlo extremes
          const expectedReturn = position.expectedReturn || LONG_TERM_NOMINAL.stocks; // Fallback to 10%
          const conservativeBull = expectedReturn * 1.15;  // +15% above expected
          const conservativeBear = expectedReturn * 0.85;  // -15% below expected
          
          bullWeightedReturn += weight * conservativeBull;
          bearWeightedReturn += weight * conservativeBear;
          totalWeight += weight;
        }
      }
      
      userFinalUpside = totalWeight > 0 ? bullWeightedReturn : userPortfolioMC.upside;
      userFinalDownside = totalWeight > 0 ? bearWeightedReturn : userPortfolioMC.downside;
      
      console.log(`📊 User Portfolio 1-Year Scenarios (from INDEX VALS):`, {
        bull: (userFinalUpside * 100).toFixed(1) + '%',
        bear: (userFinalDownside * 100).toFixed(1) + '%'
      });
    } else {
      // Multi-year: Use Monte Carlo as before
      userFinalUpside = userPortfolioMC.upside;
      userFinalDownside = userPortfolioMC.downside;
    }

    // 8. Build TIME Portfolio Analysis (use cache if available)
    let timePositions: PositionAnalysis[];
    let timeTopPositions: PositionAnalysis[];
    let timeExpectedReturn: number;
    let timeYear1Return: number;
    let timePortfolioMC: { upside: number; downside: number; median: number; volatility: number };
    
    if (useTimeCache && cachedTimePortfolio) {
      // Use cached TIME portfolio data
      console.log('📦 Using cached TIME portfolio positions and MC results');
      timePositions = cachedTimePortfolio.positions;
      timeTopPositions = cachedTimePortfolio.topPositions;
      timeExpectedReturn = cachedTimePortfolio.expectedReturn;
      timeYear1Return = cachedTimePortfolio.year1Return;
      timePortfolioMC = cachedTimePortfolio.portfolioMonteCarlo;
    } else {
      // Compute TIME portfolio from scratch
      console.log('🔄 Computing TIME portfolio (will cache for 6 hours)');
      
      // Need to fetch prices and run MC for TIME tickers
      const timeTickersToProcess = timeTickers.filter(t => !userTickers.includes(t));
      if (timeTickersToProcess.length > 0) {
        // Fetch any missing prices for TIME portfolio
        const missingTimePrices = timeTickersToProcess.filter(t => !currentPrices.has(t));
        if (missingTimePrices.length > 0) {
          const additionalPrices = await fetchBatchCurrentPrices(missingTimePrices);
          additionalPrices.forEach((price, ticker) => currentPrices.set(ticker, price));
        }
        
        // Fetch any missing target prices for TIME portfolio
        const missingTimeTargets = timeTickersToProcess.filter(t => !targetPrices.has(t));
        if (missingTimeTargets.length > 0) {
          const additionalTargets = await getTgtPrices(missingTimeTargets);
          additionalTargets.forEach((price, ticker) => targetPrices.set(ticker, price));
        }
        
        // Calculate Year 1 returns for TIME tickers we haven't processed
        for (const ticker of timeTickersToProcess) {
          if (!year1Returns.has(ticker)) {
            const currentPrice = currentPrices.get(ticker) || 0;
            const factsetTarget = targetPrices.get(ticker) || null;
            const result = await calculateYear1Return(
              ticker, currentPrice, factsetTarget, indexTargets, currentPrices, 'stocks', indexScenarioReturns
            );
            year1Returns.set(ticker, result.return);
          }
        }
        
        // Run MC for TIME tickers we haven't processed
        const timeMCTickers = timeTickersToProcess
          .filter(t => currentPrices.has(t) && year1Returns.has(t) && !monteCarloResults.has(t))
          .map(t => ({ ticker: t, currentPrice: currentPrices.get(t)!, year1Return: year1Returns.get(t)! }));
        
        if (timeMCTickers.length > 0) {
          console.log(`Running Monte Carlo for ${timeMCTickers.length} TIME portfolio tickers...`);
          const timeMCResults = await runBatchMonteCarloSimulations(timeMCTickers, timeHorizon);
          timeMCResults.forEach((result, ticker) => monteCarloResults.set(ticker, result));
        }
      }
      
      const totalTimeWeight = timeHoldings.reduce((sum, h) => sum + h.weightings, 0);
      
      timePositions = timeHoldings
        .filter(h => !h.stockTicker.toLowerCase().includes('cash') && !h.stockTicker.toLowerCase().includes('other'))
        .map(holding => {
          const currentPrice = currentPrices.get(holding.stockTicker) || holding.price || 0;
          const targetPrice = targetPrices.get(holding.stockTicker) || indexTargets.get(holding.stockTicker) || null;
          const year1Return = year1Returns.get(holding.stockTicker) ?? null;
          const monteCarlo = monteCarloResults.get(holding.stockTicker) || null;
          const normalizedWeight = totalTimeWeight > 0 ? (holding.weightings / totalTimeWeight) * 100 : 0;
          
          // Calculate blended expected return over timeframe (Year 1 + Years 2+ long-term)
          const tickerAssetClass = getAssetClassForTicker(holding.stockTicker);
          const tickerLongTermReturn = LONG_TERM_NOMINAL[tickerAssetClass] || LONG_TERM_NOMINAL.stocks;
          const expectedReturn = year1Return !== null 
            ? calculateBlendedReturn(year1Return, tickerLongTermReturn, timeHorizon)
            : null;

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

      // Calculate weighted average Year 1 return for TIME portfolio
      // Use year1Returns map directly since position.expectedReturn is now blended
      timeYear1Return = 0;
      let totalTimeYear1Weight = 0;
      for (const holding of timeHoldings) {
        if (holding.stockTicker.toLowerCase().includes('cash') || holding.stockTicker.toLowerCase().includes('other')) continue;
        const y1Return = year1Returns.get(holding.stockTicker);
        if (y1Return !== undefined && !isNaN(y1Return)) {
          timeYear1Return += y1Return * holding.weightings;
          totalTimeYear1Weight += holding.weightings;
        }
      }
      timeYear1Return = totalTimeYear1Weight > 0 ? timeYear1Return / totalTimeYear1Weight : 0;
      
      const timeLongTermReturn = LONG_TERM_NOMINAL.stocks;
      timeExpectedReturn = calculateBlendedReturn(timeYear1Return, timeLongTermReturn, timeHorizon);
      
      console.log(`📊 TIME Portfolio - Year 1: ${(timeYear1Return * 100).toFixed(1)}%, Blended (${timeHorizon}yr): ${(timeExpectedReturn * 100).toFixed(1)}%`);
      
      // Log TIME portfolio stats
      const missingTargetPrices = timePositions.filter(p => p.targetPrice === null);
      console.log('📊 TIME Portfolio stats:', {
        totalPositions: timePositions.length,
        withTargetPrice: timePositions.filter(p => p.targetPrice !== null).length,
        withoutTargetPrice: missingTargetPrices.length
      });
      
      if (missingTargetPrices.length > 0) {
        console.warn('⚠️ TIME Portfolio missing target prices for:', missingTargetPrices.map(p => p.ticker).join(', '));
      }

      timeTopPositions = [...timePositions]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5);

      // Run Portfolio-Level Monte Carlo for TIME Portfolio
      const timePortfolioMCPositions = timePositions
        .filter(p => p.monteCarlo)
        .map(p => ({
          weight: p.weight / 100,
          year1Return: year1Returns.get(p.ticker) || 0,
          year1Volatility: p.monteCarlo!.volatility,
          assetClass: 'stocks' as AssetClass
        }));
      
      timePortfolioMC = timePortfolioMCPositions.length > 0
        ? runPortfolioMonteCarloSimulation(timePortfolioMCPositions, timeHorizon)
        : { upside: 0, downside: 0, median: 0, volatility: 0, simulations: 0 };
      
      console.log(`📊 TIME Portfolio-Level Monte Carlo:`, {
        upside: (timePortfolioMC.upside * 100).toFixed(1) + '%',
        downside: (timePortfolioMC.downside * 100).toFixed(1) + '%',
        volatility: (timePortfolioMC.volatility * 100).toFixed(1) + '%'
      });
      
      // Cache the TIME portfolio for future requests (Supabase)
      // We'll cache the raw values and apply the conditional logic after
      await setCachedTimePortfolio({
        positions: timePositions,
        topPositions: timeTopPositions,
        expectedReturn: timeExpectedReturn,
        year1Return: timeYear1Return,
        portfolioMonteCarlo: timePortfolioMC
      });
    }
    
    // For multi-year portfolios (2+), use Monte Carlo median instead of deterministic expected return
    // Apply this logic whether using cache or fresh calculation
    // Use cumulative median directly (not annualized)
    const timeFinalExpectedReturn = timeHorizon >= 2 
      ? timePortfolioMC.median
      : timeExpectedReturn;
    console.log(`📊 TIME Portfolio Final Expected Return (${timeHorizon}yr): ${(timeFinalExpectedReturn * 100).toFixed(1)}%${timeHorizon >= 2 ? ' (MC median, cumulative)' : ' (deterministic)'}`);

    // For TIME Portfolio: ALWAYS use Monte Carlo (no INDEX VALS logic)
    // TIME is a diversified 30-stock portfolio, so portfolio-level MC is most appropriate
    // This keeps it simple and consistent regardless of timeframe
    const timeFinalUpside = timePortfolioMC.upside;
    const timeFinalDownside = timePortfolioMC.downside;
    
    console.log(`📊 TIME Portfolio Scenarios (from Monte Carlo):`, {
      bull: (timeFinalUpside * 100).toFixed(1) + '%',
      bear: (timeFinalDownside * 100).toFixed(1) + '%'
    });

    // Calculate TIME portfolio value (same as user's for comparison)
    const timePortfolioValue = portfolioValue;

    // 9. Build response
    // User Portfolio: INDEX VALS for 1yr (if available), Monte Carlo for multi-year
    // TIME Portfolio: Always Monte Carlo (portfolio-level best/worst year percentiles)
    console.log(`📊 User Portfolio - Bull: ${(userFinalUpside * 100).toFixed(1)}%, Bear: ${(userFinalDownside * 100).toFixed(1)}%`);
    console.log(`📊 TIME Portfolio - Bull: ${(timeFinalUpside * 100).toFixed(1)}%, Bear: ${(timeFinalDownside * 100).toFixed(1)}%`);
    
    const comparison: PortfolioComparison = {
      userPortfolio: {
        totalValue: portfolioValue,
        expectedReturn: userFinalExpectedReturn,
        upside: userFinalUpside,     // INDEX VALS bull for 1yr, Monte Carlo 95th for multi-year
        downside: userFinalDownside, // INDEX VALS bear for 1yr, Monte Carlo 5th for multi-year
        positions: userPositions,
        topPositions: userTopPositions,
        isUsingProxy: isUsingProxy,
        proxyMessage: getProxyMessage(isUsingProxy)
      },
      timePortfolio: {
        totalValue: timePortfolioValue,
        expectedReturn: timeFinalExpectedReturn,
        upside: timeFinalUpside,     // Always Monte Carlo 95th percentile (best year)
        downside: timeFinalDownside, // Always Monte Carlo 5th percentile (worst year)
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
        timeHorizon,
        timePortfolioCached: useTimeCache
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
 * Convert a cumulative return over N years to an annualized return
 * Formula: (1 + totalReturn)^(1/years) - 1
 */
function annualizeReturn(cumulativeReturn: number, years: number): number {
  if (years <= 1) {
    return cumulativeReturn; // Already annualized
  }
  
  // Handle negative returns (losses)
  const growth = 1 + cumulativeReturn;
  const annualized = Math.pow(growth, 1 / years) - 1;
  
  console.log(`📊 Annualizing return: ${(cumulativeReturn * 100).toFixed(1)}% over ${years}yr → ${(annualized * 100).toFixed(1)}% annualized`);
  
  return annualized;
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

