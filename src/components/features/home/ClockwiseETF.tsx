"use client";

import React from 'react';
import Link from 'next/link';
import AnimatedSection from "../../ui/AnimatedSection";

const ClockwiseETF = () => {
  return (
    <AnimatedSection animation="fade-up" className="py-16 px-4 relative bg-[#1A3A5F]/40">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Left-aligned layout with image on right */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left content */}
          <div className="lg:w-1/2 text-left">
            <h2 className="text-2xl md:text-3xl font-sans font-medium text-white mb-4">Clockwise ETF</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-white to-[#1FAAA3] rounded-full mb-6"></div>
            <p className="text-base md:text-lg font-serif leading-relaxed text-gray-200 mb-8">
              Clockwise&apos;s TIME ETF combines high-growth innovation investing with tactical hedging and dynamic sector rotation to capture upside, while managing downside risk in volatile markets.
            </p>
            
            {/* Cards in vertical layout */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
                <div className="flex items-start">
                  <div className="bg-[#1FAAA3]/20 p-2 rounded-lg mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-sans font-medium text-white mb-2">Market Cycle Awareness</h3>
                    <p className="text-gray-200 font-serif text-sm">
                      Balances aggressive innovation exposure with tactical hedging based on macroeconomic signals.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
                <div className="flex items-start">
                  <div className="bg-[#1FAAA3]/20 p-2 rounded-lg mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-sans font-medium text-white mb-2">Enhanced Risk-Adjusted Returns</h3>
                    <p className="text-gray-200 font-serif text-sm">
                      Seeks to provide a smoother ride compared to pure innovation ETFs with high volatility.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
                <div className="flex items-start">
                  <div className="bg-[#1FAAA3]/20 p-2 rounded-lg mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-sans font-medium text-white mb-2">Mitigating Drawdowns</h3>
                    <p className="text-gray-200 font-serif text-sm">
                      Aims to limit downside risk while participating in long-term growth trends.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
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
          
          {/* Right image */}
          <div className="lg:w-1/2">
            <div className="relative w-full h-[400px] bg-black/30 rounded-lg overflow-hidden border border-white/20 shadow-xl">
              {/* Replace with actual image */}
              <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1FAAA3]/20 to-transparent opacity-70"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold mb-2">TIME</div>
                      <div className="text-xl">NYSE: TIME</div>
                      <div className="mt-4 text-sm">ETF Image Placeholder</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ClockwiseETF;
