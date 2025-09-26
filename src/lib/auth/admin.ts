/**
 * Admin authentication utilities
 */

import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Admin credentials (in production, use environment variables)
const ADMIN_USERNAME = 'clockwiseadmin'
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'clockwise-admin-secret-key-2025')

/**
 * Verify admin token from request
 */
export async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return false
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return payload.username === ADMIN_USERNAME && payload.role === 'admin'
  } catch {
    return false
  }
}
