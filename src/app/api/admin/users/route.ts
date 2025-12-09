/**
 * Admin Users Management API
 * 
 * GET /api/admin/users - List all admin users (master only)
 * POST /api/admin/users - Create new admin user (master only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenPayload, isMasterRole, ADVISORY_FIRMS } from '@/lib/auth/admin'
import { createAdminSupabaseClient } from '@/lib/supabase/index'
import bcrypt from 'bcryptjs'

/**
 * GET - List all admin users
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

    // Only master role can manage users
    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Master role required.' },
        { status: 403 }
      )
    }

    const supabase = createAdminSupabaseClient()

    const { data: users, error } = await supabase
      .from('admin_users')
      .select('id, username, role, firm_name, display_name, email, is_active, last_login, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        firms: ADVISORY_FIRMS
      }
    })

  } catch (error) {
    console.error('Users GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new admin user
 */
export async function POST(request: NextRequest) {
  try {
    const tokenResult = await getAdminTokenPayload(request)
    if (!tokenResult.isAuthenticated || !tokenResult.payload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only master role can create users
    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Master role required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { username, password, role, firmName, displayName, email } = body as {
      username: string
      password: string
      role: 'master' | 'advisor'
      firmName?: string
      displayName?: string
      email?: string
    }

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (role !== 'master' && role !== 'advisor') {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      )
    }

    if (role === 'advisor' && !firmName) {
      return NextResponse.json(
        { success: false, message: 'Firm name is required for advisors' },
        { status: 400 }
      )
    }

    if (role === 'advisor' && firmName && !ADVISORY_FIRMS.includes(firmName as typeof ADVISORY_FIRMS[number])) {
      return NextResponse.json(
        { success: false, message: 'Invalid firm name' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Check if username already exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Username already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const { data: newUser, error } = await supabase
      .from('admin_users')
      .insert({
        username: username.toLowerCase().trim(),
        password_hash: passwordHash,
        role,
        firm_name: role === 'advisor' ? firmName : null,
        display_name: displayName || username,
        email: email || null,
        is_active: true
      })
      .select('id, username, role, firm_name, display_name, email, is_active, created_at')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { user: newUser }
    })

  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    )
  }
}

