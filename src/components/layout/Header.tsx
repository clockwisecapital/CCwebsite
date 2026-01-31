'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/lib/auth/AuthContext';
import { useKronosNotification } from '@/hooks/useKronosNotification';
import SignInModal from '@/components/features/auth/SignInModal';
import { HiArrowRightOnRectangle } from 'react-icons/hi2';

export default function Header(): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const { isAdmin, logout } = useAdmin();
  const { user, signOut } = useAuth();
  const { hasUnviewedIntelligence } = useKronosNotification();


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
            href="/kronos" 
            className="group relative text-base hover:text-[#E3B23C] font-medium transition-colors duration-300"
          >
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#E3B23C] w-0 group-hover:w-full transition-all duration-300"></span>
            Kronos
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
            href="https://clockwisefunds.com/" 
            className="group relative text-base hover:text-[#E3B23C] font-medium transition-colors duration-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#E3B23C] w-0 group-hover:w-full transition-all duration-300"></span>
            Funds
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

          {/* My Account Link - Only for authenticated users */}
          {user && (
            <Link 
              href="/account" 
              className="group relative text-base hover:text-[#E3B23C] font-medium transition-colors duration-300"
            >
              <span className="absolute bottom-0 left-0 h-0.5 bg-[#E3B23C] w-0 group-hover:w-full transition-all duration-300"></span>
              My Account
              {hasUnviewedIntelligence && (
                <span className="absolute -top-1 -right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500 border border-gray-900"></span>
                </span>
              )}
            </Link>
          )}

          {/* User Auth Button */}
          {user ? (
            <>
              <Link
                href="/scenario-testing/questions"
                className="ml-3 relative overflow-hidden bg-gradient-to-r from-teal-600 to-blue-600 text-white px-4 py-2 rounded-md font-sans font-medium group transition-all duration-300 hover:from-teal-700 hover:to-blue-700"
                title="Scenario Testing"
              >
                <span className="relative text-sm">Scenarios</span>
              </Link>
              <button 
                onClick={signOut}
                className="ml-3 relative overflow-hidden bg-teal-600 text-white px-4 py-2 rounded-md font-sans font-medium group transition-all duration-300 hover:bg-teal-700"
                title="Sign Out"
              >
                <span className="relative flex items-center space-x-2">
                  <span className="text-sm">Sign Out</span>
                  <HiArrowRightOnRectangle className="h-4 w-4" />
                </span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => setShowSignInModal(true)}
              className="ml-3 relative overflow-hidden bg-gradient-to-r from-teal-600 to-blue-600 text-white px-4 py-2 rounded-md font-sans font-medium group transition-all duration-300 hover:from-teal-700 hover:to-blue-700"
            >
              <span className="relative text-sm">Sign In</span>
            </button>
          )}

          {/* Admin Logout Button - Only visible to logged-in admins */}
          {isAdmin && (
            <button 
              onClick={logout}
              className="ml-3 relative overflow-hidden bg-red-600 text-white px-4 py-2 rounded-md font-sans font-medium group transition-all duration-300 hover:bg-red-700"
              title="Admin Logout"
            >
              <span className="relative flex items-center space-x-1">
                <HiArrowRightOnRectangle className="h-3.5 w-3.5" />
                <span className="text-sm">Admin</span>
              </span>
            </button>
          )}
        </nav>

        {/* Sign In Modal */}
        <SignInModal 
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          onSuccess={() => {
            setShowSignInModal(false);
          }}
        />

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
              href="/kronos" 
              className="text-white hover:text-[#E3B23C] font-medium transform hover:translate-x-1 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
              style={{ transitionDelay: '0ms' }}
            >
              Kronos
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
              href="https://clockwisefunds.com/" 
              className="text-white hover:text-[#E3B23C] font-medium transform hover:translate-x-1 transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
              style={{ transitionDelay: '125ms' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Funds
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

          {/* Ask AI Button (Mobile) - TEMPORARILY DISABLED */}
          {/* <button 
            className="mt-4 px-3 py-1.5 text-base font-medium text-black bg-[#E3B23C] hover:bg-[#c89b33] rounded-full transition-all duration-300 flex items-center gap-1.5"
            onClick={() => {
              setIsMenuOpen(false);
              router.push('/scenario-testing-lab');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-sm">Ask AI</span>
          </button> */}

          {/* My Account Link (Mobile) - Only for authenticated users */}
          {user && (
            <Link
              href="/account"
              className="mt-4 text-white hover:text-[#E3B23C] font-medium transform hover:translate-x-1 transition-all duration-200 relative inline-flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              My Account
              {hasUnviewedIntelligence && (
                <span className="flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                </span>
              )}
            </Link>
          )}

          {/* User Auth Button (Mobile) */}
          {user ? (
            <>
              <Link
                href="/scenario-testing/questions"
                className="mt-2 px-3 py-1.5 text-base font-medium text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 rounded-full transition-all duration-300 text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-sm">Scenarios</span>
              </Link>
              <button 
                className="mt-2 px-3 py-1.5 text-base font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-full transition-all duration-300 flex items-center gap-1.5"
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
              >
                <span className="text-sm">Sign Out</span>
                <HiArrowRightOnRectangle className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button 
              className="mt-2 px-3 py-1.5 text-base font-medium text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 rounded-full transition-all duration-300"
              onClick={() => {
                setIsMenuOpen(false);
                setShowSignInModal(true);
              }}
            >
              <span className="text-sm">Sign In</span>
            </button>
          )}

          {/* Admin Logout Button (Mobile) - Only visible to logged-in admins */}
          {isAdmin && (
            <button 
              className="mt-2 px-3 py-1.5 text-base font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-all duration-300 flex items-center gap-1.5"
              onClick={() => {
                setIsMenuOpen(false);
                logout();
              }}
            >
              <HiArrowRightOnRectangle className="h-3.5 w-3.5" />
              <span className="text-sm">Admin Logout</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  </header>
);
}