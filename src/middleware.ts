/**
 * Next.js Middleware for Admin Route Protection
 * 
 * Protects /admin routes and validates role-based access
 * Supports master (Clockwise) and advisor (partner firms) roles
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
      
      // Validate required fields
      if (!payload.username || !payload.role) {
        console.log('Invalid token payload - missing required fields')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // Validate role is valid
      if (payload.role !== 'master' && payload.role !== 'advisor') {
        console.log('Invalid role in token:', payload.role)
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }

      // Check access to users management page (master only)
      if (request.nextUrl.pathname.startsWith('/admin/users')) {
        if (payload.role !== 'master') {
          console.log('Non-master user attempting to access users page')
          return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }
      }

      // Token is valid, allow access and pass role info via headers
      console.log('Valid admin token, allowing access to:', request.nextUrl.pathname)
      
      const response = NextResponse.next()
      
      // Add role info to headers for use in API routes
      response.headers.set('x-admin-role', payload.role as string)
      response.headers.set('x-admin-username', payload.username as string)
      if (payload.firmName) {
        response.headers.set('x-admin-firm', payload.firmName as string)
      }
      if (payload.displayName) {
        response.headers.set('x-admin-display-name', payload.displayName as string)
      }
      
      return response
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
