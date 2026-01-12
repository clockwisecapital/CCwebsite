'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import QuestionCard from '@/components/features/scenario-testing/QuestionCard';
import { SCENARIO_QUESTIONS } from '@/lib/scenarioTestingData';

export default function QuestionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'questions' | 'portfolios'>('questions');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [selectedPortfolioName, setSelectedPortfolioName] = useState<string | null>(null);
  const [userPortfolios, setUserPortfolios] = useState<Array<{ id: string; name: string; created_at: string }>>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);

  // Fetch user portfolios on mount
  useEffect(() => {
    if (user) {
      fetchUserPortfolios();
    }
    
    // Check if coming from Kronos with a portfolio
    const portfolioId = sessionStorage.getItem('scenarioTestPortfolioId');
    if (portfolioId) {
      setSelectedPortfolioId(portfolioId);
      // Fetch portfolio name
      fetchPortfolioName(portfolioId);
    }
  }, [user]);

  const fetchUserPortfolios = async () => {
    if (!user) return;
    
    setLoadingPortfolios(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/portfolios/list', { headers });
      const data = await response.json();
      
      if (response.ok && data.portfolios) {
        setUserPortfolios(data.portfolios.map((p: any) => ({
          id: p.id,
          name: p.name,
          created_at: p.created_at
        })));
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoadingPortfolios(false);
    }
  };

  const fetchPortfolioName = async (portfolioId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/portfolios/${portfolioId}`, { headers });
      const data = await response.json();
      
      if (response.ok && data.portfolio) {
        setSelectedPortfolioName(data.portfolio.name);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio name:', error);
    }
  };

  const handleQuestionClick = (questionId: string) => {
    // Store selected portfolio for scenario testing
    if (selectedPortfolioId) {
      sessionStorage.setItem('scenarioTestPortfolioId', selectedPortfolioId);
      // If portfolio is selected, go directly to results/comparison view
      router.push(`/scenario-testing/${questionId}/results`);
    } else {
      // No portfolio selected, go to leaderboard
      router.push(`/scenario-testing/${questionId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Explore Portfolio Testing
          </h1>
          <p className="text-lg text-gray-300">
            See the questions and portfolios that matter most to investors.
          </p>
        </div>

        {/* Navigation Tabs and Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Tabs */}
          <nav className="flex items-center gap-2 bg-gray-800 rounded-xl p-1 border border-gray-700">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'questions'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Top Questions
            </button>
            <button
              onClick={() => setActiveTab('portfolios')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'portfolios'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Top Portfolios
            </button>
          </nav>

          {/* Dropdown */}
          <select
            className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 
              font-semibold hover:bg-gray-750 transition-colors focus:ring-2 focus:ring-teal-500 
              focus:border-transparent cursor-pointer"
            onChange={(e) => {
              if (e.target.value) {
                handleQuestionClick(e.target.value);
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Select New Question to Test</option>
            {SCENARIO_QUESTIONS.map((question) => (
              <option key={question.id} value={question.id}>
                {question.title} - {question.question}
              </option>
            ))}
          </select>
        </div>

        {/* Content Area */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Portfolio Selector */}
            {user && (
              <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-2 border-blue-500/30 rounded-xl p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Select Portfolio to Test
                    </h3>
                    {selectedPortfolioName ? (
                      <p className="text-sm text-gray-400">
                        Testing: <span className="text-blue-400 font-semibold">{selectedPortfolioName}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">Choose a portfolio to test against scenarios</p>
                    )}
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <select
                      value={selectedPortfolioId || ''}
                      onChange={(e) => {
                        const portfolioId = e.target.value;
                        setSelectedPortfolioId(portfolioId);
                        const portfolio = userPortfolios.find(p => p.id === portfolioId);
                        setSelectedPortfolioName(portfolio?.name || null);
                        if (portfolioId) {
                          sessionStorage.setItem('scenarioTestPortfolioId', portfolioId);
                        } else {
                          sessionStorage.removeItem('scenarioTestPortfolioId');
                        }
                      }}
                      disabled={loadingPortfolios}
                      className="flex-1 md:w-64 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg 
                        text-white font-medium hover:bg-gray-750 transition-colors 
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a portfolio...</option>
                      {userPortfolios.map((portfolio) => (
                        <option key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </option>
                      ))}
                    </select>
                    {selectedPortfolioId && (
                      <button
                        onClick={() => {
                          setSelectedPortfolioId(null);
                          setSelectedPortfolioName(null);
                          sessionStorage.removeItem('scenarioTestPortfolioId');
                        }}
                        className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg 
                          text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                        title="Clear selection"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {!selectedPortfolioId && userPortfolios.length === 0 && !loadingPortfolios && (
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400">
                      No portfolios found. <button 
                        onClick={() => router.push('/kronos')}
                        className="text-blue-400 hover:text-blue-300 font-semibold underline"
                      >
                        Create one now
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Section Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Top Questions (ranked by streak)
              </h2>
              <p className="text-gray-400">
                {selectedPortfolioName 
                  ? `Click any scenario to test "${selectedPortfolioName}" and see the comparison`
                  : 'Click a question to browse top portfolios or select your own above to test'}
              </p>
              <div className="flex items-center justify-end mt-2">
                <span className="text-sm font-semibold text-teal-400">Highest Score</span>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {SCENARIO_QUESTIONS.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  rank={index + 1}
                  icon={question.icon}
                  title={question.title}
                  subtitle={question.subtitle}
                  question={question.question}
                  stats={question.stats}
                  winningPortfolio={question.winningPortfolio}
                  onClick={() => handleQuestionClick(question.id)}
                />
              ))}
            </div>

            {/* Submit Portfolio CTA */}
            <div className="flex justify-center pt-12">
              <button
                onClick={() => router.push('/kronos')}
                className="px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold 
                  rounded-xl transition-all duration-300 shadow-xl hover:scale-105 
                  flex items-center gap-3"
              >
                Submit Portfolio
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'portfolios' && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
              bg-teal-500/20 border-2 border-teal-500/30 mb-6">
              <svg 
                className="w-10 h-10 text-teal-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Top Portfolios Coming Soon
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We're working on a comprehensive leaderboard showing top-performing portfolios 
              across all scenarios. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


