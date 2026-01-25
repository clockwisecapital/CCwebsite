/**
 * Asset Returns Cache Service
 * 
 * Persistent caching for historical asset class returns from Yahoo Finance.
 * Prevents redundant API calls for immutable historical data.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { AssetReturns, KronosAssetClass } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface CachedAssetReturn {
  id?: string;
  analog_id: string;
  asset_class: string;
  start_date: string;
  end_date: string;
  return_value: number;
  source: 'yahoo_finance' | 'verified_data';
  etf_ticker?: string;
  is_validated: boolean;
  validation_date?: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export const CURRENT_ASSET_CACHE_VERSION = 1;

// ============================================================================
// CACHE LOOKUPS
// ============================================================================

/**
 * Get all cached asset returns for a specific analog
 * Returns a complete AssetReturns object or null if incomplete
 */
export async function getCachedAssetReturns(
  analogId: string,
  version: number = CURRENT_ASSET_CACHE_VERSION
): Promise<{ found: boolean; assetReturns: AssetReturns | null }> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('asset_returns_cache')
      .select('*')
      .eq('analog_id', analogId)
      .eq('version', version);
    
    if (error || !data || data.length === 0) {
      console.log(`📦 No asset returns cache found for ${analogId}`);
      return { found: false, assetReturns: null };
    }
    
    // Convert array to AssetReturns object
    const assetReturns: AssetReturns = {};
    for (const row of data) {
      assetReturns[row.asset_class as KronosAssetClass] = row.return_value;
    }
    
    console.log(`✅ Cache HIT: Asset returns for ${analogId} (${data.length} asset classes)`);
    return { found: true, assetReturns };
  } catch (error) {
    console.error('Error fetching asset returns cache:', error);
    return { found: false, assetReturns: null };
  }
}

/**
 * Get cached return for a specific asset class and analog
 */
export async function getCachedAssetReturn(
  analogId: string,
  assetClass: KronosAssetClass,
  version: number = CURRENT_ASSET_CACHE_VERSION
): Promise<number | null> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('asset_returns_cache')
      .select('return_value')
      .eq('analog_id', analogId)
      .eq('asset_class', assetClass)
      .eq('version', version)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.return_value;
  } catch {
    return null;
  }
}

// ============================================================================
// CACHE WRITES
// ============================================================================

/**
 * Store multiple asset returns for an analog
 */
export async function setCachedAssetReturns(
  analogId: string,
  assetReturns: AssetReturns,
  dateRange: { start: string; end: string },
  etfMappings: Record<KronosAssetClass, string>,
  source: 'yahoo_finance' | 'verified_data' = 'yahoo_finance',
  version: number = CURRENT_ASSET_CACHE_VERSION
): Promise<{ success: boolean; inserted: number }> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const entries: Omit<CachedAssetReturn, 'id' | 'created_at' | 'updated_at'>[] = [];
    
    for (const [assetClass, returnValue] of Object.entries(assetReturns)) {
      if (returnValue !== null && returnValue !== undefined) {
        entries.push({
          analog_id: analogId,
          asset_class: assetClass,
          start_date: dateRange.start,
          end_date: dateRange.end,
          return_value: returnValue,
          source,
          etf_ticker: etfMappings[assetClass as KronosAssetClass],
          is_validated: source === 'verified_data',
          version,
        });
      }
    }
    
    if (entries.length === 0) {
      console.warn('No asset returns to cache');
      return { success: false, inserted: 0 };
    }
    
    // @ts-ignore - asset_returns_cache not yet in generated types
    const { data, error } = await supabase
      .from('asset_returns_cache')
      .upsert(entries, { onConflict: 'analog_id,asset_class,version' })
      .select();
    
    if (error) {
      console.error('Error caching asset returns:', error);
      return { success: false, inserted: 0 };
    }
    
    console.log(`📦 Cached ${data?.length || 0} asset returns for ${analogId}`);
    return { success: true, inserted: data?.length || 0 };
  } catch (error) {
    console.error('Error caching asset returns:', error);
    return { success: false, inserted: 0 };
  }
}

