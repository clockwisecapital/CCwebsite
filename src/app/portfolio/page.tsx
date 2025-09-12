'use client';

import { ConversationalChat } from '@/components/features/portfolio/ConversationalChat';
import NavigatingTurbulentTimes from '@/components/features/home/NavigatingTurbulentTimes';

export default function PortfolioPage() {

  return (
    <div className="min-h-screen bg-slate-900 pt-20">
      {/* Learn Section */}
      <NavigatingTurbulentTimes />
      
      {/* Clean Header */}
      <div className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Clockwise AI: Rate My Portfolio
              </h1>
              <p className="text-slate-300 mt-1">
                Get AI-powered insights on your investment portfolio through the lens of accelerating market cycles
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-400">Ask AI</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Page Chat Interface */}
      <div className="max-w-7xl mx-auto">
        <ConversationalChat />
      </div>
    </div>
  );
}
