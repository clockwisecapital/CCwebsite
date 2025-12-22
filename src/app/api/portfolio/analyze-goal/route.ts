import { NextRequest, NextResponse } from 'next/server';
import { 
  createGoalProbabilityInput, 
  calculateGoalProbability, 
  calculateExpectedReturn,
  LONG_TERM_AVERAGES
} from '@/lib/services/goal-probability';
import { calculateYear1Return } from '@/lib/services/year1-return';
import { getIndexSectorTargets, getTgtPrices, getIndexScenarioReturns } from '@/lib/supabase/database';
import { fetchBatchCurrentPrices } from '@/lib/services/monte-carlo';

// ============================================================================
// ASSET CLASS INFERENCE (same as get-portfolio-data)
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
  // Short/Inverse ETFs
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
  'DBC': 'commodities', 'DBA': 'commodities', 'NEM': 'commodities',
  // Cash/Money Market
  'SGOV': 'cash', 'BIL': 'cash', 'SHV': 'cash', 'FGXXX': 'cash',
};

function getAssetClassForTicker(ticker: string): AssetClassKey {
  return KNOWN_ASSET_CLASS_TICKERS[ticker.toUpperCase()] || 'stocks';
}

interface HoldingWithPercentage {
  ticker?: string;
  percentage?: number;
}

function inferAllocationFromHoldings(
  holdings: HoldingWithPercentage[]
): { stocks: number; bonds: number; cash: number; realEstate: number; commodities: number; alternatives: number } {
  const allocation = { stocks: 0, bonds: 0, cash: 0, realEstate: 0, commodities: 0, alternatives: 0 };
  for (const holding of holdings) {
    if (holding.ticker && holding.percentage) {
      const assetClass = getAssetClassForTicker(holding.ticker);
      allocation[assetClass] += holding.percentage;
    }
  }
  return allocation;
}

