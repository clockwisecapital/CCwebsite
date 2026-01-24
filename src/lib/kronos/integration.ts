/**
 * Kronos Integration Helper
 * 
 * Bridges the gap between production UI and Kronos scoring engine
 * Handles data conversion and API calls
 */

import type { Holding } from './types';
import { runPortfolioMonteCarloSimulation, type AssetClass } from '@/lib/services/monte-carlo-portfolio';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PortfolioHolding {
  ticker: string;
  weight: number;
  name?: string;
  assetClass?: string;
}

export interface KronosScoreRequest {
  question: string;
  holdings: PortfolioHolding[];
  includeTimeComparison?: boolean;
}

export interface KronosScoreResponse {
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
  userPortfolio?: {
    score: number;
    label: string;
    color: string;
    portfolioReturn: number;
    benchmarkReturn: number;
    outperformance: number;
    portfolioDrawdown: number;
    benchmarkDrawdown: number;
    returnScore: number;
    drawdownScore: number;
  };
  timePortfolio?: {
    score: number;
    label: string;
    color: string;
    portfolioReturn: number;
    benchmarkReturn: number;
    outperformance: number;
    portfolioDrawdown: number;
    benchmarkDrawdown: number;
    returnScore: number;
    drawdownScore: number;
  };
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
  clockwisePortfolios?: Array<{
    id: string;
    name: string;
    score: number;
    expectedReturn: number;
    upside: number;
    downside: number;
    holdings: Array<{
      ticker: string;
      weight: number;
      name?: string;
      assetClass?: string;
    }>;
  }>;
  error?: string;
}

export interface UITestResult {
  score: number;
  expectedReturn: number;
  expectedUpside: number;
  expectedDownside: number;
  confidence: number;
  portfolioName: string;
  questionTitle: string;
  historicalPeriod?: {
    label: string;
    years: string;
  };
  historicalAnalog?: {
    period: string;
    similarity: number;
    matchingFactors: string[];
    cycleName?: string;
  };
}

export interface UIPortfolioComparison {
  userPortfolio: {
    totalValue: number;
    expectedReturn: number;
    upside: number;
    downside: number;
    score?: number;
    benchmarkReturn?: number;
    isUsingProxy: boolean;
    positions: any[];
    topPositions: any[];
  };
  timePortfolio: {
    totalValue: number;
    expectedReturn: number;
    upside: number;
    downside: number;
    score?: number;
    benchmarkReturn?: number;
    isUsingProxy: boolean;
    positions: any[];
    topPositions: any[];
  };
  clockwisePortfolios?: Array<{
    id: string;
    name: string;
    score: number;
    expectedReturn: number;
    upside: number;
    downside: number;
    holdings: Array<{
      ticker: string;
      weight: number;
      name?: string;
      assetClass?: string;
    }>;
  }>;
}

// ============================================================================
// PORTFOLIO CONVERSION
// ============================================================================

/**
 * Convert database portfolio holdings to Kronos format
 */
export async function getPortfolioHoldings(portfolioId: string): Promise<PortfolioHolding[]> {
  // Import here to avoid circular dependencies
  const { supabase } = await import('@/lib/supabase/client');
  const { extractHoldingsFromPortfolio } = await import('./portfolio-extractor');
  
  try {
    // Fetch portfolio data from database (including intake_data for proxy portfolios)
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, portfolio_data, intake_data, name')
      .eq('id', portfolioId)
      .single();
    
    if (portfolioError || !portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }
    
    if (!portfolio.portfolio_data) {
      throw new Error('Portfolio has no data');
    }
    
    // Use portfolio extractor to handle both specific holdings and proxy portfolios
    const holdings = extractHoldingsFromPortfolio(portfolio);
    
    // Convert to PortfolioHolding format expected by integration layer
    const portfolioHoldings: PortfolioHolding[] = holdings.map(h => ({
      ticker: h.ticker,
      weight: h.weight,
      name: h.ticker,
      assetClass: h.assetClass
    }));
    
    // Validate weights sum to approximately 1.0
    const totalWeight = portfolioHoldings.reduce((sum, h) => sum + h.weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.05) {
      console.warn(`Portfolio weights sum to ${totalWeight.toFixed(3)}, normalizing...`);
      // Normalize
      portfolioHoldings.forEach(h => h.weight = h.weight / totalWeight);
    }
    
    console.log(`✅ Extracted ${portfolioHoldings.length} holdings from portfolio ${portfolio.name || portfolioId}`);
    
    return portfolioHoldings;
  } catch (error) {
    console.error('Error fetching portfolio holdings:', error);
    throw error;
  }
}

// ============================================================================
// KRONOS API CALLS
// ============================================================================

/**
 * Score a portfolio against a scenario question using Kronos engine
 */
