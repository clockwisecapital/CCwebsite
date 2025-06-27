"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ 
  isOpen, 
  onClose, 
  title,
  children 
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Close when clicking outside the modal content
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdropClick}
        >
          <motion.div 
            className="relative w-full max-w-5xl max-h-[85vh] overflow-y-auto bg-[#0A1F35] border border-white/20 rounded-xl shadow-2xl"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Gradient overlay for glass effect */}
            <div className="absolute inset-0 bg-[#0A1F35] rounded-xl -z-10"></div>
            
            {/* Header with close button */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0A1F35]">
              <h2 className="text-2xl md:text-3xl font-medium text-white">{title}</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal content */}
            <div className="p-6 md:p-10 max-w-4xl mx-auto">
              {children}
            </div>
            
            {/* Footer with action buttons */}
            <div className="sticky bottom-0 p-6 border-t border-white/10 bg-[#0A1F35] flex flex-wrap gap-4 justify-between items-center">
              <div className="flex flex-wrap gap-4">
                <button 
                  className="px-6 py-3 bg-transparent hover:bg-[#1FAAA3]/90 text-[#1FAAA3] hover:text-white rounded-md border border-[#1FAAA3] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1FAAA3]/30 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  AI Portfolio Finder
                </button>
                <button 
                  className="px-6 py-3 bg-transparent hover:bg-[#E3B23C]/90 text-[#E3B23C] hover:text-white rounded-md border border-[#E3B23C] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E3B23C]/30 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Get Started
                </button>
              </div>
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-transparent hover:bg-white/10 text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-md transition-all duration-300 focus:outline-none"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default InvestmentModal;
