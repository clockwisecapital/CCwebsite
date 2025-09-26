/**
 * Admin Authentication API
 * 
 * Simple authentication for Clockwise Admin Dashboard
 * POST /api/admin/auth - Login with username/password
 */

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'

// Admin credentials (in production, use environment variables)
const ADMIN_USERNAME = 'clockwiseadmin'
const ADMIN_PASSWORD = 'ClockwiseCapital2025!' // Strong password
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'clockwise-admin-secret-key-2025')

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Validate credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token (expires in 8 hours)
    const token = await new SignJWT({ 
      username: ADMIN_USERNAME,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(JWT_SECRET)

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: { username: ADMIN_USERNAME, role: 'admin' }
    })

    // Set secure HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/' // Changed from '/admin' to '/' for broader access
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
