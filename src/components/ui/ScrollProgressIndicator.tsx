"use client";

import React, { useState, useEffect } from 'react';

interface ScrollProgressIndicatorProps {
  sections?: string[]; // Optional array of section names to display
  showLabels?: boolean; // Whether to show section labels
  position?: 'left' | 'right'; // Position of the indicator
}

const ScrollProgressIndicator: React.FC<ScrollProgressIndicatorProps> = ({
  sections = [],
  showLabels = false,
  position = 'right'
}) => {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate overall scroll progress (0-100)
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      setScrollProgress(progress);
      
      // Hide indicator in hero section (first viewport height)
      const shouldShow = scrollTop > window.innerHeight * 0.7;
      const indicator = document.getElementById('scroll-progress-indicator');
      if (indicator) {
        indicator.style.opacity = shouldShow ? '1' : '0';
      }

      // Determine active section
      if (sections.length > 0) {
        // This is a simplified version - in a real implementation, 
        // you would get actual section positions from refs or element IDs
        const sectionHeight = scrollHeight / sections.length;
        const currentSection = Math.min(
          Math.floor(scrollTop / sectionHeight),
          sections.length - 1
        );
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections.length]);

  return (
    <div 
      id="scroll-progress-indicator"
      className={`fixed z-50 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${
        position === 'right' ? 'right-4 md:right-8' : 'left-4 md:left-8'
      } flex flex-col items-center`}
    >
      {/* Main progress bar */}
      <div className="h-48 w-1 bg-gray-300 rounded-full relative">
        <div 
          className="absolute bottom-0 w-full bg-gradient-to-t from-[#1FAAA3] to-[#1A3A5F] rounded-full transition-all duration-300 ease-out"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>

      {/* Section indicators */}
      {sections.length > 0 && (
        <div className="mt-4 flex flex-col items-center space-y-3">
          {sections.map((section, index) => (
            <div key={index} className="flex items-center">
              <div 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index <= activeSection 
                    ? 'bg-[#1FAAA3] scale-110' 
                    : 'bg-gray-300'
                }`}
              />
              {showLabels && (
                <span 
                  className={`ml-2 text-xs font-medium transition-all duration-300 ${
                    index === activeSection 
                      ? 'text-[#1FAAA3] opacity-100' 
                      : 'text-gray-500 opacity-70'
                  }`}
                >
                  {section}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScrollProgressIndicator;
