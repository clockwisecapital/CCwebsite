/**
 * Kronos Score Clockwise Portfolios API
 * 
 * POST /api/kronos/score-clockwise-portfolios
 * 
 * Scores all Clockwise portfolios (TIME + 4 asset-allocation portfolios) against a scenario question
 * Returns scores and metrics for each portfolio for comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { scorePortfolio } from '@/lib/kronos/scoring';
import { scoreAssetAllocationPortfolio } from '@/lib/kronos/asset-allocation-scoring';
import { getHoldingWeights } from '@/lib/supabase/database';
import { mapTickerToKronosAssetClassAsync } from '@/lib/kronos/scoring';
import {
  ASSET_ALLOCATION_PORTFOLIOS,
  type ClockwisePortfolio
} from '@/lib/clockwise-portfolios';
import type { Holding } from '@/lib/kronos/types';

// Fallback TIME Portfolio Holdings
const FALLBACK_TIME_PORTFOLIO: Holding[] = [
  { ticker: 'VTI', weight: 0.40, assetClass: 'us-large-cap' },
  { ticker: 'TLT', weight: 0.20, assetClass: 'long-treasuries' },
  { ticker: 'GLD', weight: 0.15, assetClass: 'gold' },
  { ticker: 'DBC', weight: 0.10, assetClass: 'commodities' },
  { ticker: 'BND', weight: 0.15, assetClass: 'aggregate-bonds' }
];

/**
 * Fetch TIME portfolio holdings from database
 */
async function getTimePortfolioHoldings(): Promise<Holding[]> {
  try {
    const holdingWeights = await getHoldingWeights();
    
    if (!holdingWeights || holdingWeights.length === 0) {
      console.warn('⚠️ No holdings found in database, using fallback');
      return FALLBACK_TIME_PORTFOLIO;
    }
    
    // Convert with AI classification
    const holdings: Holding[] = await Promise.all(
      holdingWeights.map(async (hw) => ({
        ticker: hw.stockTicker,
        weight: hw.weightings,
        assetClass: await mapTickerToKronosAssetClassAsync(hw.stockTicker)
      }))
    );
    
    // Normalize if needed
    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.05) {
      holdings.forEach(h => h.weight = h.weight / totalWeight);
    }
    
    return holdings;
  } catch (error) {
    console.error('❌ Error fetching TIME portfolio:', error);
    return FALLBACK_TIME_PORTFOLIO;
  }
}

interface ScoreClockwiseRequest {
  question: string;
}

interface PortfolioScore {
  id: string;
  name: string;
  score: number;
  expectedReturn: number;
  upside: number;
  downside: number;
  portfolioReturn: number;
  benchmarkReturn: number;
  outperformance: number;
  portfolioDrawdown: number;
  benchmarkDrawdown: number;
  returnScore: number;
  drawdownScore: number;
  holdings?: Array<{
    ticker: string;
    weight: number;
    assetClass: string;
  }>;
}

interface ScoreClockwiseResponse {
  success: boolean;
  portfolios?: PortfolioScore[];
  scenarioName?: string;
  analogName?: string;
  analogPeriod?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ScoreClockwiseResponse>> {
  try {
    const body: ScoreClockwiseRequest = await request.json();
    
    if (!body.question || typeof body.question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Question is required' },
        { status: 400 }
      );
    }
    
    console.log(`\n🎯 Scoring all Clockwise portfolios for: "${body.question}"`);
    
    const portfolioScores: PortfolioScore[] = [];
    let scenarioName: string | undefined;
    let analogName: string | undefined;
    let analogPeriod: string | undefined;
    
    // Score TIME Portfolio (from database holdings)
    try {
      console.log('\n📊 Scoring TIME Portfolio...');
      const timeHoldings = await getTimePortfolioHoldings();
      const timeResult = await scorePortfolio(body.question, timeHoldings);
      
      portfolioScores.push({
        id: 'time',
        name: 'TIME Portfolio',
        score: timeResult.score,
        expectedReturn: timeResult.portfolioReturn,
        upside: timeResult.portfolioReturn + 0.36, // +2 std devs (18% × 2)
        downside: timeResult.portfolioReturn - 0.36, // -2 std devs (18% × 2)
        portfolioReturn: timeResult.portfolioReturn,
        benchmarkReturn: timeResult.benchmarkReturn,
        outperformance: timeResult.outperformance,
        portfolioDrawdown: timeResult.portfolioDrawdown,
        benchmarkDrawdown: timeResult.benchmarkDrawdown,
        returnScore: timeResult.returnScore,
        drawdownScore: timeResult.drawdownScore,
        holdings: timeHoldings.map(h => ({
          ticker: h.ticker,
          weight: h.weight,
          assetClass: h.assetClass
        }))
      });
      
      // Store scenario info from first result
      scenarioName = timeResult.scenarioName;
      analogName = timeResult.analogName;
      analogPeriod = timeResult.analogPeriod;
      
      console.log(`✅ TIME Portfolio: ${timeResult.score}/100`);
    } catch (error) {
      console.error('❌ Failed to score TIME Portfolio:', error);
    }
    
    // Score asset-allocation portfolios in parallel
    console.log('\n📊 Scoring asset-allocation portfolios...');
    
    const allocationResults = await Promise.all(
      ASSET_ALLOCATION_PORTFOLIOS.map(async (portfolio: ClockwisePortfolio) => {
        try {
          const result = await scoreAssetAllocationPortfolio(
            body.question,
            portfolio.allocations,
            portfolio.name
          );
          
          // Store scenario info from first result if not already set
          if (!scenarioName) {
            scenarioName = result.scenarioName;
            analogName = result.analogName;
            analogPeriod = result.analogPeriod;
          }
          
          return {
            id: portfolio.id,
            name: portfolio.name,
            score: result.score,
            expectedReturn: result.portfolioReturn,
            upside: result.portfolioReturn + 0.36, // +2 std devs (18% × 2)
            downside: result.portfolioReturn - 0.36, // -2 std devs (18% × 2)
            portfolioReturn: result.portfolioReturn,
            benchmarkReturn: result.benchmarkReturn,
            outperformance: result.outperformance,
            portfolioDrawdown: result.portfolioDrawdown,
            benchmarkDrawdown: result.benchmarkDrawdown,
            returnScore: result.returnScore,
            drawdownScore: result.drawdownScore,
            holdings: [] // Asset allocation portfolios don't have specific holdings
          };
        } catch (error) {
          console.error(`❌ Failed to score ${portfolio.name}:`, error);
          return null;
        }
      })
    );
    
    // Add successful results
    allocationResults.forEach(result => {
      if (result) {
        portfolioScores.push(result);
        console.log(`✅ ${result.name}: ${result.score}/100`);
      }
    });
    
    if (portfolioScores.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to score any portfolios' },
        { status: 500 }
      );
    }
    
    console.log(`\n✅ Successfully scored ${portfolioScores.length} Clockwise portfolios\n`);
    
    return NextResponse.json({
      success: true,
      portfolios: portfolioScores,
      scenarioName,
      analogName,
      analogPeriod
    });
    
  } catch (error) {
    console.error('❌ Kronos score-clockwise-portfolios error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
      );
  }
}
