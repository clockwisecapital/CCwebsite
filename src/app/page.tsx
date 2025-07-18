"use client";

import React, { useEffect, useState } from 'react';
import { openGleapChat } from '../utils/gleap';
import { Meteors } from "@/components/ui/meteors";
// Header is now in layout.tsx
import MissionSection from "@/components/features/home/MissionSection";
import InvestmentOptions from "@/components/features/home/InvestmentOptions";
import ClockwiseMedia from "@/components/features/home/ClockwiseMedia";
import AdvisorOptions from "@/components/features/home/AdvisorOptions";
import ClockwiseTeam from "@/components/features/home/ClockwiseTeam";
import ReviewsSection from "@/components/features/home/ReviewsSection";
import DisclosuresSection from "@/components/features/home/DisclosuresSection";
import NavigatingTurbulentTimes from "@/components/features/home/NavigatingTurbulentTimes";
import EconomicExplainers from "@/components/features/home/EconomicExplainers";
import TimedPopup from "@/components/ui/TimedPopup";

// AnimatedText component removed as unused

export default function Home() {
  // State to track if component is mounted - for animations
  const [mounted, setMounted] = useState(false);
  
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
          
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30"></div>
          
          {/* Meteor animation overlay */}
          <Meteors 
            count={40}
            className="z-5"
          />
        </div>
        
        {/* Content with staggered animations - using full width container with minimal padding for header */}
        <div className="w-full text-center md:text-left z-10 relative px-4 sm:px-6 lg:px-8 pt-40 transform transition-all duration-1000 ease-out translate-y-0 opacity-100">
          <div className="container mx-auto md:mx-0 md:pl-0">
          {/* Headline with animated text reveal on two lines */}
          <h1 
            style={{
              fontFamily: 'Inter, sans-serif', 
              fontWeight: 600,
              fontSize: 'clamp(2rem, 8vw, 5rem)',
              lineHeight: '1.1',
              letterSpacing: '0.02em'
            }} 
            className="mb-6 text-white overflow-visible max-w-none"
          >
            <div className="relative overflow-visible">
              <div 
                className={`transform transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
              >
                <div>Portfolios + Advisors <br />To Navigate Turbulent Times</div>
                <div className="text-lg md:text-2xl font-normal mt-4">0% Management Fee Portfolios • Freemium Advisor Options</div>
              </div>
            </div>
          </h1>
          
          {/* Animated line separator */}
          <div className="relative mx-auto md:mx-0 max-w-xs mb-6">
            <div className={`h-px bg-gradient-to-r from-white/80 via-white/80 to-transparent md:from-white/80 md:to-transparent transition-all duration-1000 delay-1000 ${mounted ? 'w-full opacity-70' : 'w-0 opacity-0'}`}></div>
          </div>
          
          {/* Buttons with enhanced hover effects */}
          <div className={`flex flex-col sm:flex-row justify-center md:justify-start gap-4 mt-6 transition-all duration-1000 delay-1200 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <button 
              onClick={openGleapChat} 
              className="group relative overflow-hidden bg-[#1FAAA3] text-white font-sans font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300"
            >
              <span className="absolute top-0 left-0 w-full h-full transform -translate-x-full bg-white/5 skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
              <span className="relative flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Ask Clockwise AI</span>
              </span>
            </button>
            <button onClick={openGleapChat} className="group relative overflow-hidden bg-transparent text-white border-2 border-white font-sans font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300">
              <span className="absolute top-0 left-0 w-full h-full transform -translate-x-full bg-white/5 skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
              <span className="relative flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Rate My Portfolio</span>
              </span>
            </button>
          </div>
          
          {/* Removed scroll indicator as it was disrupting button placement */}
          </div>
        </div>
      </section>
      
      {/* Partners Section with animations */}
      <section className="relative bg-gradient-to-b from-[#F5F7FA] to-white py-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[5%] -right-[10%] w-96 h-96 bg-[#F5F7FA] rounded-full opacity-50"></div>
          <div className="absolute -bottom-[8%] -left-[5%] w-64 h-64 bg-[#F5F7FA] rounded-full opacity-50"></div>
        </div>
        
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center">
            {/* Animated heading with reveal effect */}
            <div className="overflow-hidden">
              <h2 className="text-center text-gray-500 font-medium text-sm uppercase tracking-wider transform translate-y-0 opacity-100 transition-all duration-700 delay-300">
                <span className="relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-px after:bg-gray-300 after:w-full">As Seen On</span>
              </h2>
            </div>
            
            {/* Partners logo grid with staggered animations */}
            <div className="flex flex-wrap justify-center gap-6 lg:gap-8 mt-10">
              {/* Partner logos with actual images */}
              {[
                { name: "CNBC", src: "/partners/cnbc.png" },
                { name: "Bloomberg", src: "/partners/Bloomberg.png" },
                { name: "Yahoo Finance", src: "/partners/Yahoo-Finance.png" },
                { name: "Schwab TV", src: "/partners/charles schwab.png" }
              ].map((partner, i) => (
                <div 
                  key={partner.name}
                  className="transform transition-all duration-500 hover:scale-110 opacity-90 hover:opacity-100 w-36 sm:w-44 md:w-56 flex items-center justify-center" 
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="relative w-full h-full flex items-center justify-center group">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={partner.src}
                        alt={`${partner.name} logo`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

       <NavigatingTurbulentTimes />
          <EconomicExplainers />

      {/* Portfolio Optionss Section with matching gray background */}
      <div className="w-full bg-[#E5E7EA]">
        <InvestmentOptions />
        <AdvisorOptions />
        {/* Customer Reviews moved below advisor options */}
        <ReviewsSection />
      </div>

      {/* AI Chatbot Widget - now using Gleap, removed placeholder */}
      {/* Gleap is now integrated in the root layout and will appear on all pages */}

      {/* Timed help popup */}
      <TimedPopup />

      {/* Introduction Section removed completely to avoid white space */}

      {/* Media and Mission & Team sections */}
      <div className="w-full bg-[#E5E7EA]">
        <ClockwiseMedia />
      </div>

      {/* Mission Section */}
      <MissionSection />

      <ClockwiseTeam />

      {/* Disclosures */}
      <DisclosuresSection />
    </main>
  );
}
