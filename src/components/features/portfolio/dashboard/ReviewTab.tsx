'use client';

import { useState } from 'react';
import type { IntakeFormData, AnalysisResult } from './PortfolioDashboard';
import CycleTab from './CycleTab';
import PortfolioTab from './PortfolioTab';
import GoalTab from './GoalTab';
import VideoPlayer from './VideoPlayer';

interface ReviewTabProps {
  analysisResult: AnalysisResult;
  intakeData: IntakeFormData;
  conversationId: string | null;
  videoId: string | null; // Still needed for prop compatibility
  onReset: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ReviewTab({ analysisResult, intakeData: _intakeData, conversationId, videoId, onReset }: ReviewTabProps) {
  // Default to collapsed on mobile (screens < 768px)
  const [showPortfolioIntelligence, setShowPortfolioIntelligence] = useState(true);
  const [showAnalysisAndSync, setShowAnalysisAndSync] = useState(false);
  const [cycleAnalysisTab, setCycleAnalysisTab] = useState<'cycle' | 'portfolio' | 'goal'>('goal');
  const [showVideoReadyModal, setShowVideoReadyModal] = useState(false);
  const [hasShownVideoModal, setHasShownVideoModal] = useState(false); // Track if modal was already shown

  const handleVideoReady = () => {
    // Only show modal once per session
    if (!hasShownVideoModal) {
      setShowVideoReadyModal(true);
      setHasShownVideoModal(true);
    }
  };

  const scrollToVideo = () => {
    setShowVideoReadyModal(false);
    // Scroll to video section
    document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      {/* VIDEO SECTION - Top Priority - Always Visible */}
      <div id="video-section" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Personalized Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">Watch Kronos explain your results</p>
        </div>
        <div className="p-6">
          {videoId ? (
            <VideoPlayer videoId={videoId} onVideoReady={handleVideoReady} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <svg className="absolute -inset-2 w-24 h-24 animate-spin" viewBox="0 0 50 50">
                  <circle 
                    className="opacity-25" 
                    cx="25" 
                    cy="25" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    style={{ color: '#0d9488' }}
                  />
                  <circle 
                    className="opacity-75" 
                    cx="25" 
                    cy="25" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    strokeDasharray="80"
                    strokeDashoffset="60"
                    style={{ color: '#0d9488' }}
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Personalized Video</h4>
              <p className="text-sm text-gray-600 text-center max-w-md">
                Kronos is creating a custom video analysis tailored to your portfolio. This typically takes 60-90 seconds.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-teal-600">
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></div>
                <span>Video generation in progress...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 1. PORTFOLIO INTELLIGENCE COMPLETE */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowPortfolioIntelligence(!showPortfolioIntelligence)}
          className="w-full border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Intelligence Complete</h3>
            <p className="text-sm text-gray-600 mt-1">AI-powered real-time investing intelligence based on the cycles driving markets</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transform transition-transform flex-shrink-0 ml-4 ${
              showPortfolioIntelligence ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showPortfolioIntelligence && (
          <>
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

            {/* Tab Content */}
            <div className="p-6">
              {cycleAnalysisTab === 'cycle' && <CycleTab cycleData={cycleData} />}
              {cycleAnalysisTab === 'portfolio' && <PortfolioTab portfolioAnalysis={portfolioAnalysis} />}
              {cycleAnalysisTab === 'goal' && <GoalTab goalAnalysis={goalAnalysis} />}
            </div>
          </>
        )}
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

            {/* Portfolio Impact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Portfolio Impact
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

      {/* Video Ready Notification Modal */}
      {showVideoReadyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Your Video is Ready!
            </h3>
            <p className="text-gray-600 mb-6">
              Kronos has finished analyzing your portfolio. Watch your personalized summary now.
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={scrollToVideo}
                className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg"
              >
                Watch Now
              </button>
              <button
                onClick={() => setShowVideoReadyModal(false)}
                className="w-full px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                Watch Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
