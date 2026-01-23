/**
 * Kronos Asset Allocation Scoring
 * 
 * Scores portfolios based solely on asset class allocations without specific ticker holdings.
 * Used for Clockwise standard portfolios (Max Growth, Growth, Moderate, Max Income).
 */

import type { AssetAllocation } from '@/lib/clockwise-portfolios';
import type { Holding } from '@/lib/kronos/types';
import { scorePortfolio } from '@/lib/kronos/scoring';

/**
 * Map simple asset class names to Kronos asset class identifiers
 * 
 * Kronos uses specific asset class IDs that map to historical data
 */
export function mapAssetClassToKronos(assetType: keyof AssetAllocation): string {
  const mapping: Record<keyof AssetAllocation, string> = {
    stocks: 'us-large-cap',        // Use US Large Cap as stocks proxy
    bonds: 'aggregate-bonds',       // Use AGG-style aggregate bonds
    commodities: 'commodities',     // Generic commodities basket
    realEstate: 'us-large-cap',     // Use stocks as real estate proxy (REITs not in historical data)
    cash: 'cash'                    // Cash/money market
  };
  
  return mapping[assetType];
}

/**
 * Convert asset allocations to Kronos holdings format
 * 
 * Creates "virtual holdings" representing each asset class
 * Uses generic tickers as placeholders since Kronos scoring works on asset class level
 */
export function assetAllocationToHoldings(allocations: AssetAllocation): Holding[] {
  // Representative tickers for each asset class (for display purposes)
  const assetClassTickers: Record<keyof AssetAllocation, string> = {
    stocks: 'SPY',      // S&P 500 ETF
    bonds: 'AGG',       // iShares Core U.S. Aggregate Bond
    commodities: 'DBC', // Invesco DB Commodity Index
    realEstate: 'VNQ',  // Vanguard Real Estate ETF
    cash: 'CASH'        // Cash position
  };

  const holdings: Holding[] = [];

  // Convert each non-zero allocation to a holding
  for (const [assetType, weight] of Object.entries(allocations)) {
    if (weight > 0) {
      holdings.push({
        ticker: assetClassTickers[assetType as keyof AssetAllocation],
        weight: weight,
        assetClass: mapAssetClassToKronos(assetType as keyof AssetAllocation)
      });
    }
  }

  // Validate total weight
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    console.warn(`⚠️ Asset allocation weights sum to ${totalWeight.toFixed(3)}, expected 1.0`);
  }

  return holdings;
}

/**
 * Score a portfolio based on asset allocations only
 * 
 * @param question - Scenario question
 * @param allocations - Asset class allocations (must sum to 1.0)
 * @param portfolioName - Name for logging purposes
 * @returns Complete ScoreResult
 */
export async function scoreAssetAllocationPortfolio(
  question: string,
  allocations: AssetAllocation,
  portfolioName: string = 'Portfolio'
) {
  console.log(`\n📊 Scoring asset-allocation portfolio: ${portfolioName}`);
  console.log(`Allocations:`, {
    stocks: `${(allocations.stocks * 100).toFixed(1)}%`,
    bonds: `${(allocations.bonds * 100).toFixed(1)}%`,
    commodities: `${(allocations.commodities * 100).toFixed(1)}%`,
    realEstate: `${(allocations.realEstate * 100).toFixed(1)}%`,
    cash: `${(allocations.cash * 100).toFixed(1)}%`
  });

  // Convert to holdings format
  const holdings = assetAllocationToHoldings(allocations);

  // Score using standard Kronos logic
  const result = await scorePortfolio(question, holdings);

  console.log(`✅ ${portfolioName} Score: ${result.score}/100`);

  return result;
}

/**
 * Score multiple asset-allocation portfolios in parallel
 * 
 * Efficiently scores multiple portfolios against the same question
 */
export async function scoreMultipleAssetAllocationPortfolios(
  question: string,
  portfolios: Array<{ name: string; allocations: AssetAllocation }>
) {
  console.log(`\n🚀 Scoring ${portfolios.length} asset-allocation portfolios in parallel...`);

  const results = await Promise.all(
    portfolios.map(p => scoreAssetAllocationPortfolio(question, p.allocations, p.name))
  );

  return results.map((result, index) => ({
    name: portfolios[index].name,
    ...result
  }));
}
