import React from 'react';
import Link from 'next/link';

const MissionSection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#F5F7FA] to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-sans font-semibold text-[#1A3A5F] mb-6">Our Mission</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full mb-10"></div>
        </div>
        
        <div className="space-y-8 max-w-4xl mx-auto text-gray-700">
          <p className="text-lg md:text-xl font-serif leading-relaxed">
            Over the last 500 years the Scientific Revolution took us to space, mapped the human genome and created super intelligence, but still limits humanity to a world of scarcity. In this world resources are limited and inefficiently distributed, as a result predictable cycles of boom and bust recur over and over. Clockwise leverages experts, data and machine learning to map these cycles.
          </p>
          
          <p className="text-lg md:text-xl font-serif leading-relaxed">
            If done right, AI will be like having a billion Einstein's in every area of science, capable of modeling, predicting, and creating an unimaginable world of abundance. Can we navigate to a new world, or does the cycle repeat?
          </p>
          
          <p className="text-lg md:text-xl font-serif leading-relaxed">
            Clockwise mission is to connect people with Advisors and Portfolios uniquely designed to navigate the awesome pace of exponential change.
          </p>
        </div>
        
        {/* eBook Download CTA */}
        <div className="mt-14 text-center">
          <div className="bg-white shadow-md rounded-xl p-8 inline-block">
            <Link 
              href="#download-ebook" // This will need to be updated later with actual functionality
              className="group relative inline-flex items-center justify-center px-8 py-4 font-medium text-white bg-[#1FAAA3] rounded-lg overflow-hidden transition-all duration-300 hover:bg-[#1A3A5F] hover:scale-105 shadow-md"
            >
              <span className="relative z-10 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download EBook: TIME Investing on the Edge of Abundance and Collapse
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
