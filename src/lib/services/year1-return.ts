/**
 * Year 1 Return Calculation Service
 * 
 * Determines the appropriate Year 1 expected return based on position type:
 * 1. Short/Inverse ETF → Index Return × Leverage × -1
 * 2. Index/Sector ETF → (Clockwise Target / Current) - 1
 * 3. Individual Stock → (FactSet Target / Current) - 1
 * 4. Fallback → Asset class average
 */

import { isShortETF, getShortInfo } from '@/lib/constants/clockwise-targets';
import { LONG_TERM_NOMINAL } from './goal-probability';

export type AssetClass = keyof typeof LONG_TERM_NOMINAL;

// 2026 Forward-Looking Expected Returns for Core Portfolio ETFs
const CORE_PORTFOLIO_ETF_RETURNS: Record<string, number> = {
  // Equity ETFs
  'TIME': 0.085,  // Clockwise Core US Equity
  'IDUB': 0.070,  // International Enhanced Yield
  'OSCV': 0.090,  // Small Cap Value
  'VEA': 0.065,   // Developed Markets
  'UPSD': 0.080,  // Large Cap Upside
  'VWO': 0.075,   // Emerging Markets
  'ACIO': 0.070,  // Collared Investment
  'ADME': 0.075,  // Drawdown-Managed Equity
  'DUBS': 0.080,  // Enhanced Yield Equity
  'BRNY': 0.085,  // Factor Rotation
  'VBK': 0.095,   // Small Cap Growth
  
  // Bond ETFs
  'DRSK': 0.045,  // Defined Risk
  'VGIT': 0.040,  // Intermediate Treasury
  'VGSH': 0.042,  // Short-Term Treasury
  'DEFR': 0.050,  // Deferred Income
  'JUCY': 0.055,  // Enhanced Yield Bonds
  
  // Commodities & Alternatives
  'GLD': 0.030,   // Gold
  'IBIT': 0.100,  // Bitcoin
  'CASH': 0.045,  // Cash
};

// Volatility estimates for Core Portfolio ETFs (based on asset class)
export const CORE_PORTFOLIO_ETF_VOLATILITIES: Record<string, number> = {
  // Equity ETFs - typical stock volatility
  'TIME': 0.17,   // 17% - US Large Cap
  'IDUB': 0.16,   // 16% - International (lower vol with options overlay)
  'OSCV': 0.20,   // 20% - Small Cap Value (higher vol)
  'VEA': 0.16,    // 16% - Developed Markets
  'UPSD': 0.15,   // 15% - Large Cap with options (lower vol)
  'VWO': 0.22,    // 22% - Emerging Markets (higher vol)
  'ACIO': 0.12,   // 12% - Collared (reduced vol from collar strategy)
  'ADME': 0.14,   // 14% - Drawdown-Managed (reduced vol)
  'DUBS': 0.15,   // 15% - Enhanced Yield with options overlay
  'BRNY': 0.18,   // 18% - Factor Rotation
  'VBK': 0.21,    // 21% - Small Cap Growth (higher vol)
  
  // Bond ETFs - typical bond volatility
  'DRSK': 0.08,   // 8% - Defined Risk (options add some vol)
  'VGIT': 0.06,   // 6% - Intermediate Treasury
  'VGSH': 0.03,   // 3% - Short-Term Treasury (very low vol)
  'DEFR': 0.07,   // 7% - Deferred Income
  'JUCY': 0.08,   // 8% - Enhanced Yield (higher yield = higher vol)
  
  // Commodities & Alternatives
  'GLD': 0.20,    // 20% - Gold (commodity volatility)
  'IBIT': 0.60,   // 60% - Bitcoin (very high volatility)
  'CASH': 0.01,   // 1% - Cash (minimal volatility)
};

export type Year1ReturnSource = 
  | 'index_vals_expected' // INDEX VALS CSV expected scenario
  | 'factset'           // FactSet analyst target price
  | 'clockwise'         // Clockwise internal index/sector target
  | 'short_formula'     // Calculated from underlying index
  | 'asset_class_fallback'; // Fallback to long-term average

export interface Year1ReturnResult {
  return: number;
  source: Year1ReturnSource;
  details?: string;
}

/**
 * Calculate Year 1 expected return for a position
 * 
 * @param ticker - Stock/ETF ticker symbol
 * @param currentPrice - Current market price
 * @param factsetTargetPrice - FactSet consensus target price (null if not available)
 * @param indexTargets - Map of Clockwise index/sector targets from database
 * @param currentPrices - Map of current prices for all tickers (needed for short calculations)
 * @param assetClass - Asset class for fallback (defaults to 'stocks')
 */
