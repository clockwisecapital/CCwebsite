'use client';

import React from 'react';
import { FiX, FiTrendingUp, FiRepeat, FiBarChart } from 'react-icons/fi';

interface MonteCarloInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MonteCarloInfoModal({ isOpen, onClose }: MonteCarloInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="monte-carlo-modal-title"
      onClick={onClose}
    >
      <div 
        className="bg-[#0f1420] rounded-2xl border border-gray-800/50 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-gray-800/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors z-10 group"
            aria-label="Close modal"
          >
            <FiX className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
          </button>
          
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <FiBarChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="monte-carlo-modal-title" className="text-xl font-bold text-white">How We Calculate Returns</h2>
              <p className="text-xs text-gray-400">Monte Carlo Simulation Explained</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          <div className="space-y-6">
            {/* Introduction */}
            <div>
              <p className="text-gray-300 leading-relaxed">
                We use a proven method called <span className="text-teal-400 font-semibold">Monte Carlo simulation</span> to 
                estimate how your portfolio might perform during similar historical market conditions.
              </p>
            </div>

            {/* How it Works */}
            <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FiRepeat className="w-5 h-5 text-teal-400" />
                How It Works
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Select Historical Period</h4>
                    <p className="text-sm text-gray-400">
                      We identify a past market scenario that closely matches current conditions (like the 2008 Financial Crisis).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Run 10,000 Simulations</h4>
                    <p className="text-sm text-gray-400">
                      We replay that historical scenario 10,000 times with your portfolio, capturing all possible outcomes 
                      based on how the market actually moved during that period.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Calculate Average</h4>
                    <p className="text-sm text-gray-400">
                      We average all 10,000 results to give you the <span className="text-teal-400 font-semibold">Expected Return (Avg Annual)</span> - 
                      your portfolio's likely annual performance in similar conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What You See */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-teal-400" />
                What The Numbers Mean
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <p className="text-white font-semibold text-sm">Expected Return (Avg Annual)</p>
                  </div>
                  <p className="text-sm text-gray-400 ml-4">
                    The average yearly return across all 10,000 simulations. This is your most likely outcome.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <p className="text-white font-semibold text-sm">Expected Best Year</p>
                  </div>
                  <p className="text-sm text-gray-400 ml-4">
                    The best single-year return you might see based on the historical pattern.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <p className="text-white font-semibold text-sm">Expected Worst Year</p>
                  </div>
                  <p className="text-sm text-gray-400 ml-4">
                    The worst single-year return you might experience, helping you understand downside risk.
                  </p>
                </div>
              </div>
            </div>

            {/* Why This Matters */}
            <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-xl p-5">
              <h3 className="text-lg font-bold text-white mb-3">Why This Matters</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Rather than guessing or using overly optimistic projections, we ground our analysis in real historical data. 
                This gives you a realistic view of how your portfolio might perform when the market faces similar challenges 
                or opportunities—helping you make informed decisions about your investment strategy.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 sm:px-8 py-4 border-t border-gray-800/50 bg-gray-900/30">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 
              text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 text-sm shadow-lg"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
