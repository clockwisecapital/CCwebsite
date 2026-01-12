'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard from '@/components/features/scenario-testing/QuestionCard';
import { SCENARIO_QUESTIONS } from '@/lib/scenarioTestingData';

interface ScenarioTestingTabProps {
  portfolioData?: {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    alternatives: number;
  };
  onNext?: () => void;
  onBack?: () => void;
}

export default function ScenarioTestingTab({ portfolioData: _portfolioData, onNext: _onNext, onBack: _onBack }: ScenarioTestingTabProps) {
  const router = useRouter();

  const handleQuestionClick = (questionId: string) => {
    router.push(`/scenario-testing/${questionId}`);
  };

  const handleExploreAll = () => {
    router.push('/scenario-testing/questions');
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-4 md:p-6 border border-blue-800 shadow-sm">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-teal-600 rounded-2xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm md:text-lg font-bold text-teal-300 mb-1 md:mb-2">
              Scenario Testing Lab
            </div>
            <p className="text-xs md:text-base text-gray-300 leading-relaxed">
              Test your portfolio against real-world economic scenarios and see how it compares 
              to top-performing portfolios. Select a question below to begin.
            </p>
          </div>
        </div>
      </div>

      {/* Top Questions Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl md:text-2xl font-bold text-white">
            Top Scenario Questions
          </h3>
          <button
            onClick={handleExploreAll}
            className="text-teal-400 hover:text-teal-300 text-sm font-semibold 
              transition-colors flex items-center gap-2"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Show top 3 questions */}
        <div className="space-y-4">
          {SCENARIO_QUESTIONS.slice(0, 3).map((question, index) => (
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
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-4 md:p-6 text-white">
        <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">
          Ready to Test Your Portfolio?
        </h3>
        <p className="text-sm md:text-base text-teal-100 mb-4 md:mb-6">
          Explore all scenario questions and see how your portfolio performs in different market conditions.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExploreAll}
            className="flex-1 sm:flex-none px-6 md:px-8 py-3 bg-white text-teal-600 font-semibold 
              rounded-lg hover:bg-gray-100 transition-colors text-center flex items-center 
              justify-center gap-2 text-sm md:text-base"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explore All Scenarios
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-teal-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">
              How Scenario Testing Works
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Each scenario represents a real historical period or economic condition. 
              When you test your portfolio, we analyze how your allocation would have performed 
              and compare it against optimized portfolios designed for that specific environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


