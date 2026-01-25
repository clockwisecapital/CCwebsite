/**
 * TIME Portfolio Cache Service (Supabase-backed)
 * 
 * Provides persistent caching for TIME portfolio analysis using Supabase.
 * Caches have a 6-hour TTL and can be refreshed via API or scheduled jobs.
 * 
 * This replaces in-memory caching with durable database storage.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { PositionAnalysis } from '@/types/portfolio';
import type { Json } from '@/lib/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

export interface CachedTimePortfolio {
  positions: PositionAnalysis[];
  topPositions: PositionAnalysis[];
  expectedReturn: number;
  year1Return: number;
  portfolioMonteCarlo: {
    upside: number;
    downside: number;
    median: number;
    volatility: number;
  };
  timeHorizon: number;
  updatedAt: Date;
}

interface TimePortfolioCacheRow {
  id: string;
  cache_key: string;
  positions: PositionAnalysis[];
  top_positions: PositionAnalysis[];
  expected_return: number;
  year1_return: number;
  portfolio_upside: number;
  portfolio_downside: number;
  portfolio_median: number;
  portfolio_volatility: number;
  time_horizon: number;
  created_at: string;
  updated_at: string;
}

interface VolatilityCacheRow {
  id: string;
  ticker: string;
  volatility: number;
  source: string;
  created_at: string;
  updated_at: string;
}

// Cache TTL (used for validation)
const TIME_PORTFOLIO_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const VOLATILITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;    // 24 hours

// ============================================================================
// TIME PORTFOLIO CACHE FUNCTIONS
// ============================================================================

/**
 * Check if TIME portfolio cache is valid (within TTL)
 */
export async function isTimePortfolioCacheValid(): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('time_portfolio_cache')
      .select('updated_at')
      .eq('cache_key', 'default')
      .single();
    
    if (error || !data) return false;
    
    const updatedAt = new Date(data.updated_at);
    const age = Date.now() - updatedAt.getTime();
    const isValid = age < TIME_PORTFOLIO_CACHE_TTL_MS;
    
    if (!isValid) {
      console.log('📦 TIME portfolio cache expired (age: ' + Math.round(age / 60000) + ' min)');
    }
    
    return isValid;
  } catch (error) {
    console.error('Error checking TIME portfolio cache:', error);
    return false;
  }
}

/**
 * Get cached TIME portfolio data from Supabase
 */
export async function getCachedTimePortfolio(): Promise<CachedTimePortfolio | null> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('time_portfolio_cache')
      .select('*')
      .eq('cache_key', 'default')
      .single();
    
    if (error || !data) {
      console.log('📦 No TIME portfolio cache found');
      return null;
    }
    
    // Cast through unknown since Supabase returns Json type
    const row = data as unknown as TimePortfolioCacheRow;
    
    // Check if cache is still valid
    const updatedAt = new Date(row.updated_at);
    const age = Date.now() - updatedAt.getTime();
    
    if (age > TIME_PORTFOLIO_CACHE_TTL_MS) {
      console.log('📦 TIME portfolio cache expired (age: ' + Math.round(age / 60000) + ' min)');
      return null;
    }
    
    console.log('✅ Using cached TIME portfolio data (age: ' + Math.round(age / 60000) + ' min)');
    
    return {
      positions: row.positions,
      topPositions: row.top_positions,
      expectedReturn: row.expected_return,
      year1Return: row.year1_return,
      portfolioMonteCarlo: {
        upside: row.portfolio_upside,
        downside: row.portfolio_downside,
        median: row.portfolio_median,
        volatility: row.portfolio_volatility || 0.15, // Default to 15% if missing (for old cache)
      },
      timeHorizon: row.time_horizon,
      updatedAt,
    };
  } catch (error) {
    console.error('Error fetching TIME portfolio cache:', error);
    return null;
  }
}

/**
 * Store TIME portfolio data in Supabase cache
 */
