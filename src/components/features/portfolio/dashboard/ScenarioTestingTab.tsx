'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ScenarioQuestionWithAuthor } from '@/types/community';

interface ScenarioTestingTabProps {
  portfolioData?: {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    alternatives: number;
  };
  portfolioId?: string;
  onNext?: () => void;
  onBack?: () => void;
}

export default function ScenarioTestingTab({ portfolioData: _portfolioData, portfolioId, onNext: _onNext, onBack: _onBack }: ScenarioTestingTabProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<ScenarioQuestionWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopQuestions();
  }, []);

  const fetchTopQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/questions?sort=trending&limit=3');
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (questionId: string) => {
    router.push(`/scenario-testing/${questionId}`);
  };

  const handleTestPortfolio = (questionId: string) => {
    if (portfolioId) {
      // Store the portfolio ID for testing
      sessionStorage.setItem('scenarioTestPortfolioId', portfolioId);
      // Navigate to the question page which will detect the stored portfolio and start testing
      router.push(`/scenario-testing/${questionId}`);
    }
  };

  const handleExploreAll = () => {
    if (portfolioId) {
      sessionStorage.setItem('scenarioTestPortfolioId', portfolioId);
    }
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
              to top-performing portfolios from the community.
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio Status */}
      {portfolioId && (
        <div className="bg-teal-900/20 border border-teal-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Your portfolio is ready for testing!</p>
              <p className="text-xs text-gray-400 mt-1">Select any scenario below to see how your portfolio performs.</p>
            </div>
          </div>
        </div>
      )}

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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          </div>
        )}

        {/* Questions List */}
        {!loading && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 
                  transition-all p-4 md:p-6"
              >
                {/* Question Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg 
                      flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg md:text-xl font-bold text-white mb-2 leading-tight">
                      {question.title}
                    </h4>
                    <p className="text-sm text-gray-400 mb-3">
                      {question.question_text}
                    </p>
                    
                    {/* Author and Stats */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {question.author && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>
                            {question.author.display_name || question.author.username || 
                              `${question.author.first_name || ''} ${question.author.last_name || ''}`.trim() || 'Anonymous'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{question.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{question.comments_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>{question.tests_count} tests</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {portfolioId ? (
                    <>
                      <button
                        onClick={() => handleTestPortfolio(question.id)}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold 
                          py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Test My Portfolio
                      </button>
                      <button
                        onClick={() => handleQuestionClick(question.id)}
                        className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white font-semibold 
                          py-3 px-4 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleQuestionClick(question.id)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold 
                        py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      View Question
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && questions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">No scenario questions available yet.</p>
            <button
              onClick={handleExploreAll}
              className="text-teal-400 hover:text-teal-300 font-semibold"
            >
              Explore Community →
            </button>
          </div>
        )}
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


