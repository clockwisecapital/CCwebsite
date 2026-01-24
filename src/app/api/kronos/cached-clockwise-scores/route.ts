/**
 * Cached Clockwise Scores API
 * 
 * POST /api/kronos/cached-clockwise-scores
 * 
 * Returns pre-computed scores for all Clockwise portfolios for a given analog.
 * Falls back to on-demand computation if cache miss.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCachedClockwiseScores, CURRENT_CACHE_VERSION } from '@/lib/kronos/cache-utils';
import { scoreAssetAllocationPortfolio } from '@/lib/kronos/asset-allocation-scoring';
import { assetAllocationToHoldings } from '@/lib/kronos/asset-allocation-scoring';
import { ASSET_ALLOCATION_PORTFOLIOS } from '@/lib/clockwise-portfolios';
import { getHistoricalAnalogById } from '@/lib/kronos/constants';
import type { CachedPortfolioScore } from '@/lib/kronos/cache-types';

// =====================================================================================
// TYPES
// =====================================================================================

interface RequestBody {
  analogId: string;
  version?: number;
}

interface PortfolioScoreResponse {
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
  label: string;
  color: string;
  holdings: Array<{
    ticker: string;
    weight: number;
    assetClass: string;
  }>;
}

interface ResponseBody {
  success: boolean;
  portfolios?: PortfolioScoreResponse[];
  analogName?: string;
  analogPeriod?: string;
  source: 'cache' | 'computed';
  computeTimeMs?: number;
  error?: string;
}

// =====================================================================================
// FALLBACK: COMPUTE ON-DEMAND IF CACHE MISS
// =====================================================================================

async function computeClockwiseScoresOnDemand(
  analogId: string
): Promise<PortfolioScoreResponse[]> {
  console.log(`⚠️ Cache miss for ${analogId}, computing on-demand...`);

  const analog = getHistoricalAnalogById(analogId);
  if (!analog) {
    throw new Error(`Unknown analog: ${analogId}`);
  }

  const results: PortfolioScoreResponse[] = [];

  // Score all 4 portfolios in parallel
  const scorePromises = ASSET_ALLOCATION_PORTFOLIOS.map(async (portfolio) => {
    try {
      const scoreResult = await scoreAssetAllocationPortfolio(
        analogId, // Use analog ID as question
        portfolio.allocations,
        portfolio.name
      );

      const holdings = assetAllocationToHoldings(portfolio.allocations);

      return {
        id: portfolio.id,
        name: portfolio.name,
        score: scoreResult.score,
        expectedReturn: scoreResult.portfolioReturn,
        upside: scoreResult.portfolioReturn * 1.5,
        downside: scoreResult.portfolioDrawdown,
        portfolioReturn: scoreResult.portfolioReturn,
        benchmarkReturn: scoreResult.benchmarkReturn,
        outperformance: scoreResult.outperformance,
        portfolioDrawdown: scoreResult.portfolioDrawdown,
        benchmarkDrawdown: scoreResult.benchmarkDrawdown,
        returnScore: scoreResult.returnScore,
        drawdownScore: scoreResult.drawdownScore,
        label: scoreResult.label,
        color: scoreResult.color,
        holdings: holdings.map(h => ({
          ticker: h.ticker,
          weight: h.weight,
          assetClass: h.assetClass
        }))
      };
    } catch (error) {
      console.error(`Failed to compute ${portfolio.name}:`, error);
      throw error;
    }
  });

  const portfolioResults = await Promise.all(scorePromises);
  results.push(...portfolioResults);

  console.log(`✅ Computed ${results.length} portfolios on-demand`);
  return results;
}

// =====================================================================================
// TRANSFORM CACHED DATA TO RESPONSE FORMAT
// =====================================================================================

function transformCachedScore(cached: CachedPortfolioScore): PortfolioScoreResponse {
  return {
    id: cached.portfolio_id,
    name: cached.portfolio_name,
    score: cached.score,
    expectedReturn: cached.portfolio_return,
    upside: cached.estimated_upside || cached.portfolio_return * 1.5,
    downside: cached.estimated_downside || cached.portfolio_drawdown,
    portfolioReturn: cached.portfolio_return,
    benchmarkReturn: cached.benchmark_return,
    outperformance: cached.outperformance,
    portfolioDrawdown: cached.portfolio_drawdown,
    benchmarkDrawdown: cached.benchmark_drawdown,
    returnScore: cached.return_score,
    drawdownScore: cached.drawdown_score,
    label: cached.label,
    color: cached.color,
    holdings: cached.holdings
  };
}

// =====================================================================================
// MAIN HANDLER
// =====================================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ResponseBody>> {
  const startTime = Date.now();

  try {
    const body: RequestBody = await request.json();

    // Validate input
    if (!body.analogId || typeof body.analogId !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'analogId is required',
          source: 'computed'
        },
        { status: 400 }
      );
    }

    const analogId = body.analogId;
    const version = body.version || CURRENT_CACHE_VERSION;

    console.log(`\n🔍 Cached Clockwise Scores Request: ${analogId} (version ${version})`);

    // Get analog metadata
    const analog = getHistoricalAnalogById(analogId);
    if (!analog) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unknown analog: ${analogId}`,
          source: 'computed'
        },
        { status: 400 }
      );
    }

    // Try cache first
    const cacheResult = await getCachedClockwiseScores(analogId, version);

    let portfolios: PortfolioScoreResponse[];
    let source: 'cache' | 'computed';

    if (cacheResult.found && cacheResult.portfolios.length === 4) {
      // CACHE HIT
      portfolios = cacheResult.portfolios.map(transformCachedScore);
      source = 'cache';
      console.log(`✅ Returning cached scores (${portfolios.length} portfolios)`);
    } else {
      // CACHE MISS - Compute on-demand
      portfolios = await computeClockwiseScoresOnDemand(analogId);
      source = 'computed';
      
      // Note: We're not storing computed results back to cache here
      // because that requires admin permissions. The generate-cache script
      // should be run to populate cache properly.
      console.log(`✅ Returning computed scores (${portfolios.length} portfolios)`);
    }

    const computeTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      portfolios,
      analogName: analog.name,
      analogPeriod: `${analog.dateRange.start} to ${analog.dateRange.end}`,
      source,
      computeTimeMs
    });

  } catch (error) {
    console.error('❌ Cached Clockwise Scores error:', error);

    const computeTimeMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        source: 'computed',
        computeTimeMs
      },
      { status: 500 }
    );
  }
}
