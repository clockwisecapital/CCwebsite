"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { Meteors } from "@/components/ui/meteors";
import Header from "@/components/layout/Header";
import MissionSection from "@/components/features/home/MissionSection";
import InvestmentOptions from "@/components/features/home/InvestmentOptions";
import ClockwiseETF from "@/components/features/home/ClockwiseETF";
import ClockwisePortfolios from "@/components/features/home/ClockwisePortfolios";
import ClockwiseHedgeFund from "@/components/features/home/ClockwiseHedgeFund";
import ClockwiseMedia from "@/components/features/home/ClockwiseMedia";
import ClockwisePartners from "@/components/features/home/ClockwisePartners";
import ClockwiseTeam from "@/components/features/home/ClockwiseTeam";

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
      <section className="relative min-h-[100vh] flex flex-col justify-center items-center">

        {/* Position header absolutely over hero */}
        <div className="absolute top-0 left-0 right-0 z-50">
          <Header />
        </div>
        
        {/* Hero Background Image with subtle motion */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: '#1A3A5F' }}>
          <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
            <Image 
              src="/homescreen/hero11.png" 
              alt="Clockwise Capital hero background" 
              priority
              fill
              sizes="100vw"
              className="transition-transform duration-700"
              style={{ 
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          </div>
          
          {/* Subtle dark overlay with gradient to enhance text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/20 to-black/30 z-10"></div>
          
          {/* Meteor animation overlay */}
          <Meteors 
            count={40}
            className="z-20"
          />
        </div>
        
        {/* Content with staggered animations - using full width container with padding for header */}
        <div className="w-full mx-auto text-center z-30 relative px-4 sm:px-6 lg:px-8 pt-24 transform transition-all duration-1000 ease-out translate-y-0 opacity-100">
          {/* Headline with animated text reveal on a single line */}
          <h1 
            style={{
              fontFamily: 'Inter, sans-serif', 
              fontWeight: 300,
              fontSize: 'clamp(2rem, 25vw, 5.5rem)',
              lineHeight: '0.9',
              letterSpacing: '0.02em'
            }} 
            className="mb-10 text-white overflow-visible max-w-none"
          >
            <div className="relative overflow-visible">
              <div 
                className={`transform transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}
                style={{ maxWidth: 'none', whiteSpace: 'nowrap' }}
              >
                Where Smart Investors Learn, Grow, and Plan
              </div>
            </div>
          </h1>
          
          {/* Animated line separator */}
          <div className="relative mx-auto max-w-xs mb-10">
            <div className={`h-px bg-gradient-to-r from-transparent via-white/80 to-transparent transition-all duration-1000 delay-1000 ${mounted ? 'w-full opacity-70' : 'w-0 opacity-0'}`}></div>
          </div>
          
          {/* Buttons with enhanced hover effects */}
          <div className={`flex flex-col sm:flex-row justify-center gap-6 mt-8 transition-all duration-1000 delay-1200 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Link href="#chatbot" className="group relative overflow-hidden bg-[#1FAAA3] text-white font-sans font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-300">
              {/* Button shine effect */}
              <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
              <span className="relative flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Ask Clockwise AI</span>
              </span>
            </Link>
            <Link href="/portfolio-rating" className="group relative overflow-hidden bg-transparent text-white border-2 border-white font-sans font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-300">
              <span className="absolute top-0 left-0 w-full h-full transform -translate-x-full bg-white/5 skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
              <span className="relative flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Rate My Portfolio</span>
              </span>
            </Link>
          </div>
          
          {/* Removed scroll indicator as it was disrupting button placement */}
        </div>
      </section>
      
      {/* As Seen On Section with animations */}
      <section className="relative bg-gradient-to-b from-[#F5F7FA] to-white py-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[5%] -right-[10%] w-96 h-96 bg-[#F5F7FA] rounded-full opacity-50"></div>
          <div className="absolute -bottom-[8%] -left-[5%] w-64 h-64 bg-[#F5F7FA] rounded-full opacity-50"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center">
            {/* Animated heading with reveal effect */}
            <div className="overflow-hidden">
              <h2 className="text-center text-gray-500 font-medium text-sm uppercase tracking-wider transform translate-y-0 opacity-100 transition-all duration-700 delay-300">
                <span className="relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-px after:bg-gray-300 after:w-full">As Seen On</span>
              </h2>
            </div>
            
            {/* Media logo grid with staggered animations */}
            <div className="w-full mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-10 items-center justify-items-center">
              {/* Media logo placeholders with hover effects */}
              {["w-24", "w-32", "w-28", "w-30", "w-36"].map((width, i) => (
                <div key={i} className="transform transition-all duration-500 hover:scale-110 opacity-80 hover:opacity-100" style={{ transitionDelay: `${i * 150}ms` }}>
                  <div className={`h-8 ${width} bg-gradient-to-r from-gray-200 to-gray-300 rounded-md shadow-sm group relative overflow-hidden`}>
                    {/* Logo shine effect on hover */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Mission Section */}
      <MissionSection />
      
      {/* Investment Options Section */}
      <InvestmentOptions />

      {/* AI Chatbot Widget - this will be a component */}
      <div id="chatbot" className="fixed bottom-4 right-4 z-50">
        {/* Placeholder for AI chatbot component */}
        <div className="bg-[#1A3A5F] text-white rounded-full p-4 shadow-lg cursor-pointer hover:bg-[#1FAAA3] transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
      </div>

      {/* Introduction Section with enhanced design */}
      <section className="py-20 bg-white overflow-hidden relative">
        {/* Subtle background elements */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#F5F7FA]/50 to-transparent"></div>
        <div className="absolute -right-24 top-40 w-96 h-96 rounded-full bg-[#1FAAA3]/5 blur-3xl"></div>
        <div className="absolute -left-20 bottom-20 w-72 h-72 rounded-full bg-[#1A3A5F]/5 blur-2xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto">
            {/* Section heading with reveal animation */}
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold text-[#1A3A5F] mb-6 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3]/90">
                  Navigate Economic Cycles
                </span>
                <span className="block mt-1">With Confidence</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 mb-8 font-serif leading-relaxed">
                Clockwise Capital helps smart investors understand where we are in economic and technology cycles, 
                positioning your portfolio for what&apos;s coming, not just what&apos;s happened.
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full"></div>
            </div>
            
            {/* Feature cards with hover effects */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mt-16">
              {[
                {
                  title: "Learn",
                  description: "Understand economic and technology cycles through our expert analysis.",
                  link: "/learn",
                  linkText: "Explore Resources",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )
                },
                {
                  title: "Grow",
                  description: "Discover investment strategies designed for today's market conditions.",
                  link: "/grow",
                  linkText: "View Strategies",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )
                },
                {
                  title: "Plan",
                  description: "Connect with advisors who understand cycle-aware investing.",
                  link: "/plan",
                  linkText: "Meet Our Team",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  )
                }
              ].map((feature) => (
                <div 
                  key={feature.title} 
                  className="group bg-gradient-to-br from-white to-[#F5F7FA] p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                >
                  <div className="text-[#1A3A5F] group-hover:text-[#1FAAA3] transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-sans font-semibold text-[#1A3A5F] mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-5 font-serif">{feature.description}</p>
                  <Link 
                    href={feature.link} 
                    className="inline-flex items-center text-[#1FAAA3] font-medium group-hover:text-[#1A3A5F] transition-colors duration-300"
                  >
                    <span>{feature.linkText}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Add the new sections */}
      <ClockwiseETF />
      <ClockwisePortfolios />
      <ClockwiseHedgeFund />
      <ClockwiseMedia />
      <ClockwisePartners />
      <ClockwiseTeam />
    </main>
  );
}
