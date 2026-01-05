"use client";

import React from 'react';
import Link from 'next/link';

interface GuidanceOption {
  id: string;
  level: string;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  badge?: string;
  buttonText: string;
  buttonLink: string;
  buttonVariant: 'primary' | 'secondary';
}

const guidanceOptions: GuidanceOption[] = [
  {
    id: 'self-guided',
    level: 'SELF-GUIDED',
    title: 'Kronos AI',
    description: 'Educational insights and portfolio analysis powered by AI',
    features: [
      'Portfolio scoring & analysis',
      'Market cycle education',
      'Strategy recommendations'
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    buttonText: 'Try Kronos Free',
    buttonLink: '/kronos',
    buttonVariant: 'primary'
  },
  {
    id: 'coached',
    level: 'COACHED',
    title: 'Portfolio Builder',
    description: 'Human advisor support for straightforward financial situations.',
    features: [
      'Everything in Self-Guided',
      'Dedicated fiduciary advisor',
      'Cash flow planning',
      'Quarterly reviews'
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    buttonText: 'Schedule a Call',
    buttonLink: 'https://calendly.com/clockwisecapital/appointments',
    buttonVariant: 'secondary'
  },
  {
    id: 'full-service',
    level: 'FULL SERVICE',
    title: 'Wealth Optimizer',
    description: 'Comprehensive planning for complex financial situations.',
    features: [
      'Everything in Coached',
      'Tax optimization strategies',
      'Estate & legacy planning',
      'Risk & insurance review'
    ],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    buttonText: 'Schedule a Call',
    buttonLink: 'https://calendly.com/clockwisecapital/appointments',
    buttonVariant: 'secondary'
  }
];

const GuidanceSection = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[#0a1119]">
      {/* Subtle animated background patterns */}
      <div className="absolute inset-0 opacity-10 z-0">
        <div className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full bg-[#1FAAA3] blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-[#1FAAA3] blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-[#1FAAA3] uppercase tracking-wide mb-3 text-sm font-medium">Guidance</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Choose Your Level of Support
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            From self-directed to full-service — get the guidance that fits your situation.
          </p>
        </div>
        
        {/* Guidance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {guidanceOptions.map((option) => (
            <div key={option.id} className="h-full">
              <div 
                className={`
                  relative h-full rounded-xl overflow-hidden backdrop-blur-md
                  bg-gradient-to-br from-[#0D1B28]/80 to-[#051219]/80 border border-[#1FAAA3]/20
                  transition-all duration-500 ease-out
                  group p-8 w-full mx-auto hover:border-[#1FAAA3]/50
                  shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-[#1FAAA3]/30
                  hover:scale-105 hover:-translate-y-1
                  flex flex-col h-full
                `}
              >
                {/* Glow effect on hover */}
                <div 
                  className={`
                    absolute inset-0 bg-gradient-to-br from-[#1FAAA3]/10 via-transparent to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-xl
                  `}
                />
                
                {/* Card content */}
                <div className="relative z-10 h-full flex flex-col">
                  {/* Icon - centered and larger */}
                  {option.icon && (
                    <div className="mb-8 text-[#1FAAA3] flex justify-center group-hover:scale-125 transition-transform duration-300">
                      <div className="w-16 h-16 flex items-center justify-center">
                        {option.icon}
                      </div>
                    </div>
                  )}
                  
                  {/* Level badge */}
                  <div className="mb-4 text-center">
                    <span className="text-[#1FAAA3] text-xs font-bold uppercase tracking-wider">
                      {option.level}
                    </span>
                  </div>

                  {/* Title - larger and bolder */}
                  <h3 className="text-3xl font-bold text-white mb-4 text-center group-hover:text-[#E3B23C] transition-colors duration-300">
                    {option.title}
                  </h3>
                  
                  {/* Description - centered */}
                  <p className="text-white/70 text-sm font-light mb-8 text-center leading-relaxed flex-grow">
                    {option.description}
                  </p>
                  
                  {/* Features list - compact and centered */}
                  <ul className="space-y-2 flex-grow mb-8">
                    {option.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center justify-center gap-2 text-white/80 text-xs">
                        <svg className="w-4 h-4 text-[#1FAAA3] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA Button */}
                  <Link 
                    href={option.buttonLink}
                    target={option.buttonLink.startsWith('http') ? '_blank' : undefined}
                    rel={option.buttonLink.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`
                      w-full py-3 px-4 rounded-lg font-semibold text-center transition-all duration-300
                      flex items-center justify-center gap-2 group/btn text-sm
                      ${option.buttonVariant === 'primary' 
                        ? 'bg-[#1FAAA3] hover:bg-[#1FAAA3]/90 text-white hover:shadow-lg hover:shadow-[#1FAAA3]/40' 
                        : 'bg-white/10 hover:bg-white/20 text-[#1FAAA3] border border-[#1FAAA3]/30 hover:border-[#1FAAA3]/60'
                      }
                    `}
                  >
                    <span>{option.buttonText}</span>
                    <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GuidanceSection;

