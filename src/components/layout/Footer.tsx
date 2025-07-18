'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#1A3A5F] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link href="/#learn" className="hover:text-[#1FAAA3] transition-colors">Learn</Link></li>
              <li><Link href="/#grow" className="hover:text-[#1FAAA3] transition-colors">Portfolios</Link></li>
              <li><Link href="/#plan" className="hover:text-[#1FAAA3] transition-colors">Advisors</Link></li>
              <li><Link href="/#reviews" className="hover:text-[#1FAAA3] transition-colors">Reviews</Link></li>
              <li><Link href="/#media" className="hover:text-[#1FAAA3] transition-colors">Media</Link></li>
              <li><Link href="/#team" className="hover:text-[#1FAAA3] transition-colors">Team</Link></li>
            </ul>
          </div>
          
          {/* Column 2: Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/#disclosures" className="hover:text-[#1FAAA3] transition-colors">Disclosures</Link></li>
            </ul>
          </div>
          
          {/* Column 3: Location */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Our Location</h3>
            <ul className="space-y-2">
              <li>1395 Brickell Ave. 800 Miami, FL 33131</li>
            </ul>
          </div>
          
          {/* Column 4: Social & Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-6">
              {/* Social Media Icons */}
              <a href="https://x.com/Clockwise_Cap" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)" className="hover:text-[#1FAAA3]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/clockwisecapital/?viewAsMember=true" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-[#1FAAA3]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="https://www.youtube.com/@ClockwiseCapital-cm9wo" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-[#1FAAA3]">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-2">Download Our Free eBook</h4>
              <div className="bg-[#1FAAA3] hover:bg-[#17867A] text-white py-2 px-4 rounded text-sm inline-block transition-colors duration-200">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
        
        {/* Disclosure Message */}
        <div className="mt-10 pt-6 text-sm">
          <p className="mb-4">
            Past performance is not indicative of future results. Differences in 
            account size, timing of transactions and market conditions prevailing 
            at the time of investment may lead to different results, and clients may 
            lose money. Clients should consult with their advisor about the advisability regarding 
            the use or appropriateness of investment.
          </p>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Link href="/" aria-label="Clockwise Capital Home">
              <Image 
                src="/Clockwise White Logo Stacked.png" 
                alt="Clockwise Capital" 
                width={150} 
                height={70} 
                className="h-auto" 
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-4 mb-6 md:mb-0">
            <a href="https://adviserinfo.sec.gov/firm/summary/175233" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#1FAAA3] transition-colors">ADV</a>
            <a href="/Clockwise Website Disclosure.pdf" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#1FAAA3] transition-colors">Disclosure</a>
            <a href="/Clockwise Capital Privacy Policy.pdf" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#1FAAA3] transition-colors">Privacy Policy</a>
          </div>
          
          <div className="text-sm text-gray-400">
            <p>© {currentYear} Clockwise Capital LLC. All Rights Reserved {currentYear}. 1395 Brickell Ave. Unit 800, Miami FL 33131</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
