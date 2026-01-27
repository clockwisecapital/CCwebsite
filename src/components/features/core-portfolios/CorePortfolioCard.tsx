'use client';

import React from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

export interface CorePortfolioCardData {
  id: string;
  name: string;
  description?: string;
  riskLevel?: string;
  expectedReturn: number;
  expectedBestYear: number;
  expectedWorstYear: number;
  upside: number;
  downside: number;
  volatility?: number;
  topPositions: Array<{
    ticker: string;
    name: string;
    weight: number;
    expectedReturn: number;
  }>;
}

interface CorePortfolioCardProps {
  portfolio: CorePortfolioCardData;
  isExpanded?: boolean;
  onToggle?: () => void;
  canToggle?: boolean;
  className?: string;
}

export default function CorePortfolioCard({
  portfolio,
  isExpanded = true,
  onToggle,
  canToggle = false,
  className = ''
}: CorePortfolioCardProps) {
  // Styling based on portfolio type
  const cardClasses = 'bg-gradient-to-br from-teal-900/20 to-blue-900/20 border-teal-600/30';
  const titleColor = 'text-teal-300';
  const dotColor = 'bg-teal-400';

  const getColorClass = (value: number, positive = true) => {
    if (value === 0) return 'text-gray-400';
    if (positive) {
      return value > 0 ? 'text-green-400' : 'text-red-400';
    }
    return value > 0 ? 'text-red-400' : 'text-green-400';
  };

  const formatPercent = (value: number) => {
    const percent = (value * 100).toFixed(1);
    const sign = value >= 0 ? '+' : '';
    return `${sign}${percent}%`;
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

      {/* Risk Level Badge */}
      {portfolio.riskLevel && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-teal-500/10 border-teal-500/30 mb-3">
          <span className="text-xs text-gray-400 uppercase">Risk</span>
          <span className="text-sm font-semibold text-teal-300 capitalize">{portfolio.riskLevel}</span>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-3 sm:space-y-4">
          {/* Metrics */}
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Projected Return</p>
            <p className={`text-lg sm:text-xl font-bold ${getColorClass(portfolio.expectedReturn)}`}>
              {formatPercent(portfolio.expectedReturn)}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Projected Best Case</p>
            <p className="text-sm sm:text-base font-bold text-green-400">{formatPercent(portfolio.expectedBestYear)}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase mb-1">Projected Worst Case</p>
            <p className="text-sm sm:text-base font-bold text-red-400">{formatPercent(portfolio.expectedWorstYear)}</p>
          </div>

          {/* Asset Allocation */}
          {portfolio.topPositions.length > 0 && (
            <div className="pt-3 border-t border-gray-700/50">
              <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Asset Allocation
              </h5>
              <div className="space-y-2">
                {portfolio.topPositions.map((position, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-teal-200">
                        {position.ticker}
                      </p>
                      {position.name && (
                        <p className="text-[10px] sm:text-xs text-gray-400 truncate">{position.name}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-bold text-xs sm:text-sm text-teal-200">
                        {position.weight.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {portfolio.description && (
            <div className="pt-3 border-t border-gray-700/50">
              <p className="text-xs text-gray-400">{portfolio.description}</p>
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