/**
 * Store a single asset return
 */
export async function setCachedAssetReturn(
  analogId: string,
  assetClass: KronosAssetClass,
  returnValue: number,
  dateRange: { start: string; end: string },
  etfTicker: string,
  source: 'yahoo_finance' | 'verified_data' = 'yahoo_finance',
  version: number = CURRENT_ASSET_CACHE_VERSION
): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const entry = {
      analog_id: analogId,
      asset_class: assetClass,
      start_date: dateRange.start,
      end_date: dateRange.end,
      return_value: returnValue,
      source,
      etf_ticker: etfTicker,
      is_validated: source === 'verified_data',
      version,
    };
    
    // @ts-ignore - asset_returns_cache not yet in generated types
    const { error } = await supabase
      .from('asset_returns_cache')
      .upsert(entry, { onConflict: 'analog_id,asset_class,version' });
    
    if (error) {
      console.error(`Error caching ${assetClass} return:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error caching ${assetClass} return:`, error);
    return false;
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear asset returns cache for a specific analog
 */
export async function clearAssetReturnsCacheForAnalog(
  analogId: string,
  version?: number
): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // @ts-ignore - asset_returns_cache not yet in generated types
    let query = supabase
      .from('asset_returns_cache')
      .delete()
      .eq('analog_id', analogId);
    
    if (version !== undefined) {
      query = query.eq('version', version);
    }
    
    const { error } = await query;
    
    if (error) {
      console.error('Error clearing asset returns cache:', error);
      return false;
    }
    
    console.log(`🗑️ Cleared asset returns cache for ${analogId}`);
    return true;
  } catch (error) {
    console.error('Error clearing asset returns cache:', error);
    return false;
  }
}

/**
 * Clear all asset returns cache for a specific version
 */
export async function clearAssetReturnsCacheVersion(
  version: number
): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // @ts-ignore - asset_returns_cache not yet in generated types
    const { error } = await supabase
      .from('asset_returns_cache')
      .delete()
      .eq('version', version);
    
    if (error) {
      console.error('Error clearing asset returns cache version:', error);
      return false;
    }
    
    console.log(`🗑️ Cleared asset returns cache version ${version}`);
    return true;
  } catch (error) {
    console.error('Error clearing asset returns cache version:', error);
    return false;
  }
}

/**
 * Check if asset returns cache is populated for all analogs
 */
export async function isAssetReturnsCachePopulated(
  version: number = CURRENT_ASSET_CACHE_VERSION
): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // @ts-ignore - asset_returns_cache not yet in generated types
    const { data, error } = await supabase
      .from('asset_returns_cache')
      .select('analog_id')
      .eq('version', version);
    
    if (error || !data) return false;
    
    // Check for 4 unique analogs
    const uniqueAnalogs = new Set(data.map(row => row.analog_id));
    return uniqueAnalogs.size === 4;
  } catch {
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getAssetReturnsCacheStats(): Promise<{
  version: number;
  totalEntries: number;
  uniqueAnalogs: number;
  uniqueAssetClasses: number;
  yahooEntries: number;
  verifiedEntries: number;
  validatedEntries: number;
} | null> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('asset_returns_cache_stats')
      .select('*')
      .single();
    
    if (error || !data) return null;
    
    return {
      version: data.version ?? 0,
      totalEntries: data.total_entries ?? 0,
      uniqueAnalogs: data.unique_analogs ?? 0,
      uniqueAssetClasses: data.unique_asset_classes ?? 0,
      yahooEntries: data.yahoo_entries ?? 0,
      verifiedEntries: data.verified_entries ?? 0,
      validatedEntries: data.validated_entries ?? 0,
    };
  } catch {
    return null;
  }
}
