import React from 'react';
import Image from "next/image";

const ClockwiseMedia = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#F5F7FA] to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-sans font-semibold text-[#1A3A5F] mb-6">Clockwise Media</h2>
          <p className="text-lg md:text-xl font-serif leading-relaxed max-w-4xl mx-auto text-gray-700">
            Check Out Our Latest News Appearances
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full mt-6"></div>
        </div>
        
        {/* Placeholder for image - replace with actual image path */}
        <div className="mt-8 flex justify-center">
          <div className="relative w-full max-w-4xl h-64 bg-[#F5F7FA] rounded-xl overflow-hidden">
            {/* Replace with actual image */}
            <div className="absolute inset-0 flex items-center justify-center text-[#1A3A5F] text-lg">
              Media Image Placeholder
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
            <div className="aspect-video relative w-full mb-4 bg-[#F5F7FA] rounded-lg overflow-hidden">
              {/* Replace with actual video thumbnail */}
              <div className="absolute inset-0 flex items-center justify-center text-[#1A3A5F]">
                Video Thumbnail
              </div>
            </div>
            <h3 className="text-xl font-sans font-semibold text-[#1A3A5F] mb-2">Cakmak: Tech's rally takes away potential gains from 2025</h3>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
            <div className="aspect-video relative w-full mb-4 bg-[#F5F7FA] rounded-lg overflow-hidden">
              {/* Replace with actual video thumbnail */}
              <div className="absolute inset-0 flex items-center justify-center text-[#1A3A5F]">
                Video Thumbnail
              </div>
            </div>
            <h3 className="text-xl font-sans font-semibold text-[#1A3A5F] mb-2">Cakmak: Tech's rally takes away potential gains from 2025</h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClockwiseMedia;
