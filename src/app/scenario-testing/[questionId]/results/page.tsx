'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import PortfolioTab from '@/components/features/portfolio/dashboard/PortfolioTab';
import { SCENARIO_QUESTIONS, SCENARIO_PORTFOLIOS } from '@/lib/scenarioTestingData';
import type { PortfolioComparison } from '@/types/portfolio';

export default function ScenarioResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const questionId = params.questionId as string;
  
  const [loading, setLoading] = useState(true);
  const [portfolioComparison, setPortfolioComparison] = useState<PortfolioComparison | null>(null);
  const [portfolioName, setPortfolioName] = useState<string>('Your Portfolio');
  const [scenarioName, setScenarioName] = useState<string>('Scenario');
  
  // Find scenario details
  const scenario = SCENARIO_QUESTIONS.find(q => q.id === questionId);
  
  useEffect(() => {
    // TODO: In real implementation, this would fetch actual test results
    // For now, show mock comparison UI
    
    const userPortfolioId = sessionStorage.getItem('scenarioTestPortfolioId');
    const leaderboardPortfolioId = sessionStorage.getItem('scenarioLeaderboardPortfolioId');
    
    if (userPortfolioId) {
      // User's own portfolio selected
      fetchPortfolioAndGenerateMockComparison(userPortfolioId);
    } else if (leaderboardPortfolioId) {
      // Leaderboard portfolio selected
      generateLeaderboardMockComparison(leaderboardPortfolioId);
    } else {
      // No portfolio selected, generate generic mock comparison
      generateMockComparison();
    }
  }, [questionId]);
  
  const fetchPortfolioAndGenerateMockComparison = async (portfolioId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/portfolios/${portfolioId}`, { headers });
      const data = await response.json();
      
      if (response.ok && data.portfolio) {
        setPortfolioName(data.portfolio.name);
        generateMockComparison(data.portfolio);
      } else {
        generateMockComparison();
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      generateMockComparison();
    }
  };
  
  const generateLeaderboardMockComparison = (leaderboardPortfolioId: string) => {
    // Find the leaderboard portfolio from mock data
    const portfoliosForQuestion = SCENARIO_PORTFOLIOS[questionId] || [];
    const leaderboardPortfolio = portfoliosForQuestion.find(p => p.id === leaderboardPortfolioId);
    
    if (leaderboardPortfolio) {
      setPortfolioName(leaderboardPortfolio.name);
      
      // Generate mock comparison for leaderboard portfolio
      const mockComparison: PortfolioComparison = {
        userPortfolio: {
          totalValue: 100000,
          expectedReturn: 0.08,
          upside: 0.15,
          downside: -0.05,
          positions: [],
          isUsingProxy: false,
          topPositions: [
            {
              ticker: 'QQQ',
              name: 'Invesco QQQ Trust',
              weight: 50,
              currentPrice: 450,
              targetPrice: 495,
              expectedReturn: 0.10,
              monteCarlo: {
                ticker: 'QQQ',
                median: 0.10,
                upside: 0.18,
                downside: -0.08,
                volatility: 0.20,
                simulations: 10000
              }
            },
            {
              ticker: 'TLT',
              name: 'iShares 20+ Year Treasury Bond ETF',
              weight: 30,
              currentPrice: 95,
              targetPrice: 100,
              expectedReturn: 0.05,
              monteCarlo: {
                ticker: 'TLT',
                median: 0.05,
                upside: 0.12,
                downside: -0.05,
                volatility: 0.12,
                simulations: 10000
              }
            },
            {
              ticker: 'GLD',
              name: 'SPDR Gold Shares',
              weight: 20,
              currentPrice: 180,
              targetPrice: 193,
              expectedReturn: 0.07,
              monteCarlo: {
                ticker: 'GLD',
                median: 0.07,
                upside: 0.15,
                downside: -0.03,
                volatility: 0.15,
                simulations: 10000
              }
            }
          ]
        },
        timePortfolio: {
          totalValue: 100000,
          expectedReturn: 0.02,
          upside: 0.15,
          downside: -0.08,
          positions: [],
          topPositions: [
            {
              ticker: 'GLD',
              name: 'SPDR Gold Shares',
              weight: 40,
              currentPrice: 180,
              targetPrice: 194,
              expectedReturn: 0.08,
              monteCarlo: {
                ticker: 'GLD',
                median: 0.08,
                upside: 0.20,
                downside: -0.05,
                volatility: 0.15,
                simulations: 10000
              }
            },
            {
              ticker: 'TLT',
              name: 'iShares 20+ Year Treasury Bond ETF',
              weight: 30,
              currentPrice: 95,
              targetPrice: 98,
              expectedReturn: 0.03,
              monteCarlo: {
                ticker: 'TLT',
                median: 0.03,
                upside: 0.12,
                downside: -0.08,
                volatility: 0.12,
                simulations: 10000
              }
            },
            {
              ticker: 'DBC',
              name: 'Invesco DB Commodity Index Tracking Fund',
              weight: 20,
              currentPrice: 18,
              targetPrice: 18,
              expectedReturn: -0.02,
              monteCarlo: {
                ticker: 'DBC',
                median: -0.02,
                upside: 0.18,
                downside: -0.12,
                volatility: 0.20,
                simulations: 10000
              }
            },
            {
              ticker: 'SPY',
              name: 'SPDR S&P 500 ETF',
              weight: 10,
              currentPrice: 450,
              targetPrice: 414,
              expectedReturn: -0.08,
              monteCarlo: {
                ticker: 'SPY',
                median: -0.08,
                upside: 0.12,
                downside: -0.18,
                volatility: 0.18,
                simulations: 10000
              }
            }
          ]
        },
        timeHorizon: 1
      };
      
      setPortfolioComparison(mockComparison);
      setScenarioName(scenario?.title || 'Scenario Test');
      setLoading(false);
    } else {
      // Portfolio not found, use generic mock
      generateMockComparison();
    }
  };
  
  const generateMockComparison = (portfolio?: any) => {
    // Generate mock comparison data for UI display
    // TODO: Replace with actual scenario testing API call
    
    const mockComparison: PortfolioComparison = {
      userPortfolio: {
        totalValue: portfolio?.portfolio_data?.totalValue || 100000,
        expectedReturn: -0.05,
        upside: 0.10,
        downside: -0.15,
        positions: [],
        isUsingProxy: false,
        topPositions: [
          {
            ticker: 'SPY',
            name: 'SPDR S&P 500 ETF',
            weight: 60,
            currentPrice: 450,
            targetPrice: 414,
            expectedReturn: -0.08,
            monteCarlo: {
              ticker: 'SPY',
              median: -0.08,
              upside: 0.12,
              downside: -0.18,
              volatility: 0.18,
              simulations: 10000
            }
          },
          {
            ticker: 'AGG',
            name: 'iShares Core U.S. Aggregate Bond ETF',
            weight: 30,
            currentPrice: 100,
            targetPrice: 99,
            expectedReturn: -0.01,
            monteCarlo: {
              ticker: 'AGG',
              median: -0.01,
              upside: 0.05,
              downside: -0.08,
              volatility: 0.06,
              simulations: 10000
            }
          },
          {
            ticker: 'VNQ',
            name: 'Vanguard Real Estate ETF',
            weight: 10,
            currentPrice: 85,
            targetPrice: 75,
            expectedReturn: -0.12,
            monteCarlo: {
              ticker: 'VNQ',
              median: -0.12,
              upside: 0.15,
              downside: -0.25,
              volatility: 0.22,
              simulations: 10000
            }
          }
        ]
      },
      timePortfolio: {
        totalValue: 100000,
        expectedReturn: 0.02,
        upside: 0.15,
        downside: -0.08,
        positions: [],
        topPositions: [
          {
            ticker: 'GLD',
            name: 'SPDR Gold Shares',
            weight: 40,
            currentPrice: 180,
            targetPrice: 194,
            expectedReturn: 0.08,
            monteCarlo: {
              ticker: 'GLD',
              median: 0.08,
              upside: 0.20,
              downside: -0.05,
              volatility: 0.15,
              simulations: 10000
            }
          },
          {
            ticker: 'TLT',
            name: 'iShares 20+ Year Treasury Bond ETF',
            weight: 30,
            currentPrice: 95,
            targetPrice: 98,
            expectedReturn: 0.03,
            monteCarlo: {
              ticker: 'TLT',
              median: 0.03,
              upside: 0.12,
              downside: -0.08,
              volatility: 0.12,
              simulations: 10000
            }
          },
          {
            ticker: 'DBC',
            name: 'Invesco DB Commodity Index Tracking Fund',
            weight: 20,
            currentPrice: 18,
            targetPrice: 18,
            expectedReturn: -0.02,
            monteCarlo: {
              ticker: 'DBC',
              median: -0.02,
              upside: 0.18,
              downside: -0.12,
              volatility: 0.20,
              simulations: 10000
            }
          },
          {
            ticker: 'SPY',
            name: 'SPDR S&P 500 ETF',
            weight: 10,
            currentPrice: 450,
            targetPrice: 414,
            expectedReturn: -0.08,
            monteCarlo: {
              ticker: 'SPY',
              median: -0.08,
              upside: 0.12,
              downside: -0.18,
              volatility: 0.18,
              simulations: 10000
            }
          }
        ]
      },
      timeHorizon: 1
    };
    
    setPortfolioComparison(mockComparison);
    setScenarioName(scenario?.title || 'Scenario Test');
    setLoading(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20 
        flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
            bg-blue-500/20 border-2 border-blue-500/30 mb-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent 
              rounded-full animate-spin" />
          </div>
          <p className="text-gray-400 text-lg">Running scenario analysis...</p>
          <p className="text-gray-500 text-sm mt-2">Comparing against TIME portfolio</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/scenario-testing/questions')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Questions
          </button>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Scenario Test Results
              </h1>
              <p className="text-lg text-blue-400 font-semibold">
                {scenarioName}
              </p>
              {scenario && (
                <p className="text-gray-400 mt-2">
                  {scenario.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Notice Banner */}
        <div className="mb-8 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-yellow-200 font-semibold text-sm">Mock Data - UI Preview</p>
              <p className="text-yellow-300/80 text-xs mt-1">
                This is a preview of the comparison UI. Actual scenario testing logic will be implemented next.
              </p>
            </div>
          </div>
        </div>
        
        {/* Portfolio Comparison */}
        {portfolioComparison && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <PortfolioTab 
              portfolioComparison={portfolioComparison}
            />
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/scenario-testing/questions')}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 
              text-white font-semibold rounded-xl transition-colors flex items-center 
              justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Try Another Scenario
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold 
              rounded-xl transition-all duration-300 shadow-lg hover:scale-105 
              flex items-center justify-center gap-2"
          >
            View My Portfolios
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

