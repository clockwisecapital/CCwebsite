'use client';

import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiZap } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import PortfolioCard, { type PortfolioCardData } from '@/components/features/community/PortfolioCard';

const PortfolioComparison = () => {
  const router = useRouter();
  const params = useParams();
  const questionId = params.questionId as string;
  const portfolioId = params.portfolioId as string;

  const [userPortfolio, setUserPortfolio] = useState<PortfolioCardData | null>(null);
  const [clockwisePortfolios, setClockwisePortfolios] = useState<PortfolioCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPortfolios, setExpandedPortfolios] = useState<Set<string>>(new Set(['user', 'time']));

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        // Fetch the selected portfolio's test result
        const response = await fetch(`/api/community/questions/${questionId}/test-results`);
        const data = await response.json();
        
        console.log('🔍 Head-to-Head - API Response:', { success: data.success, count: data.topPortfolios?.length });
        
        if (response.ok && data.success) {
          const portfolioTest = data.topPortfolios.find((p: any) => p.portfolioId === portfolioId);
          
          console.log('🔍 Looking for portfolioId:', portfolioId);
          console.log('📊 Portfolio test found:', !!portfolioTest);
          console.log('📊 Has comparisonData:', !!portfolioTest?.comparisonData);
          
          if (portfolioTest) {
            // Get user portfolio holdings from comparisonData if available
            let userTopPositions = [];
            if (portfolioTest.comparisonData?.userPortfolio?.topPositions) {
              userTopPositions = portfolioTest.comparisonData.userPortfolio.topPositions.slice(0, 5).map((pos: any) => ({
                ticker: pos.ticker,
                name: pos.name || pos.ticker,
                weight: pos.weight,
                expectedReturn: pos.expectedReturn || portfolioTest.expectedReturn
              }));
            } else if (portfolioTest.holdings) {
              // Fallback to holdings if no comparisonData
              userTopPositions = portfolioTest.holdings.slice(0, 5).map((h: any) => {
                let weight = h.weight || h.percentage || 0;
                if (weight > 0 && weight < 1) {
                  weight = weight * 100;
                }
                return {
                  ticker: h.ticker,
                  name: h.name || h.ticker,
                  weight: weight,
                  expectedReturn: portfolioTest.expectedReturn
                };
              });
            }
            
            setUserPortfolio({
              id: 'user',
              name: portfolioTest.portfolioName,
              score: portfolioTest.score,
              expectedReturn: portfolioTest.expectedReturn,
              expectedBestYear: portfolioTest.upside,
              expectedWorstYear: portfolioTest.downside,
              upside: portfolioTest.upside,
              downside: portfolioTest.downside,
              topPositions: userTopPositions
            });
            
            // Build array of all Clockwise portfolios from SAVED test data
            const clockwise: PortfolioCardData[] = [];
            
            console.log('📊 Loading Clockwise portfolios from saved test data...');
            console.log('📊 comparisonData available:', !!portfolioTest.comparisonData);
            console.log('📊 clockwisePortfolios available:', !!portfolioTest.comparisonData?.clockwisePortfolios);
            
            // Check if we have clockwisePortfolios in the saved data
            if (portfolioTest.comparisonData?.clockwisePortfolios && Array.isArray(portfolioTest.comparisonData.clockwisePortfolios)) {
              console.log('✅ Found', portfolioTest.comparisonData.clockwisePortfolios.length, 'Clockwise portfolios in saved data');
              
              portfolioTest.comparisonData.clockwisePortfolios.forEach((p: any) => {
                clockwise.push({
                  id: p.id,
                  name: p.name,
                  score: p.score,
                  expectedReturn: p.expectedReturn,
                  expectedBestYear: p.upside,
                  expectedWorstYear: p.downside,
                  upside: p.upside,
                  downside: p.downside,
                  topPositions: p.holdings?.filter((h: any) => h.weight > 0).slice(0, 5).map((h: any) => ({
                    ticker: h.ticker,
                    name: h.ticker,
                    weight: typeof h.weight === 'number' && h.weight < 1 ? h.weight * 100 : h.weight,
                    expectedReturn: p.expectedReturn || 0
                  })) || []
                });
              });
            } else {
              // Fallback: Add TIME Portfolio from old comparisonData structure
              console.warn('⚠️ No clockwisePortfolios in saved data, using legacy TIME-only structure');
              if (portfolioTest.comparisonData?.timePortfolio) {
                const timeData = portfolioTest.comparisonData.timePortfolio;
                clockwise.push({
                  id: 'time',
                  name: 'TIME Portfolio',
                  score: timeData.score || 88,
                  expectedReturn: timeData.expectedReturn || 0.094,
                  expectedBestYear: timeData.upside || 0.445,
                  expectedWorstYear: timeData.downside || -0.171,
                  upside: timeData.upside || 0.441,
                  downside: timeData.downside || -0.171,
                  topPositions: timeData.topPositions?.slice(0, 5).map((pos: any) => ({
                    ticker: pos.ticker,
                    name: pos.name || pos.ticker,
                    weight: pos.weight,
                    expectedReturn: pos.expectedReturn || 0
                  })) || []
                });
              }
            }
            
            setClockwisePortfolios(clockwise);
          }
        }
      } catch (error) {
        console.error('Failed to fetch comparison:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComparison();
  }, [questionId, portfolioId]);

  const toggleExpanded = (portfolioId: string) => {
    setExpandedPortfolios(prev => {
      const newSet = new Set(prev);
      if (newSet.has(portfolioId)) {
        newSet.delete(portfolioId);
      } else {
        newSet.add(portfolioId);
      }
      return newSet;
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (!userPortfolio || clockwisePortfolios.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Portfolio not found</p>
          <button
            onClick={() => router.push(`/scenario-testing/${questionId}/top-portfolios`)}
            className="mt-4 text-teal-400 hover:text-teal-300"
          >
            Back to Top Portfolios
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] pt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/scenario-testing/${questionId}/top-portfolios`)}
          className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-white transition-colors mb-4 sm:mb-6 md:mb-8"
        >
          <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-semibold">Back to Top Portfolios</span>
        </button>

        {/* Test Scenario Header */}
        <div className="bg-gradient-to-r from-gray-900/60 to-gray-800/60 border border-teal-600/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
          <p className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-wide mb-2">
            Testing Scenario: AI Supercycle • Historical Analog: 1995-2000 — Internet Boom
          </p>
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">
            "Is AI a productivity supercycle or just another bubble?"
          </h2>
        </div>

        {/* Head-to-Head Comparison */}
        <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-4 sm:mb-6 md:mb-8 flex items-center gap-2">
            <FiZap className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
            Portfolio Comparison
          </h3>

          {/* Mobile: Stacked View */}
          <div className="md:hidden space-y-4">
            {/* User Portfolio */}
            <PortfolioCard
              portfolio={userPortfolio}
              isUser={true}
              isExpanded={expandedPortfolios.has('user')}
              canToggle={false}
            />
            {/* Clockwise Portfolios */}
            {clockwisePortfolios.map(portfolio => {
              const isTime = portfolio.id === 'time';
              const canToggle = !isTime;
              return (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  isExpanded={expandedPortfolios.has(portfolio.id)}
                  onToggle={() => toggleExpanded(portfolio.id)}
                  canToggle={canToggle}
                />
              );
            })}
          </div>

          {/* Desktop: Grid View */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* User Portfolio */}
            <PortfolioCard
              portfolio={userPortfolio}
              isUser={true}
              isExpanded={true}
              canToggle={false}
            />
            {/* Clockwise Portfolios */}
            {clockwisePortfolios.map(portfolio => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                isExpanded={true}
                canToggle={false}
              />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-teal-900/40 to-blue-900/40 border border-teal-600/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2">
            Ready to implement your portfolio?
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-gray-300 mb-4 sm:mb-6">
            Get personalized advice from our financial experts
          </p>
          <a
            href="https://calendly.com/clockwisecapital/appointments"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-teal-500 hover:bg-teal-600 text-black text-sm sm:text-base font-bold rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105"
          >
            Talk to an Advisor
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default PortfolioComparison;