export async function calculateYear1Return(
  ticker: string,
  currentPrice: number,
  factsetTargetPrice: number | null,
  indexTargets: Map<string, number>,
  currentPrices: Map<string, number>,
  assetClass: AssetClass = 'stocks',
  indexScenarioReturns?: Map<string, {bull: number, expected: number, bear: number}>
): Promise<Year1ReturnResult> {
  const upperTicker = ticker.toUpperCase();

  // 0. Check Core Portfolio ETF returns FIRST (2026 forward-looking)
  if (CORE_PORTFOLIO_ETF_RETURNS[upperTicker]) {
    const returnVal = CORE_PORTFOLIO_ETF_RETURNS[upperTicker];
    console.log(`📊 ${upperTicker} using 2026 Core Portfolio forward-looking return: ${(returnVal * 100).toFixed(1)}%`);
    return {
      return: returnVal,
      source: 'index_vals_expected',
      details: `2026 forward-looking return for ${upperTicker} (${(returnVal * 100).toFixed(1)}%)`
    };
  }

  // 1. Check INDEX VALS scenarios (for other ETFs)
  if (indexScenarioReturns && indexScenarioReturns.has(upperTicker)) {
    const scenarios = indexScenarioReturns.get(upperTicker)!;
    console.log(`📊 ${upperTicker} using INDEX VALS expected scenario: ${(scenarios.expected * 100).toFixed(1)}%`);
    return {
      return: scenarios.expected,
      source: 'index_vals_expected',
      details: `INDEX VALS expected scenario for ${upperTicker} (${(scenarios.expected * 100).toFixed(1)}%)`
    };
  }

  // 2. Check if it's a short/inverse ETF
  if (isShortETF(upperTicker)) {
    const shortInfo = getShortInfo(upperTicker)!;
    const { underlying, leverage } = shortInfo;
    
    // Get underlying index target from Clockwise targets
    const indexTarget = indexTargets.get(underlying);
    if (!indexTarget) {
      console.warn(`⚠️ No Clockwise target for underlying ${underlying} of short ${upperTicker}`);
      return {
        return: LONG_TERM_NOMINAL[assetClass],
        source: 'asset_class_fallback',
        details: `Unknown underlying ${underlying} for short ${upperTicker}`
      };
    }
    
    // Get current price of underlying index
    const indexCurrentPrice = currentPrices.get(underlying);
    if (!indexCurrentPrice) {
      console.warn(`⚠️ No current price for underlying ${underlying} of short ${upperTicker}`);
      return {
        return: LONG_TERM_NOMINAL[assetClass],
        source: 'asset_class_fallback',
        details: `Could not get price for ${underlying}`
      };
    }
    
    // Calculate: Index Return × Leverage × -1
    const indexReturn = (indexTarget / indexCurrentPrice) - 1;
    const shortReturn = indexReturn * leverage * -1;
    
    console.log(`📊 ${upperTicker} short calculation:`, {
      underlying,
      indexTarget,
      indexCurrentPrice,
      indexReturn: (indexReturn * 100).toFixed(1) + '%',
      leverage,
      shortReturn: (shortReturn * 100).toFixed(1) + '%'
    });
    
    return {
      return: shortReturn,
      source: 'short_formula',
      details: `${underlying} return ${(indexReturn * 100).toFixed(1)}% × ${leverage} × -1`
    };
  }

  // 3. Check if it's an index/sector ETF with Clockwise target
  const clockwiseTarget = indexTargets.get(upperTicker);
  if (clockwiseTarget) {
    const returnVal = (clockwiseTarget / currentPrice) - 1;
    
    console.log(`📊 ${upperTicker} using Clockwise target:`, {
      target: clockwiseTarget,
      currentPrice,
      return: (returnVal * 100).toFixed(1) + '%'
    });
    
    return {
      return: returnVal,
      source: 'clockwise',
      details: `Clockwise target: $${clockwiseTarget.toFixed(2)}`
    };
  }

  // 4. Individual stock - use FactSet target
  if (factsetTargetPrice && factsetTargetPrice > 0 && currentPrice > 0) {
    const returnVal = (factsetTargetPrice / currentPrice) - 1;
    
    console.log(`📊 ${upperTicker} using FactSet target:`, {
      target: factsetTargetPrice,
      currentPrice,
      return: (returnVal * 100).toFixed(1) + '%'
    });
    
    return {
      return: returnVal,
      source: 'factset',
      details: `FactSet target: $${factsetTargetPrice.toFixed(2)}`
    };
  }

  // 5. Fallback - use asset class average
  console.warn(`⚠️ ${upperTicker} using fallback asset class average (${assetClass})`);
  return {
    return: LONG_TERM_NOMINAL[assetClass],
    source: 'asset_class_fallback',
    details: `No target available, using ${assetClass} average (${(LONG_TERM_NOMINAL[assetClass] * 100).toFixed(1)}%)`
  };
}

/**
 * Batch calculate Year 1 returns for multiple positions
 * More efficient than calling calculateYear1Return individually
 */
export async function batchCalculateYear1Returns(
  positions: Array<{
    ticker: string;
    currentPrice: number;
    factsetTargetPrice: number | null;
    assetClass?: AssetClass;
  }>,
  indexTargets: Map<string, number>,
  currentPrices: Map<string, number>
): Promise<Map<string, Year1ReturnResult>> {
  const results = new Map<string, Year1ReturnResult>();
  
  for (const position of positions) {
    const result = await calculateYear1Return(
      position.ticker,
      position.currentPrice,
      position.factsetTargetPrice,
      indexTargets,
      currentPrices,
      position.assetClass || 'stocks'
    );
    results.set(position.ticker, result);
  }
  
  return results;
}

/**
 * Get tickers needed for short ETF calculations
 * Returns the underlying indices that need price data
 */
export function getRequiredUnderlyingTickers(tickers: string[]): string[] {
  const underlyings = new Set<string>();
  
  for (const ticker of tickers) {
    if (isShortETF(ticker)) {
      const info = getShortInfo(ticker);
      if (info) {
        underlyings.add(info.underlying);
      }
    }
  }
  
  return Array.from(underlyings);
}

