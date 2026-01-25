/**
 * Core Portfolios Cache Service (Supabase-backed)
 * 
 * Provides persistent caching for Clockwise Core Portfolio analysis results.
 * Caches have a 24-hour TTL and can be refreshed via API or scheduled jobs.
 * 
 * This replaces in-memory caching with durable database storage.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

export interface CachedCorePortfolio {
  id: string;
  name: string;
  description: string;
  riskLevel: string;
  allocations: {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    equityHedges: number;
  };
  expectedReturn: number;
  expectedBestYear: number;
  expectedWorstYear: number;
  upside: number;
  downside: number;
  volatility: number;
  assetAllocation?: Record<string, number>;
  topPositions?: any[];
  kronosData?: any;
  timeHorizon: number;
  updatedAt: Date;
}

interface CorePortfolioCacheRow {
  id: string;
  portfolio_id: string;
  portfolio_name: string;
  description: string;
  risk_level: string;
  allocations: Json;
  expected_return: number;
  expected_best_year: number;
  expected_worst_year: number;
  upside: number;
  downside: number;
  volatility: number;
  asset_allocation: Json;
  top_positions: Json;
  kronos_data: Json;
  time_horizon: number;
  created_at: string;
  updated_at: string;
}

// Cache TTL: 24 hours
const CORE_PORTFOLIOS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// CORE PORTFOLIOS CACHE FUNCTIONS
// ============================================================================

/**
 * Check if Core Portfolios cache is valid (all portfolios cached and within TTL)
 */
export async function isCorePortfoliosCacheValid(): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Check if we have all 4 core portfolios
    const { data, error, count } = await supabase
      .from('core_portfolios_cache')
      .select('updated_at', { count: 'exact' });
    
    if (error || !data || count !== 4) {
      console.log(`📦 Core portfolios cache incomplete (${count || 0}/4 portfolios)`);
      return false;
    }
    
    // Check if any portfolio is expired
    const now = Date.now();
    for (const row of data) {
      const updatedAt = new Date(row.updated_at);
      const age = now - updatedAt.getTime();
      
      if (age > CORE_PORTFOLIOS_CACHE_TTL_MS) {
        console.log(`📦 Core portfolios cache expired (age: ${Math.round(age / 60000)} min)`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Core Portfolios cache:', error);
    return false;
  }
}

/**
 * Get all cached Core Portfolios from Supabase
 */
export async function getAllCachedCorePortfolios(): Promise<CachedCorePortfolio[] | null> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('core_portfolios_cache')
      .select('*')
      .order('portfolio_id');
    
    if (error || !data || data.length === 0) {
      console.log('📦 No Core Portfolios cache found');
      return null;
    }
    
    // Check if cache is still valid
    const now = Date.now();
    const oldestCache = data.reduce((oldest, row) => {
      const updated = new Date(row.updated_at).getTime();
      return updated < oldest ? updated : oldest;
    }, now);
    
    const age = now - oldestCache;
    
    if (age > CORE_PORTFOLIOS_CACHE_TTL_MS) {
      console.log(`📦 Core Portfolios cache expired (age: ${Math.round(age / 60000)} min)`);
      return null;
    }
    
    console.log(`✅ Using cached Core Portfolios data (age: ${Math.round(age / 60000)} min)`);
    
    // Transform to application format
    return data.map((row: any) => {
      const cacheRow = row as CorePortfolioCacheRow;
      return {
        id: cacheRow.portfolio_id,
        name: cacheRow.portfolio_name,
        description: cacheRow.description,
        riskLevel: cacheRow.risk_level,
        allocations: cacheRow.allocations as any,
        expectedReturn: cacheRow.expected_return,
        expectedBestYear: cacheRow.expected_best_year,
        expectedWorstYear: cacheRow.expected_worst_year,
        upside: cacheRow.upside,
        downside: cacheRow.downside,
        volatility: cacheRow.volatility,
        assetAllocation: cacheRow.asset_allocation as any,
        topPositions: cacheRow.top_positions as any,
        kronosData: cacheRow.kronos_data as any,
        timeHorizon: cacheRow.time_horizon,
        updatedAt: new Date(cacheRow.updated_at),
      };
    });
  } catch (error) {
    console.error('Error fetching Core Portfolios cache:', error);
    return null;
  }
}

/**
 * Get a specific cached Core Portfolio by ID
 */
export async function getCachedCorePortfolio(portfolioId: string): Promise<CachedCorePortfolio | null> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('core_portfolios_cache')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .single();
    
    if (error || !data) {
      console.log(`📦 No cache found for Core Portfolio: ${portfolioId}`);
      return null;
    }
    
    const cacheRow = data as unknown as CorePortfolioCacheRow;
    
    // Check if cache is still valid
    const updatedAt = new Date(cacheRow.updated_at);
    const age = Date.now() - updatedAt.getTime();
    
    if (age > CORE_PORTFOLIOS_CACHE_TTL_MS) {
      console.log(`📦 Cache expired for ${portfolioId} (age: ${Math.round(age / 60000)} min)`);
      return null;
    }
    
    console.log(`✅ Using cached data for ${portfolioId} (age: ${Math.round(age / 60000)} min)`);
    
    return {
      id: cacheRow.portfolio_id,
      name: cacheRow.portfolio_name,
      description: cacheRow.description,
      riskLevel: cacheRow.risk_level,
      allocations: cacheRow.allocations as any,
      expectedReturn: cacheRow.expected_return,
      expectedBestYear: cacheRow.expected_best_year,
      expectedWorstYear: cacheRow.expected_worst_year,
      upside: cacheRow.upside,
      downside: cacheRow.downside,
      volatility: cacheRow.volatility,
      assetAllocation: cacheRow.asset_allocation as any,
      topPositions: cacheRow.top_positions as any,
      kronosData: cacheRow.kronos_data as any,
      timeHorizon: cacheRow.time_horizon,
      updatedAt,
    };
  } catch (error) {
    console.error(`Error fetching cache for ${portfolioId}:`, error);
    return null;
  }
}

