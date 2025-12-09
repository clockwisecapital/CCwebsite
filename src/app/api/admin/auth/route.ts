/**
 * Admin Authentication API
 * 
 * Multi-tenant authentication for Clockwise Admin Dashboard
 * Supports master (Clockwise) and advisor (partner firms) roles
 * 
 * POST /api/admin/auth - Login with username/password
 * DELETE /api/admin/auth - Logout
 */

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { createAdminSupabaseClient } from '@/lib/supabase/index'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'clockwise-admin-secret-key-2025')

// Default passwords for initial setup (bcrypt hashed)
// These are used when the database has placeholder hashes
const DEFAULT_PASSWORDS: Record<string, string> = {
  'clockwise': 'Clockwise2025!',
  'lfpadvisors': 'LFPAdvisors2025!',
  'legado': 'Legado2025!',
  'financialgym': 'FinancialGym2025!'
}

interface AdminUser {
  id: string
  username: string
  password_hash: string
  role: 'master' | 'advisor'
  firm_name: string | null
  display_name: string | null
  email: string | null
  is_active: boolean
  last_login: string | null
}

export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    // Try to parse JSON body
    let body: { username?: string; password?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { username, password } = body

    // Check if credentials were provided
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // Look up user in database
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username.toLowerCase().trim())
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      console.log('User lookup failed:', userError?.message || 'User not found')
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const adminUser = user as AdminUser

    // Check if password hash is a placeholder (for initial setup)
    const isPlaceholderHash = adminUser.password_hash.includes('placeholder')
    
    let passwordValid = false
    
    if (isPlaceholderHash) {
      // For initial setup, check against default passwords
      const defaultPassword = DEFAULT_PASSWORDS[username.toLowerCase()]
      if (defaultPassword && password === defaultPassword) {
        passwordValid = true
        
        // Update the password hash in the database
        const newHash = await bcrypt.hash(password, 10)
        await supabase
          .from('admin_users')
          .update({ password_hash: newHash })
          .eq('id', adminUser.id)
          
        console.log(`Updated password hash for user: ${username}`)
      }
    } else {
      // Normal password verification
      passwordValid = await bcrypt.compare(password, adminUser.password_hash)
    }

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login timestamp
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser.id)

    // Create JWT token (expires in 8 hours)
    const token = await new SignJWT({ 
      username: adminUser.username,
      role: adminUser.role,
      firmName: adminUser.firm_name,
      displayName: adminUser.display_name || adminUser.username,
      userId: adminUser.id,
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(JWT_SECRET)

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: { 
        username: adminUser.username, 
        role: adminUser.role,
        firmName: adminUser.firm_name,
        displayName: adminUser.display_name || adminUser.username
      }
    })

    // Set secure HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Logout endpoint
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  })
  response.cookies.delete('admin-token')
  
  return response
}

// Get current user info
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Import jose for verification
    const { jwtVerify } = await import('jose')
    
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      
      return NextResponse.json({
        success: true,
        user: {
          username: payload.username,
          role: payload.role,
          firmName: payload.firmName,
          displayName: payload.displayName
        }
      })
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get user info' },
      { status: 500 }
    )
  }
}
