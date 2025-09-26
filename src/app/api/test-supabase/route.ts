/**
 * Supabase Test API Route
 * 
 * GET /api/test-supabase - Run integration tests
 */

import { NextRequest, NextResponse } from 'next/server'
import { testSupabaseIntegration } from '@/lib/supabase/test-connection'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting Supabase integration test via API...')
    
    const testResult = await testSupabaseIntegration()
    
    if (testResult) {
      return NextResponse.json({
        success: true,
        message: 'All Supabase integration tests passed!',
        timestamp: new Date().toISOString()
      }, { status: 200 })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Some tests failed. Check server logs for details.',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('API Test Error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Test execution failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
