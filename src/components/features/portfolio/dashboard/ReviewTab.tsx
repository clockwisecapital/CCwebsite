'use client';

import type { IntakeFormData, AnalysisResult } from './PortfolioDashboard';
import CycleTab from './CycleTab';
import PortfolioTab from './PortfolioTab';
import GoalTab from './GoalTab';

interface ReviewTabProps {
  analysisResult: AnalysisResult;
  intakeData: IntakeFormData;
  conversationId: string | null;
  videoId: string | null; // Still needed for prop compatibility
  onReset: () => void;
  onBack?: () => void;
  onNavigateToAnalyze?: () => void;
  cycleAnalysisTab: 'market' | 'portfolio' | 'goal';
  onCycleAnalysisTabChange: (tab: 'market' | 'portfolio' | 'goal') => void;
  onGoalSlideChange: (slide: number) => void;
  onPortfolioSlideChange: (slide: number) => void;
  onMarketSlideChange: (slide: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ReviewTab({ analysisResult, intakeData: _intakeData, conversationId: _conversationId, videoId: _videoId, onReset, onBack, onNavigateToAnalyze, cycleAnalysisTab, onCycleAnalysisTabChange, onGoalSlideChange, onPortfolioSlideChange, onMarketSlideChange }: ReviewTabProps) {
  const handleNext = () => {
    if (cycleAnalysisTab === 'goal') {
      onCycleAnalysisTabChange('portfolio');
    } else if (cycleAnalysisTab === 'portfolio') {
      onCycleAnalysisTabChange('market');
    } else if (cycleAnalysisTab === 'market') {
      // Navigate to Analysis tab
      if (onNavigateToAnalyze) {
        onNavigateToAnalyze();
      }
    }
  };

  const handleBack = () => {
    if (cycleAnalysisTab === 'market') {
      onCycleAnalysisTabChange('portfolio');
    } else if (cycleAnalysisTab === 'portfolio') {
      onCycleAnalysisTabChange('goal');
    } else if (cycleAnalysisTab === 'goal' && onBack) {
      // First tab (Goal) - go back to Intake
      onBack();
    }
  };

  // Handle missing cycle analysis gracefully
  if (!analysisResult.cycleAnalysis) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-900">Analysis Incomplete</h2>
          </div>
          <p className="text-red-800 mb-4">
            The cycle analysis data is missing. This may be due to an API error or timeout.
          </p>
          <button
            onClick={onReset}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const allCycles = analysisResult.cycleAnalysis.cycles;
  
  // Show all 6 cycles - Market (S&P 500) is primary/default
  const cycleData = {
    market: allCycles.market,
    country: allCycles.country,
    technology: allCycles.technology,
    economic: allCycles.economic,
    business: allCycles.business,
    company: allCycles.company,
  };
  
  const portfolioAnalysis = analysisResult.cycleAnalysis.portfolioAnalysis;
  const goalAnalysis = analysisResult.cycleAnalysis.goalAnalysis;

  return (
    <div className="space-y-8">
      {/* Portfolio Intelligence with Dynamic Kronos Recommendations */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="border-b border-gray-700">
              <nav className="flex -mb-px">
            <button
              onClick={() => onCycleAnalysisTabChange('goal')}
              className={`flex-1 py-3 md:py-4 px-2 md:px-6 text-center font-semibold transition-colors ${
                cycleAnalysisTab === 'goal'
                  ? 'border-b-2 border-teal-400 text-teal-300 bg-teal-900/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1 md:gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-sm md:text-base">Goal</span>
              </div>
              <div className={`text-[10px] md:text-xs mt-0.5 md:mt-1 hidden sm:block ${
                cycleAnalysisTab === 'goal' ? 'text-teal-400' : 'text-gray-400'
              }`}>Success Probability</div>
            </button>

            <button
              onClick={() => onCycleAnalysisTabChange('portfolio')}
              className={`flex-1 py-3 md:py-4 px-2 md:px-6 text-center font-semibold transition-colors ${
                cycleAnalysisTab === 'portfolio'
                  ? 'border-b-2 border-teal-400 text-teal-300 bg-teal-900/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1 md:gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm md:text-base">Portfolio</span>
              </div>
              <div className={`text-[10px] md:text-xs mt-0.5 md:mt-1 hidden sm:block ${
                cycleAnalysisTab === 'portfolio' ? 'text-teal-400' : 'text-gray-400'
              }`}>Monte Carlo</div>
            </button>

            <button
              onClick={() => onCycleAnalysisTabChange('market')}
              className={`flex-1 py-3 md:py-4 px-2 md:px-6 text-center font-semibold transition-colors ${
                cycleAnalysisTab === 'market'
                  ? 'border-b-2 border-teal-400 text-teal-300 bg-teal-900/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1 md:gap-2">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className="text-sm md:text-base">Market</span>
              </div>
              <div className={`text-[10px] md:text-xs mt-0.5 md:mt-1 hidden sm:block ${
                cycleAnalysisTab === 'market' ? 'text-teal-400' : 'text-gray-400'
              }`}>6 Cycles</div>
            </button>
          </nav>
        </div>

            {/* Tab Content */}
            <div className="p-6">
              {cycleAnalysisTab === 'market' && (
                <CycleTab 
                  cycleData={cycleData}
                  portfolioAnalysis={portfolioAnalysis}
                  onNext={handleNext}
                  onBack={handleBack}
                  onSlideChange={onMarketSlideChange}
                />
              )}
              {cycleAnalysisTab === 'portfolio' && (
                <PortfolioTab 
                  portfolioAnalysis={portfolioAnalysis}
                  onBack={handleBack}
                  onNext={handleNext}
                  onSlideChange={onPortfolioSlideChange}
                />
              )}
              {cycleAnalysisTab === 'goal' && (
                <GoalTab 
                  goalAnalysis={goalAnalysis}
                  analysisResult={analysisResult}
                  onNext={handleNext}
                  onBack={handleBack}
                  onSlideChange={onGoalSlideChange}
                />
              )}
            </div>
      </div>
    </div>
  );
}
