'use client';

import { useState } from 'react';
import type { PortfolioSimulation } from '@/types/cycleAnalysis';
import CollapsibleSection from './CollapsibleSection';

interface PortfolioTabProps {
  portfolioAnalysis: {
    current: PortfolioSimulation;
  };
  onBack?: () => void;
  onNavigateToAnalysis?: () => void;
}

export default function PortfolioTab({ portfolioAnalysis, onBack, onNavigateToAnalysis }: PortfolioTabProps) {
  // Filter to only show cycles that exist in the data
  const allCycles = [
    { key: 'market' as const, name: 'Market (S&P 500) Cycle' },
    { key: 'country' as const, name: 'Country Cycle' },
    { key: 'technology' as const, name: 'Technology Cycle' },
    { key: 'economic' as const, name: 'Economic Cycle' },
    { key: 'business' as const, name: 'Business Cycle' },
    { key: 'company' as const, name: 'Company Cycle' },
  ];

  const cycles = allCycles.filter(cycle => portfolioAnalysis.current.cycleResults[cycle.key] !== undefined);
  
  // Default to market if available, otherwise first available cycle
  const defaultCycle = portfolioAnalysis.current.cycleResults.market ? 'market' : cycles[0]?.key || 'country';
  const [selectedCycle, setSelectedCycle] = useState<keyof PortfolioSimulation['cycleResults']>(defaultCycle);
  const [userResponse, setUserResponse] = useState('');

  const currentCycleResult = portfolioAnalysis.current.cycleResults[selectedCycle] || portfolioAnalysis.current.cycleResults[cycles[0]?.key || 'country'];
  const overallResult = portfolioAnalysis.current.overall;

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

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Question (Call to Action) */}
      <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 rounded-2xl p-5 md:p-6 shadow-md">
        <p className="text-lg md:text-xl font-semibold text-white leading-snug m-0">
          What keeps you up at night about this portfolio?
        </p>
      </div>

      {/* Video Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 md:p-8 border border-gray-200 shadow-sm">
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
          <video
            controls
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
            preload="metadata"
          >
            <source src="/Porfolio%20Tab-with-captions.mp4" type="video/mp4" />
            <track
              kind="captions"
              src="/Porfolio%20Tab-with-captions.mp4"
              label="English"
              default
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Text Input Section */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm">
        <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 md:mb-3">
          Your Response
        </label>
        <textarea
          value={userResponse}
          onChange={(e) => setUserResponse(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition-all"
          placeholder=""
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 text-sm md:text-base font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back: Cycle
          </button>
        )}
        {onNavigateToAnalysis && (
          <button
            onClick={onNavigateToAnalysis}
            className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm md:text-base font-semibold rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 sm:ml-auto"
          >
            Next: Watch Analysis Video
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Portfolio Performance Overview */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <div className="text-base md:text-xl font-bold text-gray-900">Portfolio Performance Analysis</div>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Monte Carlo simulation across all economic cycles
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs md:text-sm text-gray-600">Total Value</div>
            <div className="text-lg md:text-2xl font-bold text-blue-900">
              {formatCurrency(portfolioAnalysis.current.totalValue)}
            </div>
          </div>
        </div>

        {/* Overall Expected Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Expected Return</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatPercent(overallResult.expectedReturn)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Median (50th percentile)</div>
            <div className="text-xs text-teal-600 mt-2 font-medium">
              Confidence: {overallResult.confidence}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="text-sm text-emerald-700 mb-1">Expected Upside</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatPercent(overallResult.expectedUpside)}
            </div>
            <div className="text-xs text-gray-600 mt-1">95th percentile</div>
            <div className="text-xs text-gray-600 mt-2">
              Value: {formatCurrency(portfolioAnalysis.current.totalValue * (1 + overallResult.expectedUpside))}
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <div className="text-sm text-rose-700 mb-1">Expected Downside</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatPercent(overallResult.expectedDownside)}
            </div>
            <div className="text-xs text-gray-600 mt-1">5th percentile</div>
            <div className="text-xs text-gray-600 mt-2">
              Value: {formatCurrency(portfolioAnalysis.current.totalValue * (1 + overallResult.expectedDownside))}
            </div>
          </div>
        </div>
      </div>

      {/* Cycle-by-Cycle Analysis */}
      <CollapsibleSection 
        title="Performance By Cycle" 
        subtitle="See how your portfolio is expected to perform under different economic cycle conditions"
      >

        {/* Cycle Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Cycle
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cycles.map((cycle) => (
              <button
                key={cycle.key}
                onClick={() => setSelectedCycle(cycle.key)}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedCycle === cycle.key
                    ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cycle.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Cycle Results */}
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="text-lg font-semibold text-gray-900 mb-4">
            {cycles.find(c => c.key === selectedCycle)?.name} Impact
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Expected Return</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercent(currentCycleResult.expectedReturn)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Next 12 months (median)</div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="text-xs text-emerald-700 mb-1">Upside Scenario</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercent(currentCycleResult.expectedUpside)}
              </div>
              <div className="text-xs text-gray-600 mt-1">95th percentile</div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <div className="text-xs text-rose-700 mb-1">Downside Scenario</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercent(currentCycleResult.expectedDownside)}
              </div>
              <div className="text-xs text-gray-600 mt-1">5th percentile</div>
            </div>
          </div>

          {currentCycleResult.maxDrawdown && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="text-sm font-semibold text-amber-900">Maximum Drawdown Risk</div>
                  <div className="text-xs text-amber-700">
                    Potential loss from peak: <span className="font-bold">{formatPercent(currentCycleResult.maxDrawdown)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-900">
              <strong>Analysis Confidence:</strong> {currentCycleResult.confidence}
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-900 mb-3">All Cycles Comparison</div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cycle</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expected Return</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Upside (95th)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Downside (5th)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cycles.map((cycle) => {
                  const result = portfolioAnalysis.current.cycleResults[cycle.key];
                  return (
                    <tr key={cycle.key} className={selectedCycle === cycle.key ? 'bg-teal-50' : ''}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cycle.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 font-semibold">
                        {formatPercent(result.expectedReturn)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-600 font-semibold">
                        {formatPercent(result.expectedUpside)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-rose-600 font-semibold">
                        {formatPercent(result.expectedDownside)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      {/* Disclaimer */}
      <CollapsibleSection 
        title="Important Disclaimer" 
        subtitle="Please read before making investment decisions"
      >
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-sm font-semibold text-amber-900 mb-1">Important Disclaimer</div>
            <p className="text-xs text-amber-800">
              These projections are based on Monte Carlo simulations using historical data and AI-powered cycle analysis. 
              Past performance does not guarantee future results. These are hypothetical scenarios and should not be 
              considered as investment advice. Please consult with a financial advisor before making investment decisions.
            </p>
          </div>
        </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
