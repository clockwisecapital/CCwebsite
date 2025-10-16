'use client';

import { useState } from 'react';
import type { IntakeFormData, AnalysisResult } from './PortfolioDashboard';

interface ReviewTabProps {
  analysisResult: AnalysisResult;
  intakeData: IntakeFormData;
  conversationId: string | null;
  onReset: () => void;
}

export default function ReviewTab({ analysisResult, intakeData, conversationId, onReset }: ReviewTabProps) {
  const [selectedCycle, setSelectedCycle] = useState<'technology' | 'economic'>('technology');
  const [showStressTest, setShowStressTest] = useState(false);

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
  const portfolioSum = Object.values(intakeData.portfolio).reduce((sum, val) => sum + val, 0);

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

      {/* Analysis Results */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
        </div>
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
      </div>

      {/* Cycle Overview Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Cycle Overview</h3>
          <p className="text-sm text-gray-600 mt-1">Choose a cycle to view its timeline and current phase</p>
        </div>
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
      </div>

      {/* Portfolio Cycle Sync (Stress Test) */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Cycle Sync</h3>
          <p className="text-sm text-gray-600 mt-1">Your intake profiled the Current Portfolio. Edit any field and we&apos;ll auto-adjust Cash.</p>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">Stress test your portfolio against market scenarios.</p>

          {/* Current Portfolio Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="border border-gray-200 rounded-lg p-5 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Current Portfolio</h4>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
                  Cycle Score: {cycleScore}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Stocks:
                  </span>
                  <span className="font-medium">{intakeData.portfolio.stocks}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Bonds:
                  </span>
                  <span className="font-medium">{intakeData.portfolio.bonds}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Real Estate:
                  </span>
                  <span className="font-medium">{intakeData.portfolio.realEstate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Commodities:
                  </span>
                  <span className="font-medium">{intakeData.portfolio.commodities}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Cash:
                  </span>
                  <span className="font-medium">{intakeData.portfolio.cash}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Alternatives:
                  </span>
                  <span className="font-medium">{intakeData.portfolio.alternatives}%</span>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-semibold">
                  <span>Auto Cash:</span>
                  <span>{(100 - portfolioSum + intakeData.portfolio.cash).toFixed(1)}%</span>
                </div>
              </div>
              <button className="mt-4 w-full text-sm text-teal-600 hover:text-teal-700 font-medium">
                View Details
              </button>
            </div>

            {/* Benchmark Portfolio Card */}
            <div className="border border-teal-200 rounded-lg p-5 bg-teal-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Clockwise Portfolio</h4>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-200 text-teal-900">
                  Cycle Score: 78
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                This re-iterative score shows how our benchmark allocation aligns with the selected cycle. Higher is better. (Demo logic.)
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Stocks:
                  </span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Bonds:
                  </span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Real Estate:
                  </span>
                  <span className="font-medium">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Commodities:
                  </span>
                  <span className="font-medium">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Cash:
                  </span>
                  <span className="font-medium">5%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stress Test Button */}
          <button
            onClick={() => setShowStressTest(!showStressTest)}
            className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {showStressTest ? 'Hide' : 'Scenario Stress-Tests'}
          </button>

          {showStressTest && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-center">
                Stress testing scenarios coming soon. This feature will allow you to test your portfolio against various market conditions.
              </p>
            </div>
          )}
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
