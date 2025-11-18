'use client';

import { useState, useEffect } from 'react';
import type { PortfolioSimulation } from '@/types/cycleAnalysis';
import { CarouselContainer, CarouselSlide } from './CarouselSlide';

interface PortfolioTabProps {
  portfolioAnalysis: {
    current: PortfolioSimulation;
  };
  onBack?: () => void;
  onNext?: () => void;
  onSlideChange?: (slide: number) => void;
}

export default function PortfolioTab({ portfolioAnalysis, onBack, onNext, onSlideChange }: PortfolioTabProps) {
  // Carousel state: 0 = Portfolio Analysis
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Notify parent when slide changes for video sync
  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(currentSlide);
    }
  }, [currentSlide, onSlideChange]);

  const overallResult = portfolioAnalysis.current.overall;

  const handleNextSlide = () => {
    if (onNext) {
      // Navigate to Analysis Tab (skipping Market Tab)
      onNext();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else if (onBack) {
      // First slide - go back to previous tab
      onBack();
    }
  };

  const getSlideDirection = (slideIndex: number): 'left' | 'right' | 'none' => {
    if (slideIndex === currentSlide) return 'none';
    return slideIndex < currentSlide ? 'left' : 'right';
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
            <div className="text-sm md:text-lg font-bold text-blue-300 mb-1 md:mb-2">Portfolio Recommendation</div>
            <p className="text-xs md:text-base text-gray-300 leading-relaxed">
              Your portfolio shows a {formatPercent(overallResult.expectedReturn)} median expected return with {overallResult.confidence} confidence. Given the current market conditions and cycle positioning, we recommend {overallResult.expectedReturn > 0.15 ? 'maintaining your current allocation while monitoring for rebalancing opportunities' : 'reviewing your risk exposure and considering strategic adjustments'}.
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
        nextButtonText='Complete Analysis'
      >
        {/* SLIDE 1: Portfolio Performance Analysis */}
        <CarouselSlide isActive={currentSlide === 0} direction={getSlideDirection(0)}>
          <h2 className="text-xl md:text-2xl font-bold text-gray-100 mb-4">Portfolio Performance Analysis</h2>
          <p className="text-sm text-gray-400 mb-6">
            Monte Carlo simulation across all economic cycles
          </p>

          {/* Total Portfolio Value */}
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-700 mb-6">
            <div className="text-sm text-gray-400 mb-1">Total Portfolio Value</div>
            <div className="text-3xl md:text-4xl font-bold text-blue-400">
              {formatCurrency(portfolioAnalysis.current.totalValue)}
            </div>
          </div>

        {/* Overall Expected Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="text-sm text-gray-400 mb-1">Expected Return</div>
            <div className="text-3xl font-bold text-gray-100">
              {formatPercent(overallResult.expectedReturn)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Median (50th percentile)</div>
            <div className="text-xs text-teal-600 mt-2 font-medium">
              Confidence: {overallResult.confidence}
            </div>
          </div>

          <div className="bg-emerald-900/20 border border-emerald-800 rounded-lg p-4">
            <div className="text-sm text-emerald-400 mb-1">Expected Upside</div>
            <div className="text-3xl font-bold text-gray-100">
              {formatPercent(overallResult.expectedUpside)}
            </div>
            <div className="text-xs text-gray-600 mt-1">95th percentile</div>
            <div className="text-xs text-gray-400 mt-2">
              Value: {formatCurrency(portfolioAnalysis.current.totalValue * (1 + overallResult.expectedUpside))}
            </div>
          </div>

          <div className="bg-rose-900/10 border border-rose-900/30 rounded-lg p-4">
            <div className="text-sm text-rose-300 mb-1">Expected Downside</div>
            <div className="text-3xl font-bold text-gray-100">
              {formatPercent(overallResult.expectedDownside)}
            </div>
            <div className="text-xs text-gray-400 mt-1">5th percentile</div>
            <div className="text-xs text-gray-400 mt-2">
              Value: {formatCurrency(portfolioAnalysis.current.totalValue * (1 + overallResult.expectedDownside))}
            </div>
          </div>
        </div>
        </CarouselSlide>
      </CarouselContainer>

      {/* SECTION 3: Next Steps - Always Visible */}
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
