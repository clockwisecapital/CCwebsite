'use client';

import React from 'react';
import { FiX, FiTrendingUp, FiTrendingDown, FiTarget, FiBarChart2, FiAward } from 'react-icons/fi';
import type { PortfolioComparison } from '@/types/portfolio';

export interface HistoricalAnalog {
  period: string; // e.g., "Oct 2008 - Mar 2009"
  similarity: number; // 0-100
  matchingFactors: string[];
  cycleName?: string; // e.g., "Great Deleveraging"
}

export interface TestResultData {
  score: number;
  expectedReturn: number;
  expectedUpside: number;
  expectedDownside: number;
  confidence?: number; // 0-100
  historicalAnalog?: HistoricalAnalog;
  portfolioName?: string;
  questionTitle?: string;
  historicalPeriod?: {
    label: string;
    years: string;
  };
}

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: TestResultData;
  portfolioComparison?: PortfolioComparison; // Optional detailed comparison data
}

export default function TestResultsModal({ isOpen, onClose, results, portfolioComparison }: TestResultsModalProps) {
  if (!isOpen) return null;

  // Formatting helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const percent = (value * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-24 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-results-modal-title"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f1420] rounded-2xl border border-gray-800/50 shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-gray-800/50">
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
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Question</p>
              <p className="text-sm font-semibold text-white truncate">
                {results.questionTitle || 'Scenario Test'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-6">
            {/* Portfolio Scores Comparison - At the Top */}
            <div className="grid grid-cols-2 gap-4">
              {/* Your Portfolio Score */}
              <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <FiTarget className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Your Portfolio</p>
                    <p className="text-sm text-white font-semibold">Score</p>
                  </div>
                </div>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {results.score.toFixed(0)}
                </p>
                {results.confidence && (
                  <p className="text-xs text-gray-500 mt-2">
                    Confidence: <span className="text-blue-400 font-semibold">{results.confidence}%</span>
                  </p>
                )}
              </div>

              {/* TIME Portfolio Score */}
              <div className="bg-gradient-to-br from-teal-500/5 to-blue-500/5 border border-teal-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <FiAward className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">TIME Portfolio</p>
                    <p className="text-sm text-white font-semibold">Score</p>
                  </div>
                </div>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">
                  {portfolioComparison?.timePortfolio?.score?.toFixed(0) || 'N/A'}
                </p>
                {portfolioComparison && portfolioComparison.timePortfolio.score !== undefined && (
                  <p className="text-xs text-teal-400 mt-2 font-semibold">
                    {portfolioComparison.timePortfolio.score > results.score 
                      ? `+${(portfolioComparison.timePortfolio.score - results.score).toFixed(0)} points higher`
                      : results.score > portfolioComparison.timePortfolio.score
                      ? `${(results.score - portfolioComparison.timePortfolio.score).toFixed(0)} points lower`
                      : 'Same score'}
                  </p>
                )}
              </div>
            </div>

            {/* Comparison Content */}
            {portfolioComparison && (
              <>
              {/* Description */}
              <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-800">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Compare your portfolio&apos;s expected performance against the Clockwise TIME portfolio. 
                  Returns blend 12-month analyst price targets with long-term nominal asset class averages.
                </p>
              </div>

              {/* Side-by-Side Portfolio Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Portfolio */}
                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4">Your Portfolio</h3>
                  
                  {/* Portfolio Metrics */}
                  <div className="mb-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Starting Value</div>
                        <div className="text-lg font-bold text-blue-400">
                          {formatCurrency(portfolioComparison.userPortfolio.totalValue)}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Expected Return</div>
                        <div className="text-lg font-bold text-emerald-400">
                          {formatPercent(portfolioComparison.userPortfolio.expectedReturn)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3">
                        <div className="text-xs text-emerald-400 mb-1">Best Year</div>
                        <div className="text-base font-bold text-emerald-300">
                          {formatPercent(portfolioComparison.userPortfolio.upside)}
                        </div>
                      </div>
                      <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                        <div className="text-xs text-red-400 mb-1">Worst Year</div>
                        <div className="text-base font-bold text-red-300">
                          {formatPercent(portfolioComparison.userPortfolio.downside)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Positions */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Top 5 Positions
                    </h4>
                    <div className="space-y-2">
                      {portfolioComparison.userPortfolio.topPositions.slice(0, 5).map((position) => (
                        <div key={position.ticker} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold text-white text-sm">{position.ticker}</span>
                              <div className="text-xs text-gray-400">{position.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-300">
                                {position.weight.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-gray-500">Return</div>
                              <div className="font-semibold text-emerald-400">
                                {position.expectedReturn !== null ? formatPercent(position.expectedReturn) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Upside</div>
                              <div className="font-semibold text-emerald-400">
                                {position.monteCarlo ? formatPercent(position.monteCarlo.upside) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Downside</div>
                              <div className="font-semibold text-red-400">
                                {position.monteCarlo ? formatPercent(position.monteCarlo.downside) : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TIME Portfolio */}
                <div className="bg-gradient-to-br from-teal-900/20 to-blue-900/20 border border-teal-800/50 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-teal-300 mb-4">TIME Portfolio</h3>
                  
                  {/* Portfolio Metrics */}
                  <div className="mb-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-teal-900/20 border border-teal-800 rounded-lg p-3">
                        <div className="text-xs text-teal-400 mb-1">Starting Value</div>
                        <div className="text-lg font-bold text-teal-300">
                          {formatCurrency(portfolioComparison.timePortfolio.totalValue)}
                        </div>
                      </div>
                      <div className="bg-teal-900/20 border border-teal-800 rounded-lg p-3">
                        <div className="text-xs text-teal-400 mb-1">Expected Return</div>
                        <div className="text-lg font-bold text-emerald-300">
                          {formatPercent(portfolioComparison.timePortfolio.expectedReturn)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3">
                        <div className="text-xs text-emerald-400 mb-1">Best Year</div>
                        <div className="text-base font-bold text-emerald-300">
                          {formatPercent(portfolioComparison.timePortfolio.upside)}
                        </div>
                      </div>
                      <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                        <div className="text-xs text-red-400 mb-1">Worst Year</div>
                        <div className="text-base font-bold text-red-300">
                          {formatPercent(portfolioComparison.timePortfolio.downside)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Positions */}
                  <div>
                    <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-3">
                      Top 5 Positions
                    </h4>
                    <div className="space-y-2">
                      {portfolioComparison.timePortfolio.topPositions.slice(0, 5).map((position) => (
                        <div key={position.ticker} className="bg-teal-900/10 rounded-lg p-3 border border-teal-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold text-teal-200 text-sm">{position.ticker}</span>
                              <div className="text-xs text-gray-400">{position.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-teal-300">
                                {position.weight.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-gray-500">Return</div>
                              <div className="font-semibold text-emerald-300">
                                {position.expectedReturn !== null ? formatPercent(position.expectedReturn) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Upside</div>
                              <div className="font-semibold text-emerald-300">
                                {position.monteCarlo ? formatPercent(position.monteCarlo.upside) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Downside</div>
                              <div className="font-semibold text-red-300">
                                {position.monteCarlo ? formatPercent(position.monteCarlo.downside) : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-5">
                <h4 className="text-sm font-bold text-white mb-3">Performance Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Return Difference</p>
                    <p className={`text-lg font-bold ${
                      portfolioComparison.timePortfolio.expectedReturn > portfolioComparison.userPortfolio.expectedReturn 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                    }`}>
                      {formatPercent(Math.abs(portfolioComparison.timePortfolio.expectedReturn - portfolioComparison.userPortfolio.expectedReturn))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Risk Difference</p>
                    <p className="text-lg font-bold text-gray-300">
                      {formatPercent(Math.abs(portfolioComparison.timePortfolio.downside - portfolioComparison.userPortfolio.downside))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Upside Potential</p>
                    <p className={`text-lg font-bold ${
                      portfolioComparison.timePortfolio.upside > portfolioComparison.userPortfolio.upside 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                    }`}>
                      {formatPercent(Math.abs(portfolioComparison.timePortfolio.upside - portfolioComparison.userPortfolio.upside))}
                    </p>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-800/50 bg-gray-900/30">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white 
              font-medium rounded-lg transition-colors text-sm"
          >
            Close
          </button>
          <button
            className="px-5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 
              text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 text-sm shadow-lg"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
