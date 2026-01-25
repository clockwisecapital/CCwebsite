/**
 * Kronos Portfolio Scoring Engine - Data Sources
 * 
 * Yahoo Finance integration for fetching historical asset class returns
 */

import type { AssetReturns, KronosAssetClass, BenchmarkData, PriceData, HistoricalReturnCache } from './types';
import { fetchYahooFinanceData } from '@/lib/market-data';
import { getVerifiedHistoricalReturn, hasVerifiedData } from './historical-indices';

// =====================================================================================
// PREDEFINED FALLBACK RETURNS FOR COMMON SCENARIOS
// =====================================================================================
// These are based on historical data and are used when Yahoo Finance fails
const FALLBACK_RETURNS_BY_SCENARIO: Record<string, Record<KronosAssetClass, number>> = {
  'COVID_CRASH': {
    'us-large-cap': -0.339,        // S&P 500 in COVID crash (Feb-Mar 2020)
    'us-growth': -0.38,
    'us-value': -0.30,
    'us-small-cap': -0.34,
    'international': -0.36,
    'emerging-markets': -0.32,
    'tech-sector': -0.28,
    'healthcare': -0.24,
    'financials': -0.42,
    'energy': -0.48,
    'long-treasuries': 0.109,      // Treasuries gained (flight to safety)
    'intermediate-treasuries': 0.087,
    'short-treasuries': 0.045,
    'tips': 0.08,
    'aggregate-bonds': 0.085,
    'corporate-ig': 0.05,
    'high-yield': -0.28,
    'gold': 0.03,                  // Gold slightly up
    'commodities': -0.24,
    'cash': 0.02
  },
  'DOT_COM_BUST': {
    'us-large-cap': -0.50,         // S&P 500: ~-50% total return 2000-2002
    'us-growth': -0.65,            // Growth stocks hit hardest
    'us-value': -0.28,             // Value held up better
    'us-small-cap': -0.20,         // Small caps more resilient
    'international': -0.35,        // International also down
    'emerging-markets': -0.40,     // EMs suffered
    'tech-sector': -0.75,          // Tech devastated
    'healthcare': -0.15,           // Defensive sectors better
    'financials': -0.25,           // Banks struggled
    'energy': -0.15,               // Energy mixed
    'long-treasuries': 0.12,       // Bonds rallied (flight to safety) - more realistic
    'intermediate-treasuries': 0.10, // Intermediate also up
    'short-treasuries': 0.05,      // Short-term less volatile
    'tips': 0.08,                  // TIPS modest gains
    'aggregate-bonds': 0.10,       // Aggregate bond index positive
    'corporate-ig': 0.05,          // IG bonds okay
    'high-yield': -0.10,           // High yield struggled
    'gold': 0.15,                  // Gold positive but moderate
    'commodities': -0.15,          // Commodities down
    'cash': 0.08                   // Cash/T-bills earned ~2-3% annually
  },
  'RATE_SHOCK': {
    'us-large-cap': -0.18,         // 2022 returns
    'us-growth': -0.30,
    'us-value': -0.08,
    'us-small-cap': -0.20,
    'international': -0.20,
    'emerging-markets': -0.18,
    'tech-sector': -0.35,
    'healthcare': -0.12,
    'financials': -0.06,
    'energy': 0.55,                // Energy rallied
    'long-treasuries': -0.24,      // Bonds crushed by rates
    'intermediate-treasuries': -0.12,
    'short-treasuries': -0.02,
    'tips': -0.08,
    'aggregate-bonds': -0.14,
    'corporate-ig': -0.14,
    'high-yield': -0.18,
    'gold': -0.02,
    'commodities': 0.28,           // Commodities rallied
    'cash': 0.15                   // Cash got attractive
  },
  'STAGFLATION': {
    'us-large-cap': -0.37,         // 1973-1974
    'us-growth': -0.42,
    'us-value': -0.30,
    'us-small-cap': -0.35,
    'international': -0.32,
    'emerging-markets': -0.38,
    'tech-sector': -0.45,
    'healthcare': -0.28,
    'financials': -0.40,
    'energy': 0.45,                // Energy rallied
    'long-treasuries': -0.10,      // Bonds negative
    'intermediate-treasuries': -0.05,
    'short-treasuries': 0.08,
    'tips': 0.15,                  // Inflation protection
    'aggregate-bonds': -0.08,
    'corporate-ig': -0.12,
    'high-yield': -0.18,
    'gold': 0.65,                  // Gold rallied dramatically
    'commodities': 0.55,           // Commodities up
    'cash': 0.10
  }
};

