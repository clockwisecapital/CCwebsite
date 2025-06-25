"use client";

import React from 'react';
import Link from 'next/link';
import Image from "next/image";
import AnimatedSection from "../../ui/AnimatedSection";

const ClockwisePortfolios = () => {
  return (
    <AnimatedSection animation="fade-right" className="py-16 px-4 relative bg-[#1A3A5F]/40">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Right-aligned layout with image on left */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left image */}
          <div className="lg:w-1/2">
            <div className="relative w-full h-[400px] bg-black/30 rounded-lg overflow-hidden border border-white/20 shadow-xl">
              {/* Replace with actual image */}
              <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1FAAA3]/20 to-transparent opacity-70"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold mb-2">Portfolios</div>
                      <div className="text-xl">Adaptive Strategy</div>
                      <div className="mt-4 text-sm">Portfolios Image Placeholder</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right content */}
          <div className="lg:w-1/2 text-left lg:text-right">
            <h2 className="text-2xl md:text-3xl font-sans font-medium text-white mb-4">Clockwise Portfolios</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-white to-[#1FAAA3] rounded-full mb-6 ml-0 lg:ml-auto"></div>
            <p className="text-base md:text-lg font-serif leading-relaxed text-gray-200 mb-8">
              Clockwise Adaptive Portfolios are broadly diversified ETF portfolios that rebalance monthly, dynamically adjusting to market conditions and cycles to align with investor risk preferences and goal time horizons.
            </p>
            
            {/* Cards in vertical layout */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
                <div className="flex items-start lg:flex-row-reverse">
                  <div className="bg-[#1FAAA3]/20 p-2 rounded-lg ml-0 mr-3 lg:ml-3 lg:mr-0 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="lg:text-right">
                    <h3 className="text-lg font-sans font-medium text-white mb-2">Broad Diversification</h3>
                    <p className="text-gray-200 font-serif text-sm">
                      Invests across global equities, bonds, and alternative assets using ETFs to enhance stability and growth.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
                <div className="flex items-start lg:flex-row-reverse">
                  <div className="bg-[#1FAAA3]/20 p-2 rounded-lg ml-0 mr-3 lg:ml-3 lg:mr-0 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="lg:text-right">
                    <h3 className="text-lg font-sans font-medium text-white mb-2">Monthly Rebalancing</h3>
                    <p className="text-gray-200 font-serif text-sm">
                      Actively adjusted to maintain alignment with market conditions, investor risk preferences, and time horizons.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
                <div className="flex items-start lg:flex-row-reverse">
                  <div className="bg-[#1FAAA3]/20 p-2 rounded-lg ml-0 mr-3 lg:ml-3 lg:mr-0 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="lg:text-right">
                    <h3 className="text-lg font-sans font-medium text-white mb-2">Goal-Oriented Strategy</h3>
                    <p className="text-gray-200 font-serif text-sm">
                      Designed to adapt to individual financial objectives, whether growth-focused or capital preservation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-start lg:justify-end">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                <Link 
                  href="/portfolio-finder" 
                  className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-[#1FAAA3] rounded-md overflow-hidden transition-all duration-300 hover:bg-[#1FAAA3]/80 hover:scale-105 shadow-md"
                >
                  <span className="relative z-10 flex items-center">
                    AI Portfolio Finder
                  </span>
                </Link>
                
                <Link 
                  href="/get-started" 
                  className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-transparent border border-white rounded-md overflow-hidden transition-all duration-300 hover:bg-white/10 hover:scale-105 shadow-sm"
                >
                  <span className="relative z-10 flex items-center">
                    Get Started
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ClockwisePortfolios;
