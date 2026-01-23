/**
 * Kronos Portfolio Scoring Engine - Core Scoring Logic
 * 
 * Implements the 5-step scoring algorithm:
 * 1. Map Question → Scenario
 * 2. Get Historical Analog
 * 3. Fetch Asset Returns
 * 4. Calculate Portfolio Return
 * 5. Calculate Score
 */

import type { ScenarioId, HistoricalAnalog, Holding, AssetReturns, ScoreResult, BenchmarkData } from './types';
import { mapTickerToKronosAssetClass as mapTickerSync } from './asset-class-mappings';
import {
  QUESTION_TO_SCENARIO,
  SCENARIO_TO_ANALOG,
  HISTORICAL_ANALOGS,
  DEFAULT_SCENARIO,
  DEFAULT_ANALOG,
  getScoreLabelForValue,
  getHistoricalAnalogById
} from './constants';
import {
  fetchAllAssetClassReturns,
  fetchSP500Benchmark,
  validateAssetReturns
} from './data-sources';
import {
  classifyQuestionWithAI,
  findHistoricalAnalogWithAI,
  isAIScoringAvailable,
  type AIScenarioClassification,
  type AIHistoricalAnalogMatch
} from './ai-scoring';

// =====================================================================================
// STEP 1: MAP QUESTION TO SCENARIO
// =====================================================================================

/**
 * Classify a user question into a scenario ID
 * Uses AI if available, falls back to keyword matching
 * 
 * @param question - User's question text
 * @param useAI - Whether to use AI classification (default: auto-detect)
 * @returns ScenarioId matching the question
 */
export async function mapQuestionToScenario(
  question: string,
  useAI: boolean = isAIScoringAvailable()
): Promise<ScenarioId> {
  // Try AI classification first if available
  if (useAI) {
    try {
      const aiClassification = await classifyQuestionWithAI(question);
      console.log(`✓ AI classified as: ${aiClassification.scenarioId} (${(aiClassification.confidence * 100).toFixed(0)}% confidence)`);
      return aiClassification.scenarioId;
    } catch (error) {
      console.warn('⚠️ AI classification failed, falling back to keyword matching:', error);
    }
  }
  
  // Fallback: Keyword matching
  const lowerQuestion = question.toLowerCase();
  
  // Check each scenario's keywords
  for (const [scenarioId, scenarioData] of Object.entries(QUESTION_TO_SCENARIO)) {
    for (const keyword of scenarioData.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        console.log(`✓ Keyword matched scenario: ${scenarioId} (keyword: "${keyword}")`);
        return scenarioId as ScenarioId;
      }
    }
  }
  
  // Default to market-volatility if no match
  console.log(`⚠️ No keyword match found, using default scenario: ${DEFAULT_SCENARIO}`);
  return DEFAULT_SCENARIO;
}

/**
 * Synchronous version of mapQuestionToScenario for backward compatibility
 * Only uses keyword matching
 */
export function mapQuestionToScenarioSync(question: string): ScenarioId {
  const lowerQuestion = question.toLowerCase();
  
  // Check each scenario's keywords
  for (const [scenarioId, scenarioData] of Object.entries(QUESTION_TO_SCENARIO)) {
    for (const keyword of scenarioData.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        console.log(`✓ Matched scenario: ${scenarioId} (keyword: "${keyword}")`);
        return scenarioId as ScenarioId;
      }
    }
  }
  
  // Default to market-volatility if no match
  console.log(`⚠️ No keyword match found, using default scenario: ${DEFAULT_SCENARIO}`);
  return DEFAULT_SCENARIO;
}

// =====================================================================================
// STEP 2: GET HISTORICAL ANALOG
// =====================================================================================

/**
 * Get the historical analog for a scenario
 * Uses AI if available to select based on current market conditions
 * 
 * @param scenarioId - The scenario ID
 * @param question - Original question (for AI context)
 * @param useAI - Whether to use AI selection (default: auto-detect)
 * @returns HistoricalAnalog with date range and metadata
 */
