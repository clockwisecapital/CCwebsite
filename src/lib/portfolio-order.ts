/**
 * Utility for consistent portfolio ordering across the application
 * Order: Max Growth → Growth → Moderate → Max Income → S&P 500 (benchmark)
 */

export const PORTFOLIO_ORDER = [
  'MAX GROWTH',
  'GROWTH',
  'MODERATE',
  'MAX INCOME',
  'S&P 500',
  'S&P 500 TR', // Alternative benchmark name
  'SPX', // Benchmark ticker
  '$SPX', // Alternative benchmark name
] as const;

/**
 * Sort portfolios according to the standard order
 * @param portfolios - Array of portfolio names or objects with a 'name' property
 * @returns Sorted array
 */
export function sortPortfolios<T>(
  portfolios: T[],
  getNameFn: (item: T) => string = (item) => String(item)
): T[] {
  return [...portfolios].sort((a, b) => {
    const nameA = getNameFn(a).toUpperCase().replace('CLOCKWISE ', '').trim();
    const nameB = getNameFn(b).toUpperCase().replace('CLOCKWISE ', '').trim();
    
    // Get index positions (-1 if not found)
    // Check if the name contains the order keyword
    const indexA = PORTFOLIO_ORDER.findIndex(order => {
      // Special handling for GROWTH to avoid matching MAX GROWTH
      if (order === 'GROWTH' && nameA.includes('MAX GROWTH')) {
        return false;
      }
      return nameA.includes(order);
    });
    const indexB = PORTFOLIO_ORDER.findIndex(order => {
      // Special handling for GROWTH to avoid matching MAX GROWTH
      if (order === 'GROWTH' && nameB.includes('MAX GROWTH')) {
        return false;
      }
      return nameB.includes(order);
    });
    
    // If both found, sort by order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // Unknown portfolios go at the end, before benchmark
    if (indexA === -1 && indexB === -1) {
      return nameA.localeCompare(nameB);
    }
    
    // One is in order, one is not
    return indexA === -1 ? 1 : -1;
  });
}

/**
 * Sort portfolio names (strings)
 */
export function sortPortfolioNames(names: string[]): string[] {
  return sortPortfolios(names, (name) => name);
}

/**
 * Sort portfolios with 'name' property
 */
export function sortPortfolioObjects<T extends { name: string }>(portfolios: T[]): T[] {
  return sortPortfolios(portfolios, (p) => p.name);
}

/**
 * Get color for a portfolio (for charts)
 * Each portfolio gets a distinct color for easy identification
 */
export function getPortfolioColor(portfolioName: string): string {
  const name = portfolioName.toUpperCase();
  
  // Benchmark colors
  if (name.includes('S&P') || name.includes('SPX')) {
    return '#f59e0b'; // Amber/Orange for benchmark
  }
  
  // Portfolio colors - distinct colors for each
  if (name.includes('MAX GROWTH')) {
    return '#10b981'; // Green
  }
  if (name.includes('GROWTH') && !name.includes('MAX')) {
    return '#3b82f6'; // Blue
  }
  if (name.includes('MODERATE')) {
    return '#8b5cf6'; // Purple
  }
  if (name.includes('MAX INCOME')) {
    return '#ec4899'; // Pink
  }
  
  // Default fallback colors
  return '#6b7280'; // Gray
}

