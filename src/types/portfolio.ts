/**
 * Portfolio Analysis Types
 * 
 * Types for portfolio comparison, target prices, and Monte Carlo simulations
 */

export interface TgtPrice {
  ticker: string;
  consensusTgtPrice: number;
}

export interface HoldingWeight {
  stockTicker: string;
  securityName: string;
  shares: number;
  price: number;
  marketValue: number;
  weightings: number;
}

export interface MonteCarloResult {
  ticker: string;
  median: number;          // 50th percentile of final returns (annualized)
  upside: number;          // Max Gain: 95th percentile of best 12-month returns
  downside: number;        // Max Loss: 5th percentile of worst 12-month returns
  volatility: number;      // Annualized volatility
  simulations: number;     // Number of simulations run
}

export interface PositionAnalysis {
  ticker: string;
  name: string;
  weight: number;                    // Portfolio weight percentage
  currentPrice: number;
  targetPrice: number | null;
  expectedReturn: number | null;     // (CurrentPrice - TgtPrice) / CurrentPrice
  monteCarlo: MonteCarloResult | null;
  isProxy?: boolean;                 // True if using representative ETF
  assetClass?: string;               // Original asset class (for proxy positions)
}

export interface PortfolioComparison {
  userPortfolio: {
    totalValue: number;
    expectedReturn: number;           // Blended weighted average (Year 1 FactSet + Years 2+ long-term)
    upside: number;                   // Portfolio-level 95th percentile annual return (diversified)
    downside: number;                 // Portfolio-level 5th percentile annual return (diversified)
    positions: PositionAnalysis[];
    topPositions: PositionAnalysis[];  // Top 5 by weight
    isUsingProxy: boolean;            // True if using representative ETFs
    proxyMessage?: string;            // Message explaining proxy usage
  };
  timePortfolio: {
    totalValue: number;
    expectedReturn: number;           // Blended weighted average (Year 1 FactSet + Years 2+ long-term)
    upside: number;                   // Portfolio-level 95th percentile annual return (diversified)
    downside: number;                 // Portfolio-level 5th percentile annual return (diversified)
    positions: PositionAnalysis[];
    topPositions: PositionAnalysis[];  // Top 5 by weight
  };
  timeHorizon?: number;               // Time horizon in years (for display labels)
}

export interface YahooFinanceQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketTime: number;
}

export interface HistoricalPrice {
  date: string;
  close: number;
}

export interface PriceUpdateResult {
  ticker: string;
  oldPrice: number | null;
  newPrice: number;
  success: boolean;
  error?: string;
}

