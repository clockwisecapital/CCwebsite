'use client';

import React, { useState } from 'react';
import { FiArrowLeft, FiTrendingUp, FiTrendingDown, FiAward, FiCheckCircle, FiAlertCircle, FiZap } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';

interface PortfolioMetrics {
  name: string;
  score: number;
  expectedReturn: number;
  expectedBestYear: number;
  expectedWorstYear: number;
  upside: number;
  downside: number;
  topPositions: Array<{
    ticker: string;
    name: string;
    weight: number;
    expectedReturn: number;
  }>;
}

interface ComparisonInsight {
  icon: React.ReactNode;
  text: string;
  color: 'green' | 'orange' | 'blue' | 'red';
}

const PortfolioComparison = () => {
  const router = useRouter();
  const params = useParams();
  const questionId = params.questionId as string;
  const portfolioId = params.portfolioId as string;

  const [selectedPortfolio] = useState<PortfolioMetrics>({
    name: 'Anti-Mag7',
    score: 72,
    expectedReturn: 0.068,
    expectedBestYear: 0.284,
    expectedWorstYear: -0.128,
    upside: 0.352,
    downside: -0.164,
    topPositions: [
      { ticker: 'SCHD', name: 'U.S. Dividend • Schwab Dividend Equity ETF', weight: 35, expectedReturn: 0.078 },
      { ticker: 'VWO', name: 'Emerging Markets • Vanguard Emerging Markets', weight: 20, expectedReturn: 0.088 },
      { ticker: 'XLV', name: 'Healthcare • Health Care Select SPDR', weight: 20, expectedReturn: 0.074 },
      { ticker: 'BND', name: 'U.S. Bonds • Vanguard Total Bond Market ETF', weight: 15, expectedReturn: 0.041 },
      { ticker: 'VEA', name: 'Intl Developed • Vanguard FTSE Developed', weight: 10, expectedReturn: 0.072 },
    ]
  });

  const timePortfolio: PortfolioMetrics = {
    name: 'TIME Portfolio',
    score: 88,
    expectedReturn: 0.094,
    expectedBestYear: 0.445,
    expectedWorstYear: -0.171,
    upside: 0.441,
    downside: -0.171,
    topPositions: [
      { ticker: 'AAPL', name: 'U.S. Large Cap • Apple Inc', weight: 8, expectedReturn: 0.104 },
      { ticker: 'MSFT', name: 'U.S. Large Cap • Microsoft Corp', weight: 7.5, expectedReturn: 0.112 },
      { ticker: 'TLT', name: 'Long-Term Treasuries • iShares 20+ Year Treasury', weight: 15, expectedReturn: 0.038 },
      { ticker: 'GLD', name: 'Commodities • Gold SPDR Shares', weight: 12.5, expectedReturn: 0.068 },
      { ticker: 'VTI', name: 'U.S. Total Market • Vanguard Total Stock', weight: 40, expectedReturn: 0.098 },
    ]
  };

  const getInsights = (): ComparisonInsight[] => [
    {
      icon: <FiTrendingUp className="w-5 h-5" />,
      text: 'TIME offers +2.6% higher expected 5-year return',
      color: 'green'
    },
    {
      icon: <FiAlertCircle className="w-5 h-5" />,
      text: 'TIME has 4.3% more downside risk in worst-case scenarios (60% return per unit risk)',
      color: 'orange'
    },
    {
      icon: <FiZap className="w-5 h-5" />,
      text: 'TIME captures +16.1% more upside in best-case years',
      color: 'blue'
    },
    {
      icon: <FiAward className="w-5 h-5" />,
      text: 'TIME scores 16 points higher for this specific scenario',
      color: 'green'
    }
  ];

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${(value * 100).toFixed(1)}%`;
  };

  const getColorClass = (value: number, positive = true) => {
    if (value === 0) return 'text-gray-400';
    if (positive) {
      return value > 0 ? 'text-green-400' : 'text-red-400';
    }
    return value > 0 ? 'text-red-400' : 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/scenario-testing/${questionId}/top-portfolios`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Top Portfolios</span>
        </button>

        {/* Test Scenario Header */}
        <div className="bg-gradient-to-r from-gray-900/60 to-gray-800/60 border border-teal-600/50 rounded-2xl p-6 mb-8">
          <p className="text-xs font-bold text-teal-400 uppercase tracking-wide mb-2">
            Testing Scenario: AI Supercycle • Historical Analog: 1995-2000 — Internet Boom
          </p>
          <h1 className="text-2xl font-bold text-white">
            "Is AI a productivity supercycle or just another bubble?"
          </h1>
        </div>

        {/* Head-to-Head Comparison */}
        <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <FiZap className="w-6 h-6 text-teal-400" />
            Head-to-Head Comparison
          </h2>

          {/* Score Comparison */}
          <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-teal-500/20">
            {/* Left Portfolio */}
            <div>
              <p className="text-gray-400 text-sm mb-2">{selectedPortfolio.name}</p>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-white">{selectedPortfolio.score}</span>
                <span className="text-gray-400">VS</span>
              </div>
              {/* Metrics */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Expected Return (5yr)</p>
                  <p className={`text-lg font-bold ${getColorClass(selectedPortfolio.expectedReturn)}`}>
                    {formatPercent(selectedPortfolio.expectedReturn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Expected Best Year (5yr)</p>
                  <p className="text-lg font-bold text-green-400">{formatPercent(selectedPortfolio.expectedBestYear)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Expected Worst Year (5yr)</p>
                  <p className="text-lg font-bold text-red-400">{formatPercent(selectedPortfolio.expectedWorstYear)}</p>
                </div>
              </div>
            </div>

            {/* Right Portfolio (TIME) */}
            <div>
              <p className="text-teal-400 text-sm mb-2 font-semibold text-right">{timePortfolio.name}</p>
              <div className="flex items-baseline gap-3 justify-end mb-6">
                <span className="text-gray-400">vs</span>
                <span className="text-4xl font-bold text-teal-400">{timePortfolio.score}</span>
              </div>
              {/* Metrics */}
              <div className="space-y-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase mb-1">Expected Return (5yr)</p>
                  <p className={`text-lg font-bold ${getColorClass(timePortfolio.expectedReturn)}`}>
                    {formatPercent(timePortfolio.expectedReturn)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase mb-1">Expected Best Year (5yr)</p>
                  <p className="text-lg font-bold text-green-400">{formatPercent(timePortfolio.expectedBestYear)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase mb-1">Expected Worst Year (5yr)</p>
                  <p className="text-lg font-bold text-red-400">{formatPercent(timePortfolio.expectedWorstYear)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-3">
            {getInsights().map((insight, idx) => {
              const bgColor = {
                green: 'bg-green-500/20 border-green-500/50',
                orange: 'bg-orange-500/20 border-orange-500/50',
                blue: 'bg-blue-500/20 border-blue-500/50',
                red: 'bg-red-500/20 border-red-500/50'
              }[insight.color];

              const textColor = {
                green: 'text-green-300',
                orange: 'text-orange-300',
                blue: 'text-blue-300',
                red: 'text-red-300'
              }[insight.color];

              return (
                <div key={idx} className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor}`}>
                  <div className={`flex-shrink-0 mt-1 ${textColor}`}>
                    {insight.icon}
                  </div>
                  <p className={`text-sm font-medium ${textColor}`}>{insight.text}</p>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-teal-500/20 border border-teal-500/30 rounded-lg">
            <p className="text-sm text-teal-300">
              <span className="font-bold text-teal-400">{timePortfolio.name}</span> delivers <span className="font-bold text-green-400">+2.6% higher expected returns</span> with <span className="font-bold text-orange-400">4.3% more downside risk</span>
            </p>
          </div>
        </div>

        {/* Portfolio Composition */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Portfolio */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              {selectedPortfolio.name}
            </h3>
            <div className="space-y-3">
              {selectedPortfolio.topPositions.map((position, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{position.ticker}</p>
                    <p className="text-xs text-gray-400 truncate">{position.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-gray-200">{position.weight}%</p>
                    <p className={`text-xs font-semibold ${getColorClass(position.expectedReturn)}`}>
                      {formatPercent(position.expectedReturn)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Portfolio (TIME) */}
          <div className="bg-teal-900/20 border border-teal-600/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-teal-300 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
              {timePortfolio.name}
            </h3>
            <div className="space-y-3">
              {timePortfolio.topPositions.map((position, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-teal-900/30 rounded-lg hover:bg-teal-900/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-teal-200 text-sm">{position.ticker}</p>
                    <p className="text-xs text-teal-400 truncate">{position.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-teal-200">{position.weight}%</p>
                    <p className={`text-xs font-semibold ${getColorClass(position.expectedReturn)}`}>
                      {formatPercent(position.expectedReturn)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-teal-900/40 to-blue-900/40 border border-teal-600/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Ready to optimize your portfolio?
          </h2>
          <p className="text-gray-300 mb-6">
            Get personalized recommendations from our advisors
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-3 bg-teal-500 hover:bg-teal-600 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105">
            Talk to an Advisor
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioComparison;
