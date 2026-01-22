'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import PostCard from '@/components/features/community/PostCard';
import CreateQuestionModal from '@/components/features/community/CreateQuestionModal';
import TestResultsModal, { type TestResultData } from '@/components/features/community/TestResultsModal';
import { FiPlus, FiTrendingUp, FiClock, FiThumbsUp, FiMessageSquare, FiUsers, FiTarget, FiFileText } from 'react-icons/fi';
import type { ScenarioQuestionWithAuthor, FeedFilter, CreateScenarioQuestionInput } from '@/types/community';
import type { PortfolioComparison } from '@/types/portfolio';

export default function CommunityFeedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [questions, setQuestions] = useState<ScenarioQuestionWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('recent');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [userPortfolios, setUserPortfolios] = useState<Array<{ id: string; name: string }>>([]);
  const [communityPortfolios, setCommunityPortfolios] = useState<Array<{ id: string; name: string; user_id: string; username?: string }>>([]);
  
  // Test Results Modal
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState<TestResultData | null>(null);
  const [portfolioComparison, setPortfolioComparison] = useState<PortfolioComparison | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Redirect unauthenticated users to Kronos
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/kronos');
    }
  }, [user, authLoading, router]);

  // Fetch questions based on active filter
  useEffect(() => {
    fetchQuestions();
  }, [activeFilter]);

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
        // Always include sample questions for demo purposes
        const realQuestions = Array.isArray(data.questions) ? data.questions : [];
        
        // Debug: Log real questions to see likes data
        console.log('📊 Real questions from API:', realQuestions.map((q: ScenarioQuestionWithAuthor) => ({
          id: q.id,
          title: q.title.substring(0, 30),
          likes_count: q.likes_count,
          is_liked_by_user: q.is_liked_by_user
        })));
        
        const sampleQuestions = getSampleQuestions();
        // Merge and deduplicate by ID
        const allQuestions = [...realQuestions];
        sampleQuestions.forEach(sample => {
          if (!allQuestions.find(q => q.id === sample.id)) {
            allQuestions.push(sample);
          }
        });
        setQuestions(allQuestions.slice(0, 20)); // Limit to 20
      } else {
        console.error('Failed to fetch questions:', data.error);
        setQuestions(getSampleQuestions());
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions(getSampleQuestions());
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPortfolios = async () => {
    if (!user) return;
    
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

  // Handle like
  const handleLike = async (questionId: string) => {
    // Don't allow liking sample questions (they're not in the database)
    if (questionId.startsWith('sample-')) {
      alert('This is a demo question. Create a real question to enable likes and comments!');
      return;
    }

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
        const data = await response.json();
        // Update local state with the actual count from the database
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { ...q, likes_count: data.likes_count || (q.likes_count + 1), is_liked_by_user: true }
            : q
        ));
      } else {
        const errorData = await response.json();
        console.error('Failed to like question:', errorData);
        throw new Error(errorData.error || 'Failed to like question');
      }
    } catch (error) {
      console.error('Failed to like question:', error);
      throw error;
    }
  };

  // Handle unlike
  const handleUnlike = async (questionId: string) => {
    // Don't allow unliking sample questions (they're not in the database)
    if (questionId.startsWith('sample-')) {
      alert('This is a demo question. Create a real question to enable likes and comments!');
      return;
    }

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
        const data = await response.json();
        // Update local state with the actual count from the database
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { ...q, likes_count: data.likes_count || Math.max(0, q.likes_count - 1), is_liked_by_user: false }
            : q
        ));
      } else {
        const errorData = await response.json();
        console.error('Failed to unlike question:', errorData);
        throw new Error(errorData.error || 'Failed to unlike question');
      }
    } catch (error) {
      console.error('Failed to unlike question:', error);
      throw error;
    }
  };

  // Save test result to leaderboard
  const saveTestResultToLeaderboard = async (
    questionId: string,
    portfolioId: string,
    portfolioName: string,
    result: any
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/community/questions/${questionId}/test-results`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          portfolioId,
          portfolioName,
          score: result.testResult.score,
          expectedReturn: result.testResult.expectedReturn,
          upside: result.testResult.expectedUpside,
          downside: result.testResult.expectedDownside,
          comparisonData: result.portfolioComparison
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Result saved to leaderboard:', data.message);
      }
    } catch (error) {
      console.error('Failed to save leaderboard result:', error);
    }
  };

  // Handle test
  const handleTest = async (questionId: string) => {
    // Check for portfolio from sessionStorage (from PostCard modal) or state (from top dropdown)
    const portfolioIdToUse = sessionStorage.getItem('scenarioTestPortfolioId') || selectedPortfolioId;
    const portfolioNameFromSession = sessionStorage.getItem('scenarioTestPortfolioName');
    
    if (!portfolioIdToUse) {
      alert('Please select a portfolio first. Redirecting to Kronos.');
      router.push('/kronos');
      return;
    }

    // Find the question
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const portfolioName = portfolioNameFromSession ||
                         userPortfolios.find(p => p.id === portfolioIdToUse)?.name || 
                         communityPortfolios.find(p => p.id === portfolioIdToUse)?.name || 
                         'Unknown Portfolio';

    setIsRunningTest(true);

    try {
      // Run real Kronos scoring
      const { runScenarioTest } = await import('@/lib/kronos/integration');
      
      const result = await runScenarioTest(
        portfolioIdToUse,
        portfolioName,
        question.title,
        question.title
      );
      
      // Clear sessionStorage after use
      sessionStorage.removeItem('scenarioTestPortfolioId');
      sessionStorage.removeItem('scenarioTestPortfolioName');

      // Store test results in sessionStorage in case user navigates away
      sessionStorage.setItem('latestTestResult', JSON.stringify({
        questionId,
        portfolioId: portfolioIdToUse,
        portfolioName,
        testResult: result.testResult,
        portfolioComparison: result.portfolioComparison,
        kronosResponse: result.kronosResponse
      }));

      // Use real Kronos results
      setTestResults(result.testResult);
      setPortfolioComparison(result.portfolioComparison);
      setShowTestResults(true);
      
      console.log('✅ Kronos test complete:', {
        score: result.testResult.score,
        scenario: result.kronosResponse.scenarioName,
        analog: result.kronosResponse.analogName
      });
      
      // Save test result to leaderboard (don't await, run in background)
      saveTestResultToLeaderboard(
        questionId,
        portfolioIdToUse,
        portfolioName,
        result
      ).catch(err => console.error('Failed to save to leaderboard:', err));
      
      /* REMOVED MOCK DATA - NOW USING REAL KRONOS
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

      // Mock portfolio comparison data
      const mockComparison: PortfolioComparison = {
        userPortfolio: {
          totalValue: 100000,
          expectedReturn: 0.124,
          upside: 0.285,
          downside: -0.065,
          isUsingProxy: false,
          positions: [],
          topPositions: [
            {
              ticker: 'AAPL',
              name: 'Apple Inc.',
              weight: 25,
              currentPrice: 185.50,
              targetPrice: 210.00,
              expectedReturn: 0.132,
              assetClass: 'Technology',
              monteCarlo: {
                ticker: 'AAPL',
                median: 0.132,
                upside: 0.320,
                downside: -0.080,
                volatility: 0.28,
                simulations: 5000
              }
            },
            {
              ticker: 'MSFT',
              name: 'Microsoft Corp.',
              weight: 20,
              currentPrice: 375.00,
              targetPrice: 420.00,
              expectedReturn: 0.120,
              assetClass: 'Technology',
              monteCarlo: {
                ticker: 'MSFT',
                median: 0.120,
                upside: 0.290,
                downside: -0.070,
                volatility: 0.25,
                simulations: 5000
              }
            },
            {
              ticker: 'GOOGL',
              name: 'Alphabet Inc.',
              weight: 18,
              currentPrice: 140.00,
              targetPrice: 162.00,
              expectedReturn: 0.157,
              assetClass: 'Technology',
              monteCarlo: {
                ticker: 'GOOGL',
                median: 0.157,
                upside: 0.340,
                downside: -0.090,
                volatility: 0.30,
                simulations: 5000
              }
            },
            {
              ticker: 'NVDA',
              name: 'NVIDIA Corp.',
              weight: 15,
              currentPrice: 495.00,
              targetPrice: 620.00,
              expectedReturn: 0.253,
              assetClass: 'Technology',
              monteCarlo: {
                ticker: 'NVDA',
                median: 0.253,
                upside: 0.480,
                downside: -0.120,
                volatility: 0.42,
                simulations: 5000
              }
            },
            {
              ticker: 'SPY',
              name: 'S&P 500 ETF',
              weight: 22,
              currentPrice: 458.00,
              targetPrice: 505.00,
              expectedReturn: 0.103,
              assetClass: 'Broad Market',
              monteCarlo: {
                ticker: 'SPY',
                median: 0.103,
                upside: 0.240,
                downside: -0.055,
                volatility: 0.18,
                simulations: 5000
              }
            }
          ]
        },
        timePortfolio: {
          totalValue: 100000,
          expectedReturn: 0.158,
          upside: 0.315,
          downside: -0.042,
          positions: [],
          topPositions: [
            {
              ticker: 'AAPL',
              name: 'Apple Inc.',
              weight: 8,
              currentPrice: 185.50,
              targetPrice: 210.00,
              expectedReturn: 0.132,
              assetClass: 'Technology',
              monteCarlo: {
                ticker: 'AAPL',
                median: 0.132,
                upside: 0.320,
                downside: -0.080,
                volatility: 0.28,
                simulations: 5000
              }
            },
            {
              ticker: 'NVDA',
              name: 'NVIDIA Corp.',
              weight: 6.5,
              currentPrice: 495.00,
              targetPrice: 620.00,
              expectedReturn: 0.253,
              assetClass: 'Technology',
              monteCarlo: {
                ticker: 'NVDA',
                median: 0.253,
                upside: 0.480,
                downside: -0.120,
                volatility: 0.42,
                simulations: 5000
              }
            },
            {
              ticker: 'XLE',
              name: 'Energy Select Sector',
              weight: 5.2,
              currentPrice: 88.50,
              targetPrice: 102.00,
              expectedReturn: 0.152,
              assetClass: 'Energy',
              monteCarlo: {
                ticker: 'XLE',
                median: 0.152,
                upside: 0.380,
                downside: -0.110,
                volatility: 0.32,
                simulations: 5000
              }
            },
            {
              ticker: 'GLD',
              name: 'Gold ETF',
              weight: 4.8,
              currentPrice: 188.00,
              targetPrice: 205.00,
              expectedReturn: 0.090,
              assetClass: 'Commodities',
              monteCarlo: {
                ticker: 'GLD',
                median: 0.090,
                upside: 0.180,
                downside: -0.035,
                volatility: 0.16,
                simulations: 5000
              }
            },
            {
              ticker: 'TLT',
              name: 'Treasury Bond ETF',
              weight: 4.5,
              currentPrice: 92.50,
              targetPrice: 98.00,
              expectedReturn: 0.059,
              assetClass: 'Bonds',
              monteCarlo: {
                ticker: 'TLT',
                median: 0.059,
                upside: 0.120,
                downside: -0.025,
                volatility: 0.10,
                simulations: 5000
              }
            }
          ]
        },
        timeHorizon: 1
      };

      // These are now set above with real Kronos data
      // setTestResults(mockResults);
      // setPortfolioComparison(mockComparison);
      // setShowTestResults(true);
      END OF MOCK DATA */
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

  const filterTabs: Array<{ id: FeedFilter; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'recent', label: 'Recent', icon: FiClock },
  ];

  const getSampleQuestions = (): ScenarioQuestionWithAuthor[] => ([
    {
      id: 'sample-ai-supercycle',
      user_id: 'sample-user-1',
      title: 'AI Supercycle',
      description: 'How should portfolios adapt to AI-driven productivity shocks?',
      question_text: 'Is AI a productivity supercycle or just another bubble?',
      historical_period: [{ start: '1995', end: '2000', label: 'Internet Boom' }],
      tags: ['ai', 'productivity', 'tech'],
      likes_count: 1203,
      comments_count: 2,
      tests_count: 84,
      views_count: 3120,
      is_active: true,
      is_featured: true,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      metadata: {},
      author: {
        id: 'author-1',
        email: 'tech_investors@clockwise.capital',
        first_name: 'Tech',
        last_name: 'Investors'
      },
      is_liked_by_user: false,
      is_following_author: false
    },
    {
      id: 'sample-etf-volatility',
      user_id: 'sample-user-2',
      title: 'ETF Volatility',
      description: 'Risk tactics for volatile macro regimes.',
      question_text: 'How do you handle market volatility with your ETFs?',
      historical_period: [{ start: '2020', end: '2020', label: 'COVID Crash' }],
      tags: ['etf', 'volatility', 'risk'],
      likes_count: 847,
      comments_count: 3,
      tests_count: 61,
      views_count: 1980,
      is_active: true,
      is_featured: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      metadata: {},
      author: {
        id: 'author-2',
        email: 'etf_investing@clockwise.capital',
        first_name: 'ETF',
        last_name: 'Investing'
      },
      is_liked_by_user: false,
      is_following_author: false
    },
    {
      id: 'sample-fixed-income',
      user_id: 'sample-user-3',
      title: 'Fixed Income Focus',
      description: 'Positioning through rate regime changes.',
      question_text: 'What fixed income strategy works best in a hiking cycle?',
      historical_period: [{ start: '2004', end: '2006', label: 'Rate Hikes' }],
      tags: ['fixed-income', 'rates', 'bonds'],
      likes_count: 529,
      comments_count: 1,
      tests_count: 45,
      views_count: 1140,
      is_active: true,
      is_featured: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      metadata: {},
      author: {
        id: 'author-3',
        email: 'fixedincome_focus@clockwise.capital',
        first_name: 'Fixed',
        last_name: 'Income Focus'
      },
      is_liked_by_user: false,
      is_following_author: false
    }
  ]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
            bg-teal-500/20 border-2 border-teal-500/30 mb-4">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] pt-20">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Filters */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 border-b border-gray-800/50 scrollbar-hide">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm
                    transition-all duration-200 whitespace-nowrap border-b-2 -mb-[2px] flex-shrink-0 ${
                    isActive
                      ? 'text-white border-teal-500'
                      : 'text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {tab.label}
                </button>
              );
            })}
             {user && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-teal-500 hover:bg-teal-600 
                  text-white font-semibold rounded-lg transition-colors text-xs sm:text-sm ml-auto flex-shrink-0"
              >
                <FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Post Question</span>
                <span className="xs:hidden">Post</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {user && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 px-3 sm:px-4 md:px-6 py-3 sm:py-3 bg-gray-900/40 backdrop-blur-sm 
            border border-gray-800 rounded-xl">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm w-full sm:w-auto">
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
                <FiUsers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 flex-shrink-0" />
                <span className="font-semibold text-white">{questions.length * 43}</span>
                <span className="hidden xs:inline">members</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
                <FiFileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                <span className="font-semibold text-white">{questions.length}</span>
                <span className="hidden xs:inline">questions</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
                <FiTarget className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                <span className="font-semibold text-white">{Math.floor(questions.length * 0.8)}</span>
                <span className="hidden xs:inline">active</span>
                <span className="hidden sm:inline">this week</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-semibold">Live</span>
            </div>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16 md:py-20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full 
                bg-teal-500/20 border-2 border-teal-500/30 mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-teal-500 border-t-transparent 
                  rounded-full animate-spin" />
              </div>
              <p className="text-sm sm:text-base text-gray-400">Loading questions...</p>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-20 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full 
              bg-gray-800 border-2 border-gray-700 mb-4 sm:mb-6">
              <FiMessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
              No questions yet
            </h3>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
              {activeFilter === 'following' 
                ? "You're not following anyone yet. Follow other investors to see their questions here."
                : "Be the first to create a scenario question!"
              }
            </p>
            {user && activeFilter !== 'following' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-teal-600 hover:bg-teal-700 
                  text-white text-sm sm:text-base font-bold rounded-xl transition-all duration-300 hover:scale-105"
              >
                <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                Create First Question
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
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
        )}

        {/* Load More (placeholder for future pagination) */}
        {!loading && questions.length > 0 && (
          <div className="flex justify-center mt-6 sm:mt-8">
            <button
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 
                text-white text-sm sm:text-base font-semibold rounded-xl transition-colors"
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
          onClose={() => {
            setShowTestResults(false);
            // Clear sessionStorage when modal is closed
            sessionStorage.removeItem('latestTestResult');
          }}
          results={testResults}
          portfolioComparison={portfolioComparison || undefined}
        />
      )}

      {/* Loading Overlay for Testing */}
      {isRunningTest && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loading-test-title"
        >
          <div className="bg-gray-900 rounded-2xl border border-teal-500/50 p-6 sm:p-8 max-w-md w-full text-center mx-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-teal-500 border-t-transparent rounded-full 
              animate-spin mx-auto mb-3 sm:mb-4" />
            <h3 id="loading-test-title" className="text-lg sm:text-xl font-bold text-white mb-2">Running Portfolio Test</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
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
