"use client";

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import AnimatedSection from '@/components/ui/AnimatedSection';

const MissionSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Ensure video plays when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Video play failed:", error);
      });
    }
  }, []);
  return (
    <section id="mission" className="py-16 relative overflow-hidden min-h-[70vh]">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video 
          ref={videoRef}
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          disablePictureInPicture
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: '100%', height: '100%', minHeight: '100%', minWidth: '100%' }}
        >
          <source src="/videos/social_u9354481378_Clean_professional_background_soft_gradient_from__a9f2991d-ff61-4db2-8864-2f69e4f87a8c_0.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Tint Overlay - Increased opacity for better text contrast */}
        <div className="absolute inset-0 bg-black opacity-70 z-10"></div>
      </div>
      
      {/* Content with proper z-index to appear above video */}
      <div className="relative z-20 container mx-auto px-4">
        <AnimatedSection animation="fade-up">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-sans font-medium text-white mb-4">Our Mission</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-white to-[#1FAAA3] mx-auto rounded-full mb-6"></div>
          </div>
          
          <div className="space-y-5 max-w-3xl mx-auto text-gray-100">
            <p className="text-base md:text-lg font-serif leading-relaxed">
              Over the last 500 years the Scientific Revolution took us to space, mapped the human genome and created super intelligence, but still limits humanity to a world of scarcity. In this world resources are limited and inefficiently distributed; as a result predictable cycles of boom and bust recur over and over. Clockwise leverages experts, data and machine learning to map these cycles.
            </p>

            <p className="text-base md:text-lg font-serif leading-relaxed">
              Our mission is to connect people with Portfolios and Advisors uniquely designed to navigate the exponential pace of change.</p>
            
            
          </div>
          
          {/* eBook Download CTA */}
          <div className="mt-10 text-center">
            <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-lg p-5 inline-block">
              <div 
                className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-[#1FAAA3] rounded-md overflow-hidden transition-all duration-300 hover:bg-[#1FAAA3]/80 hover:scale-105 shadow-md"
              >
                <span className="relative z-10 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Ebook: Coming Soon
                </span>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default MissionSection;
