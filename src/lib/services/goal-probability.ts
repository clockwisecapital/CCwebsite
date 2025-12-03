/**
 * Goal Probability Calculation Service
 * 
 * Calculates probability of reaching financial goals using:
 * - Monte Carlo simulations with 12-month target prices (for specific holdings)
 * - Long-term historical averages (for asset class allocations)
 */

import type { MonteCarloResult } from '@/types/portfolio';
import type { IntakeFormData } from '@/components/features/portfolio/dashboard/PortfolioDashboard';

// Long-term historical average returns (nominal) provided by client
export const LONG_TERM_AVERAGES = {
  stocks: 0.10,      // 10%
  bonds: 0.05,       // 5%
  realEstate: 0.10,  // 10%
  commodities: 0.05, // 5%
  cash: 0.03,        // 3%
  alternatives: 0.08 // 8% (estimated blend)
} as const;

interface GoalProbabilityInput {
  currentAmount: number;           // Current portfolio value
  goalAmount: number;              // Target goal amount
  timeHorizon: number;             // Years to reach goal
  monthlyContribution: number;     // Monthly contribution
  portfolio: {
    stocks: number;                // Percentage
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    alternatives: number;
  };
  monteCarloResults?: Map<string, MonteCarloResult>; // Optional: for specific holdings
}

interface GoalProbabilityResult {
  probabilityOfSuccess: {
    median: number;     // 50th percentile
    upside: number;     // 95th percentile  
    downside: number;   // 5th percentile
  };
  projectedValues: {
    median: number;
    upside: number;
    downside: number;
  };
  shortfall: {
    median: number;
    upside: number;
    downside: number;
  };
  expectedReturn: number; // Weighted average expected return
}

/**
 * Calculate expected portfolio return based on asset allocation and long-term averages
 */
export function calculateExpectedReturn(portfolio: GoalProbabilityInput['portfolio']): number {
  const totalAllocation = 
    portfolio.stocks + 
    portfolio.bonds + 
    portfolio.cash + 
    portfolio.realEstate + 
    portfolio.commodities + 
    portfolio.alternatives;

  if (totalAllocation === 0) {
    return 0;
  }

  // Normalize if not exactly 100%
  const normalize = (value: number) => (value / totalAllocation) * 100;

  const weightedReturn = 
    (normalize(portfolio.stocks) / 100) * LONG_TERM_AVERAGES.stocks +
    (normalize(portfolio.bonds) / 100) * LONG_TERM_AVERAGES.bonds +
    (normalize(portfolio.cash) / 100) * LONG_TERM_AVERAGES.cash +
    (normalize(portfolio.realEstate) / 100) * LONG_TERM_AVERAGES.realEstate +
    (normalize(portfolio.commodities) / 100) * LONG_TERM_AVERAGES.commodities +
    (normalize(portfolio.alternatives) / 100) * LONG_TERM_AVERAGES.alternatives;

  return weightedReturn;
}

/**
 * Calculate future value with monthly contributions
 * Currently unused but kept for potential future use
 */
// function calculateFutureValue(
//   presentValue: number,
//   monthlyContribution: number,
//   annualReturn: number,
//   years: number
// ): number {
//   const monthlyRate = annualReturn / 12;
//   const months = years * 12;

//   // Future value of present amount
//   const fvPresent = presentValue * Math.pow(1 + monthlyRate, months);

//   // Future value of monthly contributions (annuity)
//   const fvContributions = monthlyContribution * 
//     ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

//   return fvPresent + fvContributions;
// }

/**
 * Run Monte Carlo simulation for goal probability
 * Returns projected values AND actual probability of reaching goal
 */
function runGoalMonteCarloSimulation(
  currentAmount: number,
  goalAmount: number,
  timeHorizon: number,
  monthlyContribution: number,
  expectedReturn: number,
  volatility: number = 0.15, // Default 15% annual volatility
  simulations: number = 10000
): { 
  median: number; 
  upside: number; 
  downside: number;
  probabilityOfSuccess: number; // Actual probability (% of simulations reaching goal)
} {
  const results: number[] = [];
  const monthlyReturn = expectedReturn / 12;
  const monthlyVolatility = volatility / Math.sqrt(12);
  const months = timeHorizon * 12;
  
  let successCount = 0; // Count simulations that reach the goal

  for (let sim = 0; sim < simulations; sim++) {
    let portfolioValue = currentAmount;

    for (let month = 0; month < months; month++) {
      // Add monthly contribution
      portfolioValue += monthlyContribution;

      // Apply random return (normal distribution)
      const randomReturn = randomNormal(monthlyReturn, monthlyVolatility);
      portfolioValue *= (1 + randomReturn);
    }

    results.push(portfolioValue);
    
    // Count if this simulation reached the goal
    if (portfolioValue >= goalAmount) {
      successCount++;
    }
  }

  // Sort to find percentiles
  results.sort((a, b) => a - b);
  
  // Calculate actual probability: # of successes / total simulations
  const probabilityOfSuccess = successCount / simulations;

  return {
    downside: results[Math.floor(simulations * 0.05)],
    median: results[Math.floor(simulations * 0.50)],
    upside: results[Math.floor(simulations * 0.95)],
    probabilityOfSuccess
  };
}

