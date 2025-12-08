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
import { LONG_TERM_AVERAGES } from './goal-probability';

export type AssetClass = keyof typeof LONG_TERM_AVERAGES;

export type Year1ReturnSource = 
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
  assetClass: AssetClass = 'stocks'
): Promise<Year1ReturnResult> {
  const upperTicker = ticker.toUpperCase();

  // 1. Check if it's a short/inverse ETF
  if (isShortETF(upperTicker)) {
    const shortInfo = getShortInfo(upperTicker)!;
    const { underlying, leverage } = shortInfo;
    
    // Get underlying index target from Clockwise targets
    const indexTarget = indexTargets.get(underlying);
    if (!indexTarget) {
      console.warn(`⚠️ No Clockwise target for underlying ${underlying} of short ${upperTicker}`);
      return {
        return: LONG_TERM_AVERAGES[assetClass],
        source: 'asset_class_fallback',
        details: `Unknown underlying ${underlying} for short ${upperTicker}`
      };
    }
    
    // Get current price of underlying index
    const indexCurrentPrice = currentPrices.get(underlying);
    if (!indexCurrentPrice) {
      console.warn(`⚠️ No current price for underlying ${underlying} of short ${upperTicker}`);
      return {
        return: LONG_TERM_AVERAGES[assetClass],
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

  // 2. Check if it's an index/sector ETF with Clockwise target
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

  // 3. Individual stock - use FactSet target
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

  // 4. Fallback - use asset class average
  console.warn(`⚠️ ${upperTicker} using fallback asset class average (${assetClass})`);
  return {
    return: LONG_TERM_AVERAGES[assetClass],
    source: 'asset_class_fallback',
    details: `No target available, using ${assetClass} average (${(LONG_TERM_AVERAGES[assetClass] * 100).toFixed(1)}%)`
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

