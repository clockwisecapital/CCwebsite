// Types for AI-powered Cycle Analysis

export interface CycleAnalysisResult {
  cycles: {
    country: CycleData;
    technology: CycleData;
    economic: CycleData;
    business: CycleData;
    market: CycleData;
    company: CycleData;
  };
  
  portfolioAnalysis: {
    current: PortfolioSimulation;
  };
  
  goalAnalysis: GoalAnalysis;
}

export interface CycleData {
  name: string;                    // "Country Cycle"
  phase: string;                   // "Late-Crisis"
  phasePercent: number;            // 78 (for dial - 78% through cycle)
  averageLifecycle: string;        // "80-100 years"
  currentCycleStart: string;       // "1946 (Post-WWII)"
  
  timeline: Array<{
    phase: string;                 // "High", "Awakening", "Unraveling", "Crisis"
    description: string;           // Brief description
    startPercent: number;          // 0, 25, 50, 75
    endPercent: number;            // 25, 50, 75, 100
    isCurrent: boolean;            // Is this the current phase?
  }>;
  
  sp500Backtest: {
    expectedUpside: number;        // 95th percentile (e.g., 0.24 = 24%)
    expectedDownside: number;      // 5th percentile (e.g., -0.15 = -15%)
    expectedReturn: number;        // Median (e.g., 0.08 = 8%)
  };
  
  historicalAnalog: {
    period: string;                // "1945-1950"
    description: string;           // AI-generated description
    similarity: string;            // "High similarity" or percentage
    keyEvents: string[];           // ["Post-WWII rebuilding", "GI Bill expansion"]
  };
  
  frameworks: string[];            // List of frameworks used in analysis
}

export interface PortfolioSimulation {
  totalValue: number;
  
  // Monte Carlo results for EACH cycle
  cycleResults: {
    country: MonteCarloResult;
    technology: MonteCarloResult;
    economic: MonteCarloResult;
    business: MonteCarloResult;
    market: MonteCarloResult;
    company: MonteCarloResult;
  };
  
  // Overall weighted average
  overall: MonteCarloResult;
}

export interface MonteCarloResult {
  expectedUpside: number;          // 95th percentile
  expectedDownside: number;        // 5th percentile  
  expectedReturn: number;          // Median (50th percentile)
  maxDrawdown?: number;            // Optional: worst drawdown
  confidence: string;              // "High", "Medium", "Low"
}

export interface GoalAnalysis {
  goalAmount: number;              // From intake form
  goalDescription: string;         // From intake form
  currentAmount: number;           // Current portfolio value
  timeHorizon: number;             // Years (from intake)
  monthlyContribution?: number;    // If applicable from intake
  
  probabilityOfSuccess: {
    median: number;                // 0.72 = 72% chance
    downside: number;              // 0.45 = 45% chance (5th percentile)
    upside: number;                // 0.95 = 95% chance (95th percentile)
  };
  
  projectedValues: {
    median: number;                // Projected value at median
    downside: number;              // Projected value at 5th percentile
    upside: number;                // Projected value at 95th percentile
  };
  
  shortfall: {
    median: number;                // Dollars short/over at median
    downside: number;              // Dollars short at 5th percentile
    upside: number;                // Dollars over at 95th percentile
  };
  
  recommendation: string;          // AI-generated recommendation
}
