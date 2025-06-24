import React from 'react';
import Link from 'next/link';
import Image from "next/image";

const ClockwiseETF = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-white to-[#F5F7FA]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-sans font-semibold text-[#1A3A5F] mb-6">Clockwise ETF</h2>
          <p className="text-lg md:text-xl font-serif leading-relaxed max-w-4xl mx-auto text-gray-700">
            Clockwise's TIME ETF combines high-growth innovation investing with tactical hedging and dynamic sector rotation to capture upside, while managing downside risk in volatile markets.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full mt-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-start mb-4">
              <div className="bg-[#F5F7FA] p-3 rounded-lg mr-4">
                {/* Placeholder for image - replace with actual image path */}
                <div className="w-10 h-10 bg-[#1FAAA3] rounded-lg"></div>
              </div>
              <h3 className="text-xl font-sans font-semibold text-[#1A3A5F]">Market Cycle Awareness</h3>
            </div>
            <p className="text-gray-600 font-serif">
              Balances aggressive innovation exposure with tactical hedging based on macroeconomic signals.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-start mb-4">
              <div className="bg-[#F5F7FA] p-3 rounded-lg mr-4">
                {/* Placeholder for image - replace with actual image path */}
                <div className="w-10 h-10 bg-[#1FAAA3] rounded-lg"></div>
              </div>
              <h3 className="text-xl font-sans font-semibold text-[#1A3A5F]">Enhanced Risk-Adjusted Returns</h3>
            </div>
            <p className="text-gray-600 font-serif">
              Seeks to provide a smoother ride compared to pure innovation ETFs with high volatility.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-start mb-4">
              <div className="bg-[#F5F7FA] p-3 rounded-lg mr-4">
                {/* Placeholder for image - replace with actual image path */}
                <div className="w-10 h-10 bg-[#1FAAA3] rounded-lg"></div>
              </div>
              <h3 className="text-xl font-sans font-semibold text-[#1A3A5F]">Mitigating Drawdowns</h3>
            </div>
            <p className="text-gray-600 font-serif">
              Aims to limit downside risk while participating in long-term growth trends.
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4 sm:gap-8">
            <Link 
              href="/portfolio-finder" 
              className="group relative inline-flex items-center justify-center px-8 py-4 font-medium text-white bg-[#1FAAA3] rounded-lg overflow-hidden transition-all duration-300 hover:bg-[#1A3A5F] hover:scale-105 shadow-md"
            >
              <span className="relative z-10 flex items-center">
                AI Portfolio Finder
              </span>
            </Link>
            
            <Link 
              href="/get-started" 
              className="group relative inline-flex items-center justify-center px-8 py-4 font-medium text-[#1A3A5F] bg-white border border-[#1A3A5F] rounded-lg overflow-hidden transition-all duration-300 hover:bg-[#F5F7FA] hover:scale-105 shadow-sm"
            >
              <span className="relative z-10 flex items-center">
                Get Started
              </span>
            </Link>
          </div>
        </div>
        
        {/* Placeholder for image - replace with actual image path */}
        <div className="mt-16 flex justify-center">
          <div className="relative w-full max-w-4xl h-64 bg-[#F5F7FA] rounded-xl overflow-hidden">
            {/* Replace with actual image */}
            <div className="absolute inset-0 flex items-center justify-center text-[#1A3A5F] text-lg">
              ETF Image Placeholder
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClockwiseETF;