export async function setCachedTimePortfolio(data: {
  positions: PositionAnalysis[];
  topPositions: PositionAnalysis[];
  expectedReturn: number;
  year1Return: number;
  portfolioMonteCarlo: {
    upside: number;
    downside: number;
    median: number;
    volatility: number;
  };
  timeHorizon?: number;
}): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const cacheData = {
      cache_key: 'default',
      positions: data.positions as unknown as Json,
      top_positions: data.topPositions as unknown as Json,
      expected_return: data.expectedReturn,
      year1_return: data.year1Return,
      portfolio_upside: data.portfolioMonteCarlo.upside,
      portfolio_downside: data.portfolioMonteCarlo.downside,
      portfolio_median: data.portfolioMonteCarlo.median,
      portfolio_volatility: data.portfolioMonteCarlo.volatility,
      time_horizon: data.timeHorizon || 10,
    };
    
    // Upsert (insert or update)
    const { error } = await supabase
      .from('time_portfolio_cache')
      .upsert(cacheData, { onConflict: 'cache_key' });
    
    if (error) {
      console.error('Error saving TIME portfolio cache:', error);
      return false;
    }
    
    console.log('📦 TIME portfolio cached to Supabase');
    return true;
  } catch (error) {
    console.error('Error saving TIME portfolio cache:', error);
    return false;
  }
}

/**
 * Clear TIME portfolio cache
 */
export async function clearTimePortfolioCache(): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();
    
    await supabase
      .from('time_portfolio_cache')
      .delete()
      .eq('cache_key', 'default');
    
    console.log('🗑️ TIME portfolio cache cleared');
  } catch (error) {
    console.error('Error clearing TIME portfolio cache:', error);
  }
}

// ============================================================================
// VOLATILITY CACHE FUNCTIONS
// ============================================================================

/**
 * Check if volatility cache entry is valid (within TTL)
 */
export async function isVolatilityCacheValid(ticker: string): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('volatility_cache')
      .select('updated_at')
      .eq('ticker', ticker.toUpperCase())
      .single();
    
    if (error || !data) return false;
    
    const updatedAt = new Date(data.updated_at);
    const age = Date.now() - updatedAt.getTime();
    
    return age < VOLATILITY_CACHE_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Get cached volatility for a ticker
 */
export async function getCachedVolatility(ticker: string): Promise<number | null> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('volatility_cache')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .single();
    
    if (error || !data) return null;
    
    const row = data as VolatilityCacheRow;
    
    // Check if cache is still valid
    const updatedAt = new Date(row.updated_at);
    const age = Date.now() - updatedAt.getTime();
    
    if (age > VOLATILITY_CACHE_TTL_MS) {
      return null;
    }
    
    return row.volatility;
  } catch {
    return null;
  }
}

/**
 * Store volatility in cache
 */
export async function setCachedVolatility(ticker: string, volatility: number): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { error } = await supabase
      .from('volatility_cache')
      .upsert({
        ticker: ticker.toUpperCase(),
        volatility,
        source: 'yahoo_finance',
      }, { onConflict: 'ticker' });
    
    if (error) {
      console.error(`Error caching volatility for ${ticker}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error caching volatility for ${ticker}:`, error);
    return false;
  }
}

/**
 * Batch set volatilities in cache
 */
export async function batchSetCachedVolatilities(
  entries: Array<{ ticker: string; volatility: number }>
): Promise<{ success: number; failed: number }> {
  const supabase = createAdminSupabaseClient();
  
  const upsertData = entries.map(entry => ({
    ticker: entry.ticker.toUpperCase(),
    volatility: entry.volatility,
    source: 'yahoo_finance',
  }));
  
  const { error } = await supabase
    .from('volatility_cache')
    .upsert(upsertData, { onConflict: 'ticker' });
  
  if (error) {
    console.error('Error batch caching volatilities:', error);
    return { success: 0, failed: entries.length };
  }
  
  console.log(`📦 Cached volatility for ${entries.length} tickers`);
  return { success: entries.length, failed: 0 };
}

/**
 * Get all cached volatilities
 */
export async function getAllCachedVolatilities(): Promise<Map<string, number>> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('volatility_cache')
      .select('ticker, volatility, updated_at');
    
    if (error || !data) return new Map();
    
    const now = Date.now();
    const validCache = new Map<string, number>();
    
    for (const row of data) {
      const age = now - new Date(row.updated_at).getTime();
      if (age < VOLATILITY_CACHE_TTL_MS) {
        validCache.set(row.ticker, row.volatility);
      }
    }
    
    return validCache;
  } catch {
    return new Map();
  }
}

/**
 * Clear volatility cache
 */
export async function clearVolatilityCache(): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();
    
    await supabase
      .from('volatility_cache')
      .delete()
      .neq('ticker', ''); // Delete all
    
    console.log('🗑️ Volatility cache cleared');
  } catch (error) {
    console.error('Error clearing volatility cache:', error);
  }
}

// ============================================================================
// TIME PORTFOLIO ANALOG CACHE (for Scenario Testing)
// ============================================================================