// =====================================================================================
// ASSET CLASS TO ETF MAPPING
// =====================================================================================

/**
 * Maps Kronos asset classes to representative ETFs
 * These ETFs are used to calculate historical returns for each asset class
 * 
 * For older periods (pre-2004), we use SPY/TLT/GLD and fallback data
 * since most ETFs didn't exist
 */
export const ASSET_CLASS_ETFS: Record<KronosAssetClass, string> = {
  'us-large-cap': 'SPY',           // S&P 500 (launched 1993)
  'us-growth': 'VUG',              // Vanguard Growth (launched 2004)
  'us-value': 'VTV',               // Vanguard Value (launched 2004)
  'us-small-cap': 'VB',            // Vanguard Small Cap (launched 2004)
  'international': 'VXUS',         // Total International Stock (launched 2011)
  'emerging-markets': 'VWO',       // Emerging Markets (launched 2005)
  'tech-sector': 'XLK',            // Technology Sector (launched 1998)
  'healthcare': 'XLV',             // Healthcare Sector (launched 1998)
  'financials': 'XLF',             // Financial Sector (launched 1998)
  'energy': 'XLE',                 // Energy Sector (launched 1998)
  'long-treasuries': 'TLT',        // 20+ Year Treasury (launched 2002)
  'intermediate-treasuries': 'IEF', // 7-10 Year Treasury (launched 2002)
  'short-treasuries': 'SHY',       // 1-3 Year Treasury (launched 2002)
  'tips': 'TIP',                   // TIPS (launched 2003)
  'aggregate-bonds': 'AGG',        // Aggregate Bond Market (launched 2003)
  'corporate-ig': 'LQD',           // Investment Grade Corporate (launched 2002)
  'high-yield': 'HYG',             // High Yield Corporate (launched 2007)
  'gold': 'GLD',                   // Gold (launched 2004)
  'commodities': 'DBC',            // Commodities (launched 2006)
  'cash': 'SHV'                    // Short Treasury (launched 2007)
};

/**
 * ETF launch dates - used to determine if we should use fallback data
 */
const ETF_LAUNCH_DATES: Record<string, string> = {
  'SPY': '1993-01-22',
  'XLK': '1998-12-16',
  'XLV': '1998-12-16',
  'XLF': '1998-12-16',
  'XLE': '1998-12-16',
  'TLT': '2002-07-22',
  'IEF': '2002-07-22',
  'SHY': '2002-07-22',
  'LQD': '2002-07-22',
  'TIP': '2003-12-04',
  'AGG': '2003-09-22',
  'VUG': '2004-01-26',
  'VTV': '2004-01-26',
  'VB': '2004-01-26',
  'GLD': '2004-11-18',
  'VWO': '2005-03-04',
  'DBC': '2006-02-03',
  'HYG': '2007-04-04',
  'SHV': '2007-01-10',
  'VXUS': '2011-01-26'
};

// =====================================================================================
// IN-MEMORY CACHE
// =====================================================================================

/**
 * In-memory cache for historical returns
 * Key format: `${analogId}:${assetClass}`
 * Prevents duplicate API calls within the same request
 */
const historicalReturnCache: HistoricalReturnCache = {};

/**
 * Clear the cache (useful for testing)
 */
export function clearHistoricalReturnCache(): void {
  Object.keys(historicalReturnCache).forEach(key => delete historicalReturnCache[key]);
}

// =====================================================================================
// HISTORICAL RETURN FETCHING
// =====================================================================================

