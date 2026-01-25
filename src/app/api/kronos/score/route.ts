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

/**
 * Map scenario ID and analog name to analog ID for cache lookup
 */
function getAnalogIdFromScenarioId(scenarioId: string, analogName: string): string | null {
  // Try to extract from analog name first
  const analogLower = analogName.toLowerCase();
  if (analogLower.includes('covid')) return 'COVID_CRASH';
  if (analogLower.includes('dot-com') || analogLower.includes('dot com')) return 'DOT_COM_BUST';
  if (analogLower.includes('rate shock') || analogLower.includes('2022')) return 'RATE_SHOCK';
  if (analogLower.includes('stagflation') || analogLower.includes('1973')) return 'STAGFLATION';
  
  // Fallback to scenario ID mapping
  if (scenarioId === 'market-volatility') return 'COVID_CRASH';
  if (scenarioId === 'ai-supercycle' || scenarioId === 'tech-concentration') return 'DOT_COM_BUST';
  if (scenarioId === 'cash-vs-bonds') return 'RATE_SHOCK';
  if (scenarioId === 'inflation-hedge' || scenarioId === 'recession-risk') return 'STAGFLATION';
  
  return null;
}

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
        // Determine analog ID from user result
        const analogId = getAnalogIdFromScenarioId(userResult.scenarioId || '', userResult.analogName || '');
        
        // Try to get cached TIME score first
        let timeResult: any = null;
        let timePortfolioHoldings: Holding[] | null = null;
        
        if (analogId) {
          const { getCachedTimeAnalogScore } = await import('@/lib/services/time-portfolio-cache');
          const cachedScore = await getCachedTimeAnalogScore(analogId);
          
          if (cachedScore) {
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
              drawdownScore: cachedScore.drawdown_score
            };
            
            timePortfolioHoldings = cachedScore.holdings as Holding[];
          }
        }
        
        // If no cache hit, compute fresh
        if (!timeResult) {
          console.log(`⚠️ Cache miss, computing TIME portfolio score...`);
          timePortfolioHoldings = await getTimePortfolioHoldings();
          timeResult = await scorePortfolio(body.question, timePortfolioHoldings);
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
        // Determine analog ID from user result
        const analogId = getAnalogIdFromScenarioId(userResult.scenarioId || '', userResult.analogName || '');
        
        if (analogId) {
          console.log(`🔍 Looking up cached scores for analog: ${analogId}`);
          
          const { getCachedClockwiseScores } = await import('@/lib/kronos/cache-utils');
          const cacheResult = await getCachedClockwiseScores(analogId);
          
          if (cacheResult.found && cacheResult.portfolios.length > 0) {
            // Build clockwise portfolios array with TIME + cached portfolios
            (response as any).clockwisePortfolios = [
              {
                id: 'time',
                name: 'TIME Portfolio',
                score: response.timePortfolio?.score || 0,
                expectedReturn: response.timePortfolio?.portfolioReturn || 0,
                upside: (response.timePortfolio?.portfolioReturn || 0) * 1.5,
                downside: response.timePortfolio?.portfolioDrawdown || 0,
                holdings: response.timeHoldings || []
              },
              ...cacheResult.portfolios.map(p => ({
                id: p.portfolio_id,
                name: p.portfolio_name,
                score: p.score,
                expectedReturn: p.portfolio_return,
                upside: p.estimated_upside || p.portfolio_return * 1.5,
                downside: p.estimated_downside || p.portfolio_drawdown,
                holdings: p.holdings
              }))
            ];
            
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