export interface CachedTimeAnalogScore {
  id?: string;
  analog_id: string;
  analog_name: string;
  analog_period: string;
  holdings: any;
  holdings_date: string;
  score: number;
  label: string;
  color: string;
  portfolio_return: number;
  benchmark_return: number;
  outperformance: number;
  portfolio_drawdown: number;
  benchmark_drawdown: number;
  return_score: number;
  drawdown_score: number;
  scenario_id?: string;
  scenario_name?: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get cached TIME portfolio score for a specific analog
 */
export async function getCachedTimeAnalogScore(
  analogId: string,
  version: number = 1
): Promise<CachedTimeAnalogScore | null> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // @ts-ignore - time_portfolio_analog_cache not yet in generated types
    const { data, error } = await supabase
      .from('time_portfolio_analog_cache')
      .select('*')
      .eq('analog_id', analogId)
      .eq('version', version)
      .single();
    
    if (error || !data) {
      console.log(`📦 No TIME analog cache found for ${analogId}`);
      return null;
    }
    
    console.log(`✅ Cache HIT: TIME × ${analogId} (score: ${data.score}/100)`);
    return data as CachedTimeAnalogScore;
  } catch (error) {
    console.error('Error fetching TIME analog cache:', error);
    return null;
  }
}

/**
 * Store TIME portfolio analog score
 */
export async function setCachedTimeAnalogScore(
  data: Omit<CachedTimeAnalogScore, 'id' | 'created_at' | 'updated_at'>
): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // @ts-ignore - time_portfolio_analog_cache not yet in generated types
    const { error } = await supabase
      .from('time_portfolio_analog_cache')
      .upsert(data, { onConflict: 'analog_id,version' });
    
    if (error) {
      console.error('Error caching TIME analog score:', error);
      return false;
    }
    
    console.log(`📦 Cached TIME × ${data.analog_id} (score: ${data.score}/100)`);
    return true;
  } catch (error) {
    console.error('Error caching TIME analog score:', error);
    return false;
  }
}

/**
 * Clear TIME analog cache for a specific version
 */
export async function clearTimeAnalogCache(version?: number): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // @ts-ignore - time_portfolio_analog_cache not yet in generated types
    let query = supabase.from('time_portfolio_analog_cache').delete();
    
    if (version !== undefined) {
      query = query.eq('version', version);
    } else {
      query = query.neq('analog_id', ''); // Delete all
    }
    
    await query;
    console.log(`🗑️ TIME analog cache cleared${version ? ` (version ${version})` : ''}`);
  } catch (error) {
    console.error('Error clearing TIME analog cache:', error);
  }
}

/**
 * Check if TIME analog cache is populated for all analogs
 */
export async function isTimeAnalogCachePopulated(version: number = 1): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // @ts-ignore - time_portfolio_analog_cache not yet in generated types
    const { count, error } = await supabase
      .from('time_portfolio_analog_cache')
      .select('*', { count: 'exact', head: true })
      .eq('version', version);
    
    if (error) return false;
    
    // Expect 4 entries (4 analogs)
    return count === 4;
  } catch {
    return false;
  }
}

// ============================================================================
// COMBINED CACHE MANAGEMENT
// ============================================================================

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  await Promise.all([
    clearTimePortfolioCache(),
    clearVolatilityCache(),
    clearTimeAnalogCache(),
  ]);
  console.log('🗑️ All portfolio caches cleared');
}

/**
 * Get combined cache stats
 */
export async function getAllCacheStats(): Promise<{
  timePortfolio: { isCached: boolean; ageMinutes: number | null };
  volatility: { totalEntries: number };
}> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Get TIME portfolio cache stats
    const { data: timeData } = await supabase
      .from('time_portfolio_cache')
      .select('updated_at')
      .eq('cache_key', 'default')
      .single();
    
    // Get volatility cache count
    const { count } = await supabase
      .from('volatility_cache')
      .select('*', { count: 'exact', head: true });
    
    const timePortfolioStats = timeData
      ? {
          isCached: true,
          ageMinutes: Math.round((Date.now() - new Date(timeData.updated_at).getTime()) / 60000),
        }
      : { isCached: false, ageMinutes: null };
    
    return {
      timePortfolio: timePortfolioStats,
      volatility: { totalEntries: count || 0 },
    };
  } catch {
    return {
      timePortfolio: { isCached: false, ageMinutes: null },
      volatility: { totalEntries: 0 },
    };
  }
}
