/**
 * Kronos Score API - Enhanced with TIME Comparison
 * 
 * POST /api/kronos/score
 * 
 * Scores user portfolio AND TIME portfolio against scenario questions
 * Returns comparison metrics to demonstrate TIME's superiority
 */

import { NextRequest, NextResponse } from 'next/server';
import { scorePortfolio, mapTickerToKronosAssetClass, mapTickerToKronosAssetClassAsync } from '@/lib/kronos/scoring';
import { getHoldingWeights } from '@/lib/supabase/database';
import type { Holding } from '@/lib/kronos/types';

// =====================================================================================
// HELPER FUNCTIONS
// =====================================================================================


// REMOVED: getAnalogIdFromScenarioId
// This function was DANGEROUS - it guessed analog IDs from pattern matching
// Bug example: "Post-COVID Era" matched "covid" → returned COVID_CRASH (WRONG!)
// Now we use ScoreResult.analogId directly which is authoritative and accurate

// Fallback TIME Portfolio Holdings - used if database fetch fails
const FALLBACK_TIME_PORTFOLIO: Holding[] = [
  { ticker: 'VTI', weight: 0.40, assetClass: 'us-large-cap' },      // 40%
  { ticker: 'TLT', weight: 0.20, assetClass: 'long-treasuries' },   // 20%
  { ticker: 'GLD', weight: 0.15, assetClass: 'gold' },               // 15%
  { ticker: 'DBC', weight: 0.10, assetClass: 'commodities' },        // 10%
  { ticker: 'BND', weight: 0.15, assetClass: 'aggregate-bonds' }    // 15%
];

/**
 * Fetch the real TIME portfolio from Supabase holding_weights table
 * Uses AI-powered ticker classification for accurate asset class mapping
 */
