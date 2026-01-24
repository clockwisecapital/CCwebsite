'use client';

import React from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export interface PortfolioCardData {
  id: string;
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

interface PortfolioCardProps {
  portfolio: PortfolioCardData;
  isUser?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  canToggle?: boolean;
  className?: string;
}

export default function PortfolioCard({
  portfolio,
  isUser = false,
  isExpanded = true,
  onToggle,
  canToggle = false,
  className = ''
}: PortfolioCardProps) {
  const isTime = portfolio.id === 'time';

  // Styling based on portfolio type
  const cardClasses = isUser
    ? 'bg-gray-900/50 border-gray-700'
    : isTime
    ? 'bg-teal-900/20 border-teal-600/50'
    : 'bg-gray-900/30 border-gray-700/50';

  const titleColor = isUser
    ? 'text-white'
    : isTime
    ? 'text-teal-300'
    : 'text-gray-300';

  const dotColor = isUser
    ? 'bg-gray-400'
    : isTime
    ? 'bg-teal-400'
    : 'bg-gray-500';

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const getColorClass = (value: number, positive = true) => {
    if (value === 0) return 'text-gray-400';
    if (positive) {
      return value > 0 ? 'text-green-400' : 'text-red-400';
    }
    return value > 0 ? 'text-red-400' : 'text-green-400';
  };

  const formatPercent = (value: number) => {
    const percent = (value * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <div className={`border rounded-xl p-4 sm:p-5 transition-all duration-200 ${cardClasses} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h4 className={`text-sm sm:text-base font-bold flex items-center gap-2 truncate ${titleColor}`}>
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${dotColor} rounded-full flex-shrink-0`}></div>
          <span className="truncate">{portfolio.name}</span>
        </h4>
        {canToggle && (
          <button
            onClick={onToggle}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors md:hidden"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Score Badge - Always visible */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3 ${getScoreBgColor(portfolio.score)}`}>
        <span className="text-xs text-gray-400 uppercase">Score</span>
        <span className={`text-lg font-bold ${getScoreColor(portfolio.score)}`}>{portfolio.score}</span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-3 sm:space-y-4">
          {/* Metrics */}
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Expected Return</p>
            <p className={`text-sm sm:text-base font-bold ${getColorClass(portfolio.expectedReturn)}`}>
              {formatPercent(portfolio.expectedReturn)}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Expected Best Year</p>
            <p className="text-sm sm:text-base font-bold text-green-400">{formatPercent(portfolio.expectedBestYear)}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Expected Worst Year</p>
            <p className="text-sm sm:text-base font-bold text-red-400">{formatPercent(portfolio.expectedWorstYear)}</p>
          </div>

          {/* Holdings - only show if available */}
          {portfolio.topPositions.length > 0 && (
            <div className="pt-3 border-t border-gray-700/50">
              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Top Holdings</h5>
              <div className="space-y-2">
                {portfolio.topPositions.map((position, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-xs sm:text-sm ${isTime ? 'text-teal-200' : 'text-white'}`}>
                        {position.ticker}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 truncate">{position.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`font-bold text-xs sm:text-sm ${isTime ? 'text-teal-200' : 'text-gray-200'}`}>
                        {position.weight.toFixed(1)}%
                      </p>
                      <p className={`text-[10px] sm:text-xs font-semibold ${getColorClass(position.expectedReturn)}`}>
                        {formatPercent(position.expectedReturn)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed view - just show expand button */}
      {!isExpanded && canToggle && (
        <button
          onClick={onToggle}
          className="w-full mt-2 text-xs text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          View Details <FiChevronDown className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
