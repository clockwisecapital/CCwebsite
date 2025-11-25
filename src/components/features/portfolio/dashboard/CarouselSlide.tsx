'use client';

import { ReactNode } from 'react';

interface CarouselSlideProps {
  children: ReactNode;
  isActive: boolean;
  direction: 'left' | 'right' | 'none';
}

export function CarouselSlide({ children, isActive, direction }: CarouselSlideProps) {
  const getTransformClass = () => {
    if (isActive) return 'opacity-100 translate-x-0 scale-100';
    if (direction === 'left') return 'opacity-0 -translate-x-12 scale-95 pointer-events-none';
    if (direction === 'right') return 'opacity-0 translate-x-12 scale-95 pointer-events-none';
    return 'opacity-0 scale-95 pointer-events-none';
  };

  return (
    <div 
      className={`absolute inset-0 p-6 overflow-y-auto transition-all duration-700 ease-out ${getTransformClass()}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4B5563 #1F2937',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #1F2937;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
      {children}
    </div>
  );
}

interface CarouselContainerProps {
  children: ReactNode;
  currentSlide: number;
  totalSlides: number;
  onSlideChange: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  nextButtonText?: string;
}

export function CarouselContainer({
  children,
  currentSlide,
  totalSlides,
  onSlideChange,
  onNext,
  onPrev,
  nextButtonText = 'Next'
}: CarouselContainerProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Slide Indicators (Dots) */}
      <div className="flex justify-center items-center gap-2 pt-6 pb-4">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onSlideChange(idx)}
            className={`h-2 rounded-full transition-all duration-500 ease-out hover:scale-110 ${
              currentSlide === idx 
                ? 'w-8 bg-teal-500 shadow-lg shadow-teal-500/50' 
                : 'w-2 bg-gray-600 hover:bg-gray-500'
            }`}
            style={{
              transitionProperty: 'width, background-color, transform, box-shadow',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Carousel Slides Container */}
      <div className="relative overflow-hidden" style={{ height: '70vh', maxHeight: '800px', minHeight: '500px' }}>
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-700/50 border-t border-gray-700">
        <button
          onClick={onPrev}
          disabled={currentSlide === 0}
          className="px-3 sm:px-4 py-2 text-gray-300 font-medium rounded-lg hover:bg-gray-700 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 ease-out flex items-center gap-1 sm:gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
          style={{
            transitionProperty: 'background-color, transform, opacity, box-shadow',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Back</span>
        </button>
        
        <div className="text-xs sm:text-sm text-gray-400 font-medium transition-all duration-300">
          {currentSlide + 1} / {totalSlides}
        </div>

        <button
          onClick={onNext}
          className="px-4 sm:px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-700 hover:to-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-out flex items-center gap-1 sm:gap-2 shadow-md text-sm sm:text-base"
          style={{
            transitionProperty: 'background, transform, box-shadow',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <span className="hidden sm:inline">{nextButtonText}</span>
          <span className="sm:hidden">Next</span>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
