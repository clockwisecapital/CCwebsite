'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FiArrowLeft, FiAward, FiTrendingUp, FiUsers, FiChevronRight, FiBarChart2 } from 'react-icons/fi';
import type { QuestionLeaderboardEntry, ScenarioQuestionWithAuthor } from '@/types/community';
import PortfolioSelectionModal from '@/components/features/community/PortfolioSelectionModal';
import TestResultsModal, { type TestResultData } from '@/components/features/community/TestResultsModal';
import type { PortfolioComparison } from '@/types/portfolio';
import { useAuth } from '@/lib/auth/AuthContext';

type ScoreTier = {
  label: string;
  text: string;
  border: string;
  bg: string;
};

const getScoreTier = (score: number): ScoreTier => {
  if (score >= 90) {
    return { label: 'Excellent', text: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-500/20' };
  }
  if (score >= 75) {
    return { label: 'Strong', text: 'text-teal-400', border: 'border-teal-500/50', bg: 'bg-teal-500/20' };
  }
  if (score >= 60) {
    return { label: 'Moderate', text: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-500/20' };
  }
  return { label: 'Weak', text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/20' };
};

export default function TopPortfoliosPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.questionId as string;
  const { user } = useAuth();

  const [question, setQuestion] = useState<ScenarioQuestionWithAuthor | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuestionLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const [testResults, setTestResults] = useState<TestResultData | null>(null);
  const [portfolioComparison, setPortfolioComparison] = useState<PortfolioComparison | null>(null);
  const [sp500BenchmarkData, setSp500BenchmarkData] = useState<{
    avgReturn: number | null;
    bestYear: number | null;
    worstYear: number | null;
    testCount: number;
  }>({ avgReturn: null, bestYear: null, worstYear: null, testCount: 0 });

  // Fetch question details
  const fetchQuestionDetails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/community/questions/${questionId}`, { headers });
      const data = await response.json();
      if (response.ok && data.success) {
        setQuestion(data.question);
        loadSP500Average(data.question);  // Load S&P 500 average from question metadata
      }
    } catch (error) {
      console.error('Failed to fetch question:', error);
    }
  };
  
  // Simple: Just read SPY benchmark data from question metadata (already calculated)
  const loadSP500Average = (questionData: any) => {
    const metadata = questionData?.metadata;
    console.log('📊 Question metadata:', metadata);
    
    if (metadata?.sp500_avg_return !== undefined) {
      setSp500BenchmarkData({
        avgReturn: metadata.sp500_avg_return,
        bestYear: metadata.spy_best_year ?? null,
        worstYear: metadata.spy_worst_year ?? null,
        testCount: metadata.sp500_test_count || 0
      });
      console.log('✅ SPY benchmark loaded from metadata:', {
        avg: (metadata.sp500_avg_return * 100).toFixed(1) + '%',
        best: metadata.spy_best_year ? (metadata.spy_best_year * 100).toFixed(1) + '%' : 'N/A',
        worst: metadata.spy_worst_year ? (metadata.spy_worst_year * 100).toFixed(1) + '%' : 'N/A',
        tests: metadata.sp500_test_count || 0
      });
    } else {
      console.log('⚠️ No SPY benchmark data in metadata yet, will calculate from test results');
      setSp500BenchmarkData({ avgReturn: null, bestYear: null, worstYear: null, testCount: 0 });
    }
  };
  
  // Fallback: Calculate from test results if metadata is empty
  const calculateSP500FromTests = (testResults: QuestionLeaderboardEntry[]) => {
    // Only calculate if metadata didn't have it
    if (sp500BenchmarkData.avgReturn !== null) {
      console.log('⏭️ Skipping fallback - already have S&P 500 from metadata');
      return;
    }
    
    console.log('📊 Calculating S&P 500 from test results (fallback)', { testResultsCount: testResults?.length });
    
    if (!testResults || testResults.length === 0) {
      console.log('⚠️ No test results available for fallback calculation');
      return;
    }
    
    const benchmarkReturns = testResults
      .map((test, index) => {
        const compData = test.comparison_data as any;
        const userReturn = compData?.userPortfolio?.benchmarkReturn;
        const timeReturn = compData?.timePortfolio?.benchmarkReturn;
        console.log(`  Test ${index + 1}:`, { 
          hasCompData: !!compData, 
          userReturn, 
          timeReturn,
          using: userReturn || timeReturn 
        });
        return userReturn || timeReturn;
      })
      .filter((ret): ret is number => ret !== null && ret !== undefined);
    
    console.log('📊 Extracted benchmark returns:', { count: benchmarkReturns.length, returns: benchmarkReturns });
    
    if (benchmarkReturns.length > 0) {
      const avgReturn = benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / benchmarkReturns.length;
      setSp500BenchmarkData({
        avgReturn,
        bestYear: null, // Will be populated from metadata if available
        worstYear: null,
        testCount: benchmarkReturns.length
      });
      console.log('✅ S&P 500 calculated from tests:', (avgReturn * 100).toFixed(1) + '%', 
                 `(${benchmarkReturns.length} tests)`);
    } else {
      console.log('⚠️ No valid benchmark returns found in test results');
    }
  };

  useEffect(() => {

    // Check for pending test results from sessionStorage (from questions page)
    const checkForPendingResults = () => {
      const latestTestResultStr = sessionStorage.getItem('latestTestResult');
      if (latestTestResultStr) {
        try {
          const latestTestResult = JSON.parse(latestTestResultStr);
          
          // Verify this result is for the current question
          if (latestTestResult.questionId === questionId) {
            console.log('📊 Found pending test results from navigation');
            
            // Show the results modal
            if (latestTestResult.testResult) {
              setTestResults(latestTestResult.testResult);
            }
            if (latestTestResult.portfolioComparison) {
              setPortfolioComparison(latestTestResult.portfolioComparison);
            }
            setShowTestResults(true);
            
            // Clear the sessionStorage
            sessionStorage.removeItem('latestTestResult');
          }
        } catch (error) {
          console.error('Failed to parse test results:', error);
          sessionStorage.removeItem('latestTestResult');
        }
      }
    };

    Promise.all([fetchQuestionDetails(), fetchLeaderboard()])
      .then(() => {
        checkForPendingResults();
      })
      .finally(() => setLoading(false));
  }, [questionId]);

  const averageReturn = useMemo(() => {
    if (!leaderboard.length) return 0;
    const total = leaderboard.reduce((sum, entry) => sum + (entry.expected_return || 0), 0);
    return total / leaderboard.length;
  }, [leaderboard]);

  const period = question?.historical_period?.[0];

  // Handle test button click
  const handleTestClick = () => {
    if (!user) {
      router.push('/');
      return;
    }
    setShowPortfolioModal(true);
  };

  const handlePortfolioSelect = async (portfolioId: string, portfolioName: string) => {
    // Close modal
    setShowPortfolioModal(false);
    
    if (!question) return;
    
    // Show testing UI overlay
    setIsRunningTest(true);
    
    try {
      // Run real Kronos scoring
      const { runScenarioTest } = await import('@/lib/kronos/integration');
      
      const result = await runScenarioTest(
        portfolioId,
        portfolioName,
        question.title,
        question.title
      );
      
      console.log('✅ Kronos test complete:', {
        score: result.testResult.score,
        scenario: result.kronosResponse.scenarioName,
        analog: result.kronosResponse.analogName
      });
      
      // Store test results in sessionStorage in case user navigates away
      sessionStorage.setItem('latestTestResult', JSON.stringify({
        questionId,
        portfolioId,
        portfolioName,
        testResult: result.testResult,
        portfolioComparison: result.portfolioComparison,
        kronosResponse: result.kronosResponse
      }));
      
      // Hide loading overlay
      setIsRunningTest(false);
      
      // Show results in modal
      setTestResults(result.testResult);
      setPortfolioComparison(result.portfolioComparison);
      setShowTestResults(true);
      
      // Save test result to leaderboard and refresh data
      saveTestResultToLeaderboard(portfolioId, portfolioName, result)
        .then(() => {
          // Refresh all data to show updated counts and S&P 500 average
          Promise.all([fetchQuestionDetails(), fetchLeaderboard()]);
        })
        .catch(err => console.error('Failed to save to leaderboard:', err));
      
    } catch (error) {
      console.error('Failed to run test:', error);
      setIsRunningTest(false);
      alert('Failed to run portfolio test. Please try again.');
    }
  };

  const saveTestResultToLeaderboard = async (
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
      
      const payload = {
        portfolioId,
        portfolioName,
        score: result.testResult.score,
        expectedReturn: result.testResult.expectedReturn,
        upside: result.testResult.expectedUpside,
        downside: result.testResult.expectedDownside,
        comparisonData: result.portfolioComparison
      };
      
      console.log('💾 Saving test result to leaderboard');
      console.log('📊 Full result object:', result);
      console.log('📊 portfolioComparison:', result.portfolioComparison);
      console.log('📊 Has userPortfolio:', !!result.portfolioComparison?.userPortfolio);
      console.log('📊 Has timePortfolio:', !!result.portfolioComparison?.timePortfolio);
      console.log('📦 Payload being sent:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`/api/community/questions/${questionId}/test-results`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Result saved to leaderboard:', data.message);
        // Refresh leaderboard to show new result
        fetchLeaderboard();
      }
    } catch (error) {
      console.error('Failed to save leaderboard result:', error);
      throw error;
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/community/questions/${questionId}/test-results?limit=10`, { headers });
      const data = await response.json();
      if (response.ok && data.success && data.topPortfolios.length > 0) {
        // Transform API response to leaderboard format
        const transformedData: QuestionLeaderboardEntry[] = data.topPortfolios.map((p: any, index: number) => ({
          rank: index + 1,
          portfolio_id: p.portfolioId,
          portfolio_name: p.portfolioName,
          user_id: p.userId,
          username: p.userName,
          display_name: p.userName,
          score: p.score,
          expected_return: p.expectedReturn,
          upside: p.upside,
          downside: p.downside,
          test_date: p.createdAt,
          comparison_data: p.comparisonData
        }));
        setLeaderboard(transformedData);
        
        // Fallback: Calculate S&P 500 from test results if not in metadata
        calculateSP500FromTests(transformedData);
      } else {
        // Use sample data if no real data yet
        setLeaderboard(getSampleLeaderboard());
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Use sample data on error
      setLeaderboard(getSampleLeaderboard());
    }
  };

  const getSampleLeaderboard = (): QuestionLeaderboardEntry[] => [
    {
      rank: 1,
      portfolio_id: 'sample-port-1',
      portfolio_name: 'Tech Growth Fund',
      user_id: 'sample-user-1',
      username: 'Alex Chen',
      display_name: 'Alex Chen',
      score: 87.5,
      expected_return: 0.156,
      upside: 0.285,
      downside: -0.065,
      tested_at: new Date().toISOString()
    },
    {
      rank: 2,
      portfolio_id: 'sample-port-2',
      portfolio_name: 'Balanced Index',
      user_id: 'sample-user-2',
      username: 'Jordan Smith',
      display_name: 'Jordan Smith',
      score: 78.3,
      expected_return: 0.124,
      upside: 0.215,
      downside: -0.085,
      tested_at: new Date().toISOString()
    },
    {
      rank: 3,
      portfolio_id: 'sample-port-3',
      portfolio_name: 'Value Dividend',
      user_id: 'sample-user-3',
      username: 'Morgan Davis',
      display_name: 'Morgan Davis',
      score: 72.1,
      expected_return: 0.098,
      upside: 0.178,
      downside: -0.045,
      tested_at: new Date().toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] pt-20">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <button
          onClick={() => router.push('/scenario-testing/questions')}
          className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-white transition-colors mb-4 sm:mb-6"
        >
          <FiArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-semibold">Top Portfolios</span>
        </button>

        {loading ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 sm:p-8 text-center text-sm sm:text-base text-gray-400">
            Loading top portfolios...
          </div>
        ) : !question ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 sm:p-8 text-center text-sm sm:text-base text-gray-400">
            Question not found.
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-4 sm:mb-6">
              <div className="px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-4">
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-500 px-4 sm:px-5 md:px-6 py-5 sm:py-6 md:py-7 text-center border border-teal-400/20">
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white leading-snug break-words">
                    {question.question_text || question.title}
                  </h2>
                </div>
              </div>
              {period && (
                <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5">
                  <p className="text-[10px] sm:text-xs text-gray-400 flex items-start sm:items-center gap-1.5 sm:gap-2 break-words">
                    <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-teal-500/20 border border-teal-500/30 flex-shrink-0 mt-0.5 sm:mt-0">
                      <FiAward className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-400" />
                    </span>
                    <span className="flex-1">
                      Based on {period.start}-{period.end} ({period.label}) scenario analysis
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Test My Portfolio Button */}
            <button
              onClick={handleTestClick}
              className="w-full mb-4 sm:mb-6 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 bg-gradient-to-r from-teal-600 to-emerald-600 
                hover:from-teal-700 hover:to-emerald-700 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl 
                transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-teal-500/30 
                flex items-center justify-center gap-2 sm:gap-3 group"
            >
              <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-xs sm:text-sm md:text-base">
                <span className="hidden sm:inline">Test My Portfolio Against This Scenario</span>
                <span className="sm:hidden">Test My Portfolio</span>
              </span>
              <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>

            <div className="mb-4 sm:mb-6">
              {/* Single row - All 3 metrics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center hover:border-purple-500/50 transition-colors">
                  <p className="text-sm sm:text-base md:text-lg font-bold text-purple-400 break-words">
                    {period ? `${period.start}-${period.end}` : '1995-2000'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5 break-words">{period?.label || 'Dot-Com Boom'}</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center hover:border-blue-500/50 transition-colors">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400">
                    {sp500BenchmarkData.avgReturn !== null 
                      ? `${sp500BenchmarkData.avgReturn >= 0 ? '+' : ''}${(sp500BenchmarkData.avgReturn * 100).toFixed(1)}%`
                      : '--'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5">
                    <span className="hidden xs:inline">SPY Benchmark Return</span>
                    <span className="xs:hidden">SPY Benchmark</span>
                  </p>
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 text-center hover:border-teal-500/50 transition-colors">
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm md:text-base font-bold text-green-400">
                        {sp500BenchmarkData.bestYear !== null
                          ? `${sp500BenchmarkData.bestYear >= 0 ? '+' : ''}${(sp500BenchmarkData.bestYear * 100).toFixed(1)}%`
                          : '--'}
                      </p>
                      <p className="text-[8px] sm:text-[9px] text-gray-500">Best</p>
                    </div>
                    <div className="h-8 sm:h-10 md:h-12 w-px bg-gray-600"></div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm md:text-base font-bold text-red-400">
                        {sp500BenchmarkData.worstYear !== null
                          ? `${sp500BenchmarkData.worstYear >= 0 ? '+' : ''}${(sp500BenchmarkData.worstYear * 100).toFixed(1)}%`
                          : '--'}
                      </p>
                      <p className="text-[8px] sm:text-[9px] text-gray-500">Worst</p>
                    </div>
                  </div>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5">
                    SPY Range
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-700 rounded-xl sm:rounded-2xl shadow-lg">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-gray-700">
                <h3 className="text-xs sm:text-sm font-semibold text-white break-words">
                  <span className="hidden sm:inline">Top Portfolios for "{question.title}"</span>
                  <span className="sm:hidden">Top Portfolios</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400 self-end xs:self-auto">
                  <span className="hidden xs:inline">Tap to compare vs TIME</span>
                  <span className="xs:hidden">Tap to compare</span>
                </p>
              </div>
              <div className="divide-y divide-gray-800">
                {leaderboard.length === 0 ? (
                  <div className="px-4 sm:px-5 md:px-6 py-6 sm:py-8 text-xs sm:text-sm text-gray-400">
                    No test results yet. Be the first to run a test.
                  </div>
                ) : (
                  leaderboard.map((entry) => {
                    const tier = getScoreTier(entry.score);
                    return (
                      <button
                        key={entry.portfolio_id}
                        onClick={() => router.push(`/scenario-testing/${questionId}/top-portfolios/${entry.portfolio_id}`)}
                        className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-b-0 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0 ${
                            entry.rank === 1
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : entry.rank === 2
                                ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                : entry.rank === 3
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                  : 'bg-gray-700 text-gray-300'
                          }`}>
                            {entry.rank}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-teal-400 transition-colors truncate">{entry.portfolio_name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                              {(entry.display_name || entry.username || 'Investor')} • {(entry.expected_return * 100).toFixed(1)}%
                              <span className="hidden xs:inline"> expected return</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <div className={`px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-lg border ${tier.border} ${tier.bg} text-right`}>
                            <p className={`text-xs sm:text-sm font-bold ${tier.text}`}>{entry.score.toFixed(0)}</p>
                            <p className={`text-[9px] sm:text-[10px] font-semibold ${tier.text}`}>{tier.label}</p>
                          </div>
                          <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-teal-400 transition-colors" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-5 bg-gray-900/50 border border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-[10px] sm:text-[11px] font-semibold text-gray-200 mb-2">Scenario Score Guide</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[9px] sm:text-[10px] md:text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">90-100 Excellent</span>
                </span>
                <span className="inline-flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">75-89 Strong</span>
                </span>
                <span className="inline-flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">60-74 Moderate</span>
                </span>
                <span className="inline-flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="whitespace-nowrap">0-59 Weak</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Portfolio Selection Modal */}
      {question && (
        <PortfolioSelectionModal
          isOpen={showPortfolioModal}
          onClose={() => setShowPortfolioModal(false)}
          onPortfolioSelect={handlePortfolioSelect}
          questionId={questionId}
        />
      )}

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
          questionId={questionId}
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
          <style>{`
            @keyframes spinLoader {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .spinner-loader {
              animation: spinLoader 1s linear infinite;
            }
          `}</style>
          <div className="bg-gray-900 rounded-2xl border border-teal-500/50 p-6 sm:p-8 max-w-md w-full text-center mx-4">
            <div 
              className="spinner-loader w-12 h-12 sm:w-16 sm:h-16 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"
            />
            <h3 id="loading-test-title" className="text-lg sm:text-xl font-bold text-white mb-2">Testing Against Scenario</h3>
            <p className="text-xs sm:text-sm text-gray-400">
              Analyzing your portfolio allocation
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This can take up to 20 seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