/**
 * Generate random number from normal distribution (Box-Muller transform)
 */
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Calculate probability of reaching goal
 * Uses actual Monte Carlo simulation counting (not ratio)
 */
export function calculateGoalProbability(input: GoalProbabilityInput): GoalProbabilityResult {
  // Calculate expected return based on asset allocation
  const expectedReturn = calculateExpectedReturn(input.portfolio);

  // Estimate volatility based on portfolio composition
  // Higher stock allocation = higher volatility
  const stockWeight = input.portfolio.stocks / 100;
  const bondWeight = input.portfolio.bonds / 100;
  const cashWeight = input.portfolio.cash / 100;
  const estimatedVolatility = 
    stockWeight * 0.18 +      // Stocks: 18% volatility
    bondWeight * 0.06 +       // Bonds: 6% volatility
    cashWeight * 0.01 +       // Cash: 1% volatility
    (1 - stockWeight - bondWeight - cashWeight) * 0.12; // Other: 12% volatility

  // Run Monte Carlo simulation - now returns actual probability
  const simulationResult = runGoalMonteCarloSimulation(
    input.currentAmount,
    input.goalAmount,
    input.timeHorizon,
    input.monthlyContribution,
    expectedReturn,
    estimatedVolatility
  );

  // Use actual probability from simulation (% of simulations that reached goal)
  // The median probability is the main figure - downside/upside show projected values context
  const probabilityOfSuccess = {
    // Main probability: actual % of simulations that reached goal
    median: simulationResult.probabilityOfSuccess,
    // For context: if you hit downside scenario, what % of goal would you reach?
    downside: Math.min(1.0, simulationResult.downside / input.goalAmount),
    // For context: if you hit upside scenario, what % of goal would you reach?
    upside: Math.min(1.0, simulationResult.upside / input.goalAmount)
  };
  
  console.log(`🎯 Goal Probability Calculation:`, {
    currentAmount: input.currentAmount,
    goalAmount: input.goalAmount,
    timeHorizon: input.timeHorizon,
    expectedReturn: (expectedReturn * 100).toFixed(1) + '%',
    volatility: (estimatedVolatility * 100).toFixed(1) + '%',
    actualProbability: (simulationResult.probabilityOfSuccess * 100).toFixed(1) + '%',
    projectedMedian: simulationResult.median,
    projectedDownside: simulationResult.downside,
    projectedUpside: simulationResult.upside
  });

  // Calculate shortfall (difference from goal)
  const shortfall = {
    downside: simulationResult.downside - input.goalAmount,
    median: simulationResult.median - input.goalAmount,
    upside: simulationResult.upside - input.goalAmount
  };

  return {
    probabilityOfSuccess,
    projectedValues: {
      median: simulationResult.median,
      downside: simulationResult.downside,
      upside: simulationResult.upside
    },
    shortfall,
    expectedReturn
  };
}

/**
 * Helper function to create input from IntakeFormData
 */
export function createGoalProbabilityInput(
  intakeData: IntakeFormData
): GoalProbabilityInput | null {
  // Validate required fields
  if (!intakeData.goalAmount || !intakeData.timeHorizon) {
    return null;
  }

  return {
    currentAmount: intakeData.portfolio.totalValue || 0,
    goalAmount: intakeData.goalAmount,
    timeHorizon: intakeData.timeHorizon,
    monthlyContribution: intakeData.monthlyContribution || 0,
    portfolio: {
      stocks: intakeData.portfolio.stocks,
      bonds: intakeData.portfolio.bonds,
      cash: intakeData.portfolio.cash,
      realEstate: intakeData.portfolio.realEstate,
      commodities: intakeData.portfolio.commodities,
      alternatives: intakeData.portfolio.alternatives
    }
  };
}

