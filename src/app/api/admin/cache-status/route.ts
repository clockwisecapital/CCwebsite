/**
 * Admin Cache Status API
 * 
 * GET /api/admin/cache-status
 * 
 * Returns status and statistics about the Clockwise portfolio cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, isCachePopulated, CURRENT_CACHE_VERSION } from '@/lib/kronos/cache-utils';
import { supabase } from '@/lib/supabase/client';
import { HISTORICAL_ANALOGS } from '@/lib/kronos/constants';

interface CacheStatusResponse {
  success: boolean;
  status: 'ready' | 'partial' | 'empty';
  currentVersion: number;
  totalEntries: number;
  expectedEntries: number;
  analogs: Array<{
    id: string;
    name: string;
    portfoliosCount: number;
    lastUpdated: string | null;
  }>;
  statistics?: Array<{
    version: number;
    entries: number;
    avgScore: number;
    lastUpdate: string;
  }>;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<CacheStatusResponse>> {
  try {
    console.log('📊 Fetching cache status...');

    // Check if cache is populated
    const isPopulated = await isCachePopulated(CURRENT_CACHE_VERSION);
    
    // Get cache statistics
    const stats = await getCacheStats();
    const currentVersionStats = stats.find(s => s.version === CURRENT_CACHE_VERSION);

    // Get counts per analog
    const analogCounts: Record<string, { count: number; lastUpdated: string | null }> = {};
    
    for (const analog of Object.values(HISTORICAL_ANALOGS)) {
      const { data, error } = await supabase
        .from('clockwise_portfolio_cache')
        .select('updated_at')
        .eq('analog_id', analog.id)
        .eq('version', CURRENT_CACHE_VERSION);

      if (!error && data) {
        analogCounts[analog.id] = {
          count: data.length,
          lastUpdated: data.length > 0 
            ? new Date(Math.max(...data.map(d => new Date(d.updated_at).getTime()))).toISOString()
            : null
        };
      } else {
        analogCounts[analog.id] = { count: 0, lastUpdated: null };
      }
    }

    const totalEntries = Object.values(analogCounts).reduce((sum, a) => sum + a.count, 0);
    const expectedEntries = Object.keys(HISTORICAL_ANALOGS).length * 4; // 4 analogs × 4 portfolios

    let status: 'ready' | 'partial' | 'empty';
    if (totalEntries === 0) {
      status = 'empty';
    } else if (totalEntries < expectedEntries) {
      status = 'partial';
    } else {
      status = 'ready';
    }

    const response: CacheStatusResponse = {
      success: true,
      status,
      currentVersion: CURRENT_CACHE_VERSION,
      totalEntries,
      expectedEntries,
      analogs: Object.values(HISTORICAL_ANALOGS).map(analog => ({
        id: analog.id,
        name: analog.name,
        portfoliosCount: analogCounts[analog.id]?.count || 0,
        lastUpdated: analogCounts[analog.id]?.lastUpdated || null
      })),
      statistics: stats
        .filter(s => s.version !== null && s.total_entries !== null)
        .map(s => ({
          version: s.version!,
          entries: s.total_entries!,
          avgScore: s.avg_score ?? 0,
          lastUpdate: s.last_update ?? new Date().toISOString()
        }))
    };

    console.log(`✅ Cache status: ${status} (${totalEntries}/${expectedEntries} entries)`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Cache status error:', error);

    return NextResponse.json(
      {
        success: false,
        status: 'empty',
        currentVersion: CURRENT_CACHE_VERSION,
        totalEntries: 0,
        expectedEntries: 16,
        analogs: [],
        error: error instanceof Error ? error.message : 'Failed to fetch cache status'
      },
      { status: 500 }
    );
  }
}
