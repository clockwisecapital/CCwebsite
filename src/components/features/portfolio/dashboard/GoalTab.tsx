'use client';

import type { GoalAnalysis } from '@/types/cycleAnalysis';
import CollapsibleSection from './CollapsibleSection';

interface GoalTabProps {
  goalAnalysis: GoalAnalysis;
  onNext?: () => void;
}

export default function GoalTab({ goalAnalysis, onNext }: GoalTabProps) {

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
    <div className="space-y-6 md:space-y-8">
      {/* Slider Input */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm">
        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-3 md:mb-4">
          Your Answer
        </label>
        <div className="flex items-center gap-2 md:gap-4 mb-3">
          <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap flex-shrink-0">Nice-to-have</span>
          <input
            type="range"
            min="1"
            max="10"
            defaultValue="5"
            className="flex-1 h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer accent-teal-600 min-w-0"
          />
          <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap flex-shrink-0">Critical</span>
        </div>
        <div className="flex justify-between text-[10px] md:text-xs text-gray-500 px-1 md:px-2">
          {[1,2,3,4,5,6,7,8,9,10].map(n => <span key={n} className="w-6 text-center">{n}</span>)}
        </div>
      </div>

      {/* Next Button */}
      {onNext && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm md:text-base font-semibold rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Next: Portfolio Analysis
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Talk to Advisor Button */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-4 md:p-6 text-white">
        <p className="text-sm md:text-base text-teal-100 mb-3 md:mb-4">
          Want personalized guidance? Work with a Clockwise Approved Advisor.
        </p>
        <a
          href="https://clockwisecapital.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white text-teal-600 text-sm md:text-base font-semibold rounded-lg hover:bg-gray-100 transition-colors w-full md:w-auto"
        >
          Talk to an Advisor
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* Goal Overview - Additional Details */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200">
        <div className="text-2xl font-bold text-primary-blue mb-4">Your Financial Goal Details</div>
        
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
