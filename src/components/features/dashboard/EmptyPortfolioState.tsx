'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiInbox, FiPieChart } from 'react-icons/fi';

interface EmptyPortfolioStateProps {
  onCreatePortfolio?: () => void;
}

export default function EmptyPortfolioState({ onCreatePortfolio }: EmptyPortfolioStateProps) {
  const router = useRouter();

  const handleCreate = () => {
    if (onCreatePortfolio) {
      onCreatePortfolio();
    } else {
      router.push('/kronos');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* Icon */}
      <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 
        flex items-center justify-center mb-6">
        <FiInbox className="w-12 h-12 text-gray-500" />
      </div>

      {/* Message */}
      <h3 className="text-2xl font-bold text-white mb-2">
        No Portfolios Yet
      </h3>
      <p className="text-gray-400 text-center max-w-md mb-8">
        Get started by analyzing your first portfolio. We'll save it here so you can
        test it against different scenarios and track your progress over time.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleCreate}
          className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold 
            rounded-xl transition-all duration-300 shadow-xl hover:scale-105 
            flex items-center gap-3"
        >
          <FiPieChart className="w-5 h-5" />
          Analyze Your Portfolio
        </button>
        
        <button
          onClick={() => router.push('/scenario-testing/questions')}
          className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold 
            rounded-xl transition-all duration-300 border-2 border-gray-700 
            hover:border-teal-500/50 flex items-center gap-3"
        >
          Browse Scenarios
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-12 max-w-2xl bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg 
              className="w-6 h-6 text-teal-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-2">
              What happens when you analyze your portfolio?
            </h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✓ Get detailed analysis and recommendations</li>
              <li>✓ See probability of reaching your financial goals</li>
              <li>✓ Compare against the TIME portfolio</li>
              <li>✓ Portfolio saved automatically for future testing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

