'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard from '@/components/features/scenario-testing/QuestionCard';
import { SCENARIO_QUESTIONS } from '@/lib/scenarioTestingData';

export default function QuestionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'questions' | 'portfolios'>('questions');

  const handleQuestionClick = (questionId: string) => {
    router.push(`/scenario-testing/${questionId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Explore Portfolio Testing
          </h1>
          <p className="text-lg text-gray-300">
            See the questions and portfolios that matter most to investors.
          </p>
        </div>

        {/* Navigation Tabs and Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Tabs */}
          <nav className="flex items-center gap-2 bg-gray-800 rounded-xl p-1 border border-gray-700">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'questions'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Top Questions
            </button>
            <button
              onClick={() => setActiveTab('portfolios')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'portfolios'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Top Portfolios
            </button>
          </nav>

          {/* Dropdown */}
          <select
            className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 
              font-semibold hover:bg-gray-750 transition-colors focus:ring-2 focus:ring-teal-500 
              focus:border-transparent cursor-pointer"
            onChange={(e) => {
              if (e.target.value) {
                handleQuestionClick(e.target.value);
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>Select New Question to Test</option>
            {SCENARIO_QUESTIONS.map((question) => (
              <option key={question.id} value={question.id}>
                {question.title} - {question.question}
              </option>
            ))}
          </select>
        </div>

        {/* Content Area */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Top Questions (ranked by streak)
              </h2>
              <p className="text-gray-400">
                Click a question to open the winning portfolio
              </p>
              <div className="flex items-center justify-end mt-2">
                <span className="text-sm font-semibold text-teal-400">Highest Score</span>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {SCENARIO_QUESTIONS.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  rank={index + 1}
                  icon={question.icon}
                  title={question.title}
                  subtitle={question.subtitle}
                  question={question.question}
                  stats={question.stats}
                  winningPortfolio={question.winningPortfolio}
                  onClick={() => handleQuestionClick(question.id)}
                />
              ))}
            </div>

            {/* Submit Portfolio CTA */}
            <div className="flex justify-center pt-12">
              <button
                onClick={() => router.push('/kronos')}
                className="px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold 
                  rounded-xl transition-all duration-300 shadow-xl hover:scale-105 
                  flex items-center gap-3"
              >
                Submit Portfolio
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'portfolios' && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
              bg-teal-500/20 border-2 border-teal-500/30 mb-6">
              <svg 
                className="w-10 h-10 text-teal-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Top Portfolios Coming Soon
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We're working on a comprehensive leaderboard showing top-performing portfolios 
              across all scenarios. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