export async function getHistoricalAnalog(
  scenarioId: ScenarioId,
  question?: string,
  useAI: boolean = isAIScoringAvailable()
): Promise<{ analog: HistoricalAnalog; aiMatch?: AIHistoricalAnalogMatch }> {
  // Try AI analog selection if available and we have the question
  if (useAI && question) {
    try {
      const aiMatch = await findHistoricalAnalogWithAI(question, scenarioId);
      console.log(`✓ AI selected analog: ${aiMatch.analog.name} (${aiMatch.similarity}% similarity)`);
      return { analog: aiMatch.analog, aiMatch };
    } catch (error) {
      console.warn('⚠️ AI analog selection failed, falling back to default mapping:', error);
    }
  }
  
  // Fallback: Default scenario-to-analog mapping
  const analogId = SCENARIO_TO_ANALOG[scenarioId] || DEFAULT_ANALOG;
  const analog = getHistoricalAnalogById(analogId);
  
  if (!analog) {
    console.error(`Could not find analog for scenario ${scenarioId}, using default`);
    return { analog: getHistoricalAnalogById(DEFAULT_ANALOG)! };
  }
  
  console.log(`✓ Using mapped analog: ${analog.name} (${analog.dateRange.start} to ${analog.dateRange.end})`);
  return { analog };
}

/**
 * Synchronous version of getHistoricalAnalog for backward compatibility
 * Only uses default mapping
 */
export function getHistoricalAnalogSync(scenarioId: ScenarioId): HistoricalAnalog {
  const analogId = SCENARIO_TO_ANALOG[scenarioId] || DEFAULT_ANALOG;
  const analog = getHistoricalAnalogById(analogId);
  
  if (!analog) {
    console.error(`Could not find analog for scenario ${scenarioId}, using default`);
    return getHistoricalAnalogById(DEFAULT_ANALOG)!;
  }
  
  console.log(`✓ Using historical analog: ${analog.name} (${analog.dateRange.start} to ${analog.dateRange.end})`);
  return analog;
}

// =====================================================================================
// STEP 3: GET ASSET RETURNS
// =====================================================================================

/**
 * Fetch asset class returns for a historical analog period
 * 
 * @param analogId - Historical analog ID
 * @returns AssetReturns object with all asset class returns
 */
export async function getAssetReturns(analogId: string): Promise<AssetReturns> {
  const analog = getHistoricalAnalogById(analogId);
  
  if (!analog) {
    throw new Error(`Invalid analog ID: ${analogId}`);
  }
  
  // Fetch returns from Yahoo Finance
  const assetReturns = await fetchAllAssetClassReturns(analogId, analog.dateRange);
  
  // Validate the returns
  validateAssetReturns(assetReturns);
  
  return assetReturns;
}

// =====================================================================================
// STEP 4: CALCULATE PORTFOLIO RETURN
// =====================================================================================

/**
 * Map a ticker to a Kronos asset class (SYNC VERSION - for backward compatibility)
 * 
 * NOTE: This is the synchronous version that only uses static mappings.
 * For AI-powered classification, use mapTickerToKronosAssetClassAsync()
 * 
 * @param ticker - Stock/ETF ticker symbol
 * @returns Kronos asset class key
 */
export function mapTickerToKronosAssetClass(ticker: string): string {
  return mapTickerSync(ticker);
}

/**
 * Map a ticker to a Kronos asset class using AI classification
 * 
 * Uses 3-tier system:
 * 1. Static ETF mappings (instant)
 * 2. Database cache (fast)
 * 3. AI classification (slower, cached after first use)
 * 
 * @param ticker - Stock/ETF ticker symbol
 * @returns Promise<Kronos asset class key>
 */
export async function mapTickerToKronosAssetClassAsync(ticker: string): Promise<string> {
  // Import dynamically to avoid circular dependencies
  const { classifyTicker } = await import('./ticker-classifier');
  
  try {
    const classification = await classifyTicker(ticker);
    
    if (classification.confidence < 0.5) {
      console.warn(`⚠️ Low confidence (${(classification.confidence * 100).toFixed(0)}%) for ${ticker}, classified as ${classification.assetClass}`);
    }
    
    return classification.assetClass;
  } catch (error) {
    console.error(`❌ Error classifying ${ticker}:`, error);
    return mapTickerToKronosAssetClass(ticker); // Fallback to sync version
  }
}

