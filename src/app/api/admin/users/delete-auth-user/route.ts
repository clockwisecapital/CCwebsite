/**
 * Admin API - Delete Supabase Auth User
 * 
 * DELETE /api/admin/users/delete-auth-user?userId=xxx
 * Safely delete a user from Supabase Authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenPayload, isMasterRole } from '@/lib/auth/admin'
import { createClient } from '@supabase/supabase-js'

/**
 * GET - Get user deletion info before deleting
 */
export async function GET(request: NextRequest) {
  try {
    const tokenResult = await getAdminTokenPayload(request)
    if (!tokenResult.isAuthenticated || !tokenResult.payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Master role required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId parameter required' },
        { status: 400 }
      )
    }

    // Create service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Call the function to get deletion info
    const { data, error } = await supabase.rpc('admin_get_user_deletion_info', {
      user_id_to_check: userId
    })

    if (error) {
      console.error('Error getting user deletion info:', error)
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Get user deletion info error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get user deletion info' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete auth user
 */
export async function DELETE(request: NextRequest) {
  try {
    const tokenResult = await getAdminTokenPayload(request)
    if (!tokenResult.isAuthenticated || !tokenResult.payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Master role required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId parameter required' },
        { status: 400 }
      )
    }

    // Create service role client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First get info about what will be deleted
    const { data: info } = await supabase.rpc('admin_get_user_deletion_info', {
      user_id_to_check: userId
    })

    console.log('Deleting user:', info)

    // Call the deletion function
    const { data, error } = await supabase.rpc('admin_delete_auth_user', {
      user_id_to_delete: userId
    })

    if (error) {
      console.error('Error deleting auth user:', error)
      return NextResponse.json(
        { 
          success: false, 
          message: `Database error: ${error.message}`,
          error: error
        },
        { status: 500 }
      )
    }

    // If the function returned an error in the result
    if (data && !data.success) {
      return NextResponse.json(data, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully from Supabase Auth',
      data: data
    })

  } catch (error) {
    console.error('Delete auth user error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to delete auth user: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}
