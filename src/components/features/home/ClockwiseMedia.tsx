"use client";

import React from 'react';
import AnimatedSection from "../../ui/AnimatedSection";

const ClockwiseMedia = () => {
  return (
    <AnimatedSection animation="zoom-in" className="py-12 px-4 relative overflow-hidden text-[#1A3A5F]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-sans font-medium text-[#1A3A5F] mb-4">Clockwise Media</h2>
          <p className="text-base md:text-lg font-serif leading-relaxed max-w-3xl mx-auto text-gray-600">
            Check Out Our Latest News Appearances
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full mt-4"></div>
        </div>
        
        {/* Placeholder for image - replace with actual image path */}
        <div className="mt-8 flex justify-center">
          <div className="relative w-full max-w-3xl h-48 bg-[#1A3A5F]/10 rounded-lg overflow-hidden border border-[#1A3A5F]/20 shadow-sm">
            {/* Replace with actual image */}
            <div className="absolute inset-0 flex items-center justify-center text-[#1A3A5F] text-base">
              Media Image Placeholder
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <div className="bg-[#1A3A5F]/10 backdrop-blur-sm p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-[#1A3A5F]/20">
            <div className="aspect-video relative w-full mb-3 bg-[#1A3A5F]/20 rounded-md overflow-hidden">
              {/* Replace with actual video thumbnail */}
              <div className="absolute inset-0 flex items-center justify-center text-[#1A3A5F]">
                Video Thumbnail
              </div>
            </div>
            <h3 className="text-lg font-sans font-semibold text-[#1A3A5F] mb-2">Cakmak: Tech&apos;s rally takes away potential gains from 2025</h3>
          </div>
          
          <div className="bg-[#1A3A5F]/10 backdrop-blur-sm p-5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-[#1A3A5F]/20">
            <div className="aspect-video relative w-full mb-3 bg-[#1A3A5F]/20 rounded-md overflow-hidden">
              {/* Replace with actual video thumbnail */}
              <div className="absolute inset-0 flex items-center justify-center text-[#1A3A5F]">
                Video Thumbnail
              </div>
            </div>
            <h3 className="text-lg font-sans font-semibold text-[#1A3A5F] mb-2">Cakmak: Tech&apos;s rally takes away potential gains from 2025</h3>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ClockwiseMedia;
