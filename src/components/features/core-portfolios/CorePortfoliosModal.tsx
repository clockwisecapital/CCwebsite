'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiBarChart2 } from 'react-icons/fi';
import CorePortfolioCard, { type CorePortfolioCardData } from './CorePortfolioCard';

export interface CorePortfoliosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CorePortfoliosModal({ 
  isOpen, 
  onClose
}: CorePortfoliosModalProps) {
  const [portfolios, setPortfolios] = useState<CorePortfolioCardData[]>([]);
  const [expandedPortfolios, setExpandedPortfolios] = useState<Set<string>>(
    new Set(['max-growth', 'growth', 'moderate', 'max-income'])
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPortfolioData();
    }
  }, [isOpen]);

  const loadPortfolioData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching Core Portfolio analysis...');
      const response = await fetch('/api/core-portfolios/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to analyze Core Portfolios');
      }

      const data = await response.json();
      
      if (!data.success || !data.portfolios) {
        throw new Error(data.error || 'Invalid response from server');
      }

      console.log(`✅ Loaded ${data.portfolios.length} Core Portfolios`);
      setPortfolios(data.portfolios);
      
      // Log cache status for debugging
      if (data.cached) {
        console.log(`📦 Using cached data (${data.cacheAge} old)`);
      }
    } catch (err) {
      console.error('❌ Failed to load Core Portfolios:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portfolios');
    } finally {
      setLoading(false);
    }
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
      aria-labelledby="core-portfolios-modal-title"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f1420] rounded-2xl border border-gray-800/50 shadow-2xl w-full max-w-7xl max-h-[85vh] overflow-hidden flex flex-col relative"
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
              <h2 id="core-portfolios-modal-title" className="text-xl font-bold text-white">
                Clockwise Core Portfolios
              </h2>
              <p className="text-xs text-gray-400">12-Month Performance Analysis</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Analyzing portfolios...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiX className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-red-400 font-semibold mb-2">Analysis Failed</p>
                <p className="text-gray-400 text-sm">{error}</p>
                <button
                  onClick={loadPortfolioData}
                  className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Portfolio Comparison Section */}
              <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/50 rounded-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6">
                  Portfolio Performance Comparison
                </h3>

                {/* Mobile: Stacked View */}
                <div className="md:hidden space-y-4">
                  {portfolios.map(portfolio => (
                    <CorePortfolioCard
                      key={portfolio.id}
                      portfolio={portfolio}
                      isExpanded={expandedPortfolios.has(portfolio.id)}
                      onToggle={() => toggleExpanded(portfolio.id)}
                      canToggle={true}
                    />
                  ))}
                </div>

                {/* Desktop: Grid View */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {portfolios.map(portfolio => (
                    <CorePortfolioCard
                      key={portfolio.id}
                      portfolio={portfolio}
                      isExpanded={true}
                      canToggle={false}
                    />
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <strong className="text-gray-300">Disclaimer:</strong> Performance projections are based on 
                  historical asset class returns and Monte Carlo simulations. Past performance does not guarantee 
                  future results. Actual returns may vary based on market conditions, rebalancing frequency, and 
                  individual circumstances. Consult with a financial advisor before making investment decisions.
                </p>
              </div>
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
          <a
            href="https://calendly.com/clockwisecapital/appointments"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 
              text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 text-sm shadow-lg"
          >
            Talk to an Advisor
          </a>
        </div>
      </div>
    </div>
  );
}
