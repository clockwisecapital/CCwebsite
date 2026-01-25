/**
 * Server-Only Kronos Integration Functions
 * 
 * This file contains functions that use AI classification and server-only code.
 * ONLY import this from API routes or Server Components.
 * 
 * For client-safe integration functions, use integration.ts
 */

import type { PortfolioHolding } from './integration';
import { extractHoldingsWithAI } from './portfolio-extractor-server';

/**
 * Convert database portfolio holdings to Kronos format with AI classification (SERVER-ONLY)
 * 
 * @param portfolioId - Portfolio ID to fetch and extract holdings from
 * @returns Array of holdings with AI-powered asset class classification
 */
export async function getPortfolioHoldingsWithAI(portfolioId: string): Promise<PortfolioHolding[]> {
  const { supabase } = await import('@/lib/supabase/client');
  
  try {
    // Fetch portfolio data from database (including intake_data for proxy portfolios)
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, portfolio_data, intake_data, name')
      .eq('id', portfolioId)
      .single();
    
    if (portfolioError || !portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }
    
    if (!portfolio.portfolio_data) {
      throw new Error('Portfolio has no data');
    }
    
    // Use server-only extractor with AI classification for sector-specific accuracy
    const holdings = await extractHoldingsWithAI(portfolio);
    
    // Convert to PortfolioHolding format expected by integration layer
    const portfolioHoldings: PortfolioHolding[] = holdings.map(h => ({
      ticker: h.ticker,
      weight: h.weight,
      name: h.ticker,
      assetClass: h.assetClass
    }));
    
    // Validate weights sum to approximately 1.0
    const totalWeight = portfolioHoldings.reduce((sum, h) => sum + h.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      console.warn(`Portfolio ${portfolioId} weights sum to ${totalWeight.toFixed(3)}, expected 1.000`);
    }
    
    return portfolioHoldings;
  } catch (error) {
    console.error('Error getting portfolio holdings:', error);
    throw error;
  }
}

// Re-export other server-safe functions from integration.ts
export { runScenarioTest } from './integration';
