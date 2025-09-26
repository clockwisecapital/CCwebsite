/**
 * Admin Debug API
 * 
 * GET /api/admin/debug - Check what data exists in the database
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '../auth/route'
import { createAdminSupabaseClient } from '@/lib/supabase/index'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminToken(request)
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminSupabaseClient()
    
    console.log('🔍 Starting database debug check...')

    // ========================================================================
    // CHECK CONVERSATIONS TABLE
    // ========================================================================
    
    const { data: conversations, error: conversationsError, count: conversationsCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact' })

    console.log('Conversations query result:')
    console.log('- Data:', conversations)
    console.log('- Count:', conversationsCount)
    console.log('- Error:', conversationsError)

    // ========================================================================
    // CHECK MESSAGES TABLE
    // ========================================================================
    
    const { data: messages, error: messagesError, count: messagesCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })

    console.log('Messages query result:')
    console.log('- Data:', messages)
    console.log('- Count:', messagesCount)
    console.log('- Error:', messagesError)

    // ========================================================================
    // CHECK USER_DATA TABLE
    // ========================================================================
    
    const { data: userData, error: userDataError, count: userDataCount } = await supabase
      .from('user_data')
      .select('*', { count: 'exact' })

    console.log('User data query result:')
    console.log('- Data:', userData)
    console.log('- Count:', userDataCount)
    console.log('- Error:', userDataError)

    // ========================================================================
    // CHECK TABLE STRUCTURE
    // ========================================================================
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info')
      .catch(() => ({ data: null, error: 'RPC not available' }))

    return NextResponse.json({
      success: true,
      debug: {
        conversations: {
          count: conversationsCount,
          data: conversations,
          error: conversationsError
        },
        messages: {
          count: messagesCount,
          data: messages,
          error: messagesError
        },
        userData: {
          count: userDataCount,
          data: userData,
          error: userDataError
        },
        tables: {
          data: tables,
          error: tablesError
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { success: false, message: 'Debug failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
