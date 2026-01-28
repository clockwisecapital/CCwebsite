/**
 * TIME Portfolio Comparison Component
 * 
 * Shows how user portfolio compares to TIME portfolio in stress test scenarios
 * Displays metrics that demonstrate TIME's superior risk-adjusted returns
 */

'use client';

import React, { useState } from 'react';
import { FiTrendingUp, FiTrendingDown, FiShield, FiZap, FiInfo } from 'react-icons/fi';
import MonteCarloInfoModal from './MonteCarloInfoModal';

interface TimeComparisonProps {
  userScore: number;
  timeScore: number;
  userReturn: number;
  timeReturn: number;
  userDrawdown: number;
  timeDrawdown: number;
  scenarioName: string;
}

export default function TimeComparison({
  userScore,
  timeScore,
  userReturn,
  timeReturn,
  userDrawdown,
  timeDrawdown,
  scenarioName
}: TimeComparisonProps) {
  const [showMonteCarloModal, setShowMonteCarloModal] = useState(false);
  const scoreDiff = timeScore - userScore;
  const returnDiff = timeReturn - userReturn;
  const drawdownDiff = userDrawdown - timeDrawdown;
  const drawdownPercent = drawdownDiff > 0 ? ((drawdownDiff / userDrawdown) * 100) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMetricBar = (value: number, max: number = 100) => {
    return Math.min((value / max) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <FiZap className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">TIME Portfolio Comparison</h3>
        </div>
        <p className="text-sm text-gray-400">
          See how Clockwise Capital's TIME portfolio performs in the same {scenarioName} scenario
        </p>
      </div>

      {/* Score Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stress Test Score */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Stress Test Score</p>
          
          <div className="space-y-3">
            {/* Your Portfolio */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Your Portfolio</span>
                <span className={`text-lg font-bold ${getScoreColor(userScore)}`}>{userScore}/100</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                  style={{ width: `${getMetricBar(userScore)}%` }}
                />
              </div>
            </div>

            {/* TIME Portfolio */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white font-semibold">TIME Portfolio</span>
                <span className={`text-lg font-bold ${getScoreColor(timeScore)}`}>{timeScore}/100</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                  style={{ width: `${getMetricBar(timeScore)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Advantage Badge */}
          {scoreDiff > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <p className="text-xs text-emerald-400 font-semibold">
                TIME scores <span className="text-lg">{scoreDiff.toFixed(0)}</span> points higher
              </p>
            </div>
          )}
        </div>

        {/* Return Comparison */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-1 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expected Return (Avg Annual)</p>
            <button
              onClick={() => setShowMonteCarloModal(true)}
              className="text-gray-400 hover:text-teal-400 transition-colors"
              aria-label="Learn about Monte Carlo simulation"
            >
              <FiInfo className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Your Portfolio */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Your Portfolio</span>
                <div className="flex items-center gap-1">
                  {userReturn >= 0 ? (
                    <FiTrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <FiTrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-lg font-bold ${userReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(userReturn * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                  style={{ width: `${getMetricBar(userReturn, 0.15)}%` }}
                />
              </div>
            </div>

            {/* TIME Portfolio */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white font-semibold">TIME Portfolio</span>
                <div className="flex items-center gap-1">
                  <FiTrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">
                    {(timeReturn * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                  style={{ width: `${getMetricBar(timeReturn, 0.15)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Advantage Badge */}
          {returnDiff > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <p className="text-xs text-emerald-400 font-semibold">
                TIME adds <span className="text-lg">+{(returnDiff * 100).toFixed(2)}%</span> more return
              </p>
            </div>
          )}
        </div>

        {/* Drawdown Protection */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Max Drawdown</p>
          
          <div className="space-y-3">
            {/* Your Portfolio */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Your Portfolio</span>
                <div className="flex items-center gap-1">
                  <FiTrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-lg font-bold text-red-400">
                    {(userDrawdown * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                  style={{ width: `${getMetricBar(userDrawdown, 0.5)}%` }}
                />
              </div>
            </div>

            {/* TIME Portfolio */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white font-semibold">TIME Portfolio</span>
                <div className="flex items-center gap-1">
                  <FiShield className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">
                    {(timeDrawdown * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                  style={{ width: `${getMetricBar(timeDrawdown, 0.5)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Advantage Badge */}
          {drawdownDiff > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <p className="text-xs text-emerald-400 font-semibold">
                TIME reduces risk by <span className="text-lg">{drawdownPercent.toFixed(0)}%</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Why TIME Wins</p>
        
        <ul className="space-y-2">
          {scoreDiff > 0 && (
            <li className="flex items-start gap-2 text-sm">
              <span className="text-emerald-400 mt-1">✓</span>
              <span className="text-gray-300">
                <strong>Better Stress Response:</strong> TIME scores {scoreDiff.toFixed(0)} points higher by actively managing risk
              </span>
            </li>
          )}
          
          {returnDiff > 0 && (
            <li className="flex items-start gap-2 text-sm">
              <span className="text-emerald-400 mt-1">✓</span>
              <span className="text-gray-300">
                <strong>Superior Returns:</strong> +{(returnDiff * 100).toFixed(2)}% additional return through tactical positioning
              </span>
            </li>
          )}
          
          {drawdownDiff > 0 && (
            <li className="flex items-start gap-2 text-sm">
              <span className="text-emerald-400 mt-1">✓</span>
              <span className="text-gray-300">
                <strong>Downside Protection:</strong> {drawdownPercent.toFixed(0)}% less maximum loss through hedging strategies
              </span>
            </li>
          )}
          
          <li className="flex items-start gap-2 text-sm">
            <span className="text-emerald-400 mt-1">✓</span>
            <span className="text-gray-300">
              <strong>Daily Rebalancing:</strong> Adapts to market cycles automatically without guesswork
            </span>
          </li>
          
          <li className="flex items-start gap-2 text-sm">
            <span className="text-emerald-400 mt-1">✓</span>
            <span className="text-gray-300">
              <strong>Affordable:</strong> No $50k minimum - access professional active management at ETF-like fees
            </span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 rounded-lg p-4">
        <p className="text-sm text-gray-200 mb-3">
          Ready to upgrade your portfolio with cycle-aware, actively managed investing?
        </p>
        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          Learn More About TIME
        </button>
      </div>

      {/* Monte Carlo Info Modal */}
      <MonteCarloInfoModal 
        isOpen={showMonteCarloModal} 
        onClose={() => setShowMonteCarloModal(false)} 
      />
    </div>
  );
}
