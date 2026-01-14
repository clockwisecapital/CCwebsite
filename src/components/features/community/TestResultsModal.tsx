'use client';

import React, { useState } from 'react';
import { FiX, FiTrendingUp, FiTrendingDown, FiTarget, FiCalendar, FiCheckCircle, FiBarChart2, FiActivity, FiLayers } from 'react-icons/fi';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'comparison'>('overview');
  
  if (!isOpen) return null;

  const returnColor = results.expectedReturn >= 0 ? 'text-green-400' : 'text-red-400';
  const returnIcon = results.expectedReturn >= 0 ? FiTrendingUp : FiTrendingDown;
  const ReturnIcon = returnIcon;

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
    return `${(value * 100).toFixed(1)}%`;
  };

  // Mock performance data for the chart
  const performanceData = [
    { date: 'Oct 2008', value: 100 },
    { date: 'Nov 2008', value: 85 },
    { date: 'Dec 2008', value: 78 },
    { date: 'Jan 2009', value: 72 },
    { date: 'Feb 2009', value: 75 },
    { date: 'Mar 2009', value: 82 },
  ];

  const maxValue = Math.max(...performanceData.map(d => d.value));
  const minValue = Math.min(...performanceData.map(d => d.value));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0f1420] rounded-2xl border border-gray-800/50 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
              <FiBarChart2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Test Results</h2>
          </div>
          <p className="text-sm text-gray-400 ml-[52px]">Portfolio Performance Analysis</p>
          
          {/* Test Info */}
          <div className="flex items-center gap-6 mt-6 ml-[52px]">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Portfolio</p>
              <p className="text-sm font-semibold text-white">
                {results.portfolioName || 'Your Portfolio'}
              </p>
            </div>
            <div className="h-8 w-px bg-gray-800" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Question</p>
              <p className="text-sm font-semibold text-white">
                {results.questionTitle || 'Scenario Test'}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-gray-800/50">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === 'overview'
                  ? 'text-teal-400 border-teal-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <FiTarget className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === 'performance'
                  ? 'text-teal-400 border-teal-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              <FiActivity className="w-4 h-4 inline mr-2" />
              Performance Over Time
            </button>
            {portfolioComparison && (
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  activeTab === 'comparison'
                    ? 'text-teal-400 border-teal-500'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <FiLayers className="w-4 h-4 inline mr-2" />
                Detailed Comparison
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {activeTab === 'overview' ? (
            <div className="space-y-6">

              {/* Historical Analog Match */}
              {results.historicalAnalog && (
                <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FiCalendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Historical Analog Match</h3>
                      <p className="text-xs text-gray-400">
                        Based on {results.historicalPeriod?.label || 'selected period'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <p className="text-2xl font-bold text-white mb-3">
                      {results.historicalAnalog.period}
                    </p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 bg-gray-800/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${results.historicalAnalog.similarity}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-teal-400">
                        {results.historicalAnalog.similarity}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Similarity to current market conditions</p>
                  </div>

                  {/* Matching Factors */}
                  {results.historicalAnalog.matchingFactors && results.historicalAnalog.matchingFactors.length > 0 && (
                    <div className="space-y-2">
                      {results.historicalAnalog.matchingFactors.map((factor, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <FiCheckCircle className="w-3 h-3 text-green-400" />
                          </div>
                          <p className="text-sm text-gray-300">{factor}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Expected Returns */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Expected Return */}
                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Expected Return</p>
                  <div className="flex items-center gap-2 mb-2">
                    <ReturnIcon className={`w-5 h-5 ${returnColor}`} />
                    <p className={`text-3xl font-bold ${returnColor}`}>
                      {results.expectedReturn >= 0 ? '+' : ''}{(results.expectedReturn * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">Median outcome</p>
                </div>

                {/* Upside */}
                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Best Case</p>
                  <div className="flex items-center gap-2 mb-2">
                    <FiTrendingUp className="w-5 h-5 text-green-400" />
                    <p className="text-3xl font-bold text-green-400">
                      +{(results.expectedUpside * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">95th percentile</p>
                </div>

                {/* Downside */}
                <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Worst Case</p>
                  <div className="flex items-center gap-2 mb-2">
                    <FiTrendingDown className="w-5 h-5 text-red-400" />
                    <p className="text-3xl font-bold text-red-400">
                      {(results.expectedDownside * 100).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">5th percentile</p>
                </div>
              </div>

              {/* Portfolio Score */}
              <div className="bg-gradient-to-br from-teal-500/5 to-blue-500/5 border border-teal-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Portfolio Score</p>
                    <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">
                      {results.score.toFixed(1)}
                    </p>
                    {results.confidence && (
                      <p className="text-sm text-gray-500 mt-3">
                        Confidence: <span className="text-teal-400 font-semibold">{results.confidence}%</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-2">View Ranking</p>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                      <FiTarget className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'performance' ? (
            /* Performance Over Time Tab */
            <div className="space-y-6">
              {/* Performance Comparison Chart */}
              <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Performance vs TIME Portfolio</h3>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-gray-400">Your Portfolio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-teal-500" />
                      <span className="text-gray-400">TIME Portfolio</span>
                    </div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="relative h-80">
                  <svg className="w-full h-full" viewBox="0 0 800 320" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="80" x2="800" y2="80" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="160" x2="800" y2="160" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="240" x2="800" y2="240" stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Your Portfolio Line */}
                    <path
                      d={`M 0 ${320 - performanceData[0].value * 2} ${performanceData.map((d, i) => 
                        `L ${(i / (performanceData.length - 1)) * 800} ${320 - d.value * 2}`
                      ).join(' ')}`}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* TIME Portfolio Line */}
                    <path
                      d={`M 0 ${320 - (performanceData[0].value + 5) * 2} ${performanceData.map((d, i) => 
                        `L ${(i / (performanceData.length - 1)) * 800} ${320 - (d.value + 8 - i * 2) * 2}`
                      ).join(' ')}`}
                      fill="none"
                      stroke="#14B8A6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {performanceData.map((d, i) => (
                      <g key={i}>
                        <circle
                          cx={(i / (performanceData.length - 1)) * 800}
                          cy={320 - d.value * 2}
                          r="4"
                          fill="#3B82F6"
                          className="hover:r-6 transition-all cursor-pointer"
                        />
                        <circle
                          cx={(i / (performanceData.length - 1)) * 800}
                          cy={320 - (d.value + 8 - i * 2) * 2}
                          r="4"
                          fill="#14B8A6"
                          className="hover:r-6 transition-all cursor-pointer"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* X-Axis Labels */}
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    {performanceData.map((d, i) => (
                      <span key={i}>{d.date}</span>
                    ))}
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800/50">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Your Portfolio</p>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-blue-400">
                        {results.expectedReturn >= 0 ? '+' : ''}{(results.expectedReturn * 100).toFixed(1)}%
                      </div>
                      <span className="text-xs text-gray-500">Total Return</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">TIME Portfolio</p>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-teal-400">
                        +{((results.expectedReturn + 0.035) * 100).toFixed(1)}%
                      </div>
                      <span className="text-xs text-gray-500">Total Return</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-6">
                <h4 className="text-sm font-bold text-white mb-4">Key Insights</h4>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <FiCheckCircle className="w-3 h-3 text-green-400" />
                    </div>
                    <p>TIME Portfolio maintained steadier growth during the analog period</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <FiCheckCircle className="w-3 h-3 text-green-400" />
                    </div>
                    <p>Maximum drawdown was 15% vs your portfolio&apos;s 28%</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <FiCheckCircle className="w-3 h-3 text-green-400" />
                    </div>
                    <p>TIME&apos;s tactical rebalancing helped capture upside while managing risk</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'comparison' && portfolioComparison ? (
            /* Detailed Comparison Tab */
            <div className="space-y-6">
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
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-800/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-white 
              font-medium rounded-lg transition-colors text-sm"
          >
            Close
          </button>
          <button
            className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 
              text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 text-sm"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