/**
 * Fetch historical return for a single asset class
 * 
 * @param assetClass - The asset class to fetch
 * @param startDate - Period start date
 * @param endDate - Period end date
 * @returns Return as decimal (e.g., -0.339 for -33.9%), or null on error
 */
export async function fetchHistoricalAssetClassReturn(
  assetClass: KronosAssetClass,
  startDate: Date,
  endDate: Date
): Promise<number | null> {
  try {
    const etfTicker = ASSET_CLASS_ETFS[assetClass];
    if (!etfTicker) {
      console.error(`No ETF mapping for asset class: ${assetClass}`);
      return null;
    }

    // Check if ETF existed during this period
    const launchDate = ETF_LAUNCH_DATES[etfTicker];
    if (launchDate) {
      const launchDateTime = new Date(launchDate).getTime();
      const requestStartTime = startDate.getTime();
      
      if (requestStartTime < launchDateTime) {
        const launchYear = new Date(launchDate).getFullYear();
        const requestYear = startDate.getFullYear();
        console.warn(`⏳ ${etfTicker} didn't exist in ${requestYear} (launched ${launchYear}), will use fallback data`);
        return null; // Will trigger fallback in calling function
      }
    }

    // Fetch price data from Yahoo Finance
    const priceData = await fetchYahooFinanceData(etfTicker, startDate, endDate);
    
    if (!priceData || priceData.length < 2) {
      console.warn(`Insufficient price data for ${assetClass} (${etfTicker})`);
      return null;
    }

    // Calculate return: (endPrice / startPrice) - 1
    const startPrice = priceData[0].close;
    const endPrice = priceData[priceData.length - 1].close;
    
    if (startPrice <= 0 || endPrice <= 0) {
      console.error(`Invalid prices for ${assetClass}: start=${startPrice}, end=${endPrice}`);
      return null;
    }

    const returnValue = (endPrice / startPrice) - 1;
    
    // Validate return is reasonable (-100% to +500%)
    if (returnValue < -1.0 || returnValue > 5.0) {
      console.warn(`Unusual return for ${assetClass}: ${(returnValue * 100).toFixed(1)}%`);
    }
    
    console.log(`✓ ${assetClass} (${etfTicker}): ${(returnValue * 100).toFixed(2)}%`);
    return returnValue;

  } catch (error) {
    console.error(`Error fetching return for ${assetClass}:`, error);
    return null;
  }
}

/**
 * Fetch returns for all asset classes in parallel
 * 
 * @param analogId - Historical analog ID (for caching)
 * @param dateRange - Period start and end dates
 * @returns AssetReturns object with all asset class returns
 */
