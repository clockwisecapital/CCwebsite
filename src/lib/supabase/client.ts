/**
 * Supabase Client Configuration
 * 
 * Modern setup for Next.js 15 with React 19
 * Follows latest Supabase best practices for client-side operations
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types.js'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Create Supabase client for client-side operations
 * 
 * This client is used in:
 * - React components
 * - Client-side hooks
 * - Browser-based operations
 * 
 * Features:
 * - Automatic token refresh
 * - Real-time subscriptions
 * - Row Level Security (RLS) enforcement
 */
export const createClient = () => {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Enable automatic token refresh
      autoRefreshToken: true,
      // Persist session in localStorage
      persistSession: true,
      // Detect session from URL hash
      detectSessionInUrl: true,
    },
    // Global configuration
    global: {
      headers: {
        'X-Client-Info': 'clockwise-capital-web',
      },
    },
    // Real-time configuration
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

// Export singleton instance for convenience
export const supabase = createClient()
