/**
 * Kronos Score API - Enhanced with TIME Comparison
 * 
 * POST /api/kronos/score
 * 
 * Scores user portfolio AND TIME portfolio against scenario questions
 * Returns comparison metrics to demonstrate TIME's superiority
 */

import { NextRequest, NextResponse } from 'next/server';
import { scorePortfolio, mapTickerToKronosAssetClass } from '@/lib/kronos/scoring';
import type { Holding } from '@/lib/kronos/types';

// TIME Portfolio Holdings - the benchmark for comparison
// Total = 1.0 (40% broad market, 5% large cap, 5% large cap, 15% bonds, 35% alternatives/inflation hedge)
const TIME_PORTFOLIO_HOLDINGS: Holding[] = [
  { ticker: 'VTI', weight: 0.40, assetClass: 'us-large-cap' },      // 40%
  { ticker: 'TLT', weight: 0.20, assetClass: 'long-treasuries' },   // 20%
  { ticker: 'GLD', weight: 0.15, assetClass: 'gold' },               // 15%
  { ticker: 'DBC', weight: 0.10, assetClass: 'commodities' },        // 10%
  { ticker: 'BND', weight: 0.15, assetClass: 'aggregate-bonds' }    // 15%
];

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
    
    // Convert holdings to Kronos format
    const userHoldings: Holding[] = body.holdings.map(h => ({
      ticker: h.ticker,
      weight: h.weight,
      assetClass: h.assetClass || mapTickerToKronosAssetClass(h.ticker)
    }));
    
    console.log(`\n🎯 Kronos Score API Request:`);
    console.log(`Question: "${body.question}"`);
    console.log(`User Holdings: ${userHoldings.length} positions`);
    
    // Score user portfolio
    const userResult = await scorePortfolio(body.question, userHoldings);
    
    const response: ScoreResponse = {
      success: true,
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
      console.log(`\n🤖 Scoring TIME portfolio for comparison...`);
      
      try {
        const timeResult = await scorePortfolio(body.question, TIME_PORTFOLIO_HOLDINGS);
        
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
