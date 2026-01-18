/**
 * Scenario Testing Demo Page
 * 
 * Frontend test page for scenario testing functionality
 * Allows users to select sample portfolios and test questions
 * Shows TIME comparison results
 */

'use client';

import React, { useState } from 'react';
import { FiPlay, FiLoader, FiCheck, FiArrowRight } from 'react-icons/fi';
import TimeComparison from '@/components/features/community/TimePortfolioComparison';
import { SAMPLE_PORTFOLIOS, SAMPLE_QUESTIONS, generateTimeComparison, TIME_ADVANTAGES } from '@/lib/sampleScenarioTestingData';

interface TestResult {
  score: number;
  return: number;
  drawdown: number;
  scenario: string;
}

export default function ScenarioTestingDemo() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('sample-all-weather');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('q-volatility-1');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [timeResult, setTimeResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'select' | 'results' | 'insights'>('select');

  const portfolio = SAMPLE_PORTFOLIOS[selectedPortfolio as keyof typeof SAMPLE_PORTFOLIOS];
  const question = SAMPLE_QUESTIONS.find(q => q.id === selectedQuestion);

  const handleRunTest = async () => {
    if (!portfolio || !question) return;

    setLoading(true);
    
    // Simulate API call to scoring engine
    try {
      // Convert portfolio to holdings format for API
      const holdings = portfolio.holdings.map(h => ({
        ticker: h.ticker,
        weight: h.weight,
        assetClass: ''
      }));

      // Call scoring API
      const response = await fetch('/api/kronos/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          holdings
        })
      });

      if (!response.ok) throw new Error('Scoring failed');

      const data = await response.json();
      console.log('📊 API Response:', data);

      if (data.success) {
        // Extract user portfolio results
        const userPortfolio = data.userPortfolio || {};
        const timePortfolio = data.timePortfolio || {};
        
        const result = {
          score: userPortfolio.score || 0,
          return: userPortfolio.portfolioReturn || 0,
          drawdown: userPortfolio.portfolioDrawdown || 0,
          scenario: data.analogName || question.category
        };

        setTestResult(result);

        // Use actual TIME portfolio results from API
        const timeComparison = {
          userPortfolio: {
            score: userPortfolio.score || 0,
            return: userPortfolio.portfolioReturn || 0,
            drawdown: userPortfolio.portfolioDrawdown || 0
          },
          timePortfolio: {
            score: timePortfolio.score || 0,
            return: timePortfolio.portfolioReturn || 0,
            drawdown: timePortfolio.portfolioDrawdown || 0
          },
          comparison: data.comparison || {
            scoreDifference: (timePortfolio.score || 0) - (userPortfolio.score || 0),
            returnDifference: (timePortfolio.portfolioReturn || 0) - (userPortfolio.portfolioReturn || 0),
            drawdownImprovement: (userPortfolio.portfolioDrawdown || 0) - (timePortfolio.portfolioDrawdown || 0)
          }
        };
        
        console.log('📊 Test Result:', result);
        console.log('📊 TIME Comparison:', timeComparison);
        
        setTimeResult(timeComparison);

        setActiveTab('results');
      }
    } catch (error) {
      console.error('Test failed:', error);
      alert('Failed to run test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Scenario Testing</h1>
          <p className="text-gray-400">Test your portfolio against historical market scenarios and see how it compares to TIME</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('select')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'select'
                ? 'text-white border-b-2 border-emerald-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            1. Select Portfolio
          </button>
          <button
            onClick={() => setActiveTab('results')}
            disabled={!testResult}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'results'
                ? 'text-white border-b-2 border-emerald-500'
                : 'text-gray-400 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            2. Test Results
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'insights'
                ? 'text-white border-b-2 border-emerald-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            3. Why TIME Wins
          </button>
        </div>

        {/* Content */}
        {activeTab === 'select' && (
          <div className="space-y-8">
            {/* Portfolio Selection */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Select a Portfolio</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(SAMPLE_PORTFOLIOS).map(([key, port]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedPortfolio(key)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPortfolio === key
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {selectedPortfolio === key && <FiCheck className="w-5 h-5 text-emerald-400" />}
                      <h3 className="font-semibold text-white">{port.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{port.description}</p>
                    
                    <div className="space-y-1 text-xs text-gray-500">
                      <p>Expected Return: <span className="text-emerald-400 font-semibold">{(port.expectedReturn * 100).toFixed(1)}%</span></p>
                      <p>Max Drawdown: <span className="text-red-400 font-semibold">{(port.expectedDownside * 100).toFixed(1)}%</span></p>
                      <p>Holdings: <span className="text-blue-400 font-semibold">{port.holdings.length}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Portfolio Details */}
              {portfolio && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Holdings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {portfolio.holdings.map((holding, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-800/50 p-3 rounded">
                        <div>
                          <p className="font-semibold text-white">{holding.ticker}</p>
                          <p className="text-xs text-gray-400">{holding.name}</p>
                        </div>
                        <p className="font-semibold text-emerald-400">{(holding.weight * 100).toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Question Selection */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Select a Scenario Question</h2>
              
              <div className="space-y-3">
                {SAMPLE_QUESTIONS.map(q => (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestion(q.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedQuestion === q.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {selectedQuestion === q.id && <FiCheck className="w-5 h-5 text-emerald-400" />}
                        <h3 className="font-semibold text-white">{q.title}</h3>
                      </div>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{q.category}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{q.question}</p>
                    <p className="text-xs text-gray-500 italic">{q.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Run Test Button */}
            <button
              onClick={handleRunTest}
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <FiPlay className="w-5 h-5" />
                  Run Scenario Test
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && testResult && timeResult && (
          <div className="space-y-6">
            {/* Test Info */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Portfolio</p>
                  <p className="text-lg font-bold text-white">{portfolio?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Scenario</p>
                  <p className="text-lg font-bold text-white">{question?.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Historical Period</p>
                  <p className="text-lg font-bold text-white">{testResult.scenario}</p>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <TimeComparison
              userScore={timeResult?.userPortfolio?.score || testResult.score}
              timeScore={timeResult?.timePortfolio?.score || 0}
              userReturn={timeResult?.userPortfolio?.return || testResult.return}
              timeReturn={timeResult?.timePortfolio?.return || 0}
              userDrawdown={timeResult?.userPortfolio?.drawdown || testResult.drawdown}
              timeDrawdown={timeResult?.timePortfolio?.drawdown || 0}
              scenarioName={question?.title || 'scenario'}
            />

            {/* Try Another */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setActiveTab('select');
                  setTestResult(null);
                  setTimeResult(null);
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Try Another Portfolio
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Learn More <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {Object.entries(TIME_ADVANTAGES).map(([key, advantage]) => (
              <div key={key} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  {advantage.title}
                </h3>
                
                <ul className="space-y-3">
                  {advantage.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span className="text-gray-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Final CTA */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">Ready to Upgrade Your Portfolio?</h3>
              <p className="text-gray-300 mb-6">
                Stop guessing. Get professional active management that adapts to market cycles.
              </p>
              <div className="flex gap-4 justify-center">
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                  Learn About TIME
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                  Schedule a Call
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
