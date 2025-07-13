'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { openGleapChat } from '@/utils/gleap';

export default function Header(): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    

    
    return () => {
      window.removeEventListener('scroll', handleScroll);

    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header 
      className={`w-full transition-all duration-300 fixed top-0 left-0 right-0 z-[9999] ${scrolled ? 
        'bg-black/30 backdrop-blur-md py-2' : 
        'bg-transparent py-4'}`}
    >
      <div className="container mx-auto max-w-[98%] mt-1 rounded-full flex items-center justify-between px-6 sm:px-8 md:px-10 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center group" aria-label="Clockwise Capital home">
          <div className="relative flex items-center transition-all duration-300 transform group-hover:scale-105">
            {/* Glow effect on hover */}
            <span className="absolute -inset-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 blur-lg transition-all duration-300"></span>
            <span className="relative z-10">
              <Image
                src="/Clockwise%20White%20Logo%20Stacked.png"
                alt="Clockwise Capital Logo"
                width={140}
                height={50}
                priority
              />
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-7 text-white">
          {/* Main Navigation Items */}
          <Link 
            href="/#learn" 
            className="group relative text-base hover:text-[#E3B23C] font-medium transition-colors duration-300"
          >
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#E3B23C] w-0 group-hover:w-full transition-all duration-300"></span>
            Learn
          </Link>
          <Link 
            href="/#grow" 
            className="group relative text-base hover:text-[#E3B23C] font-medium transition-colors duration-300"
          >
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#E3B23C] w-0 group-hover:w-full transition-all duration-300"></span>
            Portfolios
          </Link>
          <Link 
            href="/#plan" 
            className="group relative text-base hover:text-[#E3B23C] font-medium transition-colors duration-300"
          >
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#E3B23C] w-0 group-hover:w-full transition-all duration-300"></span>
            Advisors
          </Link>
          <Link 
            href="/#reviews" 
            className="group relative text-base hover:text-[#E3B23C] font-medium transition-colors duration-300"
          >
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#E3B23C] w-0 group-hover:w-full transition-all duration-300"></span>
            Reviews
          </Link>
          <Link 
            href="/#media" 
            className="group relative text-base hover:text-[#E3B23C] font-medium transition-colors duration-300"
          >
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#E3B23C] w-0 group-hover:w-full transition-all duration-300"></span>
            Media
          </Link>
          <Link 
            href="/#team" 
            className="group relative text-base hover:text-[#E3B23C] font-medium transition-colors duration-300"
          >
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#E3B23C] w-0 group-hover:w-full transition-all duration-300"></span>
            Team
          </Link>

          {/* Ask AI Button with enhanced hover effect */}
          <button 
            onClick={openGleapChat}
            className="ml-5 relative overflow-hidden bg-[#E3B23C] text-white px-5 py-2 rounded-md font-sans font-medium group transition-all duration-300"
          >
            {/* Button shine effect */}
            <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
            <span className="relative flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-sm">Ask AI</span>
            </span>
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="relative p-2 rounded-md group"
            aria-label="Toggle navigation menu"
          >
            <div className="absolute inset-0 transform rounded-md bg-gray-50 scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200"></div>
            <div className="relative">
              {!isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu with animation */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <nav className="border-t border-white/20 mt-2 px-4 pb-6 pt-4 bg-black/30 backdrop-blur-md">
          <div className="flex flex-col space-y-4 font-sans">
            {/* Main Navigation Items */}
            <Link 
              href="/#learn" 
              className="text-white hover:text-[#E3B23C] font-medium transform hover:translate-x-1 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
              style={{ transitionDelay: '0ms' }}
            >
              Learn
            </Link>
            <Link 
              href="/#grow" 
              className="text-white hover:text-[#E3B23C] font-medium transform hover:translate-x-1 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
              style={{ transitionDelay: '50ms' }}
            >
              Portfolios
            </Link>
            <Link 
              href="/#plan" 
              className="text-white hover:text-[#E3B23C] font-medium transform hover:translate-x-1 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
              style={{ transitionDelay: '100ms' }}
            >
              Advisors
            </Link>
            <Link 
              href="/#reviews" 
              className="text-white hover:text-[#E3B23C] font-medium transform hover:translate-x-1 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
              style={{ transitionDelay: '150ms' }}
            >
              Reviews
            </Link>
            <Link 
              href="/#media" 
              className="text-white hover:text-[#E3B23C] font-medium transform hover:translate-x-1 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
              style={{ transitionDelay: '200ms' }}
            >
              Media
            </Link>
            <Link 
              href="/#team" 
              className="text-white hover:text-[#E3B23C] font-medium transform hover:translate-x-1 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
              style={{ transitionDelay: '250ms' }}
            >
              Team
            </Link>

          {/* Ask AI Button (Mobile) */}
          <button 
            className="mt-4 px-3 py-1.5 text-base font-medium text-black bg-[#E3B23C] hover:bg-[#c89b33] rounded-full transition-all duration-300 flex items-center gap-1.5"
            onClick={() => {
              setIsMenuOpen(false);
              openGleapChat();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-sm">Ask AI</span>
          </button>
        </div>
      </nav>
    </div>
  </header>
);
}