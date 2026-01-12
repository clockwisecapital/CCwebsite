/**
 * Supabase Server Configuration
 * 
 * Server-side Supabase client for Next.js 15 App Router
 * Used in API routes, Server Components, and Server Actions
 */

import { createClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'
import type { Database } from './types.js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Create Supabase client for Server Components and API Routes
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
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  const headersList = await headers()
  
  // Extract the access token from cookies or Authorization header
  const accessToken = cookieStore.get('sb-access-token')?.value || 
                      headersList.get('authorization')?.replace('Bearer ', '')
  
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // API routes don't need session persistence
    },
    global: {
      headers: {
        'X-Client-Info': 'clockwise-capital-server',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    },
  })
  
  // If we have an access token, set it on the auth object
  if (accessToken) {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: cookieStore.get('sb-refresh-token')?.value || '',
    })
  }
  
  return client
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
  const supabase = await createServerSupabaseClient()
  
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
