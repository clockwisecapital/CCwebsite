import React from 'react';
import Image from "next/image";

const ClockwisePartners = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-white to-[#F5F7FA]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-sans font-semibold text-[#1A3A5F] mb-6">Clockwise Partners</h2>
          <p className="text-lg md:text-xl font-serif leading-relaxed max-w-4xl mx-auto text-gray-700">
            Our growing network of wealth management partners.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full mt-6"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mt-12">
          {/* Partner logos with actual images */}
          {[
            { name: "Betterment", src: "/partners/Betterment.png" },
            { name: "Bloomberg", src: "/partners/Bloomberg.png" },
            { name: "Burney Investment", src: "/partners/Burney Investment.webp" },
            { name: "Sound Income Strategies", src: "/partners/Sound Income Strategies.png" },
            { name: "Tidal", src: "/partners/Tidal.png" },
            { name: "Charles Schwab", src: "/partners/charles schwab.png" }
          ].map((partner) => (
            <div 
              key={partner.name}
              className="aspect-square bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 p-6 flex items-center justify-center"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <Image 
                  src={partner.src}
                  alt={`${partner.name} logo`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-contain p-4"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClockwisePartners;
