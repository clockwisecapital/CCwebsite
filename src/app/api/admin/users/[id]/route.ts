/**
 * Admin User Management API - Individual User Operations
 * 
 * GET /api/admin/users/[id] - Get user details (master only)
 * PATCH /api/admin/users/[id] - Update user (master only)
 * DELETE /api/admin/users/[id] - Delete user (master only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenPayload, isMasterRole, ADVISORY_FIRMS } from '@/lib/auth/admin'
import { createAdminSupabaseClient } from '@/lib/supabase/index'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET - Get user details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const supabase = createAdminSupabaseClient()

    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, role, firm_name, display_name, email, is_active, last_login, created_at')
      .eq('id', id)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { user }
    })

  } catch (error) {
    console.error('User GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update user
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const { firmName, displayName, email, isActive } = body as {
      firmName?: string
      displayName?: string
      email?: string
      isActive?: boolean
    }

    const supabase = createAdminSupabaseClient()

    // Get current user to check role
    const { data: currentUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', id)
      .single()

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deactivating master account
    if (currentUser.role === 'master' && isActive === false) {
      return NextResponse.json(
        { success: false, message: 'Cannot deactivate master account' },
        { status: 400 }
      )
    }

    // Validate firm name if provided
    if (firmName !== undefined && firmName && !ADVISORY_FIRMS.includes(firmName as typeof ADVISORY_FIRMS[number])) {
      return NextResponse.json(
        { success: false, message: 'Invalid firm name' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (firmName !== undefined) updateData.firm_name = firmName || null
    if (displayName !== undefined) updateData.display_name = displayName
    if (email !== undefined) updateData.email = email || null
    if (isActive !== undefined) updateData.is_active = isActive

    const { data: updatedUser, error: updateError } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, role, firm_name, display_name, email, is_active, last_login, created_at')
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    })

  } catch (error) {
    console.error('User PATCH error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const supabase = createAdminSupabaseClient()

    // Get current user to check role
    const { data: currentUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', id)
      .single()

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting master account
    if (currentUser.role === 'master') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete master account' },
        { status: 400 }
      )
    }

    // Get the username for cleanup
    const { data: userToDelete, error: getUserError } = await supabase
      .from('admin_users')
      .select('username')
      .eq('id', id)
      .single()

    if (getUserError || !userToDelete) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Update any client_assignments that reference this user
    // Set assigned_by to 'deleted_user' or null to prevent foreign key issues
    const { error: updateAssignmentsError } = await supabase
      .from('client_assignments')
      .update({ assigned_by: `deleted_user_${userToDelete.username}` })
      .eq('assigned_by', userToDelete.username)

    if (updateAssignmentsError) {
      console.error('Error updating client assignments:', updateAssignmentsError)
      // Continue with deletion even if this fails
    }

    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to delete user: ${deleteError.message || deleteError.code || 'Database error'}`,
          error: deleteError
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('User DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