/**
 * Calculate weighted portfolio return
 * 
 * @param holdings - Array of portfolio holdings with weights and asset classes
 * @param assetReturns - Historical returns for each asset class
 * @returns Portfolio return as decimal
 */
export function calculatePortfolioReturn(
  holdings: Holding[],
  assetReturns: AssetReturns
): number {
  // Validate weights sum to approximately 1.0
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  
  if (Math.abs(totalWeight - 1.0) > 0.01) {
    console.warn(`⚠️ Portfolio weights sum to ${totalWeight.toFixed(3)}, normalizing...`);
    // Normalize weights
    holdings = holdings.map(h => ({
      ...h,
      weight: h.weight / totalWeight
    }));
  }
  
  // Calculate weighted return: Σ(weight × assetReturn)
  let portfolioReturn = 0;
  const breakdown: Record<string, { weight: number; return: number; contribution: number }> = {};
  
  for (const holding of holdings) {
    const assetReturn = assetReturns[holding.assetClass];
    
    if (assetReturn === undefined) {
      // Use us-large-cap as fallback
      const fallbackReturn = assetReturns['us-large-cap'] || 0;
      console.warn(`⚠️ No return for ${holding.assetClass}, using us-large-cap: ${(fallbackReturn * 100).toFixed(2)}%`);
      const contribution = holding.weight * fallbackReturn;
      portfolioReturn += contribution;
      
      breakdown[holding.assetClass] = {
        weight: holding.weight,
        return: fallbackReturn,
        contribution
      };
    } else {
      const contribution = holding.weight * assetReturn;
      portfolioReturn += contribution;
      
      breakdown[holding.assetClass] = {
        weight: holding.weight,
        return: assetReturn,
        contribution
      };
    }
  }
  
  console.log(`✓ Portfolio return: ${(portfolioReturn * 100).toFixed(2)}%`);
  console.log('Breakdown:', Object.entries(breakdown).map(([ac, data]) => 
    `${ac}: ${(data.weight * 100).toFixed(1)}% × ${(data.return * 100).toFixed(2)}% = ${(data.contribution * 100).toFixed(2)}%`
  ).join(', '));
  
  return portfolioReturn;
}

// =====================================================================================
// STEP 5: CALCULATE SCORE
// =====================================================================================

/**
 * Estimate portfolio drawdown (simplified for MVP)
 * 
 * @param portfolioReturn - Portfolio period return
 * @returns Estimated max drawdown as positive decimal
 */
export function estimatePortfolioDrawdown(portfolioReturn: number): number {
  if (portfolioReturn < 0) {
    // For negative returns, estimate drawdown as 80% of the loss
    return Math.abs(portfolioReturn) * 0.8;
  } else {
    // For positive returns, assume small drawdown
    return 0.05; // 5% default
  }
}

/**
 * Calculate the final Kronos score (0-100)
 * 
 * @param portfolioReturn - Portfolio return during period
 * @param portfolioDrawdown - Portfolio max drawdown
 * @param benchmarkReturn - S&P 500 return
 * @param benchmarkDrawdown - S&P 500 max drawdown
 * @returns Score from 0-100
 */
export function calculateScore(
  portfolioReturn: number,
  portfolioDrawdown: number,
  benchmarkReturn: number,
  benchmarkDrawdown: number
): { score: number; returnScore: number; drawdownScore: number } {
  // Return Score: 50 + (outperformance × 2.0)
  const outperformance = portfolioReturn - benchmarkReturn;
  let returnScore = 50 + (outperformance * 100 * 2.0);
  returnScore = Math.max(0, Math.min(100, returnScore)); // Clamp 0-100
  
  // Drawdown Score: 50 + (protection × 2.0)
  const protection = benchmarkDrawdown - portfolioDrawdown;
  let drawdownScore = 50 + (protection * 100 * 2.0);
  drawdownScore = Math.max(0, Math.min(100, drawdownScore)); // Clamp 0-100
  
  // Final Score: Average of both components
  const finalScore = Math.round((returnScore * 0.5) + (drawdownScore * 0.5));
  
  console.log(`✓ Score components: Return=${returnScore.toFixed(1)}, Drawdown=${drawdownScore.toFixed(1)}, Final=${finalScore}`);
  
  return {
    score: finalScore,
    returnScore: Math.round(returnScore),
    drawdownScore: Math.round(drawdownScore)
  };
}

