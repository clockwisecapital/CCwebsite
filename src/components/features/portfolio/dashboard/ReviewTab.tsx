'use client';

import { useState } from 'react';
import type { IntakeFormData, AnalysisResult } from './PortfolioDashboard';
import CycleTab from './CycleTab';
import PortfolioTab from './PortfolioTab';
import GoalTab from './GoalTab';

interface ReviewTabProps {
  analysisResult: AnalysisResult;
  intakeData: IntakeFormData;
  conversationId: string | null;
  videoId: string | null; // Still needed for prop compatibility
  onReset: () => void;
  onNavigateToAnalyze?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ReviewTab({ analysisResult, intakeData: _intakeData, conversationId: _conversationId, videoId: _videoId, onReset, onNavigateToAnalyze }: ReviewTabProps) {
  const [showAnalysisAndSync, setShowAnalysisAndSync] = useState(false);
  const [cycleAnalysisTab, setCycleAnalysisTab] = useState<'cycle' | 'portfolio' | 'goal'>('goal');

  const handleNext = () => {
    if (cycleAnalysisTab === 'goal') {
      setCycleAnalysisTab('cycle');
    } else if (cycleAnalysisTab === 'cycle') {
      setCycleAnalysisTab('portfolio');
    }
  };

  const handleBack = () => {
    if (cycleAnalysisTab === 'portfolio') {
      setCycleAnalysisTab('cycle');
    } else if (cycleAnalysisTab === 'cycle') {
      setCycleAnalysisTab('goal');
    }
  };

  // Process impact data (handle both string and array formats)
  const processImpactData = (data: string | string[] | undefined): string[] => {
    if (Array.isArray(data)) {
      return data.map(item => item.startsWith('•') ? item : `• ${item}`);
    }
    if (typeof data === 'string') {
      return data.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.startsWith('•') ? line : `• ${line}`);
    }
    return ['• No data available'];
  };

  const marketImpact = processImpactData(analysisResult.marketImpact);
  const portfolioImpact = processImpactData(analysisResult.portfolioImpact);
  const goalImpact = processImpactData(analysisResult.goalImpact);

  // Handle missing cycle analysis gracefully
  if (!analysisResult.cycleAnalysis) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-900">Analysis Incomplete</h2>
          </div>
          <p className="text-red-800 mb-4">
            The cycle analysis data is missing. This may be due to an API error or timeout.
          </p>
          <button
            onClick={onReset}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const allCycles = analysisResult.cycleAnalysis.cycles;
  
  // Show all 6 cycles - Market (S&P 500) is primary/default
  const cycleData = {
    market: allCycles.market,
    country: allCycles.country,
    technology: allCycles.technology,
    economic: allCycles.economic,
    business: allCycles.business,
    company: allCycles.company,
  };
  
  const portfolioAnalysis = analysisResult.cycleAnalysis.portfolioAnalysis;
  const goalAnalysis = analysisResult.cycleAnalysis.goalAnalysis;

