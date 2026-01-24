/**
 * Clockwise Portfolio Cache Utilities
 * 
 * Database operations for cached portfolio scores
 */

import { supabase } from '@/lib/supabase/client';
import type { CachedPortfolioScore, CacheInsertData, CacheLookupResult, CacheStats } from './cache-types';

// Current cache version (increment when scoring algorithm changes)
export const CURRENT_CACHE_VERSION = 1;

// =====================================================================================
// CACHE LOOKUPS
// =====================================================================================

/**
 * Get cached scores for all Clockwise portfolios for a specific analog
 * 
 * @param analogId - Historical analog ID (e.g., 'COVID_CRASH')
 * @param version - Cache version (defaults to current)
 * @returns Cached portfolio scores or empty array
 */
export async function getCachedClockwiseScores(
  analogId: string,
  version: number = CURRENT_CACHE_VERSION
): Promise<CacheLookupResult> {
  try {
    const { data, error } = await supabase
      .from('clockwise_portfolio_cache')
      .select('*')
      .eq('analog_id', analogId)
      .eq('version', version)
      .order('score', { ascending: false });

    if (error) {
      console.error('❌ Cache lookup error:', error);
      return { found: false, portfolios: [], version, source: 'computed' };
    }

    const found = data && data.length === 4; // Expect 4 portfolios
    
    if (found) {
      console.log(`✅ Cache HIT: ${analogId} (${data.length} portfolios, version ${version})`);
    } else {
      console.log(`⚠️ Cache MISS: ${analogId} (found ${data?.length || 0}/4 portfolios)`);
    }

    return {
      found,
      portfolios: data || [],
      version,
      source: found ? 'database' : 'computed'
    };
  } catch (error) {
    console.error('❌ Cache lookup exception:', error);
    return { found: false, portfolios: [], version, source: 'computed' };
  }
}

/**
 * Get cached score for a specific portfolio-analog combination
 */
export async function getCachedScore(
  portfolioId: string,
  analogId: string,
  version: number = CURRENT_CACHE_VERSION
): Promise<CachedPortfolioScore | null> {
  try {
    const { data, error } = await supabase
      .from('clockwise_portfolio_cache')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('analog_id', analogId)
      .eq('version', version)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Single cache lookup error:', error);
    return null;
  }
}

// =====================================================================================
// CACHE WRITES
// =====================================================================================

/**
 * Insert multiple cache entries
 * Used by pre-computation script
 */
export async function insertCacheEntries(
  entries: CacheInsertData[]
): Promise<{ success: boolean; inserted: number; errors: number }> {
  try {
    console.log(`💾 Inserting ${entries.length} cache entries...`);

    const { data, error } = await supabase
      .from('clockwise_portfolio_cache')
      .insert(entries)
      .select();

    if (error) {
      console.error('❌ Cache insert error:', error);
      return { success: false, inserted: 0, errors: entries.length };
    }

    console.log(`✅ Inserted ${data?.length || 0} cache entries`);
    
    return {
      success: true,
      inserted: data?.length || 0,
      errors: 0
    };
  } catch (error) {
    console.error('❌ Cache insert exception:', error);
    return { success: false, inserted: 0, errors: entries.length };
  }
}

/**
 * Insert or update a single cache entry
 */
export async function upsertCacheEntry(
  entry: CacheInsertData
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clockwise_portfolio_cache')
      .upsert(entry, {
        onConflict: 'portfolio_id,analog_id,version'
      });

    if (error) {
      console.error('❌ Cache upsert error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Cache upsert exception:', error);
    return false;
  }
}

// =====================================================================================
// CACHE MANAGEMENT
// =====================================================================================

/**
 * Delete cache entries for a specific analog
 */
export async function invalidateCacheForAnalog(
  analogId: string,
  version: number = CURRENT_CACHE_VERSION
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clockwise_portfolio_cache')
      .delete()
      .eq('analog_id', analogId)
      .eq('version', version);

    if (error) {
      console.error('❌ Cache invalidation error:', error);
      return false;
    }

    console.log(`✅ Invalidated cache for ${analogId} (version ${version})`);
    return true;
  } catch (error) {
    console.error('❌ Cache invalidation exception:', error);
    return false;
  }
}

/**
 * Delete all cache entries for a specific version
 */
export async function invalidateCacheVersion(
  version: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clockwise_portfolio_cache')
      .delete()
      .eq('version', version);

    if (error) {
      console.error('❌ Version invalidation error:', error);
      return false;
    }

    console.log(`✅ Invalidated all cache entries for version ${version}`);
    return true;
  } catch (error) {
    console.error('❌ Version invalidation exception:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats[]> {
  try {
    const { data, error } = await supabase
      .from('clockwise_cache_stats')
      .select('*')
      .order('version', { ascending: false });

    if (error) {
      console.error('❌ Cache stats error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Cache stats exception:', error);
    return [];
  }
}

/**
 * Check if cache is populated
 */
export async function isCachePopulated(
  version: number = CURRENT_CACHE_VERSION
): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('clockwise_portfolio_cache')
      .select('*', { count: 'exact', head: true })
      .eq('version', version);

    if (error) {
      return false;
    }

    // Expect 16 entries (4 portfolios × 4 analogs)
    return count === 16;
  } catch (error) {
    return false;
  }
}

/**
 * Get current cache version from database
 */
export async function getCurrentCacheVersion(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_current_cache_version');

    if (error || !data) {
      return CURRENT_CACHE_VERSION;
    }

    return data as number;
  } catch (error) {
    return CURRENT_CACHE_VERSION;
  }
}
