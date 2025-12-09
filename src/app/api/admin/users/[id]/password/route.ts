/**
 * Admin User Password Reset API
 * 
 * POST /api/admin/users/[id]/password - Reset user password (master only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenPayload, isMasterRole } from '@/lib/auth/admin'
import { createAdminSupabaseClient } from '@/lib/supabase/index'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST - Reset user password
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
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

    const body = await request.json()
    const { password } = body as { password: string }

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, username')
      .eq('id', id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash: passwordHash })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to reset password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