async function getTimePortfolioHoldings(): Promise<Holding[]> {
  try {
    console.log('📊 Fetching TIME portfolio from database...');
    const holdingWeights = await getHoldingWeights();
    
    if (!holdingWeights || holdingWeights.length === 0) {
      console.warn('⚠️ No holdings found in database, using fallback');
      return FALLBACK_TIME_PORTFOLIO;
    }
    
    console.log(`🤖 Classifying ${holdingWeights.length} tickers with AI...`);
    
    // Convert database format to Kronos format with AI classification
    const holdings: Holding[] = await Promise.all(
      holdingWeights.map(async (hw) => ({
        ticker: hw.stockTicker,
        weight: hw.weightings, // Already a decimal (e.g., 0.40 for 40%)
        assetClass: await mapTickerToKronosAssetClassAsync(hw.stockTicker)
      }))
    );
    
    // Validate weights sum to approximately 1.0
    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.05) {
      console.warn(`⚠️ TIME portfolio weights sum to ${totalWeight.toFixed(3)}, normalizing...`);
      // Normalize weights
      holdings.forEach(h => h.weight = h.weight / totalWeight);
    }
    
    console.log(`✅ Loaded TIME portfolio: ${holdings.length} positions (total weight: ${totalWeight.toFixed(3)})`);
    
    // Group by asset class for summary
    const assetClassSummary = holdings.reduce((acc, h) => {
      acc[h.assetClass] = (acc[h.assetClass] || 0) + h.weight;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 Asset class allocation:');
    Object.entries(assetClassSummary)
      .sort(([, a], [, b]) => b - a)
      .forEach(([assetClass, weight]) => {
        console.log(`   ${assetClass}: ${(weight * 100).toFixed(2)}%`);
      });
    
    return holdings;
  } catch (error) {
    console.error('❌ Error fetching TIME portfolio from database:', error);
    console.warn('⚠️ Using fallback TIME portfolio');
    return FALLBACK_TIME_PORTFOLIO;
  }
}

interface ScoreRequest {
  question: string;
  holdings: Array<{
    ticker: string;
    weight: number;
    assetClass?: string;
  }>;
  includeTimeComparison?: boolean;
}

interface ScoreResponse {
  success: boolean;
  userHoldings?: Array<{
    ticker: string;
    weight: number;
    name?: string;
    assetClass?: string;
  }>;
  timeHoldings?: Array<{
    ticker: string;
    weight: number;
    name?: string;
    assetClass?: string;
  }>;
  userPortfolio?: any;
  timePortfolio?: any;
  comparison?: {
    scoreDifference: number;
    returnDifference: number;
    drawdownImprovement: number;
    timeIsWinner: boolean;
    insights: string[];
  };
  scenarioId?: string;
  scenarioName?: string;
  analogName?: string;
  analogPeriod?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ScoreResponse>> {
  try {
    // Parse request body
    const body: ScoreRequest = await request.json();
    
    // Validate required fields
    if (!body.question || typeof body.question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Question is required' },
        { status: 400 }
      );
    }
    
    if (!body.holdings || !Array.isArray(body.holdings) || body.holdings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Holdings array is required and must not be empty' },
        { status: 400 }
      );
    }
    
    // Validate holdings
    for (const holding of body.holdings) {
      if (!holding.ticker || typeof holding.ticker !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each holding must have a ticker' },
          { status: 400 }
        );
      }
      
      if (typeof holding.weight !== 'number' || holding.weight < 0 || holding.weight > 1) {
        return NextResponse.json(
          { success: false, error: 'Each holding weight must be a number between 0 and 1' },
          { status: 400 }
        );
      }
    }
    
    // Check weights sum to approximately 1.0
    const totalWeight = body.holdings.reduce((sum, h) => sum + h.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.05) {
      return NextResponse.json(
        { success: false, error: `Holdings weights must sum to 1.0 (currently ${totalWeight.toFixed(3)})` },
        { status: 400 }
      );
    }
    
    // Convert holdings to Kronos format with AI classification
    const userHoldings: Holding[] = await Promise.all(
      body.holdings.map(async (h) => ({
        ticker: h.ticker,
        weight: h.weight,
        assetClass: h.assetClass || await mapTickerToKronosAssetClassAsync(h.ticker)
      }))
    );
    
    console.log(`\n🎯 Kronos Score API Request:`);
    console.log(`Question: "${body.question}"`);
    console.log(`User Holdings: ${userHoldings.length} positions`);
    
    // Score user portfolio
    const userResult = await scorePortfolio(body.question, userHoldings);
    
    const response: ScoreResponse = {
      success: true,
      userHoldings: userHoldings.map(h => ({
        ticker: h.ticker,
        weight: h.weight,
        name: h.ticker,
        assetClass: h.assetClass
      })),
      userPortfolio: {
        score: userResult.score,
        label: userResult.label,
        color: userResult.color,
        portfolioReturn: userResult.portfolioReturn,
        benchmarkReturn: userResult.benchmarkReturn,
        outperformance: userResult.outperformance,
        portfolioDrawdown: userResult.portfolioDrawdown,
        benchmarkDrawdown: userResult.benchmarkDrawdown,
        returnScore: userResult.returnScore,
        drawdownScore: userResult.drawdownScore
      },
      scenarioId: userResult.scenarioId,
      scenarioName: userResult.scenarioName,
      analogName: userResult.analogName,
      analogPeriod: userResult.analogPeriod
    };
    
    // Optionally score TIME portfolio for comparison (default: yes)
    if (body.includeTimeComparison !== false) {
      console.log(`\n🤖 Fetching TIME portfolio comparison...`);
      
      try {
        // Use the actual analog ID from user result (not guessed!)
        const analogId = userResult.analogId;
        
        console.log(`📊 User portfolio was scored against analog: ${analogId} (${userResult.analogName})`);
        
        // Try to get cached TIME score first
        let timeResult: any = null;
        let timePortfolioHoldings: Holding[] | null = null;
        
        if (analogId) {
          const { getCachedTimeAnalogScore } = await import('@/lib/services/time-portfolio-cache');
          const cachedScore = await getCachedTimeAnalogScore(analogId);
          
          if (cachedScore) {
            console.log(`✅ Cache HIT: TIME × ${analogId} (score: ${cachedScore.score}/100)`);
            console.log(`✅ Using cached TIME score for ${analogId}`);
            timeResult = {
              score: cachedScore.score,
              label: cachedScore.label,
              color: cachedScore.color,
              portfolioReturn: cachedScore.portfolio_return,
              benchmarkReturn: cachedScore.benchmark_return,
              outperformance: cachedScore.outperformance,
              portfolioDrawdown: cachedScore.portfolio_drawdown,
              benchmarkDrawdown: cachedScore.benchmark_drawdown,
              returnScore: cachedScore.return_score,
              drawdownScore: cachedScore.drawdown_score,
              analogId: analogId,
              analogName: userResult.analogName,
              analogPeriod: userResult.analogPeriod
            };
            
            timePortfolioHoldings = cachedScore.holdings as Holding[];
          } else {
            console.log(`⚠️ Cache MISS: No cached TIME score for ${analogId}`);
          }
        }
        
        // If no cache hit, compute fresh (and use same analog as user!)
        if (!timeResult) {
          console.log(`🔄 Computing fresh TIME portfolio score for ${analogId}...`);
          timePortfolioHoldings = await getTimePortfolioHoldings();
          // Pass the same analogId to ensure consistency!
          timeResult = await scorePortfolio(body.question, timePortfolioHoldings, analogId);
        }
        
        response.timeHoldings = (timePortfolioHoldings || []).map(h => ({
          ticker: h.ticker,
          weight: h.weight,
          name: h.ticker,
          assetClass: h.assetClass
        }));
        
        response.timePortfolio = {
          score: timeResult.score,
          label: timeResult.label,
          color: timeResult.color,
          portfolioReturn: timeResult.portfolioReturn,
          benchmarkReturn: timeResult.benchmarkReturn,
          outperformance: timeResult.outperformance,
          portfolioDrawdown: timeResult.portfolioDrawdown,
          benchmarkDrawdown: timeResult.benchmarkDrawdown,
          returnScore: timeResult.returnScore,
          drawdownScore: timeResult.drawdownScore
        };
        
        // Calculate comparison metrics
        const scoreDiff = timeResult.score - userResult.score;
        const returnDiff = timeResult.portfolioReturn - userResult.portfolioReturn;
        const drawdownDiff = userResult.portfolioDrawdown - timeResult.portfolioDrawdown;
        
        const insights: string[] = [];
        
        if (scoreDiff > 0) {
          insights.push(`TIME scores ${scoreDiff.toFixed(0)} points higher in stress test`);
        }
        
        if (returnDiff > 0) {
          insights.push(`TIME delivers +${(returnDiff * 100).toFixed(2)}% more return`);
        }
        
        if (drawdownDiff > 0) {
          insights.push(`TIME reduces risk by ${((drawdownDiff / userResult.portfolioDrawdown) * 100).toFixed(0)}%`);
        }
        
        if (insights.length === 0) {
          insights.push('Both portfolios perform similarly in this scenario');
        }
        
        response.comparison = {
          scoreDifference: scoreDiff,
          returnDifference: returnDiff,
          drawdownImprovement: drawdownDiff,
          timeIsWinner: scoreDiff > 0 || returnDiff > 0 || drawdownDiff > 0,
          insights
        };
        
        console.log(`✅ TIME Portfolio Score: ${timeResult.score}/100`);
        console.log(`📊 Comparison: ${insights.join(' | ')}`);
      } catch (error) {
        console.warn('⚠️ TIME portfolio scoring failed, returning user score only', error);
      }
      
      // Fetch cached Clockwise portfolios (fast lookup!)
      console.log(`\n📊 Fetching cached Clockwise portfolios...`);
      try {
        // Use the actual analog ID from user result (ensures consistency!)
        const analogId = userResult.analogId;
        
        if (analogId) {
          console.log(`🔍 Looking up cached scores for analog: ${analogId} (matches user portfolio scoring)`);
          
          const { getCachedClockwiseScores } = await import('@/lib/kronos/cache-utils');
          const cacheResult = await getCachedClockwiseScores(analogId);
          
          if (cacheResult.found && cacheResult.portfolios.length > 0) {
            // Build clockwise portfolios array with TIME + cached portfolios
            // NOTE: upside/downside should come from Monte Carlo simulation
            // For cached portfolios without Monte Carlo, we use ROUGH estimates:
            // - upside = portfolioReturn + 2*volatility (best case)
            // - downside = portfolioReturn - 2*volatility (worst case)
            const timeUpside = (response.timePortfolio?.portfolioReturn || 0) + (0.18 * 2); // +2 std devs
            const timeDownside = (response.timePortfolio?.portfolioReturn || 0) - (0.18 * 2); // -2 std devs
            
            (response as any).clockwisePortfolios = [
              {
                id: 'time',
                name: 'TIME Portfolio',
                score: response.timePortfolio?.score || 0,
                expectedReturn: response.timePortfolio?.portfolioReturn || 0,
                upside: timeUpside,
                downside: timeDownside,
                holdings: response.timeHoldings || []
              },
              ...cacheResult.portfolios.map(p => {
                // For cached portfolios, estimate upside/downside properly
                const portfolioUpside = p.portfolio_return + (0.18 * 2);  // +2 std devs
                const portfolioDownside = p.portfolio_return - (0.18 * 2);  // -2 std devs
                
                // VALIDATION: Ensure upside >= downside
                if (portfolioUpside < portfolioDownside) {
                  console.error(`❌ BUG: ${p.portfolio_name} has upside (${portfolioUpside.toFixed(4)}) < downside (${portfolioDownside.toFixed(4)})`);
                }
                
                return {
                  id: p.portfolio_id,
                  name: p.portfolio_name,
                  score: p.score,
                  expectedReturn: p.portfolio_return,
                  upside: portfolioUpside,
                  downside: portfolioDownside,
                  holdings: p.holdings
                };
              })
            ];
            
            // VALIDATION: Ensure TIME portfolio upside >= downside
            if (timeUpside < timeDownside) {
              console.error(`❌ BUG: TIME Portfolio has upside (${timeUpside.toFixed(4)}) < downside (${timeDownside.toFixed(4)})`);
            }
            
            console.log(`✅ Loaded ${cacheResult.portfolios.length} Clockwise portfolios from ${cacheResult.source} (TIME + cached)`);
          } else {
            console.warn(`⚠️ Cache miss for ${analogId}, skipping Clockwise portfolios`);
          }
        } else {
          console.warn('⚠️ Could not determine analog ID, skipping Clockwise portfolios');
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch cached Clockwise portfolios', error);
      }
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Kronos scoring error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
