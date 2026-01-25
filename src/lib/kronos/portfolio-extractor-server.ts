/**
 * Server-Only Portfolio Extraction with AI Classification
 * 
 * This file wraps portfolio-extractor.ts and adds AI classification.
 * ONLY import this file from server-side code (API routes, Server Components).
 * 
 * For client-side code, use portfolio-extractor.ts directly.
 */

import type { Holding } from './types';
import type { PortfolioRecord } from './portfolio-extractor';
import { classifyTicker } from './ticker-classifier';

/**
 * Extract and classify holdings with AI (SERVER-ONLY)
 * 
 * @param portfolio - Portfolio record from database
 * @returns Array of Holdings with AI-powered asset class classification
 */
export async function extractHoldingsWithAI(portfolio: PortfolioRecord): Promise<Holding[]> {
  // Import the base extractor
  const { extractHoldingsFromPortfolio } = await import('./portfolio-extractor');
  
  // Extract holdings without classification (client-safe)
  const holdings = await extractHoldingsFromPortfolio(portfolio, false);
  
  // Re-classify each holding with AI for sector-specific accuracy
  const classifiedHoldings: Holding[] = [];
  
  for (const holding of holdings) {
    const classification = await classifyTicker(holding.ticker);
    
    classifiedHoldings.push({
      ...holding,
      assetClass: classification.assetClass
    });
  }
  
  return classifiedHoldings;
}

// Re-export other utilities from portfolio-extractor
export { validateHoldings, logHoldings, type PortfolioRecord } from './portfolio-extractor';
