"use client";

import React from 'react';
import Image from "next/image";
import AnimatedSection from "../../ui/AnimatedSection";

const ClockwisePartners = () => {
  return (
    <AnimatedSection animation="fade-up" className="py-16 px-4 bg-gradient-to-b from-white via-[#f5f7fa] to-[#1A3A5F] text-[#1A3A5F]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-sans font-semibold text-[#1A3A5F] mb-4">Clockwise Partners</h2>
          <p className="text-base md:text-lg font-serif leading-relaxed max-w-3xl mx-auto text-gray-600">
            Our growing network of wealth management partners.
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full mt-4"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-5 md:gap-6 mt-8">
          {/* Partner logos with actual images */}
          {[
            { name: "Betterment", src: "/partners/Betterment.png" },
            { name: "Bloomberg", src: "/partners/Bloomberg.png" },
            { name: "Burney Investment", src: "/partners/Burney Investment.webp" },
            { name: "Sound Income Strategies", src: "/partners/Sound Income Strategies.png" },
            { name: "Tidal", src: "/partners/Tidal.png" },
            { name: "Charles Schwab", src: "/partners/charles schwab.png" },
            { name: "CNBC", src: "/partners/cnbc.png" }
          ].map((partner) => (
            <div 
              key={partner.name}
              className="aspect-square bg-[#1A3A5F]/10 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-[#1A3A5F]/20 p-4 flex items-center justify-center"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <Image 
                  src={partner.src}
                  alt={`${partner.name} logo`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-contain p-2"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ClockwisePartners;