export async function scorePortfolioWithKronos(
  question: string,
  holdings: PortfolioHolding[],
  includeTimeComparison: boolean = true
): Promise<KronosScoreResponse> {
  try {
    const response = await fetch('/api/kronos/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        holdings,
        includeTimeComparison
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to score portfolio');
    }
    
    const result: KronosScoreResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Scoring failed');
    }
    
    return result;
  } catch (error) {
    console.error('Kronos API error:', error);
    throw error;
  }
}

/**
 * Score a portfolio by ID
 */
export async function scorePortfolioById(
  portfolioId: string,
  question: string,
  includeTimeComparison: boolean = true
): Promise<KronosScoreResponse> {
  const holdings = await getPortfolioHoldings(portfolioId);
  return scorePortfolioWithKronos(question, holdings, includeTimeComparison);
}

// ============================================================================
// RESPONSE TRANSFORMATION
// ============================================================================

/**
 * Transform Kronos response to UI test result format
 */
export function transformKronosToUIResult(
  kronosResponse: KronosScoreResponse,
  portfolioName: string,
  questionTitle: string
): UITestResult {
  if (!kronosResponse.userPortfolio) {
    throw new Error('No user portfolio data in Kronos response');
  }
  
  const userPortfolio = kronosResponse.userPortfolio;
  
  // Calculate confidence based on score and data quality
  const confidence = Math.min(95, 70 + (userPortfolio.score / 100) * 25);
  
  return {
    score: userPortfolio.score,
    expectedReturn: userPortfolio.portfolioReturn,
    expectedUpside: userPortfolio.portfolioReturn + (Math.abs(userPortfolio.portfolioReturn) * 1.5), // Estimate
    expectedDownside: userPortfolio.portfolioDrawdown,
    confidence: Math.round(confidence),
    portfolioName,
    questionTitle,
    historicalPeriod: kronosResponse.analogPeriod ? {
      label: kronosResponse.analogName || 'Historical Period',
      years: kronosResponse.analogPeriod
    } : undefined,
    historicalAnalog: kronosResponse.analogName ? {
      period: kronosResponse.analogPeriod || 'Unknown',
      similarity: 85, // We don't have this in current response, estimate
      matchingFactors: kronosResponse.comparison?.insights || [],
      cycleName: kronosResponse.analogName
    } : undefined
  };
}

/**
 * Transform Kronos response to UI portfolio comparison format
 * Runs Monte Carlo simulations for both portfolios based on scenario returns
 */
export function transformKronosToUIComparison(
  kronosResponse: KronosScoreResponse
): UIPortfolioComparison | null {
  if (!kronosResponse.userPortfolio || !kronosResponse.timePortfolio) {
    return null;
  }
  
  const userPortfolio = kronosResponse.userPortfolio;
  const timePortfolio = kronosResponse.timePortfolio;
  
  // Helper to map asset class strings to AssetClass type
  const mapToAssetClass = (assetClass?: string): AssetClass => {
    if (!assetClass) return 'stocks';
    const lower = assetClass.toLowerCase();
    if (lower.includes('bond')) return 'bonds';
    if (lower.includes('gold') || lower.includes('commodit')) return 'commodities';
    if (lower.includes('real') && lower.includes('estate')) return 'realEstate';
    if (lower.includes('cash')) return 'cash';
    return 'stocks';
  };
  
  // Run Monte Carlo for USER portfolio based on scenario return
  const userMC = runPortfolioMonteCarloSimulation(
    kronosResponse.userHoldings?.map(h => ({
      weight: h.weight,
      year1Return: userPortfolio.portfolioReturn,  // Scenario-based return from Kronos
      year1Volatility: 0.18, // Required by interface, not used in calculation
      assetClass: mapToAssetClass(h.assetClass)
    })) || [],
    1 // 1-year horizon for scenario testing
  );
  
  // Run Monte Carlo for TIME portfolio based on scenario return
  const timeMC = runPortfolioMonteCarloSimulation(
    kronosResponse.timeHoldings?.map(h => ({
      weight: h.weight,
      year1Return: timePortfolio.portfolioReturn,  // Scenario-based return from Kronos
      year1Volatility: 0.18,
      assetClass: mapToAssetClass(h.assetClass)
    })) || [],
    1
  );
  
  return {
    userPortfolio: {
      totalValue: 100000, // Placeholder - we don't have actual value
      expectedReturn: userPortfolio.portfolioReturn,
      upside: userMC.upside,        // Real Monte Carlo 95th percentile
      downside: userMC.downside,    // Real Monte Carlo 5th percentile
      score: userPortfolio.score,
      benchmarkReturn: userPortfolio.benchmarkReturn,
      isUsingProxy: false,
      positions: [],
      topPositions: kronosResponse.userHoldings?.slice(0, 5).map(h => ({
        ticker: h.ticker,
        name: h.name || h.ticker,
        weight: h.weight * 100,
        currentPrice: 0,
        targetPrice: null,
        expectedReturn: userPortfolio.portfolioReturn,
        monteCarlo: {
          ticker: h.ticker,
          median: userPortfolio.portfolioReturn,
          upside: userMC.upside,      // Portfolio-level upside
          downside: userMC.downside,  // Portfolio-level downside
          volatility: userMC.volatility,
          simulations: 5000
        }
      })) || []
    },
    timePortfolio: {
      totalValue: 100000, // Placeholder
      expectedReturn: timePortfolio.portfolioReturn,
      upside: timeMC.upside,        // Real Monte Carlo 95th percentile
      downside: timeMC.downside,    // Real Monte Carlo 5th percentile
      score: timePortfolio.score,
      benchmarkReturn: timePortfolio.benchmarkReturn,
      isUsingProxy: false,
      positions: [],
      topPositions: kronosResponse.timeHoldings?.slice(0, 5).map(h => ({
        ticker: h.ticker,
        name: h.name || h.ticker,
        weight: h.weight * 100,
        currentPrice: 0,
        targetPrice: null,
        expectedReturn: timePortfolio.portfolioReturn,
        monteCarlo: {
          ticker: h.ticker,
          median: timePortfolio.portfolioReturn,
          upside: timeMC.upside,      // Portfolio-level upside
          downside: timeMC.downside,  // Portfolio-level downside
          volatility: timeMC.volatility,
          simulations: 5000
        }
      })) || []
    },
    clockwisePortfolios: kronosResponse.clockwisePortfolios || []
  };
}

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Complete flow: score portfolio and return UI-ready data
 * Now uses cached Clockwise portfolio scores for fast results
 */