// =====================================================================================
// ORCHESTRATION: COMPLETE SCORING PIPELINE
// =====================================================================================

/**
 * Score a portfolio against a scenario question
 * This is the main entry point that orchestrates all 5 steps
 * 
 * @param question - User's scenario question
 * @param holdings - Portfolio holdings with weights and asset classes
 * @param useAI - Whether to use AI enhancements (default: auto-detect)
 * @returns Complete ScoreResult with all metrics
 */
export async function scorePortfolio(
  question: string,
  holdings: Holding[],
  useAI: boolean = isAIScoringAvailable()
): Promise<ScoreResult> {
  console.log(`\n🎯 Starting portfolio scoring for question: "${question}"`);
  console.log(`Portfolio: ${holdings.length} holdings`);
  console.log(`AI Enhancement: ${useAI ? 'ENABLED ✨' : 'DISABLED'}`);
  
  // Step 1: Map question to scenario (AI-enhanced)
  const scenarioId = await mapQuestionToScenario(question, useAI);
  
  // Step 2: Get historical analog (AI-enhanced)
  const { analog, aiMatch } = await getHistoricalAnalog(scenarioId, question, useAI);
  
  // Step 3: Fetch asset returns and benchmark
  console.log('\n📊 Fetching historical data...');
  const [assetReturns, benchmarkData] = await Promise.all([
    getAssetReturns(analog.id),
    fetchSP500Benchmark(analog.id, analog.dateRange)
  ]);
  
  // Step 4: Calculate portfolio return
  console.log('\n💼 Calculating portfolio return...');
  const portfolioReturn = calculatePortfolioReturn(holdings, assetReturns);
  const portfolioDrawdown = estimatePortfolioDrawdown(portfolioReturn);
  
  // Step 5: Calculate score
  console.log('\n🎲 Calculating score...');
  const { score, returnScore, drawdownScore } = calculateScore(
    portfolioReturn,
    portfolioDrawdown,
    benchmarkData.return,
    benchmarkData.drawdown
  );
  
  // Get score label and color
  const scoreLabel = getScoreLabelForValue(score);
  
  // Build result
  const result: ScoreResult = {
    score,
    label: scoreLabel.label,
    color: scoreLabel.color,
    scenarioId,
    scenarioName: QUESTION_TO_SCENARIO[scenarioId]?.primaryRisk || scenarioId,
    analogId: analog.id,
    analogName: analog.name,
    analogPeriod: `${analog.dateRange.start} to ${analog.dateRange.end}`,
    portfolioReturn,
    benchmarkReturn: benchmarkData.return,
    outperformance: portfolioReturn - benchmarkData.return,
    portfolioDrawdown,
    benchmarkDrawdown: benchmarkData.drawdown,
    returnScore,
    drawdownScore
  };
  
  // Add AI match data if available
  if (aiMatch) {
    console.log(`\n🤖 AI Enhancement Data:`);
    console.log(`   Similarity: ${aiMatch.similarity}%`);
    console.log(`   Matching Factors: ${aiMatch.matchingFactors.length}`);
    console.log(`   Reasoning: ${aiMatch.reasoning}`);
    
    // Extend result with AI data (stored in comparison_data in DB)
    (result as any).aiAnalysis = {
      similarity: aiMatch.similarity,
      matchingFactors: aiMatch.matchingFactors,
      keyEvents: aiMatch.keyEvents,
      reasoning: aiMatch.reasoning
    };
  }
  
  console.log(`\n✅ Scoring complete: ${score}/100 (${scoreLabel.label})`);
  console.log(`   Portfolio: ${(portfolioReturn * 100).toFixed(2)}% | Benchmark: ${(benchmarkData.return * 100).toFixed(2)}%`);
  console.log(`   Outperformance: ${(result.outperformance * 100).toFixed(2)}%\n`);
  
  return result;
}
