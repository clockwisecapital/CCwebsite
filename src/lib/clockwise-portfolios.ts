/**
 * Clockwise Capital Portfolio Configurations
 * 
 * Defines the 5 standard Clockwise portfolios with their asset allocations.
 * These portfolios are used for scenario testing and comparison against user portfolios.
 */

export interface AssetAllocation {
  stocks: number;       // Equity allocation - gross long (e.g., 0.835 = 83.5%)
  equityHedges: number; // Equity hedges/short positions (e.g., 0.043 = 4.3%)
  bonds: number;        // Fixed income allocation
  commodities: number;  // Commodity allocation (Gold, etc.)
  realEstate: number;   // Real estate/REIT allocation
  cash: number;         // Cash allocation
}

export interface ClockwisePortfolio {
  id: string;
  name: string;
  description: string;
  allocations: AssetAllocation;
  riskLevel: 'aggressive' | 'moderate-aggressive' | 'moderate' | 'moderate-conservative' | 'conservative';
}

/**
 * TIME Portfolio - Active managed hedged growth fund
 * Uses actual holdings from database (holding_weights table)
 */
export const TIME_PORTFOLIO = {
  id: 'time',
  name: 'TIME Portfolio',
  description: 'Clockwise Capital\'s actively managed hedged growth fund',
  isActivelyManaged: true, // Uses specific holdings, not just asset allocation
  riskLevel: 'moderate-aggressive' as const
};

/**
 * Max Growth Portfolio
 * Highest equity allocation for maximum growth potential
 * Net Equity Exposure: 70.9% (83.5% long - hedge effect)
 */
export const MAX_GROWTH_PORTFOLIO: ClockwisePortfolio = {
  id: 'max-growth',
  name: 'Max Growth',
  description: 'Aggressive growth portfolio with 83.5% gross long stocks',
  allocations: {
    stocks: 0.835,
    equityHedges: 0.043,
    bonds: 0.050,
    commodities: 0.050,
    realEstate: 0.000,
    cash: 0.022
  },
  riskLevel: 'aggressive'
};

/**
 * Growth Portfolio
 * Growth-oriented with moderate risk
 * Net Equity Exposure: 65.5% (75.6% long - hedge effect)
 */
export const GROWTH_PORTFOLIO: ClockwisePortfolio = {
  id: 'growth',
  name: 'Growth',
  description: 'Growth portfolio with 75.6% gross long stocks',
  allocations: {
    stocks: 0.756,
    equityHedges: 0.035,
    bonds: 0.140,
    commodities: 0.050,
    realEstate: 0.000,
    cash: 0.020
  },
  riskLevel: 'moderate-aggressive'
};

/**
 * Moderate Portfolio
 * Balanced allocation between growth and income
 * Net Equity Exposure: 53.1% (60.7% long - hedge effect)
 */
export const MODERATE_PORTFOLIO: ClockwisePortfolio = {
  id: 'moderate',
  name: 'Moderate',
  description: 'Balanced portfolio with 60.7% gross long stocks',
  allocations: {
    stocks: 0.607,
    equityHedges: 0.026,
    bonds: 0.310,
    commodities: 0.040,
    realEstate: 0.000,
    cash: 0.017
  },
  riskLevel: 'moderate'
};

/**
 * Max Income Portfolio
 * Income-focused with higher bond allocation
 * Net Equity Exposure: 46.8% (51.8% long - hedge effect)
 */
export const MAX_INCOME_PORTFOLIO: ClockwisePortfolio = {
  id: 'max-income',
  name: 'Max Income',
  description: 'Income-focused portfolio with 51.8% gross long stocks',
  allocations: {
    stocks: 0.518,
    equityHedges: 0.017,
    bonds: 0.410,
    commodities: 0.040,
    realEstate: 0.000,
    cash: 0.015
  },
  riskLevel: 'moderate-conservative'
};

/**
 * All asset-allocation-based Clockwise portfolios
 * (TIME portfolio excluded as it uses specific holdings)
 */
export const ASSET_ALLOCATION_PORTFOLIOS: ClockwisePortfolio[] = [
  MAX_GROWTH_PORTFOLIO,
  GROWTH_PORTFOLIO,
  MODERATE_PORTFOLIO,
  MAX_INCOME_PORTFOLIO
];

/**
 * All Clockwise portfolios including TIME
 */
export const ALL_CLOCKWISE_PORTFOLIOS = [
  TIME_PORTFOLIO,
  ...ASSET_ALLOCATION_PORTFOLIOS
];

/**
 * Get portfolio by ID
 */
export function getPortfolioById(id: string): ClockwisePortfolio | typeof TIME_PORTFOLIO | undefined {
  if (id === 'time') return TIME_PORTFOLIO;
  return ASSET_ALLOCATION_PORTFOLIOS.find(p => p.id === id);
}

/**
 * Validate that asset allocations sum to 100%
 */
export function validateAllocations(allocations: AssetAllocation): boolean {
  const sum = Object.values(allocations).reduce((acc, val) => acc + val, 0);
  // Allow 0.1% tolerance for rounding
  return Math.abs(sum - 1.0) < 0.001;
}

/**
 * Map asset class to Kronos asset class format
 */
export function mapToKronosAssetClass(assetType: keyof AssetAllocation): string {
  const mapping = {
    stocks: 'stocks',
    equityHedges: 'stocks', // Hedges map to stocks (inverse exposure)
    bonds: 'bonds',
    commodities: 'commodities',
    realEstate: 'realEstate',
    cash: 'cash'
  };
  return mapping[assetType];
}
