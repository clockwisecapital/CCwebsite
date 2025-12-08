/**
 * Clockwise Capital Static Target Data
 * 
 * Contains static reference data for portfolio calculations:
 * - Short/Inverse ETF mappings (leverage and underlying index)
 * 
 * Note: Index/Sector targets are stored in database (index_sector_targets table)
 * as they are updated daily.
 */

/**
 * Inverse/Short ETF Reference Table
 * Maps short ETFs to their underlying index and leverage multiplier
 * 
 * Formula: Short Return = Index Return × Leverage × -1
 * 
 * Example: QID (2x inverse QQQ)
 * - If QQQ expected return = +15%
 * - QID return = 15% × 2 × -1 = -30%
 */
export const SHORTS_REFERENCE: Record<string, { underlying: string; leverage: number }> = {
  'SQQQ': { underlying: 'QQQ', leverage: 3 },
  'QID':  { underlying: 'QQQ', leverage: 2 },
  'PSQ':  { underlying: 'QQQ', leverage: 1 },
  'SPXU': { underlying: 'SPY', leverage: 3 },
  'SDS':  { underlying: 'SPY', leverage: 2 },
  'SH':   { underlying: 'SPY', leverage: 1 },
  'SDOW': { underlying: 'DIA', leverage: 3 },
  'DXD':  { underlying: 'DIA', leverage: 2 },
  'DOG':  { underlying: 'DIA', leverage: 1 },
  'SOXS': { underlying: 'SOXX', leverage: 3 },
  'SARK': { underlying: 'ARKK', leverage: 1 },
};

/**
 * Check if a ticker is a short/inverse ETF
 */
export function isShortETF(ticker: string): boolean {
  return ticker.toUpperCase() in SHORTS_REFERENCE;
}

/**
 * Get short ETF info (underlying index and leverage)
 * Returns null if not a short ETF
 */
export function getShortInfo(ticker: string): { underlying: string; leverage: number } | null {
  return SHORTS_REFERENCE[ticker.toUpperCase()] || null;
}

/**
 * Get all short ETF tickers
 */
export function getAllShortTickers(): string[] {
  return Object.keys(SHORTS_REFERENCE);
}

/**
 * Get all underlying indices used by short ETFs
 */
export function getUnderlyingIndices(): string[] {
  const indices = new Set<string>();
  Object.values(SHORTS_REFERENCE).forEach(info => {
    indices.add(info.underlying);
  });
  return Array.from(indices);
}