export async function runScenarioTest(
  portfolioId: string,
  portfolioName: string,
  question: string,
  questionTitle: string
): Promise<{
  testResult: UITestResult;
  portfolioComparison: UIPortfolioComparison | null;
  kronosResponse: KronosScoreResponse;
  clockwisePortfolios?: any[];
}> {
  console.log('\n🎯 Running scenario test with cached Clockwise portfolios...');
  
  // Score the user portfolio (includes TIME portfolio comparison + cached Clockwise portfolios)
  const kronosResponse = await scorePortfolioById(portfolioId, question, true);
  
  // Use clockwise portfolios from Kronos response (already includes TIME + cached portfolios)
  const clockwisePortfolios = kronosResponse.clockwisePortfolios || [];
  
  console.log(`✅ Using ${clockwisePortfolios.length} portfolios from Kronos response (includes TIME + Clockwise)`);
  
  // Transform to UI formats
  const testResult = transformKronosToUIResult(kronosResponse, portfolioName, questionTitle);
  const portfolioComparison = transformKronosToUIComparison(kronosResponse);
  
  // Add Clockwise portfolios to comparison if we have them
  if (portfolioComparison && clockwisePortfolios.length > 0) {
    portfolioComparison.clockwisePortfolios = clockwisePortfolios;
    console.log(`📊 Added ${clockwisePortfolios.length} portfolios to comparison data`);
  }
  
  return {
    testResult,
    portfolioComparison,
    kronosResponse,
    clockwisePortfolios
  };
}

/**
 * Helper: Extract analog ID from Kronos response
 * Maps analog names back to IDs for cache lookup
 */
function getAnalogIdFromScenarioResponse(response: KronosScoreResponse): string | null {
  const analogName = response.analogName?.toLowerCase() || '';
  
  // Map analog names to IDs
  if (analogName.includes('covid')) return 'COVID_CRASH';
  if (analogName.includes('dot-com') || analogName.includes('dot com')) return 'DOT_COM_BUST';
  if (analogName.includes('rate shock') || analogName.includes('2022')) return 'RATE_SHOCK';
  if (analogName.includes('stagflation') || analogName.includes('1973')) return 'STAGFLATION';
  
  // Fallback: try to extract from scenario ID if available
  if (response.scenarioId) {
    const scenarioId = response.scenarioId;
    if (scenarioId === 'market-volatility') return 'COVID_CRASH';
    if (scenarioId === 'ai-supercycle' || scenarioId === 'tech-concentration') return 'DOT_COM_BUST';
    if (scenarioId === 'cash-vs-bonds') return 'RATE_SHOCK';
    if (scenarioId === 'inflation-hedge' || scenarioId === 'recession-risk') return 'STAGFLATION';
  }
  
  console.warn(`⚠️ Could not determine analog ID from response:`, {
    analogName: response.analogName,
    scenarioId: response.scenarioId
  });
  
  return null;
}