/**
 * Fast Goal Analysis Endpoint
 * 
 * This endpoint provides quick goal probability analysis WITHOUT waiting for
 * the full cycle analysis. It uses long-term asset class averages for projections.
 * 
 * Called first to show Goal tab quickly while cycles load in background.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { intakeData } = await request.json();
    
    console.log('🎯 Fast Goal Analysis starting...');
    
    // Validate required fields
    if (!intakeData) {
      return NextResponse.json(
        { success: false, error: 'Missing intakeData' },
        { status: 400 }
      );
    }

    // Get portfolio values
    const totalValue = intakeData.portfolio?.totalValue || 0;
    const goalAmount = intakeData.goalAmount || 1000000;
    const timeHorizon = intakeData.timeHorizon || 10;
    const monthlyContribution = intakeData.monthlyContribution || 0;
    
    if (totalValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Portfolio value must be greater than 0' },
        { status: 400 }
      );
    }

    // ✅ INFER ALLOCATION FROM HOLDINGS if needed
    const hasSpecificHoldings = intakeData.specificHoldings && 
                               intakeData.specificHoldings.length > 0 &&
                               intakeData.specificHoldings.some((h: { ticker?: string }) => h.ticker && h.ticker.trim().length > 0);
    
    // Calculate expected return from asset allocation
    let portfolio = intakeData.portfolio || {
      stocks: 60,
      bonds: 30,
      cash: 5,
      realEstate: 5,
      commodities: 0,
      alternatives: 0
    };
    
    // Check if allocation is all zeros and we have specific holdings
    if (hasSpecificHoldings) {
      const allocationTotal = (portfolio.stocks || 0) + (portfolio.bonds || 0) + 
                              (portfolio.cash || 0) + (portfolio.realEstate || 0) + 
                              (portfolio.commodities || 0) + (portfolio.alternatives || 0);
      
      if (allocationTotal === 0) {
        console.log('📊 Fast Goal: Inferring allocation from specific holdings...');
        const inferredAllocation = inferAllocationFromHoldings(intakeData.specificHoldings);
        portfolio = { ...portfolio, ...inferredAllocation };
        // Also update intakeData.portfolio for createGoalProbabilityInput
        intakeData.portfolio = { ...intakeData.portfolio, ...inferredAllocation };
        console.log('📊 Fast Goal: Inferred allocation:', inferredAllocation);
      }
    }
    
    const expectedReturn = calculateExpectedReturn(portfolio);
    
    // ============================================================================
    // CALCULATE YEAR 1 RETURN FROM USER'S HOLDINGS
    // ============================================================================
    let year1Return: number | undefined = undefined;
    const factsetReturnsMap = new Map<string, number>();
    
    if (hasSpecificHoldings && intakeData.specificHoldings && intakeData.specificHoldings.length > 0) {
      try {
        const tickers = intakeData.specificHoldings
          .filter((h: { ticker?: string }) => h.ticker && h.ticker.trim().length > 0)
          .map((h: { ticker: string }) => h.ticker.toUpperCase());
        
        if (tickers.length > 0) {
          // Fetch required data in parallel
          const [currentPrices, factsetTargets, clockwiseTargets] = await Promise.all([
            fetchBatchCurrentPrices(tickers),
            getTgtPrices(tickers),
            getIndexSectorTargets()
          ]);
          
          // Calculate Year 1 return for each holding
          let totalWeight = 0;
          let weightedYear1Return = 0;
          
          for (const holding of intakeData.specificHoldings) {
            if (holding.ticker && holding.percentage) {
              const ticker = holding.ticker.toUpperCase();
              const weight = holding.percentage / 100;
              const currentPrice = currentPrices.get(ticker);
              const factsetTarget = factsetTargets.get(ticker);
              
              // Skip if no current price available
              if (!currentPrice) {
                console.warn(`⚠️ No current price for ${ticker}, skipping Year 1 calculation`);
                continue;
              }
              
              // Calculate Year 1 return using the same logic as portfolio
              const holdingYear1Result = await calculateYear1Return(
                ticker,
                currentPrice,
                factsetTarget || null,
                clockwiseTargets,
                currentPrices  // For underlying index prices (shorts)
              );
              
              // Store individual Year 1 return for scenario calculation
              factsetReturnsMap.set(ticker, holdingYear1Result.return);
              
              weightedYear1Return += holdingYear1Result.return * weight;
              totalWeight += weight;
              
              console.log(`📊 Year 1 for ${ticker}: ${(holdingYear1Result.return * 100).toFixed(1)}% (weight: ${(weight * 100).toFixed(1)}%)`);
            }
          }
          
          if (totalWeight > 0) {
            year1Return = weightedYear1Return / totalWeight;
            console.log(`📊 Calculated Year 1 Return for holdings: ${(year1Return * 100).toFixed(1)}%`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not calculate Year 1 return from holdings, using asset class average:', error);
        // Falls back to longTermReturn in calculateGoalProbability
      }
    }

    // ============================================================================
    // FETCH SCENARIO RETURNS FOR BULL/BASE/BEAR CALCULATIONS
    // ============================================================================
    let scenarioReturns: Map<string, {bull: number, expected: number, bear: number}> | undefined = undefined;
    try {
      scenarioReturns = await getIndexScenarioReturns();
      console.log(`📊 Loaded ${scenarioReturns.size} ETF scenarios`);
    } catch (error) {
      console.error('❌ Failed to fetch scenario returns:', error);
      // Continue without scenarios - will fall back to Monte Carlo
    }

    // Get holdings for weighted calculations
    let holdings = intakeData.specificHoldings?.filter((h: any) => h.ticker && h.percentage) || undefined;
    
    // ============================================================================
    // CREATE SYNTHETIC HOLDINGS IF NO SPECIFIC HOLDINGS PROVIDED
    // ============================================================================
    // Use proxy ETFs (SPY, AGG, VNQ, GLD) based on allocation to enable scenario calculations
    if (!holdings || holdings.length === 0) {
      const syntheticHoldings = [];
      
      if (portfolio.stocks > 0) {
        syntheticHoldings.push({ ticker: 'SPY', percentage: portfolio.stocks, weight: portfolio.stocks });
      }
      if (portfolio.bonds > 0) {
        syntheticHoldings.push({ ticker: 'AGG', percentage: portfolio.bonds, weight: portfolio.bonds });
      }
      if (portfolio.realEstate > 0) {
        syntheticHoldings.push({ ticker: 'VNQ', percentage: portfolio.realEstate, weight: portfolio.realEstate });
      }
      if (portfolio.commodities > 0) {
        syntheticHoldings.push({ ticker: 'GLD', percentage: portfolio.commodities, weight: portfolio.commodities });
      }
      // Note: Cash and alternatives don't have proxy ETFs in scenario data
      
      if (syntheticHoldings.length > 0) {
        holdings = syntheticHoldings;
        console.log('📊 Created synthetic holdings for scenario calculation:', 
          syntheticHoldings.map(h => `${h.ticker}: ${h.percentage}%`).join(', '));
      }
    }

    console.log('📊 Goal analysis inputs:', {
      totalValue,
      goalAmount,
      timeHorizon,
      monthlyContribution,
      expectedReturn: (expectedReturn * 100).toFixed(1) + '%',
      year1Return: year1Return !== undefined ? (year1Return * 100).toFixed(1) + '%' : 'using long-term',
      allocation: portfolio
    });

    // Create input for goal probability calculation - now with Year 1 return and scenario data
    const probabilityInput = createGoalProbabilityInput(
      intakeData, 
      year1Return,
      scenarioReturns,
      holdings,
      undefined,  // no monteCarloResults in fast analysis
      factsetReturnsMap  // FactSet Year 1 returns for individual stocks
    );
    
    let goalAnalysis;
    
    if (probabilityInput) {
      // Full Monte Carlo calculation
      goalAnalysis = calculateGoalProbability(probabilityInput);
    } else {
      // Fallback calculation
      console.warn('⚠️ Using fallback goal calculation');
      const projectedValue = totalValue * Math.pow(1 + expectedReturn, timeHorizon);
      const successProbability = Math.min(1, Math.max(0, projectedValue / goalAmount));
      
      goalAnalysis = {
        probabilityOfSuccess: {
          median: successProbability,
          downside: successProbability * 0.6,
          upside: Math.min(1, successProbability * 1.4),
        },
        projectedValues: {
          median: projectedValue,
          downside: projectedValue * 0.6,
          upside: projectedValue * 1.4,
        },
        shortfall: {
          median: projectedValue - goalAmount,
          downside: (projectedValue * 0.6) - goalAmount,
          upside: (projectedValue * 1.4) - goalAmount,
        },
        expectedReturn
      };
    }

    // Generate recommendation based on probability
    const successProbability = goalAnalysis.probabilityOfSuccess.median;
    let recommendation = '';
    
    if (successProbability >= 0.9) {
      recommendation = 'Your goal is highly achievable with your current portfolio and timeline (using nominal returns). Consider if you want to take on less risk or aim higher.';
    } else if (successProbability >= 0.7) {
      recommendation = 'You have a strong chance of reaching your goal based on nominal returns. Staying consistent with contributions will improve your odds.';
    } else if (successProbability >= 0.5) {
      recommendation = 'Your goal is achievable but not certain (using nominal projections). Consider increasing contributions or extending your timeline.';
    } else if (successProbability >= 0.3) {
      recommendation = 'Reaching your goal will be challenging based on nominal returns. You may need to increase contributions, extend timeline, or adjust your target.';
    } else {
      recommendation = 'Your goal may be difficult to achieve with current parameters (using nominal projections). Consider consulting with an advisor to explore options.';
    }

    // Build complete goal analysis result
    const result = {
      goalAmount,
      goalDescription: intakeData.goalDescription || 'Financial Goal',
      currentAmount: totalValue,
      timeHorizon,
      monthlyContribution,
      probabilityOfSuccess: goalAnalysis.probabilityOfSuccess,
      projectedValues: goalAnalysis.projectedValues,
      shortfall: goalAnalysis.shortfall,
      expectedReturn: goalAnalysis.expectedReturn,
      recommendation
    };

    const elapsed = Date.now() - startTime;
    console.log(`✅ Fast Goal Analysis completed in ${elapsed}ms`, {
      probability: (successProbability * 100).toFixed(1) + '%',
      projectedMedian: goalAnalysis.projectedValues.median
    });

    return NextResponse.json({
      success: true,
      goalAnalysis: result,
      timing: elapsed
    });

  } catch (error) {
    console.error('❌ Fast Goal Analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Goal analysis failed' 
      },
      { status: 500 }
    );
  }
}

