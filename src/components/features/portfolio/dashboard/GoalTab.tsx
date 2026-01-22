'use client';

import { useState, useEffect } from 'react';
import type { GoalAnalysis } from '@/types/cycleAnalysis';
import { CarouselContainer, CarouselSlide } from './CarouselSlide';

interface GoalTabProps {
  goalAnalysis: GoalAnalysis;
  onNext?: () => void;
  onBack?: () => void;
  onSlideChange?: (slide: number) => void;
  showFinishAccount?: boolean;
  onFinishAccountClick?: () => void;
}

export default function GoalTab({ goalAnalysis, onNext, onBack, onSlideChange, showFinishAccount, onFinishAccountClick }: GoalTabProps) {
  // NOTE: Goal probability calculations now use:
  // - Monte Carlo simulations (10,000 iterations)
  // - Long-term historical averages: Stocks 10%, Bonds 5%, Real Estate 10%, Commodities 5%, Cash 3%
  // - Formula: Probability Success = Monte Carlo (Asset Allocation × Long-Term Averages)
  
  // Carousel state: 0 = Probability, 1 = Projected Values
  const [currentSlide, setCurrentSlide] = useState(0);

  // Notify parent when slide changes for video sync
  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(currentSlide);
    }
  }, [currentSlide, onSlideChange]);


  const handleNextSlide = () => {
    // Only one slide now - go directly to Portfolio Tab
    if (onNext) {
      onNext();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else if (onBack) {
      // First slide - go back to previous tab (Intake)
      onBack();
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

  const getSlideDirection = (slideIndex: number): 'left' | 'right' | 'none' => {
    if (slideIndex === currentSlide) return 'none';
    return slideIndex < currentSlide ? 'left' : 'right';
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* SECTION 1: Kronos Recommendation - Always Visible */}
      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-4 md:p-6 border border-blue-800 shadow-sm">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm md:text-lg font-bold text-blue-300 mb-1 md:mb-2">Kronos Recommendation</div>
            <p className="text-xs md:text-base text-gray-300 leading-relaxed">
              {goalAnalysis.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Carousel - PowerPoint Style Slides */}
      <CarouselContainer
        currentSlide={currentSlide}
        totalSlides={1}
        onSlideChange={setCurrentSlide}
        onNext={handleNextSlide}
        onPrev={handlePrevSlide}
        nextButtonText="Go to Portfolio Analysis"
        showFinishAccount={showFinishAccount}
        onFinishAccountClick={onFinishAccountClick}
      >
        {/* SLIDE 1: Probability of Reaching Your Goal */}
        <CarouselSlide isActive={currentSlide === 0} direction={getSlideDirection(0)}>
          <h2 className="text-xl md:text-2xl font-bold text-gray-100 mb-4">Probability of Reaching Your Goal</h2>
          <p className="text-sm text-gray-400 mb-6">Based on Monte Carlo simulations using nominal returns</p>
          
          {/* Main Probability Display */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-gray-100 mb-4">
              You hit your goal {formatPercent(goalAnalysis.probabilityOfSuccess.median)} of the time
            </div>
            <div className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-${medianColor}-100 text-${medianColor}-800`}>
              {getStatusText(goalAnalysis.probabilityOfSuccess.median)} Probability
            </div>
          </div>

          {/* COMMENTED OUT: Probability Scenario Cards */}
          {/* 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 text-center">
              <div className="text-xs text-gray-300 mb-2 h-auto sm:h-8 flex items-center justify-center">Bull Scenario</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                {formatPercent(goalAnalysis.probabilityOfSuccess.upside)}
              </div>
              <div className="text-xs text-gray-400 mt-1">95th percentile</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 text-center">
              <div className="text-xs text-gray-300 mb-2 h-auto sm:h-8 flex items-center justify-center">Expected Scenario</div>
              <div className={`text-2xl sm:text-3xl font-bold text-${medianColor}-600`}>
                {formatPercent(goalAnalysis.probabilityOfSuccess.median)}
              </div>
              <div className="text-xs text-gray-400 mt-1">50th percentile</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 text-center">
              <div className="text-xs text-gray-300 mb-2 h-auto sm:h-8 flex items-center justify-center">Bear Scenario</div>
              <div className="text-2xl sm:text-3xl font-bold text-rose-600">
                {formatPercent(goalAnalysis.probabilityOfSuccess.downside)}
              </div>
              <div className="text-xs text-gray-400 mt-1">5th percentile</div>
            </div>
          </div>
          */}
        </div>

        {/* Visual Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Goal Achievement Range</span>
            <span className="text-sm text-gray-400">
              {formatPercent(goalAnalysis.probabilityOfSuccess.downside)} - {formatPercent(goalAnalysis.probabilityOfSuccess.upside)}
            </span>
          </div>
          <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${goalAnalysis.probabilityOfSuccess.median * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {formatPercent(goalAnalysis.probabilityOfSuccess.median)} Probability
            </div>
          </div>
        </div>
        </CarouselSlide>

        {/* COMMENTED OUT: SLIDE 2 - Projected Portfolio Values */}
        {/*
        <CarouselSlide isActive={currentSlide === 1} direction={getSlideDirection(1)}>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-100 mb-4">Projected Portfolio Values</h2>
          <p className="text-sm text-gray-400 mb-6">
            Estimated portfolio value in {goalAnalysis.timeHorizon} {goalAnalysis.timeHorizon === 1 ? 'year' : 'years'}
          </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-3 sm:p-4">
            <div className="text-sm text-emerald-700 mb-2 h-auto sm:h-10 flex items-start">Bull Scenario</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-100">
              {formatCurrency(goalAnalysis.projectedValues.upside)}
            </div>
            <div className="text-xs text-gray-400 mt-2">
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

          <div className={`bg-${medianColor}-50 border border-${medianColor}-200 rounded-lg p-3 sm:p-4`}>
            <div className={`text-sm text-${medianColor}-800 mb-2 font-semibold h-auto sm:h-10 flex items-start`}>Expected Scenario</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatCurrency(goalAnalysis.projectedValues.median)}
            </div>
            <div className="text-xs mt-2">
              {goalAnalysis.shortfall.median >= 0 ? (
                <span className="text-emerald-800 font-semibold">
                  +{formatCurrency(goalAnalysis.shortfall.median)} above goal
                </span>
              ) : (
                <span className="text-rose-800 font-semibold">
                  {formatCurrency(Math.abs(goalAnalysis.shortfall.median))} below goal
                </span>
              )}
            </div>
          </div>

          <div className="bg-rose-900/20 border border-rose-800 rounded-lg p-3 sm:p-4">
            <div className="text-sm text-rose-700 mb-2 h-auto sm:h-10 flex items-start">Bear Scenario</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-100">
              {formatCurrency(goalAnalysis.projectedValues.downside)}
            </div>
            <div className="text-xs text-gray-400 mt-2">
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

        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-700">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-300">Goal Target</span>
                <span className="font-semibold text-gray-100">{formatCurrency(goalAnalysis.goalAmount)}</span>
              </div>
              <div className="h-2 bg-gray-600 rounded-full" />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-300">Expected Value (Median)</span>
                <span className="font-semibold text-gray-100">{formatCurrency(goalAnalysis.projectedValues.median)}</span>
              </div>
              <div className="h-2 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full" style={{
                width: `${Math.min(100, (goalAnalysis.projectedValues.median / goalAnalysis.goalAmount) * 100)}%`
              }} />
            </div>
          </div>
        </div>
        </CarouselSlide>
        */}
      </CarouselContainer>

      {/* SECTION 3: Your Financial Goal Details - Always Visible */}
      <div className="bg-gradient-to-r from-teal-900/20 to-blue-900/20 rounded-lg p-6 border border-teal-800">
        <div className="text-2xl font-bold text-white mb-4">Your Financial Goal Details</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Goal Amount</div>
            <div className="text-2xl font-bold text-gray-100">
              {formatCurrency(goalAnalysis.goalAmount)}
            </div>
            <div className="text-xs text-gray-400 mt-1">{goalAnalysis.goalDescription}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Current Portfolio</div>
            <div className="text-2xl font-bold text-gray-100">
              {formatCurrency(goalAnalysis.currentAmount)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Starting Value</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Monthly Contribution</div>
            <div className="text-2xl font-bold text-gray-100">
              {goalAnalysis.monthlyContribution ? formatCurrency(goalAnalysis.monthlyContribution) : '$0'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Over {goalAnalysis.timeHorizon} {goalAnalysis.timeHorizon === 1 ? 'year' : 'years'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Next Step CTA - Always Visible */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-4 md:p-6 text-white">
        <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Next Step</h3>
        <p className="text-sm md:text-base text-teal-100 mb-4 md:mb-6">
          Work 1:1 with a strategist to optimize allocations for the current cycle.
        </p>
        <div className="flex justify-center">
          <a
            href="https://calendly.com/clockwisecapital/appointments"
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
