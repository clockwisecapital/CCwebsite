/**
 * Proxy Portfolio Service
 * 
 * Creates representative ETF portfolios when users only provide asset allocation
 * percentages without specific ticker holdings
 */

// Representative ETFs for each asset class
export const REPRESENTATIVE_ETFS = {
  stocks: {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF',
    description: 'U.S. Large Cap Stocks'
  },
  bonds: {
    ticker: 'AGG',
    name: 'iShares Core US Aggregate Bond ETF',
    description: 'U.S. Bond Aggregate'
  },
  realEstate: {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    description: 'REIT Index'
  },
  commodities: {
    ticker: 'GLD',
    name: 'SPDR Gold Trust',
    description: 'Gold Commodity'
  },
  alternatives: {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    description: 'Tech/Growth Alternative'
  },
  cash: {
    ticker: 'CASH',
    name: 'Cash Equivalent',
    description: 'Money Market'
  }
} as const;

export interface ProxyHolding {
  ticker: string;
  name: string;
  percentage: number;
  isProxy: true;
  assetClass: string;
}

/**
 * Create proxy portfolio from asset allocation percentages
 */
export function createProxyPortfolio(portfolio: {
  stocks: number;
  bonds: number;
  cash: number;
  realEstate: number;
  commodities: number;
  alternatives: number;
}): ProxyHolding[] {
  const proxyHoldings: ProxyHolding[] = [];

  if (portfolio.stocks > 0) {
    proxyHoldings.push({
      ticker: REPRESENTATIVE_ETFS.stocks.ticker,
      name: REPRESENTATIVE_ETFS.stocks.name,
      percentage: portfolio.stocks,
      isProxy: true,
      assetClass: 'Stocks'
    });
  }

  if (portfolio.bonds > 0) {
    proxyHoldings.push({
      ticker: REPRESENTATIVE_ETFS.bonds.ticker,
      name: REPRESENTATIVE_ETFS.bonds.name,
      percentage: portfolio.bonds,
      isProxy: true,
      assetClass: 'Bonds'
    });
  }

  if (portfolio.realEstate > 0) {
    proxyHoldings.push({
      ticker: REPRESENTATIVE_ETFS.realEstate.ticker,
      name: REPRESENTATIVE_ETFS.realEstate.name,
      percentage: portfolio.realEstate,
      isProxy: true,
      assetClass: 'Real Estate'
    });
  }

  if (portfolio.commodities > 0) {
    proxyHoldings.push({
      ticker: REPRESENTATIVE_ETFS.commodities.ticker,
      name: REPRESENTATIVE_ETFS.commodities.name,
      percentage: portfolio.commodities,
      isProxy: true,
      assetClass: 'Commodities'
    });
  }

  if (portfolio.alternatives > 0) {
    proxyHoldings.push({
      ticker: REPRESENTATIVE_ETFS.alternatives.ticker,
      name: REPRESENTATIVE_ETFS.alternatives.name,
      percentage: portfolio.alternatives,
      isProxy: true,
      assetClass: 'Alternatives'
    });
  }

  // Cash doesn't need Monte Carlo simulation
  if (portfolio.cash > 0) {
    proxyHoldings.push({
      ticker: REPRESENTATIVE_ETFS.cash.ticker,
      name: REPRESENTATIVE_ETFS.cash.name,
      percentage: portfolio.cash,
      isProxy: true,
      assetClass: 'Cash'
    });
  }

  return proxyHoldings;
}

/**
 * Check if user provided specific holdings or just allocations
 */
export function hasSpecificHoldings(
  specificHoldings?: Array<{ name: string; ticker?: string; percentage: number }>
): boolean {
  return (
    specificHoldings !== undefined &&
    specificHoldings.length > 0 &&
    specificHoldings.some(h => h.ticker && h.ticker.trim().length > 0)
  );
}

/**
 * Get display message for proxy usage
 */
export function getProxyMessage(isUsingProxy: boolean): string {
  if (isUsingProxy) {
    return 'Based on your asset allocation using representative market ETFs (SPY, AGG, VNQ, GLD, QQQ)';
  }
  return 'Based on your actual holdings';
}

