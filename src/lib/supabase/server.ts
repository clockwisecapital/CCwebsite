/**
 * Supabase Server Configuration
 * 
 * Server-side Supabase client for Next.js 15 App Router
 * Used in API routes, Server Components, and Server Actions
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types.js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Create Supabase client for Server Components
 * 
 * Used in:
 * - Server Components
 * - Route handlers (API routes)
 * - Server Actions
 * 
 * Features:
 * - Cookie-based session management
 * - Automatic token refresh
 * - RLS enforcement with user context
 */
export const createServerSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'clockwise-capital-server',
      },
    },
  })
}

/**
 * Create Supabase admin client with service role key
 * 
 * Used for:
 * - Admin operations that bypass RLS
 * - System-level database operations
 * - Background jobs and migrations
 * 
 * ⚠️ WARNING: This bypasses Row Level Security!
 * Only use when absolutely necessary and with proper validation.
 */
export const createAdminSupabaseClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'clockwise-capital-admin',
      },
    },
  })
}

/**
 * Utility function to get user from server-side context
 */
export const getServerUser = async () => {
  const supabase = createServerSupabaseClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn('Failed to get user:', error.message)
      return null
    }
    
    return user
  } catch (error) {
    console.warn('Error getting user:', error)
    return null
  }
}
