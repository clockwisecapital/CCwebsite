"use client";

import React from 'react';
import Link from 'next/link';
import AnimatedSection from "../../ui/AnimatedSection";

const ClockwiseHedgeFund = () => {
  return (
    <AnimatedSection animation="fade-left" className="py-16 px-4 relative bg-[#1A3A5F]/40">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Centered header with zigzag layout below */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-sans font-medium text-white mb-4">Clockwise Hedge Fund</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-white to-[#1FAAA3] mx-auto rounded-full mb-6"></div>
          <p className="text-base md:text-lg font-serif leading-relaxed max-w-3xl mx-auto text-gray-200">
            Clockwise Hedge Fund employs a dynamic options overlay strategy, adaptive market positioning, and advanced risk management to capitalize on both daily market fluctuations and long-term technology and economic cycles. Available exclusively to qualified investors.
          </p>
        </div>
        
        {/* Image at the top */}
        <div className="mb-12 flex justify-center">
          <div className="relative w-full max-w-4xl h-64 bg-black/30 rounded-lg overflow-hidden border border-white/20 shadow-xl">
            {/* Replace with actual image */}
            <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1FAAA3]/20 to-transparent opacity-70"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">Hedge Fund</div>
                    <div className="text-xl">For Qualified Investors</div>
                    <div className="mt-4 text-sm">Hedge Fund Image Placeholder</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Zigzag cards layout */}
        <div className="space-y-8 md:space-y-12">
          {/* Card 1 - Left aligned */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-1/6 flex justify-center">
              <div className="bg-[#1FAAA3]/20 p-4 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="md:w-5/6 bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
              <h3 className="text-xl font-sans font-medium text-white mb-3">Dynamic Options Strategies</h3>
              <p className="text-gray-200 font-serif">
                Utilizes a variety of sophisticated options strategies to profit from daily market fluctuations and long-term macroeconomic trends. Our approach combines both defensive and offensive positions to capitalize on market volatility while maintaining strategic long-term exposure.
              </p>
            </div>
          </div>
          
          {/* Card 2 - Right aligned */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-6">
            <div className="md:w-1/6 flex justify-center">
              <div className="bg-[#1FAAA3]/20 p-4 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>
            <div className="md:w-5/6 bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
              <h3 className="text-xl font-sans font-medium text-white mb-3">Adaptive Market Positioning</h3>
              <p className="text-gray-200 font-serif">
                Continuously adjusts portfolio exposure based on real-time market conditions to maximize upside potential and mitigate risk. Our proprietary algorithms monitor hundreds of market signals to dynamically shift positioning as conditions evolve.
              </p>
            </div>
          </div>
          
          {/* Card 3 - Left aligned */}
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-1/6 flex justify-center">
              <div className="bg-[#1FAAA3]/20 p-4 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="md:w-5/6 bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
              <h3 className="text-xl font-sans font-medium text-white mb-3">Broad Market Cycle Awareness</h3>
              <p className="text-gray-200 font-serif">
                Leverages deep market cycle analysis to capture opportunities across bull, bear, and sideways markets. By understanding where we are in both economic and technology cycles, we position the fund to benefit from structural shifts while managing downside risk.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-3 sm:gap-6">
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
    </AnimatedSection>
  );
};

export default ClockwiseHedgeFund;
