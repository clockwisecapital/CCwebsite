/**
 * Scenario Testing Types
 * 
 * Types for scenario questions, portfolios, and testing functionality
 */

export interface ScenarioQuestion {
  id: string;
  title: string;
  subtitle: string;
  question: string;
  icon: string; // Icon component name from react-icons
  stats: {
    percentageBadge: string;
    timePeriod: string;
    investorCount: number;
  };
  winningPortfolio: {
    name: string;
    score: number;
  };
}

export interface ScenarioPortfolio {
  id: string;
  name: string;
  subtitle: string;
  icon: string; // Icon component name from react-icons
  metrics: {
    votes: number;
    expectedReturn: number;
    timePeriod: string;
    score: number;
  };
}

export interface ScenarioComparison {
  questionId: string;
  portfolioId: string;
  userPortfolio: {
    name: string;
    startingValue: number;
    endingValue: number;
    expectedReturn: number;
    upside: number;
    downside: number;
    topPositions: Array<{
      ticker: string;
      name: string;
      percentage: number;
      expectedReturn: number;
      upside: number;
      downside: number;
    }>;
  };
  timePortfolio: {
    name: string;
    startingValue: number;
    endingValue: number;
    expectedReturn: number;
    upside: number;
    downside: number;
    topPositions: Array<{
      ticker: string;
      name: string;
      percentage: number;
      expectedReturn: number;
      upside: number;
      downside: number;
    }>;
  };
  scenarioScore: number;
}


