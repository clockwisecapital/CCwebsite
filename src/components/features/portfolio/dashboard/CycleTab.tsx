'use client';

import { useState } from 'react';
import type { CycleData } from '@/types/cycleAnalysis';
import CollapsibleSection from './CollapsibleSection';

interface CycleTabProps {
  cycleData: {
    market: CycleData;
    country: CycleData;
    technology: CycleData;
    economic: CycleData;
    business: CycleData;
    company: CycleData;
  };
  onNext?: () => void;
  onBack?: () => void;
}

export default function CycleTab({ cycleData, onNext, onBack }: CycleTabProps) {
  // Default to market if available, otherwise first available cycle
  const availableCycles = (Object.keys(cycleData) as Array<keyof typeof cycleData>).filter(key => cycleData[key] !== undefined);
  const defaultCycle = cycleData.market ? 'market' : availableCycles[0] || 'country';
  
  const [selectedCycle, setSelectedCycle] = useState<keyof typeof cycleData>(defaultCycle);
  const [userResponse, setUserResponse] = useState('');
  
  const currentCycle = cycleData[selectedCycle] || cycleData[availableCycles[0]] || cycleData.country; // Fallback to first available

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
              className="fill-none stroke-secondary-teal"
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
              className="stroke-accent-gold"
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
            className="fill-gray-900 font-bold"
            style={{ fontSize: '32px' }}
          >
            {progress}%
          </text>
          <text
            x={center}
            y={center + 20}
            textAnchor="middle"
            className="fill-gray-600"
            style={{ fontSize: '12px' }}
          >
            Through Cycle
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Slider Input */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Your Answer
        </label>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 whitespace-nowrap">Not Confident</span>
          <input
            type="range"
            min="1"
            max="10"
            defaultValue="5"
            className="flex-1 h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          <span className="text-sm text-gray-600 whitespace-nowrap">Extremely Confident</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
          {[1,2,3,4,5,6,7,8,9,10].map(n => <span key={n}>{n}</span>)}
        </div>
      </div>

      {/* Text Input Section */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm">
        <label className="block text-sm md:text-base font-semibold text-gray-700 mb-2 md:mb-3">
          Additional thoughts (Optional)
        </label>
        <textarea
          value={userResponse}
          onChange={(e) => setUserResponse(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition-all"
          placeholder="Share your thoughts about market conditions..."
        />
      </div>

      {/* Talk to Advisor Button */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-6 text-white">
        <p className="text-teal-100 mb-4">
          Want personalized guidance? Work with a Clockwise Approved Advisor.
        </p>
        <a
          href="https://clockwisecapital.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          Talk to an Advisor
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Navigation Buttons */}
      {(onBack || onNext) && (
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 text-sm md:text-base font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back: Portfolio
            </button>
          )}
        </div>
      )}

      {/* S&P 500 Historical Backtest */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm">
        <div className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-secondary-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          S&P 500 Historical Backtest
        </div>
        <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
          Based on historical S&P 500 performance during similar {currentCycle.name.toLowerCase()} phases
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Expected Return (Median)</div>
            <div className="text-2xl font-bold text-gray-900">
              {(currentCycle.sp500Backtest.expectedReturn * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">50th percentile, next 12 months</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="text-xs text-emerald-700 mb-1">Upside (95th)</div>
              <div className="text-xl font-bold text-gray-900">
                {(currentCycle.sp500Backtest.expectedUpside * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
              <div className="text-xs text-rose-700 mb-1">Downside (5th)</div>
              <div className="text-xl font-bold text-gray-900">
                {(currentCycle.sp500Backtest.expectedDownside * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Analog */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm">
        <div className="text-base md:text-lg font-semibold text-gray-900 mb-2 md:mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Best Historical Analog
        </div>
        
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-base md:text-lg font-bold text-gray-900">{currentCycle.historicalAnalog.period}</span>
            <span className="text-xs px-2 py-1 bg-amber-200 text-amber-900 rounded-full font-medium whitespace-nowrap">
              {currentCycle.historicalAnalog.similarity}
            </span>
          </div>
          <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
            {currentCycle.historicalAnalog.description}
          </p>
        </div>
        
        {currentCycle.historicalAnalog.keyEvents.length > 0 && (
          <div className="mt-4">
              <div className="text-xs font-bold text-gray-700 mb-2">Key Events:</div>
            <ul className="space-y-1">
              {currentCycle.historicalAnalog.keyEvents.map((event, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>{event}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Cycle Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Cycle to Analyze
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableCycles.map((key) => (
              <button
                key={key}
                onClick={() => setSelectedCycle(key)}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedCycle === key
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cycleData[key]!.name}
              </button>
            ))}
        </div>
      </div>

      {/* Cycle Analysis */}
      <CollapsibleSection 
        title={currentCycle.name} 
        subtitle={`Current Phase: ${currentCycle.phase} • ${currentCycle.averageLifecycle} lifecycle • Started ${currentCycle.currentCycleStart}`}
      >

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Dial & Timeline */}
          <div className="space-y-6">
            {/* Dial */}
            <div className="flex justify-center">
              <CycleDial value={currentCycle.phasePercent} size={220} />
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Cycle Timeline</div>
              <div className="space-y-3">
                {currentCycle.timeline.map((phase, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      phase.isCurrent
                        ? 'border-secondary-teal bg-teal-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">{phase.phase}</span>
                      <span className="text-xs text-gray-500">
                        {phase.startPercent}% - {phase.endPercent}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{phase.description}</p>
                  </div>
                ))}
              </div>
              {/* Progress Bar */}
              <div className="mt-4 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-teal transition-all duration-500"
                  style={{ width: `${currentCycle.phasePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Additional Cycle Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="text-lg font-semibold text-gray-900 mb-3">Additional Cycle Information</div>
              <p className="text-sm text-gray-600">
                The detailed cycle analysis and recommendations appear below after navigation.
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
