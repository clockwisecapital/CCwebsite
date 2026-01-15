/**
 * Admin authentication utilities
 * Supports multi-tenant role-based access for Clockwise and partner advisory firms
 */

import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Verify JWT_SECRET is configured
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET environment variable is not set. Using default (insecure in production)');
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'clockwise-admin-secret-key-2025')

/**
 * Admin user roles
 */
export type AdminRole = 'master' | 'advisor'

/**
 * Admin token payload structure
 */
export interface AdminTokenPayload {
  username: string
  role: AdminRole
  firmName: string | null
  displayName: string
  userId: string
  iat?: number
  exp?: number
}

/**
 * Result of token verification
 */
export interface VerifyTokenResult {
  isAuthenticated: boolean
  payload: AdminTokenPayload | null
}

/**
 * Verify admin token from request and return full payload
 * @returns Object with isAuthenticated flag and payload with role/firm info
 */
export async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  const result = await getAdminTokenPayload(request)
  return result.isAuthenticated
}

/**
 * Get admin token payload with role and firm information
 * @returns Full token verification result with payload
 */
export async function getAdminTokenPayload(request: NextRequest): Promise<VerifyTokenResult> {
  try {
    const token = request.cookies.get('admin-token')?.value
    
    if (!token) {
      return { isAuthenticated: false, payload: null }
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    // Validate required fields
    if (!payload.username || !payload.role) {
      return { isAuthenticated: false, payload: null }
    }

    // Validate role is valid
    if (payload.role !== 'master' && payload.role !== 'advisor') {
      return { isAuthenticated: false, payload: null }
    }

    const adminPayload: AdminTokenPayload = {
      username: payload.username as string,
      role: payload.role as AdminRole,
      firmName: (payload.firmName as string | null) || null,
      displayName: (payload.displayName as string) || payload.username as string,
      userId: (payload.userId as string) || ''
    }

    return {
      isAuthenticated: true,
      payload: adminPayload
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return { isAuthenticated: false, payload: null }
  }
}

/**
 * Check if user has master role
 */
export function isMasterRole(payload: AdminTokenPayload | null): boolean {
  return payload?.role === 'master'
}

/**
 * Check if user has advisor role
 */
export function isAdvisorRole(payload: AdminTokenPayload | null): boolean {
  return payload?.role === 'advisor'
}

/**
 * Get firm name for advisor users
 */
export function getUserFirm(payload: AdminTokenPayload | null): string | null {
  return payload?.firmName || null
}

/**
 * List of advisory firms (for validation and UI)
 */
export const ADVISORY_FIRMS = [
  'LPF Advisors',
  'Legado Wealth Management',
  'The Financial Gym'
] as const

export type AdvisoryFirm = typeof ADVISORY_FIRMS[number]
