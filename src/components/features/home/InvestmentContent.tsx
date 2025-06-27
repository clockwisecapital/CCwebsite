"use client";

import React from 'react';

// ETF Content
const ETFContent = () => {
  return (
    <div className="text-white max-w-4xl mx-auto bg-[#0A1F35] p-6 rounded-xl">
      {/* Header description */}
      <p className="text-base md:text-lg font-serif leading-relaxed text-gray-200 mb-10 px-4">
        Clockwise ETF (NYSE: TIME) is an actively managed hedged growth fund that rebalances weekly to adapt to dynamic technology and economic cycles, providing investors with a strategic approach to navigating market volatility.
      </p>
      
      {/* Image at the top */}
      <div className="mb-14 flex justify-center px-4">
        <div className="relative w-full max-w-3xl h-64 bg-[#0A1F35]/40 rounded-lg overflow-hidden border border-white/10 shadow-xl">
          <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1FAAA3]/30 to-[#0A1F35]/60 opacity-80"></div>
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
      
      {/* Zigzag cards layout */}
      <div className="space-y-10 md:space-y-16 px-4">
        {/* Card 1 - Left aligned */}
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="md:w-1/6 flex justify-center">
            <div className="bg-[#1FAAA3]/30 p-4 rounded-lg border border-[#1FAAA3]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="md:w-5/6 bg-[#0A1F35]/30 backdrop-blur-sm p-8 rounded-lg shadow-md border border-white/10">
            <h3 className="text-xl font-sans font-medium text-white mb-4">Active Management</h3>
            <p className="text-gray-200 font-serif leading-relaxed">
              Unlike passive index funds, TIME is actively managed by our team of experts who continuously analyze market conditions and make strategic adjustments to optimize performance across different market environments.
            </p>
          </div>
        </div>
        
        {/* Card 2 - Right aligned */}
        <div className="flex flex-col md:flex-row-reverse items-start gap-8">
          <div className="md:w-1/6 flex justify-center">
            <div className="bg-[#1FAAA3]/30 p-4 rounded-lg border border-[#1FAAA3]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="md:w-5/6 bg-[#0A1F35]/30 backdrop-blur-sm p-8 rounded-lg shadow-md border border-white/10">
            <h3 className="text-xl font-sans font-medium text-white mb-4">Weekly Rebalancing</h3>
            <p className="text-gray-200 font-serif leading-relaxed">
              Our proprietary algorithm evaluates market conditions on a weekly basis to rebalance the portfolio, ensuring optimal positioning as economic and technology cycles evolve.
            </p>
          </div>
        </div>
        
        {/* Card 3 - Left aligned */}
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="md:w-1/6 flex justify-center">
            <div className="bg-[#1FAAA3]/30 p-4 rounded-lg border border-[#1FAAA3]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
          <div className="md:w-5/6 bg-[#0A1F35]/30 backdrop-blur-sm p-8 rounded-lg shadow-md border border-white/10">
            <h3 className="text-xl font-sans font-medium text-white mb-4">Hedged Growth Strategy</h3>
            <p className="text-gray-200 font-serif leading-relaxed">
              TIME combines growth-oriented investments with strategic hedges to protect against downside risk, allowing investors to participate in market upside while limiting exposure during downturns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Portfolios Content
const PortfoliosContent = () => {
  return (
    <div className="text-white max-w-4xl mx-auto bg-[#0A1F35] p-6 rounded-xl">
      {/* Header description */}
      <p className="text-base md:text-lg font-serif leading-relaxed text-gray-200 mb-10 px-4">
        Clockwise Portfolios offer professionally managed investment strategies tailored to different risk profiles and market conditions, combining our cycle-aware approach with diversified asset allocation.
      </p>
      
      {/* Image at the top */}
      <div className="mb-14 flex justify-center px-4">
        <div className="relative w-full max-w-3xl h-64 bg-[#0A1F35]/40 rounded-lg overflow-hidden border border-white/10 shadow-xl">
          <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1FAAA3]/30 to-[#0A1F35]/60 opacity-80"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">Portfolios</div>
                  <div className="text-xl">Strategic Asset Allocation</div>
                  <div className="mt-4 text-sm">Portfolio Image Placeholder</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Zigzag cards layout */}
      <div className="space-y-10 md:space-y-16 px-4">
        {/* Card 1 - Left aligned */}
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="md:w-1/6 flex justify-center">
            <div className="bg-[#1FAAA3]/30 p-4 rounded-lg border border-[#1FAAA3]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="md:w-5/6 bg-[#0A1F35]/30 backdrop-blur-sm p-8 rounded-lg shadow-md border border-white/10">
            <h3 className="text-xl font-sans font-medium text-white mb-4">Institutional-Grade Diversification</h3>
            <p className="text-gray-200 font-serif leading-relaxed">
              Our portfolios provide access to institutional-quality diversification across asset classes, geographies, and sectors, previously available only to large institutional investors.
            </p>
          </div>
        </div>
        
        {/* Card 2 - Right aligned */}
        <div className="flex flex-col md:flex-row-reverse items-start gap-8">
          <div className="md:w-1/6 flex justify-center">
            <div className="bg-[#1FAAA3]/30 p-4 rounded-lg border border-[#1FAAA3]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="md:w-5/6 bg-[#0A1F35]/30 backdrop-blur-sm p-8 rounded-lg shadow-md border border-white/10">
            <h3 className="text-xl font-sans font-medium text-white mb-4">Risk-Calibrated Strategies</h3>
            <p className="text-gray-200 font-serif leading-relaxed">
              Choose from conservative, balanced, or growth-oriented portfolios, each calibrated to deliver optimal risk-adjusted returns based on your personal risk tolerance and investment timeline.
            </p>
          </div>
        </div>
        
        {/* Card 3 - Left aligned */}
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="md:w-1/6 flex justify-center">
            <div className="bg-[#1FAAA3]/30 p-4 rounded-lg border border-[#1FAAA3]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="md:w-5/6 bg-[#0A1F35]/30 backdrop-blur-sm p-8 rounded-lg shadow-md border border-white/10">
            <h3 className="text-xl font-sans font-medium text-white mb-4">Cycle-Aware Rebalancing</h3>
            <p className="text-gray-200 font-serif leading-relaxed">
              Our portfolios adapt to changing economic and technology cycles through strategic monthly rebalancing, ensuring your investments remain optimally positioned as market conditions evolve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hedge Fund Content
const HedgeFundContent = () => {
  return (
    <div className="text-white max-w-4xl mx-auto bg-[#0A1F35] p-6 rounded-xl">
      {/* Header description */}
      <p className="text-base md:text-lg font-serif leading-relaxed text-gray-200 mb-10 px-4">
        Clockwise Hedge Fund employs sophisticated options strategies and dynamic market positioning to generate alpha across all market conditions, leveraging our deep understanding of economic and technology cycles.
      </p>
      
      {/* Image at the top */}
      <div className="mb-14 flex justify-center px-4">
        <div className="relative w-full max-w-3xl h-64 bg-[#0A1F35]/40 rounded-lg overflow-hidden border border-white/10 shadow-xl">
          <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1FAAA3]/30 to-[#0A1F35]/60 opacity-80"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">Hedge Fund</div>
                  <div className="text-xl">Sophisticated Investment Strategies</div>
                  <div className="mt-4 text-sm">Hedge Fund Image Placeholder</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Zigzag cards layout */}
      <div className="space-y-10 md:space-y-16 px-4">
        {/* Card 1 - Left aligned */}
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="md:w-1/6 flex justify-center">
            <div className="bg-[#1FAAA3]/30 p-4 rounded-lg border border-[#1FAAA3]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="md:w-5/6 bg-[#0A1F35]/30 backdrop-blur-sm p-8 rounded-lg shadow-md border border-white/10">
            <h3 className="text-xl font-sans font-medium text-white mb-4">Dynamic Options Strategies</h3>
            <p className="text-gray-200 font-serif leading-relaxed">
              Utilizes a variety of sophisticated options strategies to profit from daily market fluctuations and long-term macroeconomic trends. Our approach combines both defensive and offensive positions to capitalize on market volatility while maintaining strategic long-term exposure.
            </p>
          </div>
        </div>
        
        {/* Card 2 - Right aligned */}
        <div className="flex flex-col md:flex-row-reverse items-start gap-8">
          <div className="md:w-1/6 flex justify-center">
            <div className="bg-[#1FAAA3]/30 p-4 rounded-lg border border-[#1FAAA3]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          <div className="md:w-5/6 bg-[#0A1F35]/30 backdrop-blur-sm p-8 rounded-lg shadow-md border border-white/10">
            <h3 className="text-xl font-sans font-medium text-white mb-4">Adaptive Market Positioning</h3>
            <p className="text-gray-200 font-serif leading-relaxed">
              Our fund dynamically adjusts market exposure based on proprietary cycle indicators, allowing us to take advantage of both bullish and bearish market conditions through strategic positioning.
            </p>
          </div>
        </div>
        
        {/* Card 3 - Left aligned */}
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="md:w-1/6 flex justify-center">
            <div className="bg-[#1FAAA3]/30 p-4 rounded-lg border border-[#1FAAA3]/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1FAAA3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="md:w-5/6 bg-[#0A1F35]/30 backdrop-blur-sm p-8 rounded-lg shadow-md border border-white/10">
            <h3 className="text-xl font-sans font-medium text-white mb-4">Advanced Risk Management</h3>
            <p className="text-gray-200 font-serif leading-relaxed">
              Our sophisticated risk management framework employs multiple layers of protection, including position sizing, correlation analysis, and strategic hedging to protect capital during market downturns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export a component that renders the appropriate content based on the investment type
interface InvestmentContentProps {
  type: 'etf' | 'portfolios' | 'hedge-fund';
}

const InvestmentContent: React.FC<InvestmentContentProps> = ({ type }) => {
  switch (type) {
    case 'etf':
      return <ETFContent />;
    case 'portfolios':
      return <PortfoliosContent />;
    case 'hedge-fund':
      return <HedgeFundContent />;
    default:
      return <div>Content not found</div>;
  }
};

export default InvestmentContent;
