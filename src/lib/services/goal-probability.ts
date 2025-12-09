/**
 * Goal Probability Calculation Service
 * 
 * Calculates probability of reaching financial goals using:
 * - Monte Carlo simulations with 12-month target prices (for specific holdings)
 * - Long-term historical averages (for asset class allocations)
 * - Optional cycle-adjusted returns (based on current market cycle phases)
 */

import type { MonteCarloResult } from '@/types/portfolio';
import type { IntakeFormData } from '@/components/features/portfolio/dashboard/PortfolioDashboard';

// Long-term historical average returns (REAL - inflation-adjusted)
// Based on 100+ years of historical data (Ibbotson/Morningstar)
// NOTE: These are the BASELINE returns - can be adjusted by cycle phases
export const LONG_TERM_AVERAGES: CycleAdjustedAverages = {
  stocks: 0.07,      // 7% real (vs 10% nominal)
  bonds: 0.02,       // 2% real (vs 5% nominal)
  realEstate: 0.05,  // 5% real
  commodities: 0.01, // 1% real
  cash: 0.00,        // 0% real (matches inflation)
  alternatives: 0.05 // 5% real (blend of alternatives)
};

// Type for cycle-adjusted returns (allows any number value)
export interface CycleAdjustedAverages {
  stocks: number;
  bonds: number;
  realEstate: number;
  commodities: number;
  cash: number;
  alternatives: number;
}

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
  year1Return?: number;            // Optional: Year 1 return from user's holdings
  monteCarloResults?: Map<string, MonteCarloResult>; // Optional: for specific holdings
  cycleAdjustedReturns?: CycleAdjustedAverages;      // Optional: cycle-adjusted returns
  volatilityMultiplier?: number;                      // Optional: cycle-based volatility adjustment
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
 * Calculate expected portfolio return based on asset allocation
 * 
 * @param portfolio - Portfolio allocation percentages
 * @param returnAverages - Returns to use (defaults to LONG_TERM_AVERAGES, can be cycle-adjusted)
 */
export function calculateExpectedReturn(
  portfolio: GoalProbabilityInput['portfolio'],
  returnAverages: CycleAdjustedAverages = LONG_TERM_AVERAGES
): number {
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
    (normalize(portfolio.stocks) / 100) * returnAverages.stocks +
    (normalize(portfolio.bonds) / 100) * returnAverages.bonds +
    (normalize(portfolio.cash) / 100) * returnAverages.cash +
    (normalize(portfolio.realEstate) / 100) * returnAverages.realEstate +
    (normalize(portfolio.commodities) / 100) * returnAverages.commodities +
    (normalize(portfolio.alternatives) / 100) * returnAverages.alternatives;

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
 * 
 * Year 1: Uses user's holdings-specific return (from FactSet/Clockwise targets)
 * Years 2+: Uses asset class weighted long-term averages
 * 
 * Returns projected values AND actual probability of reaching goal
 */
function runGoalMonteCarloSimulation(
  currentAmount: number,
  goalAmount: number,
  timeHorizon: number,
  monthlyContribution: number,
  year1Return: number,           // Year 1 return from user's holdings
  longTermReturn: number,        // Years 2+ asset class average
  volatility: number = 0.15,
  simulations: number = 10000
): { 
  median: number; 
  upside: number; 
  downside: number;
  probabilityOfSuccess: number;
} {
  const results: number[] = [];
  const monthlyVolatility = volatility / Math.sqrt(12);
  const months = timeHorizon * 12;
  
  let successCount = 0;

  for (let sim = 0; sim < simulations; sim++) {
    let portfolioValue = currentAmount;

    for (let month = 0; month < months; month++) {
      // Add monthly contribution
      portfolioValue += monthlyContribution;

      // Year 1 (months 0-11): Use user's holdings-specific return
      // Years 2+ (months 12+): Use asset class long-term return
      const year = Math.floor(month / 12);
      const annualReturn = year === 0 ? year1Return : longTermReturn;
      const monthlyReturn = annualReturn / 12;

      // Apply random return (normal distribution)
      const randomReturn = randomNormal(monthlyReturn, monthlyVolatility);
      portfolioValue *= (1 + randomReturn);
    }

    results.push(portfolioValue);
    
    if (portfolioValue >= goalAmount) {
      successCount++;
    }
  }

  results.sort((a, b) => a - b);
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
 * 
 * Year 1: Uses user's holdings return (if provided), otherwise asset class average
 * Years 2+: Uses cycle-adjusted returns (if provided) or long-term averages
 * 
 * @param input - Goal probability input including optional cycle adjustments
 */
export function calculateGoalProbability(input: GoalProbabilityInput): GoalProbabilityResult {
  // Use cycle-adjusted returns if provided, otherwise use baseline LONG_TERM_AVERAGES
  const returnAverages = input.cycleAdjustedReturns || LONG_TERM_AVERAGES;
  
  // Long-term return from asset allocation (for Years 2+)
  // Now uses cycle-adjusted returns if available
  const longTermReturn = calculateExpectedReturn(input.portfolio, returnAverages);

  // Year 1 return: use provided value from user's holdings, or fall back to long-term
  const year1Return = input.year1Return ?? longTermReturn;

  // Volatility from asset class weights (same for all years)
  const stockWeight = input.portfolio.stocks / 100;
  const bondWeight = input.portfolio.bonds / 100;
  const cashWeight = input.portfolio.cash / 100;
  let estimatedVolatility = 
    stockWeight * 0.18 +      // Stocks: 18% volatility
    bondWeight * 0.06 +       // Bonds: 6% volatility
    cashWeight * 0.01 +       // Cash: 1% volatility
    (1 - stockWeight - bondWeight - cashWeight) * 0.12; // Other: 12% volatility

  // Apply cycle-based volatility adjustment if provided
  if (input.volatilityMultiplier) {
    estimatedVolatility *= input.volatilityMultiplier;
  }

  // Run Monte Carlo with Year 1 vs Years 2+ distinction
  const simulationResult = runGoalMonteCarloSimulation(
    input.currentAmount,
    input.goalAmount,
    input.timeHorizon,
    input.monthlyContribution,
    year1Return,              // Year 1: user's holdings or asset class
    longTermReturn,           // Years 2+: cycle-adjusted or baseline average
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
  
  const usingCycleAdjusted = !!input.cycleAdjustedReturns;
  console.log(`🎯 Goal Probability Calculation${usingCycleAdjusted ? ' (CYCLE-ADJUSTED)' : ''}:`, {
    currentAmount: input.currentAmount,
    goalAmount: input.goalAmount,
    timeHorizon: input.timeHorizon,
    year1Return: (year1Return * 100).toFixed(1) + '%',
    longTermReturn: (longTermReturn * 100).toFixed(1) + '%' + (usingCycleAdjusted ? ' (cycle-adjusted)' : ''),
    volatility: (estimatedVolatility * 100).toFixed(1) + '%' + (input.volatilityMultiplier ? ` (${input.volatilityMultiplier.toFixed(2)}x multiplier)` : ''),
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
    expectedReturn: longTermReturn  // Cycle-adjusted or baseline average
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

