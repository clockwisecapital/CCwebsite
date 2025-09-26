/**
 * Next.js Middleware for Admin Route Protection
 * 
 * Protects /admin routes and redirects unauthorized users
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'clockwise-admin-secret-key-2025')

export async function middleware(request: NextRequest) {
  // Only apply middleware to admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page and root admin page
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/admin') {
      return NextResponse.next()
    }

    // Check for admin token
    const token = request.cookies.get('admin-token')?.value

    if (!token) {
      console.log('No admin token found, redirecting to login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET)
      
      if (payload.username !== 'clockwiseadmin' || payload.role !== 'admin') {
        console.log('Invalid token payload, redirecting to login')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // Token is valid, allow access
      console.log('Valid admin token, allowing access to:', request.nextUrl.pathname)
      return NextResponse.next()
    } catch (error) {
      // Invalid token, redirect to login
      console.error('Token verification failed:', error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
