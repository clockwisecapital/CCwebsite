"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Meteors } from "@/components/ui/meteors";
// Header is now in layout.tsx
import MissionSection from "@/components/features/home/MissionSection";
import InvestmentOptions from "@/components/features/home/InvestmentOptions";
import ClockwiseMedia from "@/components/features/home/ClockwiseMedia";
import GuidanceSection from "@/components/features/home/GuidanceSection";
import ClockwiseTeam from "@/components/features/home/ClockwiseTeam";
import ReviewsSection from "@/components/features/home/ReviewsSection";
import NavigatingTurbulentTimes from "@/components/features/home/NavigatingTurbulentTimes";
import EconomicExplainers from "@/components/features/home/EconomicExplainers";

// AnimatedText component removed as unused

export default function Home() {
  // State to track if component is mounted - for animations
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    setMounted(true);
    
    // Optional: Add scroll listener for parallax effect
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroImage = document.getElementById('hero-image');
      if (heroImage) {
        // Subtle parallax effect on scroll
        heroImage.style.transform = `translateY(${scrollY * 0.1}px)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="overflow-x-hidden">
      {/* Hero Banner Section with header integration */}
      <section className="relative min-h-[100vh] flex flex-col justify-start">

        {/* Header is now in layout.tsx */}
        
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            preload="auto"
            disablePictureInPicture
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: '100%', height: '100%', minHeight: '100%', minWidth: '100%' }}
          >
            <source src="/videos/herobgvideo1.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Darker overlay for better text contrast */}
          <div className="absolute inset-0 bg-black/60"></div>
          
          {/* Meteor animation overlay */}
          <Meteors 
            count={40}
            className="z-5"
          />
        </div>
        
        {/* Content with staggered animations - using full width container with minimal padding for header */}
        <div className="w-full text-center md:text-left z-10 relative px-4 sm:px-6 lg:px-8 pt-40 pb-20 transform transition-all duration-1000 ease-out translate-y-0 opacity-100">
          <div className="container mx-auto md:mx-0 md:pl-0 max-w-4xl">
          
          {/* AI-Powered Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-[#1FAAA3]/20 border border-[#1FAAA3]/50 backdrop-blur-sm transition-all duration-1000 delay-100 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <svg className="w-4 h-4 text-[#1FAAA3]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z"/>
              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/>
            </svg>
            <span className="text-[#1FAAA3] text-sm font-medium">AI-Powered Portfolio Analysis</span>
          </div>
          
          {/* Headline with animated text reveal */}
          <h1 
            style={{
              fontFamily: 'Inter, sans-serif', 
              fontWeight: 700,
              fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }} 
            className="mb-6 text-white overflow-visible max-w-none"
          >
            <div className="relative overflow-visible">
              <div 
                className={`transform transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
              >
                <div>Is Your Portfolio <br /><span className="text-[#1FAAA3]">Built for What&apos;s Next?</span></div>
              </div>
            </div>
          </h1>
          
          {/* Subtext */}
          <p className={`text-lg md:text-xl text-gray-200 mb-8 max-w-2xl transition-all duration-1000 delay-500 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            Get your free portfolio score in 60 seconds. See how you compare to cycle-optimized strategies — then talk to a fiduciary advisor about what to do next.
          </p>
          
          {/* Buttons with enhanced hover effects */}
          <div className={`flex flex-col sm:flex-row justify-center md:justify-start gap-4 mb-12 transition-all duration-1000 delay-700 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <button 
              onClick={() => router.push('/kronos')} 
              className="group relative overflow-hidden bg-[#1FAAA3] hover:bg-[#1FAAA3]/90 text-white font-sans font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
            >
              <span className="absolute top-0 left-0 w-full h-full transform -translate-x-full bg-white/10 skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
              <span className="relative flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Score My Portfolio</span>
              </span>
            </button>
            <a 
              href="https://calendly.com/clockwisecapital/appointments"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden bg-transparent hover:bg-white/10 text-white border-2 border-white font-sans font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 inline-block"
            >
              <span className="absolute top-0 left-0 w-full h-full transform -translate-x-full bg-white/5 skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
              <span className="relative flex items-center justify-center space-x-2">
                <span>Talk to an Advisor</span>
              </span>
            </a>
          </div>
          
          {/* Feature badges at bottom */}
          <div className={`flex flex-wrap justify-center md:justify-start gap-6 transition-all duration-1000 delay-900 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex items-center gap-2 text-white/90">
              <svg className="w-5 h-5 text-[#1FAAA3]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium">Fiduciary Advisors</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <svg className="w-5 h-5 text-[#1FAAA3]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium">Cycle-Optimized Strategies</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <svg className="w-5 h-5 text-[#1FAAA3]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"/>
              </svg>
              <span className="text-sm font-medium">AI + Human Guidance</span>
            </div>
          </div>
          
          </div>
        </div>
      </section>
      
      {/* Partners Section with dark aesthetic */}
      <section className="relative bg-[#0a1119] py-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            {/* Animated heading with reveal effect */}
            <div className="overflow-hidden">
              <h2 className="text-center text-gray-400 font-medium text-sm uppercase tracking-wider transform translate-y-0 opacity-100 transition-all duration-700 delay-300">
                <span className="relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-px after:bg-[#1FAAA3]/30 after:w-full">As Featured In</span>
              </h2>
            </div>
            
            {/* Partners text grid with staggered animations */}
            <div className="flex flex-wrap justify-center gap-8 lg:gap-12 mt-10">
              {/* Partner text representations */}
              {[
                { name: "CNBC", display: "CNBC" },
                { name: "Bloomberg", display: "Bloomberg" },
                { name: "Yahoo Finance", display: "Yahoo Finance" },
                { name: "Schwab Network", display: "Schwab Network" }
              ].map((partner, i) => (
                <div 
                  key={partner.name}
                  className="transform transition-all duration-500 hover:scale-110 flex items-center justify-center" 
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="relative flex items-center justify-center group">
                    <span className="text-gray-400 group-hover:text-white font-semibold text-lg md:text-xl transition-all duration-300">
                      {partner.display}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

       <NavigatingTurbulentTimes />
          <EconomicExplainers />

      {/* Portfolio Options & Guidance Section with dark background */}
      <div className="w-full">
        <InvestmentOptions />
        <GuidanceSection />
      </div>

      {/* Reviews Section with matching gray background */}
      <div className="w-full bg-[#E5E7EA]">
        <ReviewsSection />
      </div>

      {/* AI Chatbot Widget - now using Gleap, removed placeholder */}
      {/* Gleap is now integrated in the root layout and will appear on all pages */}

      {/* Media section */}
      <ClockwiseMedia />

      {/* Team Section */}
      <ClockwiseTeam />

      {/* Mission Section */}
      <MissionSection />
    </main>
  );
}
