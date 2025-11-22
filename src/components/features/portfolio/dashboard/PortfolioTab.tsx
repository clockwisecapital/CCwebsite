'use client';

import { useEffect } from 'react';
import type { PortfolioComparison } from '@/types/portfolio';

interface PortfolioTabProps {
  portfolioComparison?: PortfolioComparison | null;
  onNext?: () => void;
  onBack?: () => void;
  onSlideChange?: (slide: number) => void;
}

export default function PortfolioTab({ portfolioComparison, onNext, onBack, onSlideChange }: PortfolioTabProps) {
  // Always on slide 0 for portfolio comparison view
  const currentSlide = 0;
  
  // Notify parent of current slide for video sync
  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(currentSlide);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNextSlide = () => {
    if (onNext) {
      // Navigate to Analysis Tab (skipping Market Tab)
      onNext();
    }
  };

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

  // ALWAYS show comparison view (will use proxy ETFs if no specific holdings provided)
  if (portfolioComparison) {
    const isUsingProxy = portfolioComparison.userPortfolio.isUsingProxy;
    return (
      <div className="space-y-6 md:space-y-8">
        {/* SECTION 1: Recommendation - Always Visible */}
        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-4 md:p-6 border border-blue-800 shadow-sm">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm md:text-lg font-bold text-blue-300 mb-1 md:mb-2">Portfolio Comparison</div>
              <p className="text-xs md:text-base text-gray-300 leading-relaxed">
                Compare your portfolio&apos;s expected performance against the Clockwise TIME portfolio based on current market conditions, target prices, and Monte Carlo simulations.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Side-by-Side Portfolio Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Portfolio */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Your Portfolio</h3>
              {isUsingProxy && (
                <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Using Market Proxies
                </div>
              )}
            </div>
            {isUsingProxy && portfolioComparison.userPortfolio.proxyMessage && (
              <p className="text-xs text-gray-400 mb-4 italic">
                {portfolioComparison.userPortfolio.proxyMessage}
              </p>
            )}
            
            {/* Total Value and Expected Return */}
            <div className="mb-6 space-y-3">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Total Portfolio Value</div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(portfolioComparison.userPortfolio.totalValue)}
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Expected Return (Weighted Avg)</div>
                <div className="text-2xl font-bold text-gray-100">
                  {formatPercent(portfolioComparison.userPortfolio.expectedReturn)}
                </div>
              </div>
            </div>

            {/* Top 5 Positions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Top 5 Positions</h4>
              <div className="space-y-3">
                {portfolioComparison.userPortfolio.topPositions.map((position) => (
                  <div key={position.ticker} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{position.ticker}</span>
                          {position.isProxy && (
                            <span className="text-xs text-amber-400 bg-amber-900/20 px-1.5 py-0.5 rounded">Proxy</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {position.assetClass ? `${position.assetClass} • ` : ''}{position.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-300">{position.weight.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-400">Expected Return</div>
                        <div className={`font-semibold ${position.expectedReturn && position.expectedReturn > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {position.expectedReturn ? formatPercent(position.expectedReturn) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Upside</div>
                        <div className="font-semibold text-emerald-400">
                          {position.monteCarlo ? formatPercent(position.monteCarlo.upside) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Downside</div>
                        <div className="font-semibold text-rose-400">
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
          <div className="bg-gradient-to-br from-teal-900/20 to-blue-900/20 rounded-lg p-6 border border-teal-800">
            <h3 className="text-xl font-bold text-teal-300 mb-4">TIME Portfolio</h3>
            
            {/* Total Value and Expected Return */}
            <div className="mb-6 space-y-3">
              <div className="bg-teal-900/20 rounded-lg p-4 border border-teal-800">
                <div className="text-sm text-teal-400 mb-1">Total Portfolio Value</div>
                <div className="text-2xl font-bold text-teal-300">
                  {formatCurrency(portfolioComparison.timePortfolio.totalValue)}
                </div>
              </div>
              <div className="bg-teal-900/20 rounded-lg p-4 border border-teal-800">
                <div className="text-sm text-teal-400 mb-1">Expected Return (Weighted Avg)</div>
                <div className="text-2xl font-bold text-white">
                  {formatPercent(portfolioComparison.timePortfolio.expectedReturn)}
                </div>
              </div>
            </div>

            {/* Top 5 Positions */}
            <div>
              <h4 className="text-sm font-semibold text-teal-300 mb-3">Top 5 Positions</h4>
              <div className="space-y-3">
                {portfolioComparison.timePortfolio.topPositions.map((position) => (
                  <div key={position.ticker} className="bg-teal-900/10 rounded-lg p-3 border border-teal-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white">{position.ticker}</div>
                        <div className="text-xs text-teal-400">{position.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-teal-300">{position.weight.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-teal-400">Expected Return</div>
                        <div className={`font-semibold ${position.expectedReturn && position.expectedReturn > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                          {position.expectedReturn ? formatPercent(position.expectedReturn) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-teal-400">Upside</div>
                        <div className="font-semibold text-emerald-300">
                          {position.monteCarlo ? formatPercent(position.monteCarlo.upside) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-teal-400">Downside</div>
                        <div className="font-semibold text-rose-300">
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

        {/* SECTION 3: Next Steps - Always Visible */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-4 md:p-6 text-white">
          <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Next Step</h3>
          <p className="text-sm md:text-base text-teal-100 mb-4 md:mb-6">
            Work 1:1 with a strategist to optimize allocations for the current cycle.
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <a
              href="https://calendly.com/clockwisecapital/appointments"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 md:px-8 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-center flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Match me with an advisor
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <button
              onClick={handleNextSlide}
              className="w-full sm:w-auto px-6 md:px-8 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors text-center flex items-center justify-center gap-2 text-sm md:text-base"
            >
              Complete Analysis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: If no portfolio comparison data at all (shouldn't happen in production)
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-4 md:p-6 border border-blue-800 shadow-sm">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-600 rounded-2xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm md:text-lg font-bold text-amber-300 mb-1 md:mb-2">Portfolio Analysis Unavailable</div>
            <p className="text-xs md:text-base text-gray-300 leading-relaxed">
              Unable to load portfolio comparison data. Please ensure you have entered your portfolio value and asset allocation, then try again.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
        <p className="text-gray-400 mb-4">Go back to the Intake tab to provide your portfolio information.</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          Return to Intake
        </button>
      </div>
    </div>
  );
}
