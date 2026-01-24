/**
 * Admin Invalidate Cache API
 * 
 * POST /api/admin/invalidate-cache
 * 
 * Invalidates cache entries for a specific analog or entire version
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { invalidateCacheForAnalog, invalidateCacheVersion, CURRENT_CACHE_VERSION } from '@/lib/kronos/cache-utils';

interface InvalidateRequest {
  analogId?: string;
  version?: number;
}

interface InvalidateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<InvalidateResponse>> {
  try {
    // TODO: Add admin authentication check here
    // For now, this endpoint is unprotected (should add auth before production)
    
    const body: InvalidateRequest = await request.json();

    if (body.analogId) {
      // Invalidate specific analog
      const version = body.version || CURRENT_CACHE_VERSION;
      const success = await invalidateCacheForAnalog(body.analogId, version);

      if (success) {
        return NextResponse.json({
          success: true,
          message: `Cache invalidated for analog ${body.analogId} (version ${version})`
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to invalidate cache'
          },
          { status: 500 }
        );
      }
    } else if (body.version !== undefined) {
      // Invalidate entire version
      const success = await invalidateCacheVersion(body.version);

      if (success) {
        return NextResponse.json({
          success: true,
          message: `All cache entries invalidated for version ${body.version}`
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to invalidate version'
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Must provide either analogId or version'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Cache invalidation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
