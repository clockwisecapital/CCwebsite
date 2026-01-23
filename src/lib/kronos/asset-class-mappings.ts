/**
 * Asset Class Mappings
 * 
 * Pure mapping functions with no server dependencies
 * Safe to import in both client and server components
 */

/**
 * Map a ticker to a Kronos asset class using static mappings
 * 
 * This is a synchronous, client-safe version that uses only predefined mappings.
 * For AI-powered classification, use mapTickerToKronosAssetClassAsync from scoring.ts
 * 
 * @param ticker - Stock/ETF ticker symbol
 * @returns Kronos asset class key
 */
export function mapTickerToKronosAssetClass(ticker: string): string {
  const upperTicker = ticker.toUpperCase();
  
  // Common ETF mappings (kept for backward compatibility)
  const etfMappings: Record<string, string> = {
    // Large Cap
    'SPY': 'us-large-cap',
    'VOO': 'us-large-cap',
    'IVV': 'us-large-cap',
    'VTI': 'us-large-cap',
    // Growth/Value
    'VUG': 'us-growth',
    'VTV': 'us-value',
    'IWF': 'us-growth',
    'IWD': 'us-value',
    // Small Cap
    'VB': 'us-small-cap',
    'IWM': 'us-small-cap',
    'IJR': 'us-small-cap',
    // International
    'VXUS': 'international',
    'VEA': 'international',
    'IEFA': 'international',
    'VWO': 'emerging-markets',
    'EEM': 'emerging-markets',
    // Sectors
    'XLK': 'tech-sector',
    'VGT': 'tech-sector',
    'XLV': 'healthcare',
    'XLF': 'financials',
    'XLE': 'energy',
    // Bonds
    'TLT': 'long-treasuries',
    'IEF': 'intermediate-treasuries',
    'SHY': 'short-treasuries',
    'TIP': 'tips',
    'AGG': 'aggregate-bonds',
    'BND': 'aggregate-bonds',
    'LQD': 'corporate-ig',
    'HYG': 'high-yield',
    // Alternatives
    'GLD': 'gold',
    'IAU': 'gold',
    'DBC': 'commodities',
    'SHV': 'cash',
    'CASH': 'cash',
    // Real Estate
    'VNQ': 'us-large-cap'
  };
  
  // Check direct mapping
  if (etfMappings[upperTicker]) {
    return etfMappings[upperTicker];
  }
  
  // Default to us-large-cap for unknown tickers (conservative)
  console.warn(`⚠️ Unknown ticker ${ticker}, defaulting to us-large-cap (use mapTickerToKronosAssetClassAsync for AI classification)`);
  return 'us-large-cap';
}
