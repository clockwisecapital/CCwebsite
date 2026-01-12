'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import PortfolioCard from '@/components/features/dashboard/PortfolioCard';
import EmptyPortfolioState from '@/components/features/dashboard/EmptyPortfolioState';
import { FiPieChart, FiRefreshCw } from 'react-icons/fi';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  portfolio_score?: number;
  goal_probability?: number;
  total_value?: number;
  allocation?: {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate?: number;
    commodities?: number;
    alternatives?: number;
  };
  risk_tolerance?: string;
  is_scenario_test?: boolean;
  scenario_name?: string;
  is_public: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/kronos');
      return;
    }

    if (user) {
      fetchPortfolios();
    }
  }, [user, authLoading, router]);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/portfolios/list', { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch portfolios');
      }

      setPortfolios(data.portfolios || []);
    } catch (err) {
      console.error('Fetch portfolios error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (id: string, newName: string) => {
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename portfolio');
      }

      // Update local state
      setPortfolios(prev =>
        prev.map(p => (p.id === id ? { ...p, name: newName } : p))
      );
    } catch (err) {
      console.error('Rename error:', err);
      alert('Failed to rename portfolio. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete portfolio');
      }

      // Remove from local state
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete portfolio. Please try again.');
    }
  };

  // Show loading spinner while checking auth
  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 
        flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
            bg-teal-500/20 border-2 border-teal-500/30 mb-4">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent 
              rounded-full animate-spin" />
          </div>
          <p className="text-gray-400">Loading your portfolios...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect in progress)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              My Portfolios
            </h1>
            <p className="text-gray-400">
              {portfolios.length === 0
                ? 'Start by analyzing your first portfolio'
                : `You have ${portfolios.length} saved ${portfolios.length === 1 ? 'portfolio' : 'portfolios'}`}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchPortfolios}
              disabled={loading}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold 
                rounded-xl transition-colors border border-gray-700 hover:border-gray-600 
                flex items-center gap-2 disabled:opacity-50"
              title="Refresh"
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              onClick={() => router.push('/scenario-testing/questions')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 
                hover:from-blue-700 hover:to-cyan-700 text-white font-bold 
                rounded-xl transition-all duration-300 shadow-lg hover:scale-105 
                flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="hidden sm:inline">Scenario Testing</span>
            </button>
            
            <button
              onClick={() => router.push('/kronos')}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold 
                rounded-xl transition-all duration-300 shadow-lg hover:scale-105 
                flex items-center gap-2"
            >
              <FiPieChart className="w-5 h-5" />
              <span className="hidden sm:inline">Analyze New Portfolio</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-8">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchPortfolios}
              className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Portfolio Grid or Empty State */}
        {!loading && portfolios.length === 0 ? (
          <EmptyPortfolioState onCreatePortfolio={() => router.push('/kronos')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map(portfolio => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

