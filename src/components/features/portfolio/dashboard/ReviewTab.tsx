'use client';

import { useState } from 'react';
import type { IntakeFormData, AnalysisResult } from './PortfolioDashboard';
import CycleTab from './CycleTab';
import PortfolioTab from './PortfolioTab';
import GoalTab from './GoalTab';

interface ReviewTabProps {
  analysisResult: AnalysisResult;
  intakeData: IntakeFormData;
  conversationId: string | null;
  onReset: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ReviewTab({ analysisResult, intakeData: _intakeData, conversationId, onReset }: ReviewTabProps) {
  const [selectedCycle, setSelectedCycle] = useState<'technology' | 'economic'>('technology');
  const [showAnalysisAndSync, setShowAnalysisAndSync] = useState(true);
  const [showCycleOverview, setShowCycleOverview] = useState(true);
  const [cycleAnalysisTab, setCycleAnalysisTab] = useState<'cycle' | 'portfolio' | 'goal'>('cycle');

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    alert('PDF download feature coming soon!');
  };

  // Process impact data (handle both string and array formats)
  const processImpactData = (data: string | string[] | undefined): string[] => {
    if (Array.isArray(data)) {
      return data.map(item => item.startsWith('•') ? item : `• ${item}`);
    }
    if (typeof data === 'string') {
      return data.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.startsWith('•') ? line : `• ${line}`);
    }
    return ['• No data available'];
  };

  const marketImpact = processImpactData(analysisResult.marketImpact);
  const portfolioImpact = processImpactData(analysisResult.portfolioImpact);
  const goalImpact = processImpactData(analysisResult.goalImpact);

  // Calculate cycle score (mock data - replace with real calculation)
  const cycleScore = analysisResult.cycleScore || 79;

  // Use real cycle analysis from backend - NO FALLBACKS (forces AI to work)
  if (!analysisResult.cycleAnalysis) {
    throw new Error('Cycle analysis data missing - AI analysis may have failed');
  }

  const allCycles = analysisResult.cycleAnalysis.cycles;
  
  // Only show the 4 implemented cycles (exclude market and company for now)
  const cycleData = {
    country: allCycles.country,
    technology: allCycles.technology,
    economic: allCycles.economic,
    business: allCycles.business,
  };
  
  const portfolioAnalysis = analysisResult.cycleAnalysis.portfolioAnalysis;
  const goalAnalysis = analysisResult.cycleAnalysis.goalAnalysis;

  return (
    <div className="space-y-8">
      {/* Analysis Summary Header */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Portfolio Analysis Complete
            </h2>
            <p className="text-sm text-gray-600">
              Generated {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
            {conversationId && (
              <p className="text-xs text-gray-500 mt-1">ID: {conversationId}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>

      {/* 1. DETAILED CYCLE ANALYSIS - AT TOP */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Cycle Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">AI-powered analysis across 4 economic cycles</p>
        </div>
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setCycleAnalysisTab('cycle')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                cycleAnalysisTab === 'cycle'
                  ? 'border-b-2 border-secondary-teal text-secondary-teal bg-teal-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Cycle
              </div>
              <div className="text-xs text-gray-500 mt-1">4 Economic Cycles</div>
            </button>

            <button
              onClick={() => setCycleAnalysisTab('portfolio')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                cycleAnalysisTab === 'portfolio'
                  ? 'border-b-2 border-secondary-teal text-secondary-teal bg-teal-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Portfolio
              </div>
              <div className="text-xs text-gray-500 mt-1">Monte Carlo</div>
            </button>

            <button
              onClick={() => setCycleAnalysisTab('goal')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                cycleAnalysisTab === 'goal'
                  ? 'border-b-2 border-secondary-teal text-secondary-teal bg-teal-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Goal
              </div>
              <div className="text-xs text-gray-500 mt-1">Success Probability</div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {cycleAnalysisTab === 'cycle' && <CycleTab cycleData={cycleData} />}
          {cycleAnalysisTab === 'portfolio' && <PortfolioTab portfolioAnalysis={portfolioAnalysis} />}
          {cycleAnalysisTab === 'goal' && <GoalTab goalAnalysis={goalAnalysis} />}
        </div>
      </div>

      {/* 2. Analysis Results & Portfolio Sync */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowAnalysisAndSync(!showAnalysisAndSync)}
          className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">Analysis Results & Portfolio Sync</h3>
            <p className="text-sm text-gray-600 mt-1">Market impact and portfolio comparison</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transform transition-transform flex-shrink-0 ml-4 ${
              showAnalysisAndSync ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showAnalysisAndSync && (
          <div className="p-6 space-y-6">
            {/* Market Impact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Market Impact
              </h4>
              <ul className="space-y-2 text-gray-700">
                {marketImpact.map((item, idx) => (
                  <li key={idx} className="pl-4">{item}</li>
                ))}
              </ul>
            </div>

            {/* Portfolio Impact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Portfolio Impact
              </h4>
              <ul className="space-y-2 text-gray-700">
                {portfolioImpact.map((item, idx) => (
                  <li key={idx} className="pl-4">{item}</li>
                ))}
              </ul>
            </div>

            {/* Goal Impact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Goal Impact
              </h4>
              <ul className="space-y-2 text-gray-700">
                {goalImpact.map((item, idx) => (
                  <li key={idx} className="pl-4">{item}</li>
                ))}
              </ul>
            </div>

            {/* Metrics Table */}
            {analysisResult.metrics && analysisResult.metrics.length > 0 && (
              <div className="mt-6 overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recommendation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysisResult.metrics.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row[0]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row[1]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {row[2]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cycle Overview Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowCycleOverview(!showCycleOverview)}
          className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">Cycle Overview</h3>
            <p className="text-sm text-gray-600 mt-1">Choose a cycle to view its timeline and current phase</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transform transition-transform flex-shrink-0 ml-4 ${
              showCycleOverview ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showCycleOverview && (
          <div className="p-6">
            {/* Cycle Selector */}
            <div className="mb-6">
            <label htmlFor="cycle" className="block text-sm font-medium text-gray-700 mb-2">
              Cycle
            </label>
            <select
              id="cycle"
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value as 'technology' | 'economic')}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="technology">Technology Cycle</option>
              <option value="economic">Economic Cycle</option>
            </select>
          </div>

          {/* Cycle Gauge */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="8"
                    strokeDasharray={`${(cycleScore / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{cycleScore}</span>
                  <span className="text-sm text-gray-500">Cycle Score</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
                  {selectedCycle === 'technology' ? 'Frenzy → Synergy' : 'Late Stage'}
                </span>
              </div>
            </div>

            {/* Cycle Description */}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                {selectedCycle === 'technology' ? 'Technology Cycle' : 'Economic Cycle'}
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                {selectedCycle === 'technology' 
                  ? 'General-purpose tech wave from installation & frenzy to deployment & maturity, and maturity.'
                  : 'Economic cycles track the broader market conditions including inflation, interest rates, and overall economic health.'}
              </p>

              {/* Timeline (simplified) */}
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  {selectedCycle === 'technology' ? 'Technology Cycle Timeline' : 'Economic Cycle Timeline'}
                </h5>
                <div className="relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200"></div>
                  <div className="relative flex justify-between items-center">
                    {['Initiation', 'Frenzy', 'Synergy/Deployment', 'Maturity'].map((phase, idx) => (
                      <div key={phase} className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${idx === 2 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                        <span className="mt-2 text-xs text-gray-600 text-center max-w-[80px]">{phase}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-sm text-gray-600">
                      Current Phase: <span className="font-medium text-teal-600">Synergy/Deployment</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Scenario Stress Testing - COMING SOON */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Scenario Stress Testing</h3>
          <p className="text-sm text-gray-600 mt-1">Coming Soon</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 font-medium mb-2">Coming Soon</p>
            <p className="text-sm text-gray-500">
              Stress testing scenarios will allow you to test your portfolio against various historical market conditions.
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps / CTA */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-3">Next Step</h3>
        <p className="text-teal-100 mb-6">
          Work 1:1 with a strategist to optimize allocations for the current cycle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://clockwisecapital.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-center flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Match me with an advisor
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <button
            onClick={handleDownloadPDF}
            className="px-8 py-3 bg-teal-700 text-white font-semibold rounded-lg hover:bg-teal-800 transition-colors"
          >
            Download Report (PDF)
          </button>
        </div>
        <p className="mt-4 text-xs text-teal-200">
          Privacy: Your intake details are used solely to personalize your review and schedule your consultation. 
          We never sell your data. <a href="/privacy-policy" className="underline">Read our Privacy Policy</a> • 
          <a href="/disclaimer" className="underline ml-2">Read our Disclaimer Policy</a>
        </p>
      </div>
    </div>
  );
}
