/**
 * Cycle Analysis Cache
 * 
 * Ensures all users see the same cycle analysis for a given time period.
 * Cycles don't change hourly, so we cache the AI responses.
 */

import type { CycleData } from '@/types/cycleAnalysis';

interface CachedCycle {
  data: CycleData;
  timestamp: number;
  dataHash: string; // Hash of input data to detect when to refresh
}

interface CycleCache {
  country?: CachedCycle;
  technology?: CachedCycle;
  economic?: CachedCycle;
  business?: CachedCycle;
}

// In-memory cache (for serverless, consider Redis or database for persistence)
let cycleCache: CycleCache = {};

// Cache duration: 6 hours (cycles don't change that fast)
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

/**
 * Simple hash function for data consistency check (reserved for future use)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function hashData(data: any): string {
  return JSON.stringify(data);
}

/**
 * Check if cached data is still valid
 */
export function isCacheValid(
  cycleName: keyof CycleCache,
  currentDataHash: string
): boolean {
  const cached = cycleCache[cycleName];
  
  if (!cached) return false;
  
  const age = Date.now() - cached.timestamp;
  const isExpired = age > CACHE_DURATION_MS;
  const dataChanged = cached.dataHash !== currentDataHash;
  
  return !isExpired && !dataChanged;
}

/**
 * Get cached cycle data
 */
export function getCachedCycle(
  cycleName: keyof CycleCache
): CycleData | null {
  const cached = cycleCache[cycleName];
  return cached ? cached.data : null;
}

/**
 * Store cycle data in cache
 */
export function setCachedCycle(
  cycleName: keyof CycleCache,
  data: CycleData,
  inputDataHash: string
): void {
  cycleCache[cycleName] = {
    data,
    timestamp: Date.now(),
    dataHash: inputDataHash,
  };
}

/**
 * Clear all cache (useful for testing or manual refresh)
 */
export function clearCycleCache(): void {
  cycleCache = {};
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
  return {
    country: cycleCache.country ? {
      age: Date.now() - cycleCache.country.timestamp,
      valid: isCacheValid('country', cycleCache.country.dataHash)
    } : null,
    technology: cycleCache.technology ? {
      age: Date.now() - cycleCache.technology.timestamp,
      valid: isCacheValid('technology', cycleCache.technology.dataHash)
    } : null,
    economic: cycleCache.economic ? {
      age: Date.now() - cycleCache.economic.timestamp,
      valid: isCacheValid('economic', cycleCache.economic.dataHash)
    } : null,
    business: cycleCache.business ? {
      age: Date.now() - cycleCache.business.timestamp,
      valid: isCacheValid('business', cycleCache.business.dataHash)
    } : null,
  };
}
