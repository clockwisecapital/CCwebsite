'use client';

import { useState } from 'react';
import type { GoalAnalysis } from '@/types/cycleAnalysis';
import CollapsibleSection from './CollapsibleSection';

interface GoalTabProps {
  goalAnalysis: GoalAnalysis;
}

export default function GoalTab({ goalAnalysis }: GoalTabProps) {
  const [showWatchFirst, setShowWatchFirst] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };

  const getStatusColor = (probability: number) => {
    if (probability >= 0.75) return 'emerald';
    if (probability >= 0.5) return 'amber';
    return 'rose';
  };

  const getStatusText = (probability: number) => {
    if (probability >= 0.9) return 'Very High';
    if (probability >= 0.75) return 'High';
    if (probability >= 0.5) return 'Moderate';
    if (probability >= 0.25) return 'Low';
    return 'Very Low';
  };

  const medianColor = getStatusColor(goalAnalysis.probabilityOfSuccess.median);

  return (
    <div className="space-y-6">
      {/* Watch Me First - Video Explanation */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowWatchFirst(!showWatchFirst)}
          className="w-full px-6 py-4 flex items-center justify-between text-white hover:bg-black/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg text-white">What are the implications if you fall short of this goal?</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-white transform transition-transform ${
              showWatchFirst ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showWatchFirst && (
          <div className="bg-white p-6 border-t border-teal-200">
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">Video Placeholder</p>
                <p className="text-xs">Goal Analysis Explainer Video</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Goal Overview */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200">
        <h3 className="text-2xl font-bold text-primary-blue mb-4">Your Financial Goal</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Goal Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(goalAnalysis.goalAmount)}
            </div>
            <div className="text-xs text-gray-500 mt-1">{goalAnalysis.goalDescription}</div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Current Portfolio</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(goalAnalysis.currentAmount)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Starting value</div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Time Horizon</div>
            <div className="text-2xl font-bold text-gray-900">
              {goalAnalysis.timeHorizon} {goalAnalysis.timeHorizon === 1 ? 'year' : 'years'}
            </div>
            {goalAnalysis.monthlyContribution && (
              <div className="text-xs text-gray-500 mt-1">
                + {formatCurrency(goalAnalysis.monthlyContribution)}/mo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kronos Recommendation */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Kronos Recommendation</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {goalAnalysis.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Probability of Success */}
      <CollapsibleSection 
        title="Probability of Reaching Your Goal" 
        subtitle="Based on Monte Carlo simulations across all economic cycles"
      >

        {/* Main Probability Display */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
          <div className="text-center mb-6">
            <div className="text-sm text-gray-600 mb-2">Expected Probability (Median)</div>
            <div className={`text-6xl font-bold text-${medianColor}-600 mb-2`}>
              {formatPercent(goalAnalysis.probabilityOfSuccess.median)}
            </div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-${medianColor}-100 text-${medianColor}-800`}>
              {getStatusText(goalAnalysis.probabilityOfSuccess.median)} Probability
            </div>
          </div>

          {/* Probability Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <div className="text-xs text-gray-600 mb-2">Best Case Scenario</div>
              <div className="text-3xl font-bold text-emerald-600">
                {formatPercent(goalAnalysis.probabilityOfSuccess.upside)}
              </div>
              <div className="text-xs text-gray-500 mt-1">95th percentile</div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <div className="text-xs text-gray-600 mb-2">Expected Scenario</div>
              <div className={`text-3xl font-bold text-${medianColor}-600`}>
                {formatPercent(goalAnalysis.probabilityOfSuccess.median)}
              </div>
              <div className="text-xs text-gray-500 mt-1">50th percentile</div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <div className="text-xs text-gray-600 mb-2">Worst Case Scenario</div>
              <div className="text-3xl font-bold text-rose-600">
                {formatPercent(goalAnalysis.probabilityOfSuccess.downside)}
              </div>
              <div className="text-xs text-gray-500 mt-1">5th percentile</div>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Goal Achievement Range</span>
            <span className="text-sm text-gray-600">
              {formatPercent(goalAnalysis.probabilityOfSuccess.downside)} - {formatPercent(goalAnalysis.probabilityOfSuccess.upside)}
            </span>
          </div>
          <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${goalAnalysis.probabilityOfSuccess.median * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-900">
              {formatPercent(goalAnalysis.probabilityOfSuccess.median)} Probability
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Projected Values */}
      <CollapsibleSection 
        title="Projected Portfolio Values" 
        subtitle={`Estimated portfolio value in ${goalAnalysis.timeHorizon} ${goalAnalysis.timeHorizon === 1 ? 'year' : 'years'}`}
      >

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="text-sm text-emerald-700 mb-2">Upside Scenario</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(goalAnalysis.projectedValues.upside)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {goalAnalysis.shortfall.upside >= 0 ? (
                <span className="text-emerald-700 font-semibold">
                  +{formatCurrency(goalAnalysis.shortfall.upside)} above goal
                </span>
              ) : (
                <span className="text-rose-700 font-semibold">
                  {formatCurrency(Math.abs(goalAnalysis.shortfall.upside))} below goal
                </span>
              )}
            </div>
          </div>

          <div className={`bg-${medianColor}-50 border border-${medianColor}-200 rounded-lg p-4`}>
            <div className={`text-sm text-${medianColor}-700 mb-2`}>Expected Scenario</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(goalAnalysis.projectedValues.median)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {goalAnalysis.shortfall.median >= 0 ? (
                <span className="text-emerald-700 font-semibold">
                  +{formatCurrency(goalAnalysis.shortfall.median)} above goal
                </span>
              ) : (
                <span className="text-rose-700 font-semibold">
                  {formatCurrency(Math.abs(goalAnalysis.shortfall.median))} below goal
                </span>
              )}
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <div className="text-sm text-rose-700 mb-2">Downside Scenario</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(goalAnalysis.projectedValues.downside)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {goalAnalysis.shortfall.downside >= 0 ? (
                <span className="text-emerald-700 font-semibold">
                  +{formatCurrency(goalAnalysis.shortfall.downside)} above goal
                </span>
              ) : (
                <span className="text-rose-700 font-semibold">
                  {formatCurrency(Math.abs(goalAnalysis.shortfall.downside))} below goal
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Visual Comparison */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">Goal Target</span>
                <span className="font-semibold text-gray-900">{formatCurrency(goalAnalysis.goalAmount)}</span>
              </div>
              <div className="h-2 bg-gray-300 rounded-full" />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">Expected Value (Median)</span>
                <span className="font-semibold text-gray-900">{formatCurrency(goalAnalysis.projectedValues.median)}</span>
              </div>
              <div className="h-2 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full" style={{
                width: `${Math.min(100, (goalAnalysis.projectedValues.median / goalAnalysis.goalAmount) * 100)}%`
              }} />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Next Steps CTA */}
      <CollapsibleSection 
        title="Ready to Optimize Your Strategy?" 
        subtitle="Work with a Clockwise Capital strategist"
      >
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-6 text-white">
        <p className="text-teal-100 mb-4">
          Refine your portfolio and maximize your chances of reaching your goal.
        </p>
        <a
          href="https://clockwisecapital.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          Schedule a Consultation
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
        </div>
      </CollapsibleSection>
    </div>
  );
}
