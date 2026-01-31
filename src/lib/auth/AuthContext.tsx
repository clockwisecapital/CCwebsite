'use client';

/**
 * Authentication Context Provider
 * Manages user authentication state using Supabase Auth
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string }) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      
      // Clear ALL Kronos data when user signs out
      if (event === 'SIGNED_OUT') {
        try {
          localStorage.removeItem('kronos-dashboard-state');
          localStorage.removeItem('kronos_intelligence_notification');
          localStorage.removeItem('kronos_intelligence_viewed');
          console.log('🗑️ SIGNED_OUT event: Cleared all Kronos localStorage data');
          
          // Force a page reload if on Kronos page to ensure clean state
          if (typeof window !== 'undefined' && window.location.pathname === '/kronos') {
            console.log('🔄 Reloading Kronos page to ensure clean state');
            setTimeout(() => window.location.reload(), 100);
          }
        } catch (error) {
          console.error('Failed to clear Kronos data on SIGNED_OUT:', error);
        }
      }
      
      setSession(session);
      setUser(newUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata?.firstName,
          last_name: metadata?.lastName,
        },
      },
    });

    if (data.user && !error && data.user.email) {
      // Update user profile in public.users table
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        first_name: metadata?.firstName,
        last_name: metadata?.lastName,
        last_login: new Date().toISOString(),
      });
    }

    return { user: data.user, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.user && !error) {
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return { user: data.user, error };
  };

  const signOut = async () => {
    // Clear all Kronos-related data before signing out
    try {
      localStorage.removeItem('kronos-dashboard-state');
      localStorage.removeItem('kronos_intelligence_notification');
      localStorage.removeItem('kronos_intelligence_viewed');
      console.log('🗑️ Cleared all Kronos data on signOut');
    } catch (error) {
      console.error('Failed to clear Kronos data:', error);
    }
    
    await supabase.auth.signOut();
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string }) => {
    if (!user) return { error: new Error('No user logged in') as AuthError };

    const { error } = await supabase
      .from('users')
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return { error: error as AuthError | null };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
