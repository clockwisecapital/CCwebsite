'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import PostCard from '@/components/features/community/PostCard';
import CreateQuestionModal from '@/components/features/community/CreateQuestionModal';
import TestResultsModal, { type TestResultData } from '@/components/features/community/TestResultsModal';
import { FiPlus, FiTrendingUp, FiClock, FiThumbsUp, FiMessageSquare, FiUsers, FiTarget, FiBriefcase, FiFileText, FiBarChart2, FiCheckCircle, FiChevronRight, FiGlobe, FiCheck } from 'react-icons/fi';
import type { ScenarioQuestionWithAuthor, FeedFilter, CreateScenarioQuestionInput } from '@/types/community';

export default function CommunityFeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [questions, setQuestions] = useState<ScenarioQuestionWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('recent');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [userPortfolios, setUserPortfolios] = useState<Array<{ id: string; name: string }>>([]);
  const [communityPortfolios, setCommunityPortfolios] = useState<Array<{ id: string; name: string; user_id: string; username?: string }>>([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);
  
  // Feed Toggle
  const [activeFeed, setActiveFeed] = useState<'questions' | 'portfolios'>('questions');
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'top' | 'following' | 'mine'>('all');
  const [feedPortfolios, setFeedPortfolios] = useState<Array<any>>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  
  // Test Results Modal
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState<TestResultData | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Fetch questions or portfolios based on active feed
  useEffect(() => {
    if (activeFeed === 'questions') {
      fetchQuestions();
    } else {
      fetchFeedPortfolios();
    }
  }, [activeFilter, activeFeed, portfolioFilter]);

  // Fetch user portfolios and community portfolios
  useEffect(() => {
    if (user) {
      fetchUserPortfolios();
      fetchCommunityPortfolios();
    }
    
    // Check if coming from Kronos with a portfolio
    const portfolioId = sessionStorage.getItem('scenarioTestPortfolioId');
    if (portfolioId) {
      setSelectedPortfolioId(portfolioId);
    }
  }, [user]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `/api/community/questions?filter=${activeFilter}&limit=20`,
        { headers }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setQuestions(data.questions);
      } else {
        console.error('Failed to fetch questions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

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
          name: p.name
        })));
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoadingPortfolios(false);
    }
  };

  // Fetch community portfolios (other users' public portfolios)
  const fetchCommunityPortfolios = async () => {
    if (!user) return;
    
    try {
      // Fetch public portfolios from other users
      const { data, error } = await supabase
        .from('portfolios')
        .select(`
          id,
          name,
          user_id,
          users!portfolios_user_id_fkey(
            email,
            first_name,
            last_name
          )
        `)
        .neq('user_id', user.id)
        .limit(20);

      if (!error && data) {
        setCommunityPortfolios(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          user_id: p.user_id,
          username: p.users?.first_name && p.users?.last_name 
            ? `${p.users.first_name} ${p.users.last_name}`
            : p.users?.email?.split('@')[0] || 'Unknown User'
        })));
      }
    } catch (error) {
      console.error('Failed to fetch community portfolios:', error);
    }
  };

  // Fetch portfolios for the feed based on filter
  const fetchFeedPortfolios = async () => {
    if (!user) return;
    
    setLoadingFeed(true);
    try {
      let query = supabase
        .from('portfolios')
        .select(`
          id,
          name,
          description,
          created_at,
          user_id,
          allocation,
          users!portfolios_user_id_fkey(
            email,
            first_name,
            last_name
          )
        `);

      // Apply filter
      switch (portfolioFilter) {
        case 'mine':
          query = query.eq('user_id', user.id);
          break;
        case 'following':
          // TODO: Add following logic when user_follows is ready
          query = query.neq('user_id', user.id);
          break;
        case 'top':
          // Order by some metric (for now, created_at)
          query = query.order('created_at', { ascending: false });
          break;
        case 'all':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query.limit(20);

      if (!error && data) {
        setFeedPortfolios(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          created_at: p.created_at,
          user_id: p.user_id,
          allocation: p.allocation,
          username: p.users?.first_name && p.users?.last_name 
            ? `${p.users.first_name} ${p.users.last_name}`
            : p.users?.email?.split('@')[0] || 'Unknown User',
          isOwn: p.user_id === user.id
        })));
      }
    } catch (error) {
      console.error('Failed to fetch feed portfolios:', error);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Handle like
  const handleLike = async (questionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/community/questions/${questionId}/like`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        // Update local state
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { ...q, likes_count: q.likes_count + 1, is_liked_by_user: true }
            : q
        ));
      }
    } catch (error) {
      console.error('Failed to like question:', error);
      throw error;
    }
  };

  // Handle unlike
  const handleUnlike = async (questionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/community/questions/${questionId}/like`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        // Update local state
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { ...q, likes_count: Math.max(0, q.likes_count - 1), is_liked_by_user: false }
            : q
        ));
      }
    } catch (error) {
      console.error('Failed to unlike question:', error);
      throw error;
    }
  };

  // Handle test
  const handleTest = async (questionId: string) => {
    if (!selectedPortfolioId) {
      alert('Please select a portfolio first (Step 1)');
      // Scroll to portfolio selection
      document.getElementById('portfolio-selector')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Find the question
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const portfolioName = userPortfolios.find(p => p.id === selectedPortfolioId)?.name || 
                         communityPortfolios.find(p => p.id === selectedPortfolioId)?.name || 
                         'Unknown Portfolio';

    setIsRunningTest(true);

    try {
      // TODO: Replace with actual API call to run portfolio test
      // For now, show mock results to demonstrate the UX flow
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      const mockResults: TestResultData = {
        score: 78.5,
        expectedReturn: 0.124,
        expectedUpside: 0.285,
        expectedDownside: -0.065,
        confidence: 87,
        portfolioName: portfolioName,
        questionTitle: question.title,
        historicalPeriod: question.historical_period && question.historical_period[0] ? {
          label: question.historical_period[0].label,
          years: `${question.historical_period[0].start}-${question.historical_period[0].end}`
        } : undefined,
        historicalAnalog: {
          period: "Oct 2008 - Mar 2009",
          similarity: 94,
          matchingFactors: [
            "Similar debt-to-GDP ratios (current: 128%, analog: 125%)",
            "Comparable central bank policy stance (quantitative easing)",
            "Market sentiment alignment (VIX levels within 15%)",
            "Credit spread patterns match historical period"
          ],
          cycleName: question.historical_period?.[0]?.label
        }
      };

      setTestResults(mockResults);
      setShowTestResults(true);
    } catch (error) {
      console.error('Error running test:', error);
      alert('Failed to run portfolio test. Please try again.');
    } finally {
      setIsRunningTest(false);
    }
  };

  // Handle create question
  const handleCreateQuestion = async (questionData: CreateScenarioQuestionInput) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/community/questions', {
        method: 'POST',
        headers,
        body: JSON.stringify(questionData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add new question to the top of the list
        setQuestions(prev => [data.question, ...prev]);
        setIsCreateModalOpen(false);
      } else {
        throw new Error(data.error || 'Failed to create question');
      }
    } catch (error) {
      console.error('Failed to create question:', error);
      throw error;
    }
  };

  // Filter tabs
  const filterTabs: Array<{ id: FeedFilter; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'trending', label: 'Trending', icon: FiTrendingUp },
    { id: 'recent', label: 'Recent', icon: FiClock },
    { id: 'top', label: 'Top', icon: FiThumbsUp },
    { id: 'discussed', label: 'Discussed', icon: FiMessageSquare },
    ...(user ? [{ id: 'following' as FeedFilter, label: 'Following', icon: FiUsers }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        {user && (
          <div className="flex items-center justify-between mb-6 px-6 py-3 bg-gray-900/40 backdrop-blur-sm 
            border border-gray-800 rounded-xl">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <FiUsers className="w-4 h-4 text-teal-400" />
                <span className="font-semibold text-white">{questions.length * 43}</span>
                <span>members</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <FiFileText className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-white">{questions.length}</span>
                <span>questions</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <FiTarget className="w-4 h-4 text-green-400" />
                <span className="font-semibold text-white">{Math.floor(questions.length * 0.8)}</span>
                <span>active today</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-semibold">Live</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-end justify-end gap-3 mb-6">
            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {user && (
                <>
                  <button
                    onClick={() => router.push('/account')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900/60 hover:bg-gray-800 
                      border border-gray-700/50 text-white font-medium rounded-lg transition-colors text-sm"
                    title="My Account"
                  >
                    <FiUsers className="w-4 h-4" />
                    <span className="hidden md:inline">My Account</span>
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 
                      text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Question</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 3-Step Testing Workflow */}
          {user && (
            <div className="mb-6 bg-gray-800 rounded-xl border border-gray-700 p-4">
              {/* Step Progress */}
              <div className="mb-4 flex items-center justify-center gap-3">
                {/* Step 1 */}
                <div className={`flex items-center gap-2 ${selectedPortfolioId ? 'opacity-100' : 'opacity-60'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    selectedPortfolioId 
                      ? 'bg-teal-500' 
                      : 'bg-gray-700'
                  }`}>
                    {selectedPortfolioId ? (
                      <FiCheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <FiBriefcase className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-gray-500 uppercase">Step 1</p>
                    <p className="text-xs font-semibold text-white">Portfolio</p>
                  </div>
                </div>

                <FiChevronRight className="w-4 h-4 text-gray-600" />

                {/* Step 2 */}
                <div className="flex items-center gap-2 opacity-100">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-700">
                    <FiFileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-gray-500 uppercase">Step 2</p>
                    <p className="text-xs font-semibold text-white">Question</p>
                  </div>
                </div>

                <FiChevronRight className="w-4 h-4 text-gray-600" />

                {/* Step 3 */}
                <div className={`flex items-center gap-2 ${selectedPortfolioId ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-700">
                    <FiBarChart2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-gray-500 uppercase">Step 3</p>
                    <p className="text-xs font-semibold text-white">Test</p>
                  </div>
                </div>
              </div>

              {/* Step 1: Portfolio Selection - Expanded Card Style */}
              <div className="mb-4 bg-[#1a1f2e] border border-gray-800 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedPortfolioId ? 'bg-teal-500' : 'bg-gray-700'
                    }`}>
                      {selectedPortfolioId ? (
                        <FiCheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <FiBriefcase className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Step 1: Select Your Portfolio
                      </h3>
                      {selectedPortfolioId ? (
                        <p className="text-xs text-teal-400 flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3" />
                          {userPortfolios.find(p => p.id === selectedPortfolioId)?.name || 
                           communityPortfolios.find(p => p.id === selectedPortfolioId)?.name}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">Choose a portfolio to begin testing</p>
                      )}
                    </div>
                  </div>
                  {selectedPortfolioId && (
                    <button
                      onClick={() => setSelectedPortfolioId(null)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Change
                    </button>
                  )}
                </div>

                {/* Portfolio Selector / Card */}
                {selectedPortfolioId ? (
                  <div className="p-4 bg-gradient-to-br from-gray-900/40 to-gray-900/20">
                    {/* Portfolio Filter */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-400 mb-2 block">Filter Portfolios</label>
                      <select
                        value={portfolioFilter}
                        onChange={(e) => {
                          setPortfolioFilter(e.target.value as any);
                          // Re-fetch portfolios based on new filter
                          if (e.target.value === 'mine') {
                            // Keep only user portfolios
                          } else {
                            fetchCommunityPortfolios();
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg 
                          text-white text-sm font-medium hover:bg-gray-800 transition-colors 
                          focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                      >
                        <option value="all">All Portfolios</option>
                        <option value="mine">My Portfolios Only</option>
                        <option value="top">Top Rated</option>
                        <option value="following">From People I Follow</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <select
                        id="portfolio-selector"
                        value={selectedPortfolioId}
                        onChange={(e) => {
                          const portfolioId = e.target.value;
                          setSelectedPortfolioId(portfolioId);
                          if (portfolioId) {
                            sessionStorage.setItem('scenarioTestPortfolioId', portfolioId);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg 
                          text-white font-medium hover:bg-gray-800 transition-colors 
                          focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer text-sm"
                      >
                        {((portfolioFilter === 'all' || portfolioFilter === 'mine') && userPortfolios.length > 0) && (
                          <optgroup label="📁 My Portfolios">
                            {userPortfolios.map((portfolio) => (
                              <option key={portfolio.id} value={portfolio.id}>
                                {portfolio.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {((portfolioFilter === 'all' || portfolioFilter !== 'mine') && communityPortfolios.length > 0) && (
                          <optgroup label="🌐 Community Portfolios">
                            {communityPortfolios.map((portfolio) => (
                              <option key={portfolio.id} value={portfolio.id}>
                                {portfolio.name} (by {portfolio.username})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* Portfolio Metrics */}
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Total Value</p>
                        <p className="text-sm font-bold text-white">$142,847</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">30d Return</p>
                        <p className="text-sm font-bold text-green-400 flex items-center gap-1">
                          <FiTrendingUp className="w-3 h-3" />
                          +8.3%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Risk Score</p>
                        <p className="text-sm font-bold text-yellow-400">Moderate</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Tests Run</p>
                        <p className="text-sm font-bold text-white">23</p>
                      </div>
                    </div>

                    {/* Risk Bar */}
                    <div className="mt-3">
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full" 
                          style={{ width: '65%' }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {/* Portfolio Filter */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-400 mb-2 block">Filter Portfolios</label>
                      <select
                        value={portfolioFilter}
                        onChange={(e) => {
                          setPortfolioFilter(e.target.value as any);
                          // Re-fetch portfolios based on new filter
                          if (e.target.value === 'mine') {
                            // Keep only user portfolios
                          } else {
                            fetchCommunityPortfolios();
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg 
                          text-white text-sm font-medium hover:bg-gray-800 transition-colors 
                          focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
                      >
                        <option value="all">All Portfolios</option>
                        <option value="mine">My Portfolios Only</option>
                        <option value="top">Top Rated</option>
                        <option value="following">From People I Follow</option>
                      </select>
                    </div>

                    <select
                      id="portfolio-selector"
                      value=""
                      onChange={(e) => {
                        const portfolioId = e.target.value;
                        setSelectedPortfolioId(portfolioId);
                        if (portfolioId) {
                          sessionStorage.setItem('scenarioTestPortfolioId', portfolioId);
                        }
                      }}
                      disabled={loadingPortfolios}
                      className="w-full px-3 py-2 bg-gray-900/60 border-2 border-dashed border-gray-700 
                        rounded-lg text-gray-400 text-sm hover:border-teal-500/50 hover:bg-gray-900 transition-all 
                        focus:ring-2 focus:ring-teal-500 focus:border-solid cursor-pointer
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select portfolio...</option>
                      {((portfolioFilter === 'all' || portfolioFilter === 'mine') && userPortfolios.length > 0) && (
                        <optgroup label="📁 My Portfolios">
                          {userPortfolios.map((portfolio) => (
                            <option key={portfolio.id} value={portfolio.id}>
                              {portfolio.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {((portfolioFilter === 'all' || portfolioFilter !== 'mine') && communityPortfolios.length > 0) && (
                        <optgroup label="🌐 Community Portfolios">
                          {communityPortfolios.map((portfolio) => (
                            <option key={portfolio.id} value={portfolio.id}>
                              {portfolio.name} (by {portfolio.username})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    <button
                      onClick={() => router.push('/kronos')}
                      className="mt-2.5 w-full px-3 py-2 bg-teal-500/10 border border-teal-500/30 
                        hover:bg-teal-500/20 text-teal-400 text-sm font-medium rounded-lg transition-all 
                        flex items-center justify-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Create New Portfolio
                    </button>

                    {!loadingPortfolios && userPortfolios.length === 0 && communityPortfolios.length === 0 && (
                      <p className="mt-2 text-[10px] text-center text-gray-500">
                        No portfolios available. Create your first one to get started.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2 & 3 Instructions */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 bg-[#1a1f2e] border border-gray-800 rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 
                      flex items-center justify-center flex-shrink-0">
                      <FiFileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-1">Step 2: Pick a Question</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Browse scenarios below and click "Test Portfolio"
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-[#1a1f2e] border border-gray-800 rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 
                      flex items-center justify-center flex-shrink-0">
                      <FiBarChart2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-1">Step 3: View Results</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        See your historical analog match and expected returns
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feed Toggle & Filters */}
        <div className="mb-6">
          {/* Feed Toggle Buttons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFeed('questions')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  activeFeed === 'questions'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <FiFileText className="w-4 h-4 inline mr-2" />
                Questions
              </button>
              <button
                onClick={() => setActiveFeed('portfolios')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  activeFeed === 'portfolios'
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <FiBriefcase className="w-4 h-4 inline mr-2" />
                Portfolios
              </button>
            </div>

            {/* Portfolio Filter Dropdown - Only show when portfolios feed is active */}
            {activeFeed === 'portfolios' && (
              <select
                value={portfolioFilter}
                onChange={(e) => setPortfolioFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-800/60 border border-gray-700 rounded-lg 
                  text-white text-sm font-medium hover:bg-gray-800 transition-colors 
                  focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All Portfolios</option>
                <option value="top">Top Rated</option>
                <option value="following">From People I Follow</option>
                <option value="mine">My Portfolios</option>
              </select>
            )}
          </div>

          {/* Question Filter Tabs - Only show when questions feed is active */}
          {activeFeed === 'questions' && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-gray-800/50">
              {filterTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 font-medium text-sm
                      transition-all duration-200 whitespace-nowrap border-b-2 -mb-[2px] ${
                      isActive
                        ? 'text-white border-teal-500'
                        : 'text-gray-500 border-transparent hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feed */}
        {activeFeed === 'questions' ? (
          /* Questions Feed */
          loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
                  bg-teal-500/20 border-2 border-teal-500/30 mb-4">
                  <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent 
                    rounded-full animate-spin" />
                </div>
                <p className="text-gray-400">Loading questions...</p>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                bg-gray-800 border-2 border-gray-700 mb-6">
                <FiMessageSquare className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No questions yet
              </h3>
              <p className="text-gray-400 mb-6">
                {activeFilter === 'following' 
                  ? "You're not following anyone yet. Follow other investors to see their questions here."
                  : "Be the first to create a scenario question!"
                }
              </p>
              {user && activeFilter !== 'following' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 
                    text-white font-bold rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <FiPlus className="w-5 h-5" />
                  Create First Question
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => (
                <PostCard
                  key={question.id}
                  question={question}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onTest={handleTest}
                />
              ))}
            </div>
          )
        ) : (
          /* Portfolios Feed */
          loadingFeed ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
                  bg-teal-500/20 border-2 border-teal-500/30 mb-4">
                  <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent 
                    rounded-full animate-spin" />
                </div>
                <p className="text-gray-400">Loading portfolios...</p>
              </div>
            </div>
          ) : feedPortfolios.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                bg-gray-800 border-2 border-gray-700 mb-6">
                <FiBriefcase className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No portfolios found
              </h3>
              <p className="text-gray-400 mb-6">
                {portfolioFilter === 'mine' 
                  ? "You haven't created any portfolios yet. Create your first portfolio to get started!"
                  : "No portfolios found for this filter. Try selecting a different filter."
                }
              </p>
              {user && portfolioFilter === 'mine' && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 
                    text-white font-bold rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Portfolio
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {feedPortfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 
                    hover:border-teal-500/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => {
                    setSelectedPortfolioId(portfolio.id);
                    sessionStorage.setItem('selectedPortfolioId', portfolio.id);
                  }}
                >
                  {/* Portfolio Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 
                        flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                        {portfolio.username?.charAt(0).toUpperCase() || '?'}
                      </div>

                      {/* Portfolio Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold text-xl group-hover:text-teal-400 transition-colors">
                            {portfolio.name}
                          </h3>
                          {portfolio.isOwn && (
                            <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs font-semibold rounded-md">
                              Your Portfolio
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          by {portfolio.username}
                        </p>
                      </div>
                    </div>

                    {/* Select Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPortfolioId(portfolio.id);
                        sessionStorage.setItem('selectedPortfolioId', portfolio.id);
                      }}
                      className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        selectedPortfolioId === portfolio.id
                          ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {selectedPortfolioId === portfolio.id ? (
                        <span className="flex items-center gap-2">
                          <FiCheck className="w-4 h-4" />
                          Selected
                        </span>
                      ) : 'Select'}
                    </button>
                  </div>

                  {/* Portfolio Description */}
                  {portfolio.description && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {portfolio.description}
                    </p>
                  )}

                  {/* Portfolio Metrics */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <FiClock className="w-4 h-4 text-blue-400" />
                      <span>{new Date(portfolio.created_at).toLocaleDateString()}</span>
                    </div>
                    {portfolio.allocation && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <FiBriefcase className="w-4 h-4 text-teal-400" />
                        <span>{Object.keys(portfolio.allocation).length} holdings</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Load More (placeholder for future pagination) */}
        {!loading && questions.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 
                text-white font-semibold rounded-xl transition-colors"
              onClick={() => {
                // TODO: Implement pagination
                console.log('Load more clicked');
              }}
            >
              Load More
            </button>
          </div>
        )}
      </div>

      {/* Create Question Modal */}
      <CreateQuestionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateQuestion}
      />

      {/* Test Results Modal */}
      {testResults && (
        <TestResultsModal
          isOpen={showTestResults}
          onClose={() => setShowTestResults(false)}
          results={testResults}
        />
      )}

      {/* Loading Overlay for Testing */}
      {isRunningTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-teal-500/50 p-8 max-w-md text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full 
              animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Running Portfolio Test</h3>
            <p className="text-sm text-gray-400 mb-4">
              Analyzing your portfolio allocation...
            </p>
            <p className="text-xs text-teal-400">
              Finding best historical analog...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
