'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiBarChart2, FiZap } from 'react-icons/fi';
import PortfolioCard, { type PortfolioCardData } from './PortfolioCard';

export interface HistoricalAnalog {
  period: string;
  similarity: number;
  matchingFactors: string[];
  cycleName?: string;
}

export interface TestResultData {
  score: number;
  expectedReturn: number;
  expectedUpside: number;
  expectedDownside: number;
  confidence?: number;
  historicalAnalog?: HistoricalAnalog;
  portfolioName?: string;
  questionTitle?: string;
  historicalPeriod?: {
    label: string;
    years: string;
  };
}

export interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: TestResultData;
  portfolioComparison?: any; // Legacy - keeping for backward compatibility
  questionId?: string;
}

export default function TestResultsModal({ 
  isOpen, 
  onClose, 
  results,
  portfolioComparison,
  questionId 
}: TestResultsModalProps) {
  const router = useRouter();
  const [userPortfolio, setUserPortfolio] = useState<PortfolioCardData | null>(null);
  const [clockwisePortfolios, setClockwisePortfolios] = useState<PortfolioCardData[]>([]);
  const [expandedPortfolios, setExpandedPortfolios] = useState<Set<string>>(new Set(['user', 'time']));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPortfolioData();
    }
  }, [isOpen, results, portfolioComparison]);

  const loadPortfolioData = async () => {
    setLoading(true);

    // Build user portfolio from results
    const userPortfolioData: PortfolioCardData = {
      id: 'user',
      name: results.portfolioName || 'Your Portfolio',
      score: results.score,
      expectedReturn: results.expectedReturn,
      expectedBestYear: results.expectedUpside,
      expectedWorstYear: results.expectedDownside,
      upside: results.expectedUpside,
      downside: results.expectedDownside,
      topPositions: portfolioComparison?.userPortfolio?.topPositions?.slice(0, 5).map((pos: any) => ({
        ticker: pos.ticker,
        name: pos.name || pos.ticker,
        weight: pos.weight,
        expectedReturn: pos.expectedReturn || 0
      })) || []
    };
    setUserPortfolio(userPortfolioData);

    // Load Clockwise portfolios from SAVED test data (no new API call!)
    console.log('📊 Loading Clockwise portfolios from portfolioComparison...');
    console.log('📊 portfolioComparison available:', !!portfolioComparison);
    console.log('📊 clockwisePortfolios available:', !!portfolioComparison?.clockwisePortfolios);
    
    if (portfolioComparison?.clockwisePortfolios && Array.isArray(portfolioComparison.clockwisePortfolios)) {
      console.log('✅ Found', portfolioComparison.clockwisePortfolios.length, 'Clockwise portfolios in saved data');
      
      const clockwise: PortfolioCardData[] = portfolioComparison.clockwisePortfolios.map((p: any) => ({
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
      }));
      
      setClockwisePortfolios(clockwise);
      console.log('✅ Loaded Clockwise portfolios from saved data:', clockwise.length);
    } else {
      // Fallback: use old TIME-only structure for backward compatibility
      console.warn('⚠️ No clockwisePortfolios in saved data, using legacy TIME-only structure');
      if (portfolioComparison?.timePortfolio) {
        const timeData = portfolioComparison.timePortfolio;
        setClockwisePortfolios([{
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
        }]);
      } else {
        console.warn('⚠️ No portfolioComparison data available');
        setClockwisePortfolios([]);
      }
    }

    setLoading(false);
  };

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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-24 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-results-modal-title"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f1420] rounded-2xl border border-gray-800/50 shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-gray-800/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors z-10 group"
            aria-label="Close modal"
          >
            <FiX className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
          </button>
          
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
              <FiBarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="test-results-modal-title" className="text-xl font-bold text-white">Test Results</h2>
              <p className="text-xs text-gray-400">Portfolio Performance Analysis</p>
            </div>
          </div>
          
          {/* Test Info */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800/30">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Portfolio</p>
              <p className="text-sm font-semibold text-white">
                {results.portfolioName || 'Your Portfolio'}
              </p>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Scenario</p>
              <p className="text-sm font-semibold text-white truncate">
                {results.questionTitle || 'Scenario Test'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Loading portfolio comparisons...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Portfolio Comparison Section */}
              <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/50 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <FiZap className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                  Portfolio Comparison
                </h3>

                {/* Mobile: Stacked View */}
                <div className="md:hidden space-y-4">
                  {/* User Portfolio */}
                  {userPortfolio && (
                    <PortfolioCard
                      portfolio={userPortfolio}
                      isUser={true}
                      isExpanded={expandedPortfolios.has('user')}
                      onToggle={() => toggleExpanded('user')}
                      canToggle={false}
                    />
                  )}
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
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* User Portfolio */}
                  {userPortfolio && (
                    <PortfolioCard
                      portfolio={userPortfolio}
                      isUser={true}
                      isExpanded={true}
                      canToggle={false}
                    />
                  )}
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

              {/* Historical Analog Info (if available) */}
              {results.historicalAnalog && (
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 sm:p-5">
                  <h4 className="text-sm font-bold text-blue-300 mb-3">Historical Analog Match</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Period</span>
                      <span className="text-sm font-semibold text-white">{results.historicalAnalog.period}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Similarity</span>
                      <span className="text-sm font-semibold text-blue-400">{results.historicalAnalog.similarity}%</span>
                    </div>
                    {results.historicalAnalog.cycleName && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Cycle</span>
                        <span className="text-sm font-semibold text-white">{results.historicalAnalog.cycleName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-gray-800/50 bg-gray-900/30">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white 
              font-medium rounded-lg transition-colors text-sm"
          >
            Close
          </button>
          {questionId && (
            <button
              onClick={() => {
                router.push(`/scenario-testing/${questionId}/top-portfolios`);
                onClose();
              }}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 
                text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 text-sm shadow-lg"
              aria-label="View top portfolios for this scenario"
            >
              Top Portfolios
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
