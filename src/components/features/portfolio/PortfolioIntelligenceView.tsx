'use client';

import { useState } from 'react';
import type { CycleData, PortfolioSimulation } from '@/types/cycleAnalysis';

interface PortfolioIntelligenceViewProps {
  portfolio: any;
  analysisResults: any;
}

export default function PortfolioIntelligenceView({ portfolio, analysisResults }: PortfolioIntelligenceViewProps) {
  console.log('🔍 PortfolioIntelligenceView rendering with:', {
    portfolioId: portfolio?.id,
    portfolioName: portfolio?.name,
    hasAnalysisResults: !!analysisResults,
    hasCycleAnalysis: !!analysisResults?.cycleAnalysis,
    hasCycles: !!analysisResults?.cycleAnalysis?.cycles,
    hasPersonalizedVideo: !!analysisResults?.personalizedVideo,
    hasMarketImpact: !!analysisResults?.marketImpact,
    hasPortfolioImpact: !!analysisResults?.portfolioImpact,
    hasGoalImpact: !!analysisResults?.goalImpact,
    hasRecommendations: !!analysisResults?.recommendations,
  });

  const cycleData = analysisResults?.cycleAnalysis?.cycles;
  const portfolioAnalysis = analysisResults?.cycleAnalysis?.portfolioAnalysis;
  const goalAnalysis = analysisResults?.cycleAnalysis?.goalAnalysis;
  const timeExpectedReturn = analysisResults?.portfolioComparison?.timePortfolio?.expectedReturn;
  const personalizedVideo = analysisResults?.personalizedVideo;
  
  // Impact and Recommendations (main focus)
  const marketImpact = analysisResults?.marketImpact;
  const portfolioImpact = analysisResults?.portfolioImpact;
  const goalImpact = analysisResults?.goalImpact;
  const recommendations = analysisResults?.recommendations;
  
  // Collapsible cycle details state
  const [showCycleDetails, setShowCycleDetails] = useState(false);

  if (!analysisResults || (!cycleData && !marketImpact && !recommendations)) {
    console.warn('⚠️ No analysis data available');
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="mb-2">No portfolio intelligence available</p>
        <p className="text-xs text-gray-500">Run a new Kronos analysis to generate portfolio intelligence</p>
      </div>
    );
  }

  // Default to market if available, otherwise first available cycle
  const availableCycles = cycleData ? (Object.keys(cycleData) as Array<keyof typeof cycleData>).filter(key => cycleData[key] !== undefined) : [];
  const defaultCycle = cycleData?.market ? 'market' : availableCycles[0] || 'country';
  
  const [selectedCycle, setSelectedCycle] = useState<keyof typeof cycleData>(defaultCycle);
  const [portfolioCycleFilter, setPortfolioCycleFilter] = useState<keyof typeof cycleData>(defaultCycle);
  const [currentView, setCurrentView] = useState<'cycle' | 'analog' | 'performance'>('cycle');
  
  const currentCycle = cycleData ? (cycleData[selectedCycle] || cycleData[availableCycles[0]] || cycleData.country) : null;

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Cycle Dial Component
  const CycleDial = ({ value, size = 200 }: { value: number; size?: number }) => {
    const radius = (size - 16) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(100, value));
    const dash = (progress / 100) * circumference;
    const angle = (progress / 100) * 360;

    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow">
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="fill-none stroke-gray-300"
            strokeWidth={10}
          />
          <g transform={`rotate(-90 ${center} ${center})`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              className="fill-none stroke-teal-500"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              strokeWidth={10}
            />
          </g>
          <g transform={`rotate(${angle - 90} ${center} ${center})`}>
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - radius + 10}
              className="stroke-amber-500"
              strokeWidth={3}
              strokeLinecap="round"
            />
          </g>
          {[0, 25, 50, 75, 100].map((t) => {
            const a = (t / 100) * 2 * Math.PI - Math.PI / 2;
            const x1 = center + Math.cos(a) * (radius - 2);
            const y1 = center + Math.sin(a) * (radius - 2);
            const x2 = center + Math.cos(a) * (radius - 10);
            const y2 = center + Math.sin(a) * (radius - 10);
            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className="stroke-gray-400"
                strokeWidth={2}
              />
            );
          })}
          {/* Text inside dial */}
          <text
            x={center}
            y={center - 5}
            textAnchor="middle"
            className="fill-gray-100 font-bold"
            style={{ fontSize: '32px' }}
          >
            {progress}%
          </text>
          <text
            x={center}
            y={center + 20}
            textAnchor="middle"
            className="fill-gray-300"
            style={{ fontSize: '12px' }}
          >
            Through Cycle
          </text>
        </svg>
      </div>
    );
  };

  const formatImpactText = (impact: string | string[] | undefined): string[] => {
    if (!impact) return [];
    return Array.isArray(impact) ? impact : [impact];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-white mb-2">
          {portfolio.name}
        </h2>
        <p className="text-gray-400 text-sm">
          Personalized portfolio intelligence from your most recent Kronos experience
        </p>
      </div>

      {/* Personalized Video Analysis */}
      {personalizedVideo && (
        <div className="bg-gradient-to-br from-teal-900/20 to-blue-900/20 rounded-2xl p-6 border border-teal-500/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-teal-500/60 shadow-lg shadow-teal-500/30">
              <img
                src="/team/kronos.png"
                alt="Kronos"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-teal-300">Your Personalized Analysis Video</h3>
              <p className="text-sm text-gray-400">Created by Kronos just for you</p>
            </div>
          </div>
          
          <div className="relative rounded-xl overflow-hidden bg-black shadow-2xl">
            <video
              src={personalizedVideo.videoUrl}
              controls
              className="w-full aspect-video"
              poster={personalizedVideo.thumbnailUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>Generated: {new Date(personalizedVideo.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            <a
              href={personalizedVideo.videoUrl}
              download
              className="text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Video
            </a>
          </div>
        </div>
      )}

      {/* Unified Impact & Risk Analysis */}
      {((marketImpact && formatImpactText(marketImpact).length > 0) || 
        (portfolioImpact && formatImpactText(portfolioImpact).length > 0) || 
        (goalImpact && formatImpactText(goalImpact).length > 0)) && (
        <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/50 shadow-lg backdrop-blur-sm">
          <div className="space-y-6">
            {/* Market Impact Section */}
            {marketImpact && formatImpactText(marketImpact).length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-700/50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-teal-300">Market Impact</h3>
                </div>
                <div className="ml-13 space-y-2">
                  {formatImpactText(marketImpact).map((text, idx) => (
                    <p key={idx} className="text-sm text-gray-300 leading-relaxed">
                      • {text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {marketImpact && portfolioImpact && (
              <div className="border-t border-gray-700/50" />
            )}

            {/* Portfolio Risk Section */}
            {portfolioImpact && formatImpactText(portfolioImpact).length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-700/50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-teal-300">Personalized Portfolio Risk</h3>
                </div>
                <div className="ml-13 space-y-2">
                  {formatImpactText(portfolioImpact).map((text, idx) => (
                    <p key={idx} className="text-sm text-gray-300 leading-relaxed">
                      • {text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {portfolioImpact && goalImpact && (
              <div className="border-t border-gray-700/50" />
            )}

            {/* Goal Impact Section */}
            {goalImpact && formatImpactText(goalImpact).length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-700/50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-teal-300">Goal Impact</h3>
                </div>
                <div className="ml-13 space-y-2">
                  {formatImpactText(goalImpact).map((text, idx) => (
                    <p key={idx} className="text-sm text-gray-300 leading-relaxed">
                      • {text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-2xl p-4 md:p-6 border border-purple-700 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-14 md:h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm md:text-lg font-bold text-purple-300 mb-1 md:mb-2">Kronos Recommendations</div>
              <ul className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs md:text-base text-gray-300 leading-relaxed flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Cycle Details */}
      {cycleData && currentCycle && (
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
          <button
            onClick={() => setShowCycleDetails(!showCycleDetails)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-semibold text-gray-300">Advanced Cycle Analysis</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${showCycleDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCycleDetails && (
            <div className="p-4 border-t border-gray-700/50 space-y-6">
              {/* View Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setCurrentView('cycle')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                    currentView === 'cycle'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Cycle Analysis
                </button>
                <button
                  onClick={() => setCurrentView('analog')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                    currentView === 'analog'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Historical Analog
                </button>
                <button
                  onClick={() => setCurrentView('performance')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                    currentView === 'performance'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Performance By Cycle
                </button>
              </div>

      {/* Content Views */}
      {currentView === 'cycle' && (
        <div className="space-y-6">
          {/* S&P 500 Historical Backtest */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-4 md:p-6 border border-gray-700/50 shadow-sm backdrop-blur-sm">
            <div className="text-base md:text-lg font-semibold text-gray-100 mb-3 md:mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              S&P 500 Historical Backtest
            </div>
            <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">
              Based on historical S&P 500 performance during similar {currentCycle.name.toLowerCase()} phases
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Expected Return (Median)</div>
                <div className="text-2xl font-bold text-gray-100">
                  {((timeExpectedReturn ?? currentCycle.sp500Backtest.expectedReturn) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">12 month price target return</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3">
                  <div className="text-xs text-emerald-400 mb-1">Upside (95th)</div>
                  <div className="text-xl font-bold text-gray-100">
                    {(currentCycle.sp500Backtest.expectedUpside * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-rose-900/10 border border-rose-900/30 rounded-lg p-3">
                  <div className="text-xs text-rose-300 mb-1">Downside (5th)</div>
                  <div className="text-xl font-bold text-gray-100">
                    {(currentCycle.sp500Backtest.expectedDownside * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cycle Dial */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm flex justify-center">
            <CycleDial value={currentCycle.phasePercent} size={220} />
          </div>

          {/* Cycle Selector */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-lg border border-gray-700/50 p-4 backdrop-blur-sm">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Cycle to Analyze
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableCycles.map((key) => (
                <button
                  key={String(key)}
                  onClick={() => setSelectedCycle(key)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedCycle === key
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cycleData[key]!.name}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-lg p-4 border border-gray-700/50 backdrop-blur-sm">
            <div className="text-sm font-semibold text-gray-100 mb-3">Cycle Timeline</div>
            <div className="space-y-2">
              {currentCycle.timeline.map((phase: { phase: string; startPercent: number; endPercent: number; description: string; isCurrent: boolean }, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    phase.isCurrent
                      ? 'border-teal-500 bg-teal-900/30'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-100 text-sm">{phase.phase}</span>
                    <span className="text-xs text-gray-400">
                      {phase.startPercent}% - {phase.endPercent}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{phase.description}</p>
                </div>
              ))}
            </div>
            {/* Progress Bar */}
            <div className="mt-4 h-2 w-full bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-500"
                style={{ width: `${currentCycle.phasePercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {currentView === 'analog' && (
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-4 md:p-6 border border-gray-700/50 shadow-sm backdrop-blur-sm">
          <div className="text-base md:text-lg font-semibold text-gray-100 mb-2 md:mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Best Historical Analog
          </div>
          
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-base md:text-lg font-bold text-gray-100">{currentCycle.historicalAnalog.period}</span>
              <span className="text-xs px-2 py-1 bg-amber-900/30 text-amber-400 border border-amber-800 rounded-full font-medium whitespace-nowrap">
                {currentCycle.historicalAnalog.similarity}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              {currentCycle.historicalAnalog.description}
            </p>
          </div>
          
          {currentCycle.historicalAnalog.keyEvents.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-bold text-gray-300 mb-2">Key Events:</div>
              <ul className="space-y-1">
                {currentCycle.historicalAnalog.keyEvents.map((event: string, idx: number) => (
                  <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>{event}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {currentView === 'performance' && portfolioAnalysis && (
        <div className="space-y-6">
          {/* Cycle Filter */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-lg border border-gray-700/50 p-4 backdrop-blur-sm">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Cycle
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableCycles.map((key) => (
                <button
                  key={String(key)}
                  onClick={() => setPortfolioCycleFilter(key)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    portfolioCycleFilter === key
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cycleData[key]!.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Cycle Results */}
          {portfolioAnalysis.current.cycleResults[portfolioCycleFilter] && (
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-lg p-4 border border-gray-700/50 backdrop-blur-sm">
              <div className="text-lg font-semibold text-gray-100 mb-4">
                {cycleData[portfolioCycleFilter]!.name} Impact
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Expected Return</div>
                  <div className="text-2xl font-bold text-gray-100">
                    {formatPercent(
                      portfolioCycleFilter === 'company' && timeExpectedReturn !== undefined
                        ? timeExpectedReturn
                        : portfolioAnalysis.current.cycleResults[portfolioCycleFilter].expectedReturn
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {portfolioCycleFilter === 'company' ? '12 month price target return' : 'Next 12 months (median)'}
                  </div>
                </div>

                <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-4">
                  <div className="text-xs text-emerald-400 mb-1">Upside Scenario</div>
                  <div className="text-2xl font-bold text-gray-100">
                    {formatPercent(portfolioAnalysis.current.cycleResults[portfolioCycleFilter].expectedUpside)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">95th percentile</div>
                </div>

                <div className="bg-rose-900/10 border border-rose-900/30 rounded-lg p-4">
                  <div className="text-xs text-rose-300 mb-1">Downside Scenario</div>
                  <div className="text-2xl font-bold text-gray-100">
                    {formatPercent(portfolioAnalysis.current.cycleResults[portfolioCycleFilter].expectedDownside)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">5th percentile</div>
                </div>
              </div>

              {portfolioAnalysis.current.cycleResults[portfolioCycleFilter].maxDrawdown && (
                <div className="mt-4 p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <div className="text-sm font-semibold text-amber-300 mb-1">Maximum Drawdown Risk</div>
                      <div className="text-xs text-amber-400">
                        Potential loss from peak: <span className="font-bold">{formatPercent(portfolioAnalysis.current.cycleResults[portfolioCycleFilter].maxDrawdown!)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="text-xs text-blue-300">
                  <strong>Analysis Confidence:</strong> {portfolioAnalysis.current.cycleResults[portfolioCycleFilter].confidence}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-lg p-4 border border-gray-700/50 backdrop-blur-sm">
            <div className="text-sm font-semibold text-gray-100 mb-3">All Cycles Comparison</div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Cycle</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300">Return</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300">Upside</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-300">Downside</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {availableCycles.map((key) => {
                    const result = portfolioAnalysis.current.cycleResults[key];
                    if (!result) return null;
                    const displayReturn = key === 'company' && timeExpectedReturn !== undefined
                      ? timeExpectedReturn
                      : result.expectedReturn;
                    return (
                      <tr key={String(key)} className={portfolioCycleFilter === key ? 'bg-teal-900/30' : ''}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-100">{cycleData[key]!.name}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-100 font-semibold">
                          {formatPercent(displayReturn)}
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
        </div>
      )}
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-teal-900/20 rounded-lg p-4 md:p-6 border border-teal-400 backdrop-blur-sm">
        <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-teal-300">Next Steps</h3>
        <p className="text-sm md:text-base text-teal-200 mb-4 md:mb-6">
          Test your portfolio in different market conditions, schedule a consultation, or run a new Kronos analysis.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/scenario-testing"
            className="px-6 py-3 bg-gray-800 text-teal-300 border border-teal-500 font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Scenario Testing
          </a>
          <a
            href="https://calendly.com/clockwisecapital/appointments"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-800 text-teal-300 border border-teal-500 font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule a Consulation
          </a>
          <a
            href="/kronos"
            className="px-6 py-3 bg-gray-800 text-teal-300 border border-teal-500 font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </a>
        </div>
      </div>
    </div>
  );
}
