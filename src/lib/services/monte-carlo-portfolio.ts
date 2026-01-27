/**
 * Portfolio-Level Monte Carlo Simulation
 * 
 * Client-safe version with NO server dependencies
 * Uses asset class weighted averages for portfolio-level simulations
 */

const SIMULATIONS = 5000;

// Long-term asset class averages (NOMINAL returns)
const ASSET_CLASS_RETURNS = {
  stocks: 0.10,
  bonds: 0.05,
  realEstate: 0.08,
  commodities: 0.04,
  cash: 0.03,
  alternatives: 0.08
} as const;

// Typical annual volatilities for each asset class
const ASSET_CLASS_VOLATILITIES = {
  stocks: 0.17,
  bonds: 0.06,
  realEstate: 0.15,
  commodities: 0.20,
  cash: 0.01,
  alternatives: 0.12
} as const;

export type AssetClass = keyof typeof ASSET_CLASS_RETURNS;

/**
 * Portfolio-level Monte Carlo result
 */
export interface PortfolioMonteCarloResult {
  upside: number;      // 95th percentile of ANNUAL returns (best single year)
  downside: number;    // 5th percentile of ANNUAL returns (worst single year)
  median: number;      // 50th percentile ANNUALIZED return
  volatility: number;  // Portfolio-level annualized volatility
  simulations: number;
}

/**
 * Generate random number from normal distribution (Box-Muller transform)
 */
function randomNormal(mean: number, stdDev: number): number {
  let u1 = 0;
  let u2 = 0;
  
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Run Monte Carlo simulation at the PORTFOLIO level
 * 
 * Client-safe function with no server dependencies
 * Uses asset class weighted averages for return and volatility
 * 
 * @param positions - Array of positions with weights and parameters
 * @param timeHorizon - Investment horizon in years
 * @returns Portfolio-level upside, downside, and median
 */
export function runPortfolioMonteCarloSimulation(
  positions: Array<{
    weight: number;           // As decimal (0.08 for 8%)
    year1Return: number;      // Pre-calculated Year 1 expected return
    year1Volatility: number;  // Not used - kept for interface compatibility
    assetClass: AssetClass;   // Determines volatility and long-term return
  }>,
  timeHorizon: number = 1
): PortfolioMonteCarloResult {
  const allPortfolioAnnualReturns: number[] = [];
  const finalPortfolioReturns: number[] = [];
  
  const totalYears = Math.ceil(timeHorizon);
  
  // Calculate weighted averages
  let year1PortfolioReturn = 0;
  let portfolioVolatility = 0;
  let longTermReturn = 0;
  
  for (const position of positions) {
    // Year 1 return: weighted average of position-specific returns
    year1PortfolioReturn += position.weight * position.year1Return;
    
    // Volatility: weighted average of ASSET CLASS volatilities
    portfolioVolatility += position.weight * ASSET_CLASS_VOLATILITIES[position.assetClass];
    
    // Long-term return (Years 2+): weighted average of ASSET CLASS returns
    longTermReturn += position.weight * ASSET_CLASS_RETURNS[position.assetClass];
  }
  
  console.log(`📊 Running portfolio-level Monte Carlo:`, {
    positions: positions.length,
    year1Return: (year1PortfolioReturn * 100).toFixed(1) + '%',
    longTermReturn: (longTermReturn * 100).toFixed(1) + '%',
    portfolioVol: (portfolioVolatility * 100).toFixed(1) + '%',
    timeHorizon: timeHorizon + ' years',
    simulations: SIMULATIONS
  });
  
  // Run simulations
  for (let sim = 0; sim < SIMULATIONS; sim++) {
    let portfolioValue = 1.0;
    
    for (let year = 0; year < totalYears; year++) {
      // Year 1: Use provided returns, Years 2+: Use long-term averages
      const expectedReturn = year === 0 ? year1PortfolioReturn : longTermReturn;
      const volatility = portfolioVolatility;
      
      // Single random shock for the portfolio
      const z = randomNormal(0, 1);
      
      // Calculate portfolio annual return using log-normal with volatility drag
      const annualDrift = expectedReturn - 0.5 * volatility * volatility;
      const portfolioYearReturn = Math.exp(annualDrift + volatility * z) - 1;
      
      // Collect this year's portfolio return
      allPortfolioAnnualReturns.push(portfolioYearReturn);
      
      // Update portfolio value
      portfolioValue *= (1 + portfolioYearReturn);
    }
    
    // Collect final portfolio return
    finalPortfolioReturns.push(portfolioValue - 1);
  }
  
  // Sort to find percentiles
  allPortfolioAnnualReturns.sort((a, b) => a - b);
  finalPortfolioReturns.sort((a, b) => a - b);
  
  // Percentile helper
  const percentile = (arr: number[], p: number): number => {
    const idx = Math.floor(arr.length * p);
    return arr[Math.min(idx, arr.length - 1)];
  };
  
  // Annualize the median final return
  const totalMedian = percentile(finalPortfolioReturns, 0.50);
  const annualizeReturn = (totalReturn: number, years: number): number => {
    if (years <= 1) return totalReturn;
    const growthFactor = 1 + totalReturn;
    if (growthFactor <= 0) return -0.99;
    return Math.pow(growthFactor, 1 / years) - 1;
  };
  const median = annualizeReturn(totalMedian, timeHorizon);
  
  // Get best/worst annual returns (95th/5th percentile of any single year)
  const upside = percentile(allPortfolioAnnualReturns, 0.95);
  const downside = percentile(allPortfolioAnnualReturns, 0.05);
  
  // CRITICAL VALIDATION: upside should ALWAYS be >= downside
  // If not, it means the values are incorrectly swapped somewhere
  if (upside < downside) {
    console.error(`❌ MONTE CARLO BUG DETECTED: upside (${upside}) < downside (${downside})`);
    console.error(`❌ This should NEVER happen! 95th percentile should be >= 5th percentile`);
    console.error(`❌ Array sorting or percentile calculation is broken!`);
    throw new Error(`Monte Carlo calculation error: upside < downside`);
  }
  
  console.log(`📊 Portfolio Monte Carlo results:`, {
    medianAnnualized: (median * 100).toFixed(1) + '%',
    upside: (upside * 100).toFixed(1) + '% (best year)',
    downside: (downside * 100).toFixed(1) + '% (worst year)',
    volatility: (portfolioVolatility * 100).toFixed(1) + '%',
    simulations: SIMULATIONS,
    validation: upside >= downside ? '✅ PASS' : '❌ FAIL'
  });
  
  return {
    upside,
    downside,
    median,
    volatility: portfolioVolatility,
    simulations: SIMULATIONS
  };
}
