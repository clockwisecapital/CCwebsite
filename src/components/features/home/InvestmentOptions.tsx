"use client";

import React from 'react';
import Card3D from '@/components/ui/Card3D';




type InvestmentOption = {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const investmentOptions: InvestmentOption[] = [
  {
    id: 'etf',
    number: '01',
    title: 'Clockwise Single\nETF Portfolio',
    description: 'Investment Minimum: <$50\n\n— Clockwise ETF NYSE: TIME is an active managed hedged growth fund. TIME rebalances daily to adapt to dynamic technology and economic cycles.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: 'portfolios',
    number: '02',
    title: 'Clockwise Diversified\nGrowth Portfolios',
    description: 'Investment Minimum: $50k+\n\n— Clockwise Adaptive Portfolios leverage AI & human experts to broadly diversify ETF portfolios for maximum risk-adjusted growth that rebalance on a monthly basis to align with investors\' unique risk preferences and goal time horizons.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    id: 'hedge-fund',
    number: '03',
    title: 'Clockwise Diversified\nIncome Portfolios',
    description: 'Investment Minimum: $50k+\n\n— Clockwise Adaptive Portfolios leverage AI & human experts to broadly diversify ETF portfolios for maximum risk-adjusted income that rebalance on a monthly basis to align with investors\' unique risk preferences and goal time horizons.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    )
  }
];

const InvestmentOptions = () => {



  return (
    <section className="py-16 relative overflow-hidden">
      {/* Dark blue gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1F35] via-[#1A3A5F] to-[#0A1F35] z-0" />
      
      {/* Subtle animated background patterns */}
      <div className="absolute inset-0 opacity-10 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/grid-pattern.svg')] bg-repeat opacity-5" />
        <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-[#1FAAA3] blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#E3B23C] blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-teal-300 uppercase tracking-wide mb-2">0% Management Fee Portfolios</p>
          <h2 className="text-3xl md:text-4xl font-sans font-medium text-white mb-4">
            Portfolio Options
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1FAAA3] to-[#E3B23C] rounded-full mx-auto mb-6"></div>
          <p className="text-white/70 max-w-2xl mx-auto">
            Explore our range of investment products designed to help you navigate economic and technology cycles with confidence.
          </p>
        </div>
        
        {/* 3D Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16">
          {investmentOptions.map((card) => (
            <div key={card.id} className="h-full perspective-1000 pb-8">
              <Card3D
                title={card.title}
                description={card.description}
                icon={card.icon}
                number={card.number}
                id={card.id}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InvestmentOptions;