/**
 * Store a single Core Portfolio analysis result in cache
 */
export async function setCachedCorePortfolio(portfolio: {
  id: string;
  name: string;
  description: string;
  riskLevel: string;
  allocations: any;
  expectedReturn: number;
  expectedBestYear: number;
  expectedWorstYear: number;
  upside: number;
  downside: number;
  volatility: number;
  assetAllocation?: any;
  topPositions?: any[];
  kronosData?: any;
  timeHorizon?: number;
}): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const cacheData = {
      portfolio_id: portfolio.id,
      portfolio_name: portfolio.name,
      description: portfolio.description,
      risk_level: portfolio.riskLevel,
      allocations: portfolio.allocations as unknown as Json,
      expected_return: portfolio.expectedReturn,
      expected_best_year: portfolio.expectedBestYear,
      expected_worst_year: portfolio.expectedWorstYear,
      upside: portfolio.upside,
      downside: portfolio.downside,
      volatility: portfolio.volatility,
      asset_allocation: (portfolio.assetAllocation || {}) as unknown as Json,
      top_positions: (portfolio.topPositions || []) as unknown as Json,
      kronos_data: (portfolio.kronosData || {}) as unknown as Json,
      time_horizon: portfolio.timeHorizon || 1,
    };
    
    // Upsert (insert or update)
    const { error } = await supabase
      .from('core_portfolios_cache')
      .upsert(cacheData, { onConflict: 'portfolio_id' });
    
    if (error) {
      console.error(`Error saving cache for ${portfolio.name}:`, error);
      return false;
    }
    
    console.log(`📦 Cached ${portfolio.name} to Supabase`);
    return true;
  } catch (error) {
    console.error(`Error saving cache for ${portfolio.name}:`, error);
    return false;
  }
}

/**
 * Store multiple Core Portfolio analysis results in cache (batch)
 */
export async function batchSetCachedCorePortfolios(
  portfolios: Array<{
    id: string;
    name: string;
    description: string;
    riskLevel: string;
    allocations: any;
    expectedReturn: number;
    expectedBestYear: number;
    expectedWorstYear: number;
    upside: number;
    downside: number;
    volatility: number;
    assetAllocation?: any;
    topPositions?: any[];
    kronosData?: any;
    timeHorizon?: number;
  }>
): Promise<{ success: number; failed: number }> {
  const results = await Promise.all(
    portfolios.map(portfolio => setCachedCorePortfolio(portfolio))
  );
  
  const success = results.filter(r => r).length;
  const failed = results.length - success;
  
  console.log(`📦 Batch cached ${success}/${portfolios.length} Core Portfolios`);
  
  return { success, failed };
}

/**
 * Clear Core Portfolios cache
 */
export async function clearCorePortfoliosCache(): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();
    
    await supabase
      .from('core_portfolios_cache')
      .delete()
      .neq('portfolio_id', ''); // Delete all
    
    console.log('🗑️ Core Portfolios cache cleared');
  } catch (error) {
    console.error('Error clearing Core Portfolios cache:', error);
  }
}

/**
 * Clear cache for a specific portfolio
 */
export async function clearCorePortfolioCache(portfolioId: string): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();
    
    await supabase
      .from('core_portfolios_cache')
      .delete()
      .eq('portfolio_id', portfolioId);
    
    console.log(`🗑️ Cache cleared for ${portfolioId}`);
  } catch (error) {
    console.error(`Error clearing cache for ${portfolioId}:`, error);
  }
}

/**
 * Get cache statistics
 */
export async function getCorePortfoliosCacheStats(): Promise<{
  totalPortfolios: number;
  oldestCacheAge: number | null; // in minutes
  newestCacheAge: number | null; // in minutes
  isValid: boolean;
}> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('core_portfolios_cache_stats')
      .select('*')
      .single();
    
    if (error || !data) {
      return {
        totalPortfolios: 0,
        oldestCacheAge: null,
        newestCacheAge: null,
        isValid: false,
      };
    }
    
    const now = Date.now();
    const oldestAge = data.oldest_cache ? Math.round((now - new Date(data.oldest_cache).getTime()) / 60000) : null;
    const newestAge = data.newest_cache ? Math.round((now - new Date(data.newest_cache).getTime()) / 60000) : null;
    const isValid = oldestAge !== null && oldestAge < (CORE_PORTFOLIOS_CACHE_TTL_MS / 60000);
    
    return {
      totalPortfolios: data.total_portfolios || 0,
      oldestCacheAge: oldestAge,
      newestCacheAge: newestAge,
      isValid,
    };
  } catch (error) {
    console.error('Error fetching Core Portfolios cache stats:', error);
    return {
      totalPortfolios: 0,
      oldestCacheAge: null,
      newestCacheAge: null,
      isValid: false,
    };
  }
}
