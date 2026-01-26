/**
 * API Endpoint: Clear Core Portfolios Cache
 * 
 * Admin endpoint to force regeneration of core portfolios cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearCorePortfoliosCache } from '@/lib/services/core-portfolios-cache';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️  Clearing core portfolios cache...');
    
    await clearCorePortfoliosCache();
    
    console.log('✅ Core portfolios cache cleared!');
    
    return NextResponse.json({
      success: true,
      message: 'Core portfolios cache cleared. It will regenerate on the next request.'
    });
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
