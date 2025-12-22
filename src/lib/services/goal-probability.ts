/**
 * Goal Probability Calculation Service
 * 
 * Calculates probability of reaching financial goals using:
 * - Monte Carlo simulations with 12-month target prices (for specific holdings)
 * - Long-term historical averages (for asset class allocations)
 */

import type { MonteCarloResult } from '@/types/portfolio';
import type { IntakeFormData } from '@/components/features/portfolio/dashboard/PortfolioDashboard';

/**
 * Cap probability at 99% maximum (never show 100% certainty to client)
 */
function capProbability(probability: number): number {
  return Math.min(probability, 0.99);
}

// Long-term historical average returns (REAL - inflation-adjusted)
// Based on 100+ years of historical data (Ibbotson/Morningstar)
export const LONG_TERM_AVERAGES = {
  stocks: 0.07,      // 7% real (vs 10% nominal)
  bonds: 0.02,       // 2% real (vs 5% nominal)
  realEstate: 0.05,  // 5% real
  commodities: 0.01, // 1% real
  cash: 0.00,        // 0% real (matches inflation)
  alternatives: 0.05 // 5% real (blend of alternatives)
} as const;

// Nominal (not inflation-adjusted) returns for Years 2+ fallback
// Historical averages: stocks ~10%, bonds ~5%, etc.
export const LONG_TERM_NOMINAL = {
  stocks: 0.10,      // 10% nominal (vs 7% real)
  bonds: 0.05,       // 5% nominal (vs 2% real)
  realEstate: 0.08,  // 8% nominal (vs 5% real)
  commodities: 0.04, // 4% nominal (vs 1% real)
  cash: 0.03,        // 3% nominal (vs 0% real)
  alternatives: 0.08 // 8% nominal (vs 5% real)
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
  year1Return?: number;            // Optional: Year 1 return from user's holdings
  monteCarloResults?: Map<string, MonteCarloResult>; // Optional: for specific holdings
  holdings?: Array<{ticker: string, weight: number}>; // NEW: For weighted calculation
  scenarioReturns?: Map<string, {bull: number, expected: number, bear: number}>; // NEW: CSV scenarios
  factsetReturns?: Map<string, number>; // NEW: FactSet Year 1 returns for individual stocks
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
    (normalize(portfolio.stocks) / 100) * LONG_TERM_NOMINAL.stocks +
    (normalize(portfolio.bonds) / 100) * LONG_TERM_NOMINAL.bonds +
    (normalize(portfolio.cash) / 100) * LONG_TERM_NOMINAL.cash +
    (normalize(portfolio.realEstate) / 100) * LONG_TERM_NOMINAL.realEstate +
    (normalize(portfolio.commodities) / 100) * LONG_TERM_NOMINAL.commodities +
    (normalize(portfolio.alternatives) / 100) * LONG_TERM_NOMINAL.alternatives;

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
  probabilityAtPercentiles: {
    p5: number;   // Probability at 5th percentile (bear scenario)
    p50: number;  // Probability at 50th percentile (expected scenario)
    p95: number;  // Probability at 95th percentile (bull scenario)
  };
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
  const probabilityOfSuccess = capProbability(successCount / simulations);
  
  // Calculate probability at each percentile
  // At 5th percentile: what % of outcomes at that level reach the goal
  const p5Index = Math.floor(simulations * 0.05);
  const p50Index = Math.floor(simulations * 0.50);
  const p95Index = Math.floor(simulations * 0.95);
  
  const probabilityAtPercentiles = {
    p5: capProbability(results[p5Index] >= goalAmount ? 
        (simulations - p5Index) / simulations : // If 5th percentile succeeds, count from there up
        0.05), // If not, very low probability
    p50: probabilityOfSuccess, // Median = overall probability (already capped)
    p95: capProbability(results[p95Index] >= goalAmount ? 
        0.90 + (results[p95Index] - goalAmount) / goalAmount * 0.09 : // High probability if 95th succeeds
        (simulations - p95Index) / simulations)
  };

  return {
    downside: results[p5Index],
    median: results[p50Index],
    upside: results[p95Index],
    probabilityOfSuccess,
    probabilityAtPercentiles
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
 * Calculate future value with monthly contributions
 * Simple compound interest with regular additions
 */
function calculateFutureValueWithContributions(
  startingValue: number,
  annualReturn: number,
  monthlyContribution: number,
  years: number
): number {
  const monthlyRate = annualReturn / 12;
  const months = years * 12;
  
  let value = startingValue;
  for (let month = 0; month < months; month++) {
    value += monthlyContribution;
    value *= (1 + monthlyRate);
  }
  
  return value;
}

/**
 * Calculate multi-year value with Year 1 scenario + Years 2+ long-term returns
 * Used for Bull/Base/Bear projections in multi-year goals
 */
function calculateMultiYearValue(
  startingValue: number,
  year1Return: number,
  longTermReturn: number,
  monthlyContribution: number,
  years: number
): number {
  if (years === 1) {
    // Single year - just use Year 1 return
    return calculateFutureValueWithContributions(
      startingValue,
      year1Return,
      monthlyContribution,
      1
    );
  }
  
  // Year 1 with specific return
  let value = calculateFutureValueWithContributions(
    startingValue,
    year1Return,
    monthlyContribution,
    1
  );
  
  // Years 2+ with long-term return
  value = calculateFutureValueWithContributions(
    value,
    longTermReturn,
    monthlyContribution,
    years - 1
  );
  
  return value;
}

/**
 * Calculate weighted portfolio returns across Bull/Expected/Bear scenarios
 * Combines CSV data for ETFs with FactSet/Monte Carlo for individual stocks
 */
function calculateWeightedScenarioReturns(
  holdings: Array<{ticker: string, weight: number}>,
  scenarioReturns: Map<string, {bull: number, expected: number, bear: number}>,
  monteCarloResults?: Map<string, MonteCarloResult>,
  factsetReturns?: Map<string, number>
): {bull: number, expected: number, bear: number} {
  let bullReturn = 0;
  let expectedReturn = 0;
  let bearReturn = 0;
  
  for (const holding of holdings) {
    const weight = holding.weight / 100;
    const scenarios = scenarioReturns.get(holding.ticker);
    
    if (scenarios) {
      // ETF in database - use CSV scenarios
      bullReturn += weight * scenarios.bull;
      expectedReturn += weight * scenarios.expected;
      bearReturn += weight * scenarios.bear;
      console.log(`  ${holding.ticker}: Using CSV scenarios (${(scenarios.bull * 100).toFixed(1)}%, ${(scenarios.expected * 100).toFixed(1)}%, ${(scenarios.bear * 100).toFixed(1)}%)`);
    } else {
      // Individual stock - try Monte Carlo first, then FactSet with estimated spread
      const mc = monteCarloResults?.get(holding.ticker);
      const factsetReturn = factsetReturns?.get(holding.ticker);
      
      if (mc) {
        // Use Monte Carlo upside/downside
        bullReturn += weight * mc.upside;
        expectedReturn += weight * mc.median;
        bearReturn += weight * mc.downside;
        console.log(`  ${holding.ticker}: Using Monte Carlo (${(mc.upside * 100).toFixed(1)}%, ${(mc.median * 100).toFixed(1)}%, ${(mc.downside * 100).toFixed(1)}%)`);
      } else if (factsetReturn !== undefined) {
        // Use FactSet expected with estimated bull/bear spread based on stock volatility
        // Typical individual stock: ~20-30% volatility → ±30% spread from expected
        const bullSpread = factsetReturn + 0.30; // +30% upside
        const bearSpread = factsetReturn - 0.30; // -30% downside
        bullReturn += weight * bullSpread;
        expectedReturn += weight * factsetReturn;
        bearReturn += weight * bearSpread;
        console.log(`  ${holding.ticker}: Using FactSet with spread (${(bullSpread * 100).toFixed(1)}%, ${(factsetReturn * 100).toFixed(1)}%, ${(bearSpread * 100).toFixed(1)}%)`);
      } else {
        // Fallback to long-term average for stocks
        const fallbackReturn = LONG_TERM_NOMINAL.stocks;
        bullReturn += weight * fallbackReturn * 1.4;
        expectedReturn += weight * fallbackReturn;
        bearReturn += weight * fallbackReturn * 0.6;
        console.log(`  ${holding.ticker}: Using fallback (${(fallbackReturn * 100).toFixed(1)}%)`);
      }
    }
  }
  
  return {bull: bullReturn, expected: expectedReturn, bear: bearReturn};
}

/**
 * Calculate 12-month goal scenarios using CSV data
 * Uses Bull/Expected/Bear returns from database for ETFs
 * Falls back to Monte Carlo for individual stocks
 */
function calculate12MonthScenarios(
  input: GoalProbabilityInput
): GoalProbabilityResult {
  console.log('📊 Calculating 12-month scenarios with CSV data');
  
  if (!input.holdings || input.holdings.length === 0 || !input.scenarioReturns) {
    console.warn('⚠️ Missing holdings or scenario returns, falling back to Monte Carlo');
    // Fall back to regular Monte Carlo if no holdings data
    return calculateGoalProbabilityWithMonteCarlo(input);
  }
  
  // Calculate weighted returns for each scenario
  const weightedReturns = calculateWeightedScenarioReturns(
    input.holdings,
    input.scenarioReturns,
    input.monteCarloResults,
    input.factsetReturns
  );
  
  console.log('📊 Weighted scenario returns:', {
    bull: (weightedReturns.bull * 100).toFixed(1) + '%',
    expected: (weightedReturns.expected * 100).toFixed(1) + '%',
    bear: (weightedReturns.bear * 100).toFixed(1) + '%'
  });
  
  // Calculate future values for 1-year goals using SIMPLE annual return (no monthly compounding)
  // If there are monthly contributions, we'll apply them simply
  const totalContributions = input.monthlyContribution * 12;
  
  const bullValue = (input.currentAmount + totalContributions) * (1 + weightedReturns.bull);
  const expectedValue = (input.currentAmount + totalContributions) * (1 + weightedReturns.expected);
  const bearValue = (input.currentAmount + totalContributions) * (1 + weightedReturns.bear);
  
  // For 1-year goals: ALL scenarios are deterministic (no Monte Carlo)
  // If projected value >= goal, probability = 1.0, otherwise 0.0
  // NOTE: Cap at 99% (never show 100% certainty)
  const bullProbability = capProbability(bullValue >= input.goalAmount ? 1.0 : 0.0);
  const expectedProbability = capProbability(expectedValue >= input.goalAmount ? 1.0 : 0.0);
  const bearProbability = capProbability(bearValue >= input.goalAmount ? 1.0 : 0.0);
  
  const probabilityOfSuccess = {
    median: expectedProbability,
    downside: bearProbability,
    upside: bullProbability
  };
  
  console.log('📊 12-month scenario results:', {
    bullValue: bullValue.toFixed(0),
    expectedValue: expectedValue.toFixed(0),
    bearValue: bearValue.toFixed(0),
    bullProbability: (bullProbability * 100).toFixed(1) + '%',
    expectedProbability: (expectedProbability * 100).toFixed(1) + '%',
    bearProbability: (bearProbability * 100).toFixed(1) + '%'
  });
  
  return {
    probabilityOfSuccess,
    projectedValues: {
      upside: bullValue,
      median: expectedValue,
      downside: bearValue
    },
    shortfall: {
      upside: bullValue - input.goalAmount,
      median: expectedValue - input.goalAmount,
      downside: bearValue - input.goalAmount
    },
    expectedReturn: weightedReturns.expected
  };
}

/**
 * Calculate probability of reaching goal using Monte Carlo
 * Now uses Bull/Base/Bear scenarios for Year 1 when available (multi-year goals)
 */
function calculateGoalProbabilityWithMonteCarlo(input: GoalProbabilityInput): GoalProbabilityResult {
  // Long-term return from asset allocation (for Years 2+)
  const longTermReturn = calculateExpectedReturn(input.portfolio);

  // Check if we have scenario data for Year 1 (Bull/Base/Bear from CSV)
  let year1Bull, year1Expected, year1Bear;
  let useScenarioProjections = false;
  
  if (input.scenarioReturns && input.holdings && input.holdings.length > 0) {
    // Calculate weighted Bull/Base/Bear for Year 1
    const scenarios = calculateWeightedScenarioReturns(
      input.holdings,
      input.scenarioReturns,
      input.monteCarloResults,
      input.factsetReturns
    );
    year1Bull = scenarios.bull;
    year1Expected = scenarios.expected;
    year1Bear = scenarios.bear;
    useScenarioProjections = true;
    console.log('📊 Using Bull/Base/Bear scenarios for Year 1 of multi-year goal');
  } else {
    // Fallback to single year1Return with Monte Carlo volatility
    const year1Return = input.year1Return ?? longTermReturn;
    year1Expected = year1Return;
    // Will use Monte Carlo for upside/downside
    console.log('📊 Using Monte Carlo volatility for Year 1 (no scenario data)');
  }

  // Volatility from asset class weights (for Monte Carlo probability calculation)
  const stockWeight = input.portfolio.stocks / 100;
  const bondWeight = input.portfolio.bonds / 100;
  const cashWeight = input.portfolio.cash / 100;
  const estimatedVolatility = 
    stockWeight * 0.18 +      // Stocks: 18% volatility
    bondWeight * 0.06 +       // Bonds: 6% volatility
    cashWeight * 0.01 +       // Cash: 1% volatility
    (1 - stockWeight - bondWeight - cashWeight) * 0.12; // Other: 12% volatility

  // Calculate projected values and probabilities
  let bullValue, expectedValue, bearValue;
  let bullProbability, expectedProbability, bearProbability;
  
  if (useScenarioProjections) {
    // Use Bull/Base/Bear scenarios for Year 1, long-term for Years 2+
    bullValue = calculateMultiYearValue(
      input.currentAmount,
      year1Bull!,
      longTermReturn,
      input.monthlyContribution,
      input.timeHorizon
    );
    
    expectedValue = calculateMultiYearValue(
      input.currentAmount,
      year1Expected,
      longTermReturn,
      input.monthlyContribution,
      input.timeHorizon
    );
    
    bearValue = calculateMultiYearValue(
      input.currentAmount,
      year1Bear!,
      longTermReturn,
      input.monthlyContribution,
      input.timeHorizon
    );
    
    console.log('📊 Scenario-based projections:', {
      bull: bullValue.toFixed(0),
      expected: expectedValue.toFixed(0),
      bear: bearValue.toFixed(0)
    });
    
    // Run separate Monte Carlo for each scenario to get accurate probabilities
    const bullMC = runGoalMonteCarloSimulation(
      input.currentAmount,
      input.goalAmount,
      input.timeHorizon,
      input.monthlyContribution,
      year1Bull!,
      longTermReturn,
      estimatedVolatility
    );
    
    const expectedMC = runGoalMonteCarloSimulation(
      input.currentAmount,
      input.goalAmount,
      input.timeHorizon,
      input.monthlyContribution,
      year1Expected,
      longTermReturn,
      estimatedVolatility
    );
    
    const bearMC = runGoalMonteCarloSimulation(
      input.currentAmount,
      input.goalAmount,
      input.timeHorizon,
      input.monthlyContribution,
      year1Bear!,
      longTermReturn,
      estimatedVolatility
    );
    
    bullProbability = bullMC.probabilityOfSuccess;
    expectedProbability = expectedMC.probabilityOfSuccess;
    bearProbability = bearMC.probabilityOfSuccess;
    
    console.log('📊 Scenario probabilities:', {
      bull: (bullProbability * 100).toFixed(1) + '%',
      expected: (expectedProbability * 100).toFixed(1) + '%',
      bear: (bearProbability * 100).toFixed(1) + '%'
    });
    
  } else {
    // Use Monte Carlo simulation for all projections
    const simulationResult = runGoalMonteCarloSimulation(
      input.currentAmount,
      input.goalAmount,
      input.timeHorizon,
      input.monthlyContribution,
      year1Expected,
      longTermReturn,
      estimatedVolatility
    );
    
    bullValue = simulationResult.upside;
    expectedValue = simulationResult.median;
    bearValue = simulationResult.downside;
    
    bullProbability = simulationResult.probabilityAtPercentiles.p95;
    expectedProbability = simulationResult.probabilityOfSuccess;
    bearProbability = simulationResult.probabilityAtPercentiles.p5;
  }

  // Cap all probabilities at 99% (never show 100% certainty)
  const probabilityOfSuccess = {
    median: capProbability(expectedProbability),
    downside: capProbability(bearProbability),
    upside: capProbability(bullProbability)
  };
  
  console.log(`🎯 Goal Probability Calculation:`, {
    currentAmount: input.currentAmount,
    goalAmount: input.goalAmount,
    timeHorizon: input.timeHorizon,
    year1Expected: (year1Expected * 100).toFixed(1) + '%',
    longTermReturn: (longTermReturn * 100).toFixed(1) + '%',
    volatility: (estimatedVolatility * 100).toFixed(1) + '%',
    expectedProbability: (probabilityOfSuccess.median * 100).toFixed(1) + '%',
    bullProbability: (probabilityOfSuccess.upside * 100).toFixed(1) + '%',
    bearProbability: (probabilityOfSuccess.downside * 100).toFixed(1) + '%',
    projectedMedian: expectedValue.toFixed(0),
    projectedBear: bearValue.toFixed(0),
    projectedBull: bullValue.toFixed(0)
  });

  // Calculate shortfall (difference from goal)
  const shortfall = {
    downside: bearValue - input.goalAmount,
    median: expectedValue - input.goalAmount,
    upside: bullValue - input.goalAmount
  };

  return {
    probabilityOfSuccess,
    projectedValues: {
      median: expectedValue,
      downside: bearValue,
      upside: bullValue
    },
    shortfall,
    expectedReturn: year1Expected
  };
}

/**
 * Calculate probability of reaching goal
 * 
 * For 12-month goals: Uses Bull/Base/Bear scenarios from CSV database
 * For multi-year goals: Uses Monte Carlo with Year 1 holdings + Years 2+ asset class averages
 */
export function calculateGoalProbability(input: GoalProbabilityInput): GoalProbabilityResult {
  // Check if this is a 12-month goal with scenario data
  if (input.timeHorizon === 1 && input.scenarioReturns && input.holdings) {
    console.log('🎯 Using 12-month CSV scenarios for goal calculation');
    return calculate12MonthScenarios(input);
  }
  
  // Otherwise use Monte Carlo simulation
  console.log('🎯 Using Monte Carlo simulation for goal calculation');
  return calculateGoalProbabilityWithMonteCarlo(input);
}

/**
 * Helper function to create input from IntakeFormData
 */
export function createGoalProbabilityInput(
  intakeData: IntakeFormData,
  year1Return?: number,  // Optional: Pass calculated Year 1 return from holdings
  scenarioReturns?: Map<string, {bull: number, expected: number, bear: number}>,  // Optional: CSV scenarios
  holdings?: Array<{ticker: string, percentage: number}>,  // Optional: Holdings for weighting
  monteCarloResults?: Map<string, MonteCarloResult>,  // Optional: Monte Carlo results for individual stocks
  factsetReturns?: Map<string, number>  // Optional: FactSet Year 1 returns for individual stocks
): GoalProbabilityInput | null {
  // Validate required fields
  if (!intakeData.goalAmount || !intakeData.timeHorizon) {
    return null;
  }

  // Transform holdings to have weight property
  const transformedHoldings = holdings?.map(h => ({
    ticker: h.ticker,
    weight: h.percentage
  }));

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
    },
    year1Return,  // Pass through to ensure Goal uses same Year 1 as Portfolio
    scenarioReturns,  // Pass CSV scenario data
    holdings: transformedHoldings,  // Pass holdings for weighted calculation
    monteCarloResults,  // Pass Monte Carlo results for fallback
    factsetReturns  // Pass FactSet returns for individual stocks
  };
}

