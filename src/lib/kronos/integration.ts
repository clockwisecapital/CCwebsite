/**
 * Kronos Integration Helper
 * 
 * Bridges the gap between production UI and Kronos scoring engine
 * Handles data conversion and API calls
 */

import type { Holding } from './types';

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
    isUsingProxy: boolean;
    positions: any[];
    topPositions: any[];
  };
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
  
  try {
    // Fetch portfolio data from database
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('portfolio_data')
      .eq('id', portfolioId)
      .single();
    
    if (portfolioError || !portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }
    
    // Extract holdings from JSONB portfolio_data
    const portfolioData = portfolio.portfolio_data as any;
    
    if (!portfolioData) {
      throw new Error('Portfolio has no data');
    }
    
    // Check if portfolio has specific holdings with tickers
    if (!portfolioData.holdings || portfolioData.holdings.length === 0) {
      throw new Error(
        'Portfolio does not have specific holdings with ticker symbols. ' +
        'Please edit your portfolio to add specific stocks/ETFs to test against scenarios.'
      );
    }
    
    // Convert to Kronos format
    const holdings: PortfolioHolding[] = portfolioData.holdings.map((h: any) => ({
      ticker: h.ticker || h.symbol || h.name,
      weight: (h.weight !== undefined) ? h.weight : 
              (h.percentage !== undefined) ? (h.percentage / 100) : 
              (h.allocation !== undefined) ? h.allocation : 0,
      name: h.name || h.ticker || h.symbol,
      assetClass: h.assetClass || h.asset_class
    }));
    
    // Validate weights sum to approximately 1.0
    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.05) {
      console.warn(`Portfolio weights sum to ${totalWeight.toFixed(3)}, normalizing...`);
      // Normalize
      holdings.forEach(h => h.weight = h.weight / totalWeight);
    }
    
    return holdings;
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
 */
export function transformKronosToUIComparison(
  kronosResponse: KronosScoreResponse
): UIPortfolioComparison | null {
  if (!kronosResponse.userPortfolio || !kronosResponse.timePortfolio) {
    return null;
  }
  
  const userPortfolio = kronosResponse.userPortfolio;
  const timePortfolio = kronosResponse.timePortfolio;
  
  return {
    userPortfolio: {
      totalValue: 100000, // Placeholder - we don't have actual value
      expectedReturn: userPortfolio.portfolioReturn,
      upside: userPortfolio.portfolioReturn + (Math.abs(userPortfolio.portfolioReturn) * 1.5),
      downside: userPortfolio.portfolioDrawdown,
      score: userPortfolio.score,
      isUsingProxy: false,
      positions: [],
      topPositions: kronosResponse.userHoldings?.slice(0, 5).map(h => ({
        ticker: h.ticker,
        name: h.name || h.ticker,
        weight: h.weight * 100,
        expectedReturn: userPortfolio.portfolioReturn,
        monteCarlo: null
      })) || []
    },
    timePortfolio: {
      totalValue: 100000, // Placeholder
      expectedReturn: timePortfolio.portfolioReturn,
      upside: timePortfolio.portfolioReturn + (Math.abs(timePortfolio.portfolioReturn) * 1.5),
      downside: timePortfolio.portfolioDrawdown,
      score: timePortfolio.score,
      isUsingProxy: false,
      positions: [],
      topPositions: kronosResponse.timeHoldings?.slice(0, 5).map(h => ({
        ticker: h.ticker,
        name: h.name || h.ticker,
        weight: h.weight * 100,
        expectedReturn: timePortfolio.portfolioReturn,
        monteCarlo: null
      })) || []
    }
  };
}

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Complete flow: score portfolio and return UI-ready data
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
}> {
  // Score the portfolio
  const kronosResponse = await scorePortfolioById(portfolioId, question, true);
  
  // Transform to UI formats
  const testResult = transformKronosToUIResult(kronosResponse, portfolioName, questionTitle);
  const portfolioComparison = transformKronosToUIComparison(kronosResponse);
  
  return {
    testResult,
    portfolioComparison,
    kronosResponse
  };
}
