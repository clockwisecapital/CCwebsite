/**
 * Portfolio Data Extraction
 * 
 * Extracts holdings from portfolio_data JSONB and converts to Kronos Holding[] format
 */

import type { Holding } from './types';
import { mapTickerToKronosAssetClass } from './scoring';

// =====================================================================================
// TYPES
// =====================================================================================

/**
 * Portfolio data structure from database
 * This matches the JSONB structure stored in the portfolios table
 */
interface PortfolioData {
  totalValue?: number;
  stocks?: number;
  bonds?: number;
  cash?: number;
  realEstate?: number;
  commodities?: number;
  alternatives?: number;
}

interface IntakeData {
  specificHoldings?: Array<{
    ticker?: string;
    percentage?: number;
    shares?: number;
    currentValue?: number;
  }>;
  portfolio?: PortfolioData;
  portfolioTotalValue?: number;
}

/**
 * Complete portfolio record from database
 */
export interface PortfolioRecord {
  id: string;
  portfolio_data: PortfolioData | any;
  intake_data: IntakeData | any;
  name?: string;
}

// =====================================================================================
// EXTRACTION FUNCTIONS
// =====================================================================================

/**
 * Extract holdings from portfolio database record
 * Handles both specific holdings and allocation-based portfolios
 * 
 * @param portfolio - Portfolio record from database
 * @returns Array of Holdings with ticker, weight, and asset class
 */
export function extractHoldingsFromPortfolio(portfolio: PortfolioRecord): Holding[] {
  // Try to get specific holdings from intake_data
  const intakeData = portfolio.intake_data as IntakeData;
  const portfolioData = portfolio.portfolio_data as PortfolioData;
  
  if (intakeData?.specificHoldings && Array.isArray(intakeData.specificHoldings)) {
    const specificHoldings = intakeData.specificHoldings.filter(h => 
      h.ticker && 
      h.ticker.trim().length > 0 &&
      !h.ticker.toLowerCase().includes('other')
    );
    
    if (specificHoldings.length > 0) {
      return extractFromSpecificHoldings(specificHoldings, intakeData.portfolioTotalValue || portfolioData?.totalValue);
    }
  }
  
  // Fallback: Create proxy ETF holdings based on allocation
  return extractFromAllocation(portfolioData || intakeData?.portfolio || {});
}

/**
 * Extract holdings from specific holdings array
 * Converts tickers and percentages to Holding[] format
 */
function extractFromSpecificHoldings(
  specificHoldings: Array<{ ticker?: string; percentage?: number; shares?: number; currentValue?: number }>,
  totalValue?: number
): Holding[] {
  const holdings: Holding[] = [];
  let totalPercentage = 0;
  
  // Calculate weights
  for (const holding of specificHoldings) {
    if (!holding.ticker) continue;
    
    let weight = 0;
    
    // Try percentage first
    if (holding.percentage && holding.percentage > 0) {
      weight = holding.percentage / 100; // Convert percentage to decimal
    }
    // Try calculating from shares and value
    else if (holding.currentValue && totalValue && totalValue > 0) {
      weight = holding.currentValue / totalValue;
    }
    // Try inferring from shares (if we have other holdings with values)
    else if (holding.shares && holding.shares > 0) {
      // We'll normalize later if we can't calculate exact weights
      weight = 0.1; // Placeholder
    }
    
    if (weight > 0) {
      holdings.push({
        ticker: holding.ticker,
        weight,
        assetClass: mapTickerToKronosAssetClass(holding.ticker)
      });
      
      totalPercentage += weight;
    }
  }
  
  // Normalize weights to sum to 1.0
  if (totalPercentage > 0 && Math.abs(totalPercentage - 1.0) > 0.01) {
    console.log(`Normalizing holdings: ${totalPercentage.toFixed(3)} → 1.000`);
    for (const holding of holdings) {
      holding.weight /= totalPercentage;
    }
  }
  
  // If we still don't have valid weights, distribute equally
  if (holdings.length > 0 && totalPercentage === 0) {
    console.log(`No weight data available, distributing equally across ${holdings.length} holdings`);
    const equalWeight = 1.0 / holdings.length;
    for (const holding of holdings) {
      holding.weight = equalWeight;
    }
  }
  
  return holdings;
}

/**
 * Create proxy ETF holdings from allocation percentages
 * Used when user hasn't specified individual tickers
 */
function extractFromAllocation(allocation: PortfolioData): Holding[] {
  const holdings: Holding[] = [];
  
  // Map allocation to representative ETFs
  if (allocation.stocks && allocation.stocks > 0) {
    holdings.push({
      ticker: 'VTI',
      weight: allocation.stocks / 100,
      assetClass: 'us-large-cap'
    });
  }
  
  if (allocation.bonds && allocation.bonds > 0) {
    holdings.push({
      ticker: 'AGG',
      weight: allocation.bonds / 100,
      assetClass: 'aggregate-bonds'
    });
  }
  
  if (allocation.cash && allocation.cash > 0) {
    holdings.push({
      ticker: 'SHV',
      weight: allocation.cash / 100,
      assetClass: 'cash'
    });
  }
  
  if (allocation.realEstate && allocation.realEstate > 0) {
    holdings.push({
      ticker: 'VNQ',
      weight: allocation.realEstate / 100,
      assetClass: 'us-large-cap' // Real estate ETFs map to this
    });
  }
  
  if (allocation.commodities && allocation.commodities > 0) {
    holdings.push({
      ticker: 'DBC',
      weight: allocation.commodities / 100,
      assetClass: 'commodities'
    });
  }
  
  if (allocation.alternatives && allocation.alternatives > 0) {
    holdings.push({
      ticker: 'GLD',
      weight: allocation.alternatives / 100,
      assetClass: 'gold'
    });
  }
  
  // If no holdings generated, create a default balanced portfolio
  if (holdings.length === 0) {
    console.warn('No allocation data found, creating default 60/40 portfolio');
    holdings.push(
      { ticker: 'VTI', weight: 0.6, assetClass: 'us-large-cap' },
      { ticker: 'AGG', weight: 0.4, assetClass: 'aggregate-bonds' }
    );
  }
  
  return holdings;
}

/**
 * Validate holdings array
 * Ensures weights sum to 1.0 and all required fields are present
 */
export function validateHoldings(holdings: Holding[]): { valid: boolean; error?: string } {
  if (!holdings || holdings.length === 0) {
    return { valid: false, error: 'No holdings provided' };
  }
  
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  
  if (Math.abs(totalWeight - 1.0) > 0.05) {
    return {
      valid: false,
      error: `Holdings weights must sum to 1.0 (currently ${totalWeight.toFixed(3)})`
    };
  }
  
  for (const holding of holdings) {
    if (!holding.ticker || !holding.assetClass) {
      return { valid: false, error: 'Each holding must have ticker and assetClass' };
    }
    
    if (holding.weight < 0 || holding.weight > 1) {
      return { valid: false, error: `Invalid weight for ${holding.ticker}: ${holding.weight}` };
    }
  }
  
  return { valid: true };
}

/**
 * Log holdings for debugging
 */
export function logHoldings(holdings: Holding[]): void {
  console.log('\n📋 Portfolio Holdings:');
  for (const holding of holdings) {
    console.log(`  ${holding.ticker}: ${(holding.weight * 100).toFixed(1)}% (${holding.assetClass})`);
  }
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  console.log(`  Total: ${(totalWeight * 100).toFixed(1)}%\n`);
}
