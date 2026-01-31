'use client';

import type { IntakeFormData, AnalysisResult } from './PortfolioDashboard';
import type { User } from '@supabase/supabase-js';
import { convertToAssetClassIfClockwise, isClockwisePortfolio } from '@/lib/asset-class-aggregation';

interface ReviewTabProps {
  analysisResult: AnalysisResult;
  intakeData: IntakeFormData;
  conversationId: string | null;
  onReset: () => void;
  onBack?: () => void;
  portfolioId?: string;
  user?: User | null;
  onFinishAccountClick?: () => void;
  emailData?: { email: string; firstName: string; lastName: string } | null;
}

export default function ReviewTab({ 
  analysisResult, 
  intakeData, 
  conversationId: _conversationId, 
  onReset, 
  onBack: _onBack, 
  portfolioId: _portfolioId, 
  user, 
  onFinishAccountClick,
  emailData
}: ReviewTabProps) {

  // Handle missing goal analysis (only show error if even goal is missing)
  if (!analysisResult.cycleAnalysis?.goalAnalysis) {
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
            The analysis data is missing. This may be due to an API error or timeout.
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

  const goalAnalysis = analysisResult.cycleAnalysis.goalAnalysis;
  const portfolioComparison = analysisResult.portfolioComparison;

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getStatusColor = (probability: number) => {
    if (probability >= 0.75) return 'emerald';
    if (probability >= 0.5) return 'amber';
    return 'rose';
  };

  const getStatusText = (probability: number) => {
    if (probability >= 0.9) return 'Very High';
    if (probability >= 0.75) return 'High';
    if (probability >= 0.5) return 'Moderate';
    if (probability >= 0.25) return 'Low';
    return 'Very Low';
  };

  const medianColor = getStatusColor(goalAnalysis.probabilityOfSuccess.median);

  // Convert to asset classes if Clockwise portfolios
  const userDisplayPositions = portfolioComparison ? convertToAssetClassIfClockwise(
    portfolioComparison.userPortfolio.topPositions, 
    portfolioComparison.userPortfolio.name || 'User Portfolio'
  ) : [];
  
  const timeDisplayPositions = portfolioComparison ? convertToAssetClassIfClockwise(
    portfolioComparison.timePortfolio.topPositions, 
    portfolioComparison.timePortfolio.name || 'TIME Portfolio'
  ) : [];
  
  const showUserAsAssetClasses = portfolioComparison ? isClockwisePortfolio(portfolioComparison.userPortfolio.name || '') : false;
  const showTimeAsAssetClasses = portfolioComparison ? isClockwisePortfolio(portfolioComparison.timePortfolio.name || '') : false;
  const timeHorizon = portfolioComparison?.timeHorizon || 1;
  const timeLabel = timeHorizon === 1 ? '1yr' : `${timeHorizon}yr`;

  return (
    <div className="space-y-8">
      {/* SECTION 1: Portfolio Oversight Suggested (Conditional - only if user exists) */}
      {user && intakeData && (
        <div className="bg-teal-900/20 rounded-lg p-6 border border-teal-400">
          <div className="text-2xl font-bold text-teal-300 mb-2">Portfolio Oversight Suggested</div>
          <p className="text-sm text-teal-200 mb-6">
            Based on your {intakeData.riskTolerance === 'high' ? 'Aggressive' : intakeData.riskTolerance === 'medium' ? 'Moderate' : 'Conservative'} risk tolerance, we recommend:
          </p>
          
          {/* Portfolio Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              let portfolio1 = '';
              let portfolio2 = '';
              
              if (intakeData.riskTolerance === 'high') {
                portfolio1 = 'Max Growth';
                portfolio2 = 'Growth';
              } else if (intakeData.riskTolerance === 'medium') {
                portfolio1 = 'Growth';
                portfolio2 = 'Moderate';
              } else {
                portfolio1 = 'Moderate';
                portfolio2 = 'Income';
              }
              
              return (
                <>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Primary Recommendation</div>
                    <div className="text-2xl font-bold text-gray-100">
                      {portfolio1}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Clockwise {portfolio1} Portfolio</div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Alternative Option</div>
                    <div className="text-2xl font-bold text-gray-100">
                      {portfolio2}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Clockwise {portfolio2} Portfolio</div>
                  </div>
                </>
              );
            })()}
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="https://calendly.com/clockwisecapital/appointments"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-3 bg-gray-800 text-teal-300 border border-teal-500 font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule a Consultation
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="/scenario-testing/questions"
              className="flex-1 px-6 py-3 bg-gray-800 text-teal-300 border border-teal-500 font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Scenario Testing
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* SECTION 2: Your Analysis is Complete CTA (Conditional - only if user is NOT signed in) */}
      {!user && emailData && (
        <div className="bg-teal-900/20 rounded-lg p-6 border border-teal-400">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 border-2 border-teal-400">
              <svg className="w-6 h-6 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-teal-300 mb-2">Your Analysis is Complete!</h3>
              <p className="text-sm text-teal-200">
                Create an account to save your personalized portfolio analysis and access advanced scenario testing.
              </p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Finish Account Setup Card */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-teal-500 transition-all group cursor-pointer" onClick={onFinishAccountClick}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-all">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-100 mb-1">Finish Account Setup</h4>
                  <p className="text-xs text-gray-400">Save your analysis & unlock features</p>
                </div>
              </div>
            </div>

            {/* Scenario Testing Card */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-teal-500 transition-all group cursor-pointer" onClick={onFinishAccountClick}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-100 mb-1">Scenario Testing</h4>
                  <p className="text-xs text-gray-400">Test your portfolio in market conditions</p>
                </div>
              </div>
            </div>

            {/* Schedule Consultation Card */}
            <a
              href="https://calendly.com/clockwisecapital/appointments"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-teal-500 transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-all">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-100 mb-1">Schedule Consultation</h4>
                  <p className="text-xs text-gray-400">Speak with a portfolio strategist</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* SECTION 3: Goals Output - Probability of Success */}
      <div className="space-y-6 md:space-y-8">
        {/* Probability Content */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-100 mb-4">Probability of Reaching Your Goal</h2>
            <p className="text-sm text-gray-400 mb-6">Based on Monte Carlo simulations using nominal returns</p>
            
            {/* Main Probability Display */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-100 mb-4">
                  You hit your goal {formatPercent(goalAnalysis.probabilityOfSuccess.median)} of the time
                </div>
                <div className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-${medianColor}-100 text-${medianColor}-800`}>
                  {getStatusText(goalAnalysis.probabilityOfSuccess.median)} Probability
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Goal Achievement Range</span>
                <span className="text-sm text-gray-400">
                  {formatPercent(goalAnalysis.probabilityOfSuccess.downside)} - {formatPercent(goalAnalysis.probabilityOfSuccess.upside)}
                </span>
              </div>
              <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${goalAnalysis.probabilityOfSuccess.median * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {formatPercent(goalAnalysis.probabilityOfSuccess.median)} Probability
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Financial Goal Details */}
        <div className="bg-teal-900/20 rounded-lg p-6 border border-teal-400">
          <div className="text-2xl font-bold text-teal-300 mb-4">Your Financial Goal Details</div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Goal Amount</div>
              <div className="text-2xl font-bold text-gray-100">
                {formatCurrency(goalAnalysis.goalAmount)}
              </div>
              <div className="text-xs text-gray-400 mt-1">{goalAnalysis.goalDescription}</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Current Portfolio</div>
              <div className="text-2xl font-bold text-gray-100">
                {formatCurrency(goalAnalysis.currentAmount)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Starting Value</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Monthly Contribution</div>
              <div className="text-2xl font-bold text-gray-100">
                {goalAnalysis.monthlyContribution ? formatCurrency(goalAnalysis.monthlyContribution) : '$0'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Over {goalAnalysis.timeHorizon} {goalAnalysis.timeHorizon === 1 ? 'year' : 'years'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Portfolio Comparison */}
      {portfolioComparison && (
        <div className="space-y-6 md:space-y-8">
          {/* Side-by-Side Portfolio Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Portfolio */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Your Portfolio</h3>
              </div>
              
              {/* Total Value and Portfolio Metrics */}
              <div className="mb-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Starting Value</div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-400">
                      {formatCurrency(portfolioComparison.userPortfolio.totalValue)}
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Ending Value</div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                      {formatCurrency(portfolioComparison.userPortfolio.totalValue * Math.pow(1 + portfolioComparison.userPortfolio.expectedReturn, portfolioComparison.timeHorizon || 1))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2 h-auto sm:h-12 flex items-start">Expected Return ({timeLabel})</div>
                    <div className={`text-base sm:text-lg font-bold ${portfolioComparison.userPortfolio.expectedReturn > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatPercent(portfolioComparison.userPortfolio.expectedReturn)}
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2 h-auto sm:h-12 flex items-start">Expected Best Year ({timeLabel})</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-400">
                      {portfolioComparison.userPortfolio.upside !== undefined 
                        ? formatPercent(portfolioComparison.userPortfolio.upside) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2 h-auto sm:h-12 flex items-start">Expected Worst Year ({timeLabel})</div>
                    <div className="text-base sm:text-lg font-bold text-rose-400">
                      {portfolioComparison.userPortfolio.downside !== undefined 
                        ? formatPercent(portfolioComparison.userPortfolio.downside) 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top 5 Positions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  {showUserAsAssetClasses ? 'Asset Classes' : 'Top 5 Positions'}
                </h4>
                <div className="space-y-3">
                  {userDisplayPositions.map((position) => {
                    const isSingleHolding = portfolioComparison.userPortfolio.topPositions.length === 1 && position.weight >= 99;
                    const displayExpectedReturn = isSingleHolding 
                      ? portfolioComparison.userPortfolio.expectedReturn 
                      : position.expectedReturn;
                    
                    return (
                      <div key={position.ticker} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{position.ticker}</span>
                            </div>
                            {!showUserAsAssetClasses && (
                              <div className="text-xs text-gray-400">
                                {position.assetClass ? `${position.assetClass} • ` : ''}{position.name}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-300">{position.weight.toFixed(1)}%</div>
                          </div>
                        </div>
                        {!showUserAsAssetClasses && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-gray-400">Expected Return</div>
                              <div className={`font-semibold ${displayExpectedReturn && displayExpectedReturn > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {displayExpectedReturn !== null && displayExpectedReturn !== undefined ? formatPercent(displayExpectedReturn) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">Upside</div>
                              <div className="font-semibold text-emerald-400">
                                {isSingleHolding
                                  ? formatPercent(portfolioComparison.userPortfolio.upside)
                                  : position.monteCarlo ? formatPercent(position.monteCarlo.upside) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400">Downside</div>
                              <div className="font-semibold text-rose-400">
                                {isSingleHolding
                                  ? formatPercent(portfolioComparison.userPortfolio.downside)
                                  : position.monteCarlo ? formatPercent(position.monteCarlo.downside) : 'N/A'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* TIME Portfolio */}
            <div className="bg-gradient-to-br from-teal-900/20 to-blue-900/20 rounded-lg p-6 border border-teal-800">
              <h3 className="text-xl font-bold text-teal-300 mb-4">TIME Portfolio</h3>
              
              {/* Total Value and Portfolio Metrics */}
              <div className="mb-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-teal-900/20 rounded-lg p-4 border border-teal-800">
                    <div className="text-sm text-teal-400 mb-1">Starting Value</div>
                    <div className="text-xl sm:text-2xl font-bold text-teal-300">
                      {formatCurrency(portfolioComparison.timePortfolio.totalValue)}
                    </div>
                  </div>
                  <div className="bg-teal-900/20 rounded-lg p-4 border border-teal-800">
                    <div className="text-sm text-teal-400 mb-1">Ending Value</div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-300">
                      {formatCurrency(portfolioComparison.timePortfolio.totalValue * Math.pow(1 + portfolioComparison.timePortfolio.expectedReturn, portfolioComparison.timeHorizon || 1))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-800">
                    <div className="text-xs text-teal-400 mb-2 h-auto sm:h-12 flex items-start">Expected Return ({timeLabel})</div>
                    <div className={`text-base sm:text-lg font-bold ${portfolioComparison.timePortfolio.expectedReturn > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {formatPercent(portfolioComparison.timePortfolio.expectedReturn)}
                    </div>
                  </div>
                  <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-800">
                    <div className="text-xs text-teal-400 mb-2 h-auto sm:h-12 flex items-start">Expected Best Year ({timeLabel})</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-300">
                      {portfolioComparison.timePortfolio.upside !== undefined 
                        ? formatPercent(portfolioComparison.timePortfolio.upside) 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-800">
                    <div className="text-xs text-teal-400 mb-2 h-auto sm:h-12 flex items-start">Expected Worst Year ({timeLabel})</div>
                    <div className="text-base sm:text-lg font-bold text-rose-300">
                      {portfolioComparison.timePortfolio.downside !== undefined 
                        ? formatPercent(portfolioComparison.timePortfolio.downside) 
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top 5 Positions */}
              <div>
                <h4 className="text-sm font-semibold text-teal-300 mb-3">
                  {showTimeAsAssetClasses ? 'Asset Classes' : 'Top 5 Positions'}
                </h4>
                <div className="space-y-3">
                  {timeDisplayPositions.map((position) => (
                    <div key={position.ticker} className="bg-teal-900/10 rounded-lg p-3 border border-teal-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-white">{position.ticker}</div>
                          {!showTimeAsAssetClasses && position.name && (
                            <div className="text-xs text-teal-400">{position.name}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-teal-300">{position.weight.toFixed(1)}%</div>
                        </div>
                      </div>
                      {!showTimeAsAssetClasses && (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-teal-400">Expected Return</div>
                            <div className={`font-semibold ${position.expectedReturn && position.expectedReturn > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                              {position.expectedReturn ? formatPercent(position.expectedReturn) : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-teal-400">Upside</div>
                            <div className="font-semibold text-emerald-300">
                              {position.monteCarlo ? formatPercent(position.monteCarlo.upside) : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-teal-400">Downside</div>
                            <div className="font-semibold text-rose-300">
                              {position.monteCarlo ? formatPercent(position.monteCarlo.downside) : 'N/A'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-teal-900/20 rounded-lg p-4 md:p-6 border border-teal-400">
            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 text-teal-300">Next Step</h3>
            <p className="text-sm md:text-base text-teal-200 mb-4 md:mb-6">
              Work 1:1 with a strategist to optimize allocations for the current cycle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://calendly.com/clockwisecapital/appointments"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 md:px-8 py-3 bg-gray-800 text-teal-300 border border-teal-500 font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule a Consultation
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              {!user && onFinishAccountClick && (
                <button
                  onClick={onFinishAccountClick}
                  className="w-full sm:w-auto px-6 md:px-8 py-3 bg-gray-800 text-teal-300 border border-teal-500 font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Finish Account
                </button>
              )}
            </div>
          </div>

          {/* Monte Carlo Disclaimer */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-400">Clockwise Kronos – Monte Carlo Simulation Disclaimer:</span>{' '}
              The Monte Carlo return projections shown for the User Portfolio and the TIME Portfolio are hypothetical in nature and are provided solely for illustrative purposes. They do not represent actual or guaranteed future performance. The scenarios shown are based on statistical modeling that incorporates assumptions about returns, volatility, correlations, and market behavior. Actual market conditions may differ significantly from those assumed, resulting in outcomes that vary materially from the projections.
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed mt-2">
              Monte Carlo simulations illustrate a range of possible outcomes, not a single expected result. They cannot account for all economic, market, geopolitical, interest rate, or liquidity events that may impact future portfolio performance. Past performance does not guarantee future results, and all investments carry the risk of loss, including the potential loss of principal.
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed mt-2">
              Holdings in the TIME Portfolio are subject to change without notice as part of Clockwise Capital&apos;s active risk-managed investment process. For the most current information, investors can review the full list of holdings at:{' '}
              <a 
                href="https://clockwisefunds.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-teal-500 hover:text-teal-400 underline"
              >
                https://clockwisefunds.com/
              </a>
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed mt-2">
              The information provided does not constitute investment, tax, legal, or financial advice. Investors should evaluate their own financial circumstances, objectives, and risk tolerance, and are encouraged to consult with a qualified financial professional before making investment decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