  return (
    <div className="space-y-8">
      {/* Portfolio Intelligence with Dynamic Kronos Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
            <button
              onClick={() => setCycleAnalysisTab('goal')}
              className={`flex-1 py-3 md:py-4 px-2 md:px-6 text-center font-semibold transition-colors ${
                cycleAnalysisTab === 'goal'
                  ? 'border-b-2 border-secondary-teal text-secondary-teal bg-teal-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 md:gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-sm md:text-base">Goal</span>
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 hidden sm:block">Success Probability</div>
            </button>

            <button
              onClick={() => setCycleAnalysisTab('cycle')}
              className={`flex-1 py-3 md:py-4 px-2 md:px-6 text-center font-semibold transition-colors ${
                cycleAnalysisTab === 'cycle'
                  ? 'border-b-2 border-secondary-teal text-secondary-teal bg-teal-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 md:gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="text-sm md:text-base">Cycle</span>
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 hidden sm:block">6 Cycles</div>
            </button>

            <button
              onClick={() => setCycleAnalysisTab('portfolio')}
              className={`flex-1 py-3 md:py-4 px-2 md:px-6 text-center font-semibold transition-colors ${
                cycleAnalysisTab === 'portfolio'
                  ? 'border-b-2 border-secondary-teal text-secondary-teal bg-teal-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 md:gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm md:text-base">Portfolio</span>
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 hidden sm:block">Monte Carlo</div>
            </button>
          </nav>
        </div>

            {/* Dynamic Kronos Recommendation - Changes based on active tab */}
            <div className="p-6 border-b border-gray-200">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 md:p-6 border border-blue-100 shadow-sm">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base md:text-lg font-bold text-blue-900 mb-1 md:mb-2">Kronos Recommendation</div>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      {cycleAnalysisTab === 'goal' && goalAnalysis.recommendation}
                      {cycleAnalysisTab === 'cycle' && (
                        <>
                          Based on the current {cycleData.market.phase} phase of the {cycleData.market.name}, our analysis suggests a {cycleData.market.phasePercent < 50 ? 'cautious' : 'strategic'} approach. Historical patterns indicate {(cycleData.market.sp500Backtest.expectedReturn * 100).toFixed(1)}% median returns with significant volatility potential.
                        </>
                      )}
                      {cycleAnalysisTab === 'portfolio' && (
                        <>
                          Your portfolio shows a {((portfolioAnalysis.current.overall.expectedReturn) * 100).toFixed(1)}% median expected return with {portfolioAnalysis.current.overall.confidence} confidence. Given the current market conditions and cycle positioning, we recommend {portfolioAnalysis.current.overall.expectedReturn > 0.15 ? 'maintaining your current allocation while monitoring for rebalancing opportunities' : 'reviewing your risk exposure and considering strategic adjustments'}.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {cycleAnalysisTab === 'cycle' && (
                <CycleTab 
                  cycleData={cycleData} 
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {cycleAnalysisTab === 'portfolio' && (
                <PortfolioTab 
                  portfolioAnalysis={portfolioAnalysis}
                  onBack={handleBack}
                  onNavigateToAnalysis={onNavigateToAnalyze}
                />
              )}
              {cycleAnalysisTab === 'goal' && (
                <GoalTab 
                  goalAnalysis={goalAnalysis}
                  onNext={handleNext}
                />
              )}
            </div>
      </div>

      {/* 2. Portfolio Intelligence Results */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowAnalysisAndSync(!showAnalysisAndSync)}
          className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Intelligence Results</h3>
            <p className="text-sm text-gray-600 mt-1">Impact & Recommendation</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transform transition-transform flex-shrink-0 ml-4 ${
              showAnalysisAndSync ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showAnalysisAndSync && (
          <div className="p-6 space-y-6">
            {/* Market Impact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Market Impact
              </h4>
              <ul className="space-y-2 text-gray-700">
                {marketImpact.map((item, idx) => (
                  <li key={idx} className="pl-4">{item}</li>
                ))}
              </ul>
            </div>

            {/* Your Portfolio Impact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Your Portfolio Impact
              </h4>
              <ul className="space-y-2 text-gray-700">
                {portfolioImpact.map((item, idx) => (
                  <li key={idx} className="pl-4">{item}</li>
                ))}
              </ul>
            </div>

            {/* Goal Impact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Goal Impact
              </h4>
              <ul className="space-y-2 text-gray-700">
                {goalImpact.map((item, idx) => (
                  <li key={idx} className="pl-4">{item}</li>
                ))}
              </ul>
            </div>

            {/* Professional Oversight Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Professional oversight suggested</p>
                  <p className="text-xs text-blue-800">Clockwise portfolio solutions available</p>
                </div>
              </div>
            </div>

            {/* Metrics Table */}
            {analysisResult.metrics && analysisResult.metrics.length > 0 && (
              <div className="mt-6 overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recommendation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysisResult.metrics.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row[0]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row[1]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {row[2]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scenario Stress Testing - Hidden as requested */}

      {/* Next Steps / CTA - Moved to Bottom */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-4 md:p-8 text-white">
        <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Next Step</h3>
        <p className="text-sm md:text-base text-teal-100 mb-4 md:mb-6">
          Work 1:1 with a strategist to optimize allocations for the current cycle.
        </p>
        <div className="flex justify-center">
          <a
            href="https://clockwisecapital.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 md:px-8 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-center flex items-center justify-center gap-2 text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Match me with an advisor
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
