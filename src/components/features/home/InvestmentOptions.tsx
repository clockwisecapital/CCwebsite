"use client";

import React, { useState } from 'react';

type InvestmentOption = {
  id: string;
  number: string;
  title: string;
  description: string;
};

const investmentOptions: InvestmentOption[] = [
  {
    id: 'etf',
    number: '01',
    title: 'Clockwise ETF',
    description: 'Clockwise ETF NYSE: TIME is an active managed hedged growth fund. TIME rebalances weekly to adapt to dynamic technology and economic cycles.'
  },
  {
    id: 'portfolios',
    number: '02',
    title: 'Clockwise Portfolios',
    description: 'Clockwise Adaptive Portfolios leverage AI & human experts to broadly diversify ETF portfolios that rebalance on a monthly basis to align with investors unique risk preferences and goal time horizons.'
  },
  {
    id: 'hedge-fund',
    number: '03',
    title: 'Clockwise Hedge Fund',
    description: 'Clockwise Hedge Fund incorporates a derivative options overlay strategy to complement its core focus on innovation investing, aiming to enhance returns, hedge risks, and generate income.'
  }
];

const InvestmentOptions = () => {
  const [openOption, setOpenOption] = useState<string | null>('etf'); // Default first one open

  const toggleOption = (id: string) => {
    setOpenOption(openOption === id ? null : id);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-10 lg:gap-16">
        {/* Left side - Title and image */}
        <div className="lg:w-2/5">
          <h2 className="text-3xl md:text-4xl font-sans font-semibold text-[#1A3A5F] mb-6">
            Why Clockwise?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] rounded-full mb-10"></div>
          
          {/* Circular image with icons similar to the reference */}
          <div className="relative mx-auto lg:mx-0 w-64 h-64 md:w-80 md:h-80">
            <div className="absolute inset-0 rounded-full bg-[#1A3A5F] flex items-center justify-center">
              <div className="w-3/5 h-3/5 relative">
                {/* Infinity-like symbol in teal */}
                <svg viewBox="0 0 100 60" className="w-full h-full text-[#1FAAA3]">
                  <path 
                    d="M30,30 C10,50 10,10 30,30 C50,50 90,50 70,30 C50,10 10,10 30,30 Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            
            {/* Circular icons around the main circle */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="#1A3A5F">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="absolute top-1/2 -right-5 -translate-y-1/2 w-16 h-16 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="#1A3A5F">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="#1A3A5F">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            
            <div className="absolute top-1/2 -left-5 -translate-y-1/2 w-16 h-16 bg-white rounded-full border border-gray-200 shadow-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="#1A3A5F">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Right side - Accordion */}
        <div className="lg:w-3/5">
          <div className="space-y-2">
            {investmentOptions.map((option) => (
              <div key={option.id} className="border-b border-gray-200">
                <button
                  onClick={() => toggleOption(option.id)}
                  className="w-full py-5 flex items-start justify-between text-left focus:outline-none"
                >
                  <div className="flex items-center">
                    <span className="text-[#1FAAA3] text-xl font-semibold mr-4">{option.number}.</span>
                    <h3 className="text-xl font-semibold text-[#1A3A5F]">{option.title}</h3>
                  </div>
                  <span className="text-gray-400">
                    {openOption === option.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </span>
                </button>
                
                {openOption === option.id && (
                  <div className="pb-5 pr-12">
                    <p className="text-gray-600 font-serif">{option.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestmentOptions;
