/**
 * Asset Class Aggregation Utilities
 * 
 * Converts ticker-based holdings into aggregated asset class allocations
 * for display purposes in Clockwise portfolios.
 */

export type HighLevelAssetClass = 'Stocks' | 'Bonds' | 'Commodities' | 'Cash' | 'Real Estate' | 'Hedges';

export interface AssetClassHolding {
  assetClass: HighLevelAssetClass;
  weight: number;
  name: string;
}

/**
 * Map a ticker to a high-level asset class
 */
export function mapTickerToHighLevelAssetClass(ticker: string): HighLevelAssetClass {
  const upperTicker = ticker.toUpperCase();
  
  // Equity Hedges / Short ETFs
  if (upperTicker.match(/^(SQQQ|QID|PSQ|SPXU|SDS|SH|SDOW|DXD|DOG|SOXS|SARK)$/)) {
    return 'Hedges';
  }
  
  // Cash equivalents
  if (upperTicker.match(/^(CASH|SHV|SGOV|BIL|FGXXX)$/)) {
    return 'Cash';
  }
  
  // Bonds
  if (upperTicker.match(/^(AGG|BND|TLT|IEF|LQD|HYG|VCIT|VGIT|VCSH|MUB|TIP|SHY)$/)) {
    return 'Bonds';
  }
  
  // Real Estate
  if (upperTicker.match(/^(VNQ|SCHH|IYR|XLRE)$/)) {
    return 'Real Estate';
  }
  
  // Commodities (including Gold)
  if (upperTicker.match(/^(GLD|SLV|IAU|USO|DBC|DBA|NEM)$/)) {
    return 'Commodities';
  }
  
  // Everything else defaults to Stocks
  return 'Stocks';
}

/**
 * Check if a portfolio is a Clockwise portfolio (should show asset classes)
 */
export function isClockwisePortfolio(portfolioName: string): boolean {
  const normalizedName = portfolioName.toUpperCase().trim().replace('CLOCKWISE ', '');
  return ['MAX GROWTH', 'GROWTH', 'MODERATE', 'MAX INCOME'].includes(normalizedName);
}

/**
 * Aggregate holdings by high-level asset class
 * 
 * @param holdings - Array of holdings with ticker and weight
 * @returns Array of aggregated asset class holdings, sorted by weight descending
 */
export function aggregateHoldingsByAssetClass(
  holdings: Array<{ ticker: string; weight: number; name?: string }>
): AssetClassHolding[] {
  const assetClassMap = new Map<HighLevelAssetClass, number>();
  
  // Aggregate weights by asset class
  for (const holding of holdings) {
    const assetClass = mapTickerToHighLevelAssetClass(holding.ticker);
    const currentWeight = assetClassMap.get(assetClass) || 0;
    assetClassMap.set(assetClass, currentWeight + holding.weight);
  }
  
  // Convert to array and sort by weight descending
  const assetClassHoldings: AssetClassHolding[] = [];
  for (const [assetClass, weight] of assetClassMap.entries()) {
    if (weight > 0) {
      assetClassHoldings.push({
        assetClass,
        weight,
        name: assetClass // Use asset class name as the name
      });
    }
  }
  
  // Sort by weight descending
  assetClassHoldings.sort((a, b) => b.weight - a.weight);
  
  return assetClassHoldings;
}

/**
 * Convert topPositions array to asset class format if it's a Clockwise portfolio
 * 
 * @param topPositions - Original ticker-based positions
 * @param portfolioName - Name of the portfolio (to check if it's Clockwise)
 * @returns Asset class holdings if Clockwise, original positions otherwise
 */
export function convertToAssetClassIfClockwise(
  topPositions: Array<{ ticker: string; weight: number; name?: string; expectedReturn?: number | null; monteCarlo?: any }>,
  portfolioName: string
): Array<{
  ticker: string;
  weight: number;
  name?: string;
  expectedReturn?: number | null;
  monteCarlo?: any;
  assetClass?: string;
}> {
  // Only convert if it's a Clockwise portfolio
  if (!isClockwisePortfolio(portfolioName)) {
    return topPositions;
  }
  
  // Aggregate by asset class
  const aggregated = aggregateHoldingsByAssetClass(topPositions);
  
  // Convert back to the expected format
  return aggregated.map(holding => ({
    ticker: holding.assetClass, // Use asset class as ticker
    weight: holding.weight,
    name: holding.name,
    expectedReturn: null, // Asset class doesn't have individual expected return
    assetClass: holding.assetClass
  }));
}
