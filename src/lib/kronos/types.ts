/**
 * Kronos Portfolio Scoring Engine - Type Definitions
 * 
 * Defines all TypeScript interfaces for the scoring system
 */

// =====================================================================================
// SCENARIO TYPES
// =====================================================================================

export type ScenarioId = 
  | 'market-volatility'
  | 'ai-supercycle'
  | 'cash-vs-bonds'
  | 'tech-concentration'
  | 'inflation-hedge'
  | 'recession-risk';

export interface ScenarioKeywords {
  keywords: string[];
  primaryRisk: string;
}

// =====================================================================================
// HISTORICAL ANALOG TYPES
// =====================================================================================

export interface HistoricalAnalog {
  id: string;
  name: string;
  dateRange: {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
  };
  description?: string;
}

export interface HistoricalPeriod {
  analogId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

// =====================================================================================
// PORTFOLIO TYPES
// =====================================================================================

export interface Holding {
  ticker: string;
  weight: number;      // Decimal (0.30 = 30%)
  assetClass: string;  // Maps to Kronos asset class keys
}

export interface PortfolioAllocation {
  stocks?: number;
  bonds?: number;
  cash?: number;
  realEstate?: number;
  commodities?: number;
  alternatives?: number;
}

// =====================================================================================
// ASSET RETURN TYPES
// =====================================================================================

export type KronosAssetClass = 
  | 'us-large-cap'
  | 'us-growth'
  | 'us-value'
  | 'us-small-cap'
  | 'international'
  | 'emerging-markets'
  | 'tech-sector'
  | 'healthcare'
  | 'financials'
  | 'energy'
  | 'long-treasuries'
  | 'intermediate-treasuries'
  | 'short-treasuries'
  | 'tips'
  | 'aggregate-bonds'
  | 'corporate-ig'
  | 'high-yield'
  | 'gold'
  | 'commodities'
  | 'cash';

export interface AssetReturns {
  [assetClass: string]: number; // Decimal return (-0.339 = -33.9%)
}

// =====================================================================================
// SCORING TYPES
// =====================================================================================

export interface ScoreResult {
  score: number;                    // 0-100
  label: string;                    // 'Excellent', 'Strong', 'Moderate', 'Weak'
  color: string;                    // Hex color code
  scenarioId: ScenarioId;
  scenarioName: string;
  analogId: string;
  analogName: string;
  analogPeriod: string;             // Display string like "Feb-Mar 2020"
  portfolioReturn: number;          // Decimal
  benchmarkReturn: number;          // SPY ETF return
  outperformance: number;           // portfolioReturn - benchmarkReturn
  portfolioDrawdown: number;        // Estimated drawdown
  benchmarkDrawdown: number;        // SPY ETF max drawdown
  returnScore: number;              // Return component (0-100)
  drawdownScore: number;            // Drawdown component (0-100)
  breakdown?: {
    [assetClass: string]: {
      weight: number;
      return: number;
      contribution: number;
    };
  };
}

export interface ScoreLabel {
  label: string;
  color: string;
  minScore: number;
  maxScore: number;
}

// =====================================================================================
// BENCHMARK TYPES
// =====================================================================================

export interface BenchmarkData {
  return: number;      // Period return as decimal
  drawdown: number;    // Max drawdown as decimal (positive number)
}

// =====================================================================================
// DATA SOURCE TYPES
// =====================================================================================

export interface AssetClassETFMapping {
  [assetClass: string]: string; // Asset class → ETF ticker
}

export interface PriceData {
  date: string;
  close: number;
}

export interface HistoricalReturnCache {
  [key: string]: number; // `${analogId}:${assetClass}` → return
}
