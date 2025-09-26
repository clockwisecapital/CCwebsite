/**
 * Admin Test API
 * 
 * Simple endpoint to test authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '../auth/route'

export async function GET(request: NextRequest) {
  try {
    console.log('Test API called')
    
    // Check cookies
    const token = request.cookies.get('admin-token')?.value
    console.log('Token found:', !!token)
    
    // Verify admin authentication
    const isAuthenticated = await verifyAdminToken(request)
    console.log('Is authenticated:', isAuthenticated)
    
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', hasToken: !!token },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { success: false, message: 'Test failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