export async function fetchAllAssetClassReturns(
  analogId: string,
  dateRange: { start: string; end: string }
): Promise<AssetReturns> {
  console.log(`📊 Fetching asset class returns for ${analogId} (${dateRange.start} to ${dateRange.end})`);
  
  // Step 1: Check persistent Supabase cache first
  try {
    const { getCachedAssetReturns } = await import('./asset-returns-cache');
    const cacheResult = await getCachedAssetReturns(analogId);
    
    if (cacheResult.found && cacheResult.assetReturns) {
      console.log(`✅ Using persistent cached asset returns for ${analogId}`);
      return cacheResult.assetReturns;
    }
  } catch (error) {
    console.warn('⚠️ Could not check persistent cache:', error);
  }
  
  // Step 2: Cache miss - fetch from Yahoo Finance
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  // Get all asset classes
  const assetClasses = Object.keys(ASSET_CLASS_ETFS) as KronosAssetClass[];
  
  // Fetch returns with controlled concurrency (batch of 5 at a time)
  const BATCH_SIZE = 5;
  const results: Array<{ assetClass: KronosAssetClass; return: number | null }> = [];
  
  for (let i = 0; i < assetClasses.length; i += BATCH_SIZE) {
    const batch = assetClasses.slice(i, i + BATCH_SIZE);
    console.log(`📦 Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(assetClasses.length / BATCH_SIZE)}: ${batch.join(', ')}`);
    
    const batchPromises = batch.map(async (assetClass) => {
      // Check in-memory cache first (for this request)
      const cacheKey = `${analogId}:${assetClass}`;
      if (historicalReturnCache[cacheKey] !== undefined) {
        console.log(`📦 Using in-memory cached return for ${assetClass}`);
        return { assetClass, return: historicalReturnCache[cacheKey] };
      }
      
      // Fetch from Yahoo Finance
      const returnValue = await fetchHistoricalAssetClassReturn(assetClass, startDate, endDate);
      
      // Cache the result in-memory (for this request)
      if (returnValue !== null) {
        historicalReturnCache[cacheKey] = returnValue;
      }
      
      return { assetClass, return: returnValue };
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  // Build AssetReturns object
  const assetReturns: AssetReturns = {};
  let successCount = 0;
  let verifiedCount = 0;
  
  // Get fallback returns for this scenario
  const scenarioFallbacks = FALLBACK_RETURNS_BY_SCENARIO[analogId] || FALLBACK_RETURNS_BY_SCENARIO['COVID_CRASH'];
  
  for (const { assetClass, return: returnValue } of results) {
    if (returnValue !== null) {
      assetReturns[assetClass] = returnValue;
      successCount++;
    } else {
      // Priority 1: Try verified historical data first
      const verifiedData = getVerifiedHistoricalReturn(analogId, assetClass);
      if (verifiedData) {
        assetReturns[assetClass] = verifiedData.return;
        verifiedCount++;
        console.log(`📚 Using verified historical data for ${assetClass}: ${(verifiedData.return * 100).toFixed(1)}% (${verifiedData.source})`);
      } else {
        // Priority 2: Use scenario-specific fallback
        const fallback = scenarioFallbacks[assetClass] || 0;
        assetReturns[assetClass] = fallback;
        console.warn(`⚠️ Using estimated fallback for ${assetClass}: ${(fallback * 100).toFixed(1)}%`);
      }
    }
  }
  
  console.log(`✅ Data sources: ${successCount} real-time ETFs, ${verifiedCount} verified historical indices, ${assetClasses.length - successCount - verifiedCount} estimates`);
  console.log(`✅ Total: ${assetClasses.length} asset class returns validated`);
  
  // Step 3: Store in persistent cache for next time
  try {
    const { setCachedAssetReturns } = await import('./asset-returns-cache');
    await setCachedAssetReturns(analogId, assetReturns, dateRange, ASSET_CLASS_ETFS);
  } catch (error) {
    console.warn('⚠️ Could not store in persistent cache:', error);
  }
  
  return assetReturns;
}

/**
 * Calculate duration in years between two dates
 */
export function calculateScenarioDuration(
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years
  return Math.max(diffYears, 0.01); // Minimum 0.01 to avoid division by zero
}

/**
 * Annualize a cumulative return using CAGR
 * @param cumulativeReturn - Total return over the period (e.g., 1.8 for 180%)
 * @param years - Duration in years
 * @returns Annualized 1-year equivalent return
 */
export function annualizeReturn(
  cumulativeReturn: number,
  years: number
): number {
  // If already 1 year or less, no conversion needed
  if (years <= 1) {
    return cumulativeReturn;
  }
  
  // Handle edge case: complete loss
  if (cumulativeReturn <= -1) {
    return -1;
  }
  
  // CAGR formula: (1 + r)^(1/n) - 1
  const annualized = Math.pow(1 + cumulativeReturn, 1 / years) - 1;
  
  console.log(`📊 Annualized: ${(cumulativeReturn * 100).toFixed(2)}% over ${years.toFixed(2)}yr → ${(annualized * 100).toFixed(2)}%/yr`);
  
  return annualized;
}

/**
 * Fetch S&P 500 benchmark return and max drawdown
 * 
 * @param analogId - Historical analog ID (for caching)
 * @param dateRange - Period start and end dates
 * @returns Benchmark data with return and drawdown
 */
// Predefined S&P 500 benchmark returns for common scenarios
const FALLBACK_SP500_BENCHMARKS: Record<string, BenchmarkData> = {
  'COVID_CRASH': { return: -0.339, drawdown: 0.339 },
  'DOT_COM_BUST': { return: -0.50, drawdown: 0.50 },
  'RATE_SHOCK': { return: -0.18, drawdown: 0.20 },
  'STAGFLATION': { return: -0.37, drawdown: 0.48 }
};

export async function fetchSP500Benchmark(
  analogId: string,
  dateRange: { start: string; end: string }
): Promise<BenchmarkData> {
  console.log(`📈 Fetching S&P 500 benchmark for ${analogId}`);
  
  // Check cache
  const cacheKey = `${analogId}:SP500`;
  if (historicalReturnCache[cacheKey] !== undefined) {
    const cachedReturn = historicalReturnCache[cacheKey];
    const cachedDrawdown = historicalReturnCache[`${analogId}:SP500:drawdown`] || Math.abs(cachedReturn);
    return { return: cachedReturn, drawdown: cachedDrawdown };
  }
  
  try {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Fetch S&P 500 Total Return Index (^SP500TR)
    const priceData = await fetchYahooFinanceData('^SP500TR', startDate, endDate);
    
    if (!priceData || priceData.length < 2) {
      console.warn('Using fallback S&P 500 data');
      // Fallback to SPY if ^SP500TR fails
      const spyData = await fetchYahooFinanceData('SPY', startDate, endDate);
      if (!spyData || spyData.length < 2) {
        throw new Error('Unable to fetch S&P 500 data');
      }
      return calculateBenchmarkMetrics(spyData, analogId);
    }
    
    return calculateBenchmarkMetrics(priceData, analogId);
    
  } catch (error) {
    console.error('Error fetching S&P 500 benchmark:', error);
    // Use scenario-specific fallback
    const fallback = FALLBACK_SP500_BENCHMARKS[analogId] || { return: -0.20, drawdown: 0.20 };
    console.warn(`⚠️ Using fallback S&P 500 benchmark: ${(fallback.return * 100).toFixed(1)}% return, ${(fallback.drawdown * 100).toFixed(1)}% drawdown`);
    return fallback;
  }
}

/**
 * Calculate return and max drawdown from price data
 */
function calculateBenchmarkMetrics(priceData: PriceData[], analogId: string): BenchmarkData {
  const startPrice = priceData[0].close;
  const endPrice = priceData[priceData.length - 1].close;
  
  // Calculate period return
  const periodReturn = (endPrice / startPrice) - 1;
  
  // Calculate max drawdown
  let peak = startPrice;
  let maxDrawdown = 0;
  
  for (const dataPoint of priceData) {
    if (dataPoint.close > peak) {
      peak = dataPoint.close;
    }
    const drawdown = (peak - dataPoint.close) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Cache the results
  historicalReturnCache[`${analogId}:SP500`] = periodReturn;
  historicalReturnCache[`${analogId}:SP500:drawdown`] = maxDrawdown;
  
  console.log(`✓ S&P 500: Return ${(periodReturn * 100).toFixed(2)}%, Max Drawdown ${(maxDrawdown * 100).toFixed(2)}%`);
  
  return {
    return: periodReturn,
    drawdown: maxDrawdown
  };
}

/**
 * Validate that asset returns are reasonable
 * Logs warnings but doesn't block scoring
 */
export function validateAssetReturns(assetReturns: AssetReturns): void {
  const assetClasses = Object.keys(assetReturns);
  
  for (const assetClass of assetClasses) {
    const returnValue = assetReturns[assetClass];
    
    // Check for unreasonable values
    if (returnValue < -0.95) {
      console.warn(`⚠️ Extreme negative return for ${assetClass}: ${(returnValue * 100).toFixed(1)}%`);
    }
    if (returnValue > 3.0) {
      console.warn(`⚠️ Extreme positive return for ${assetClass}: ${(returnValue * 100).toFixed(1)}%`);
    }
  }
  
  console.log(`✅ Validated ${assetClasses.length} asset class returns`);
}
