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

export interface PortfolioHolding {
  ticker: string;
  name: string;
  percentage: number;
  assetClass: 'stocks' | 'bonds' | 'commodities' | 'alternatives' | 'cash';
}

export interface ClockwisePortfolio {
  id: string;
  name: string;
  description: string;
  allocations: AssetAllocation;
  holdings: PortfolioHolding[]; // Real ETF holdings
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
  holdings: [
    { ticker: 'TIME', name: 'Clockwise Core US Equity ETF', percentage: 50.0, assetClass: 'stocks' },
    { ticker: 'IDUB', name: 'Aptus International Enhanced Yield ETF', percentage: 11.0, assetClass: 'stocks' },
    { ticker: 'OSCV', name: 'Opus Small Cap Value ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', percentage: 2.0, assetClass: 'stocks' },
    { ticker: 'UPSD', name: 'Aptus Large Cap Upside ETF', percentage: 6.0, assetClass: 'stocks' },
    { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', percentage: 5.0, assetClass: 'stocks' },
    { ticker: 'ACIO', name: 'Aptus Collared Investment Opportunity ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'ADME', name: 'Aptus Drawdown-Managed Equity ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'DUBS', name: 'Aptus Large Cap Enhanced Yield ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'BRNY', name: 'Burney U.S. Factor Rotation ETF', percentage: 8.0, assetClass: 'stocks' },
    { ticker: 'VBK', name: 'Vanguard Small Cap Growth ETF', percentage: 3.0, assetClass: 'stocks' },
    { ticker: 'DRSK', name: 'Aptus Defined Risk ETF', percentage: 1.0, assetClass: 'bonds' },
    { ticker: 'VGIT', name: 'Vanguard Intermediate-Term Treasury ETF', percentage: 2.0, assetClass: 'bonds' },
    { ticker: 'VGSH', name: 'Vanguard Short-Term Treasury ETF', percentage: 2.0, assetClass: 'bonds' },
    { ticker: 'GLD', name: 'SPDR Gold Shares', percentage: 3.0, assetClass: 'commodities' },
    { ticker: 'IBIT', name: 'iShares Bitcoin Trust ETF', percentage: 2.0, assetClass: 'alternatives' },
    { ticker: 'CASH', name: 'Cash', percentage: 1.0, assetClass: 'cash' }
  ],
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
  holdings: [
    { ticker: 'TIME', name: 'Clockwise Core US Equity ETF', percentage: 40.0, assetClass: 'stocks' },
    { ticker: 'IDUB', name: 'Aptus International Enhanced Yield ETF', percentage: 11.0, assetClass: 'stocks' },
    { ticker: 'OSCV', name: 'Opus Small Cap Value ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'UPSD', name: 'Aptus Large Cap Upside ETF', percentage: 6.0, assetClass: 'stocks' },
    { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', percentage: 5.0, assetClass: 'stocks' },
    { ticker: 'ACIO', name: 'Aptus Collared Investment Opportunity ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'ADME', name: 'Aptus Drawdown-Managed Equity ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'DUBS', name: 'Aptus Large Cap Enhanced Yield ETF', percentage: 5.0, assetClass: 'stocks' },
    { ticker: 'BRNY', name: 'Burney U.S. Factor Rotation ETF', percentage: 7.0, assetClass: 'stocks' },
    { ticker: 'VBK', name: 'Vanguard Small Cap Growth ETF', percentage: 2.0, assetClass: 'stocks' },
    { ticker: 'DRSK', name: 'Aptus Defined Risk ETF', percentage: 8.0, assetClass: 'bonds' },
    { ticker: 'VGIT', name: 'Vanguard Intermediate-Term Treasury ETF', percentage: 3.0, assetClass: 'bonds' },
    { ticker: 'VGSH', name: 'Vanguard Short-Term Treasury ETF', percentage: 3.0, assetClass: 'bonds' },
    { ticker: 'GLD', name: 'SPDR Gold Shares', percentage: 3.0, assetClass: 'commodities' },
    { ticker: 'IBIT', name: 'iShares Bitcoin Trust ETF', percentage: 2.0, assetClass: 'alternatives' },
    { ticker: 'CASH', name: 'Cash', percentage: 1.0, assetClass: 'cash' }
  ],
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
  holdings: [
    { ticker: 'TIME', name: 'Clockwise Core US Equity ETF', percentage: 30.0, assetClass: 'stocks' },
    { ticker: 'IDUB', name: 'Aptus International Enhanced Yield ETF', percentage: 10.0, assetClass: 'stocks' },
    { ticker: 'OSCV', name: 'Opus Small Cap Value ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'UPSD', name: 'Aptus Large Cap Upside ETF', percentage: 4.0, assetClass: 'stocks' },
    { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', percentage: 3.0, assetClass: 'stocks' },
    { ticker: 'ACIO', name: 'Aptus Collared Investment Opportunity ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'ADME', name: 'Aptus Drawdown-Managed Equity ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'DUBS', name: 'Aptus Large Cap Enhanced Yield ETF', percentage: 8.0, assetClass: 'stocks' },
    { ticker: 'BRNY', name: 'Burney U.S. Factor Rotation ETF', percentage: 4.0, assetClass: 'stocks' },
    { ticker: 'VBK', name: 'Vanguard Small Cap Growth ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'DRSK', name: 'Aptus Defined Risk ETF', percentage: 14.0, assetClass: 'bonds' },
    { ticker: 'VGIT', name: 'Vanguard Intermediate-Term Treasury ETF', percentage: 3.0, assetClass: 'bonds' },
    { ticker: 'VGSH', name: 'Vanguard Short-Term Treasury ETF', percentage: 3.0, assetClass: 'bonds' },
    { ticker: 'DEFR', name: 'Aptus Deferred Income ETF', percentage: 7.0, assetClass: 'bonds' },
    { ticker: 'JUCY', name: 'Aptus Enhanced Yield ETF', percentage: 4.0, assetClass: 'bonds' },
    { ticker: 'GLD', name: 'SPDR Gold Shares', percentage: 3.0, assetClass: 'commodities' },
    { ticker: 'IBIT', name: 'iShares Bitcoin Trust ETF', percentage: 1.0, assetClass: 'alternatives' },
    { ticker: 'CASH', name: 'Cash', percentage: 1.0, assetClass: 'cash' }
  ],
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
  holdings: [
    { ticker: 'TIME', name: 'Clockwise Core US Equity ETF', percentage: 20.0, assetClass: 'stocks' },
    { ticker: 'IDUB', name: 'Aptus International Enhanced Yield ETF', percentage: 10.0, assetClass: 'stocks' },
    { ticker: 'OSCV', name: 'Opus Small Cap Value ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'UPSD', name: 'Aptus Large Cap Upside ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'ACIO', name: 'Aptus Collared Investment Opportunity ETF', percentage: 1.0, assetClass: 'stocks' },
    { ticker: 'ADME', name: 'Aptus Drawdown-Managed Equity ETF', percentage: 7.0, assetClass: 'stocks' },
    { ticker: 'DUBS', name: 'Aptus Large Cap Enhanced Yield ETF', percentage: 11.0, assetClass: 'stocks' },
    { ticker: 'BRNY', name: 'Burney U.S. Factor Rotation ETF', percentage: 2.0, assetClass: 'stocks' },
    { ticker: 'DRSK', name: 'Aptus Defined Risk ETF', percentage: 18.0, assetClass: 'bonds' },
    { ticker: 'VGIT', name: 'Vanguard Intermediate-Term Treasury ETF', percentage: 3.0, assetClass: 'bonds' },
    { ticker: 'VGSH', name: 'Vanguard Short-Term Treasury ETF', percentage: 3.0, assetClass: 'bonds' },
    { ticker: 'DEFR', name: 'Aptus Deferred Income ETF', percentage: 8.0, assetClass: 'bonds' },
    { ticker: 'JUCY', name: 'Aptus Enhanced Yield ETF', percentage: 9.0, assetClass: 'bonds' },
    { ticker: 'GLD', name: 'SPDR Gold Shares', percentage: 3.0, assetClass: 'commodities' },
    { ticker: 'IBIT', name: 'iShares Bitcoin Trust ETF', percentage: 1.0, assetClass: 'alternatives' },
    { ticker: 'CASH', name: 'Cash', percentage: 1.0, assetClass: 'cash' }
  ],
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
