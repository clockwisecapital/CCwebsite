import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

/**
 * Manual cache refresh endpoint
 * 
 * Triggers an immediate refresh of TIME portfolio and volatility caches.
 * Useful for:
 * - Testing cache system
 * - Emergency refresh after data updates
 * - Manual refresh outside scheduled times
 * 
 * POST /api/admin/refresh-cache
 * Body: { 
 *   cacheType: 'time-portfolio' | 'volatility' | 'all',
 *   adminKey: string  // Set ADMIN_API_KEY in env vars
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cacheType = 'all', adminKey } = body;
    
    // Simple admin key authentication
    const expectedKey = process.env.ADMIN_API_KEY;
    if (!expectedKey || adminKey !== expectedKey) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - invalid admin key'
      }, { status: 401 });
    }
    
    const jobs: string[] = [];
    
    // Trigger appropriate cache refresh jobs
    if (cacheType === 'time-portfolio' || cacheType === 'all') {
      await inngest.send({
        name: 'app/refresh.time-portfolio',
        data: { trigger: 'manual', requestedAt: new Date().toISOString() }
      });
      jobs.push('time-portfolio');
    }
    
    if (cacheType === 'volatility' || cacheType === 'all') {
      await inngest.send({
        name: 'app/refresh.volatility',
        data: { trigger: 'manual', requestedAt: new Date().toISOString() }
      });
      jobs.push('volatility');
    }
    
    console.log(`🔄 Manual cache refresh triggered: ${jobs.join(', ')}`);
    
    return NextResponse.json({
      success: true,
      message: `Cache refresh job(s) queued: ${jobs.join(', ')}`,
      jobs,
      note: 'Jobs will process in background. Check logs for completion.'
    });
  } catch (error) {
    console.error('❌ Cache refresh trigger error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger cache refresh'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check cache status
 */
export async function GET(request: NextRequest) {
  const adminKey = request.nextUrl.searchParams.get('adminKey');
  
  // Simple admin key authentication
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized - invalid admin key'
    }, { status: 401 });
  }
  
  // Import here to avoid circular dependencies
  const { getAllCacheStats } = await import('@/lib/services/time-portfolio-cache');
  
  const stats = await getAllCacheStats();
  
  return NextResponse.json({
    success: true,
    caches: stats,
    scheduledRefresh: {
      timePortfolio: '8pm, 2am, 8am, 2pm EST (every ~6 hours during off-peak)',
      volatility: '1am EST daily'
    }
  });
}








