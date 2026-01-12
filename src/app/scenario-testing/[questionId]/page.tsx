'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ScenarioHeader from '@/components/features/scenario-testing/ScenarioHeader';
import PortfolioCard from '@/components/features/scenario-testing/PortfolioCard';
import { getQuestionById, getPortfoliosByQuestionId } from '@/lib/scenarioTestingData';

export default function TopPortfoliosPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.questionId as string;
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  const question = getQuestionById(questionId);
  const portfolios = getPortfoliosByQuestionId(questionId);

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white mb-4">Question Not Found</h2>
            <p className="text-gray-400 mb-8">
              The scenario question you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push('/scenario-testing/questions')}
              className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold 
                rounded-xl transition-all duration-300"
            >
              Browse All Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePortfolioClick = (portfolioId: string) => {
    // For now, just navigate back to Kronos or show a placeholder
    // In future, this would navigate to comparison view
    router.push(`/kronos`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/scenario-testing/questions')}
          className="flex items-center gap-2 text-gray-400 hover:text-white 
            transition-colors mb-8 group"
        >
          <svg 
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
          <span className="font-semibold">Back to Questions</span>
        </button>

        {/* Collapsible Question Header */}
        <div className="mb-8">
          <ScenarioHeader
            icon={question.icon}
            title={question.title}
            subtitle={question.subtitle}
            isCollapsible={true}
            isCollapsed={isCollapsed}
            onToggle={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        {/* Portfolios Section */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Top Portfolios in "{question.title}"
            </h2>
            <p className="text-gray-400">
              12-mo return estimates • derived from selected historical analog
            </p>
            <div className="flex items-center justify-end mt-2">
              <span className="text-sm font-semibold text-teal-400">Highest Score</span>
            </div>
          </div>

          {/* Portfolios List */}
          {portfolios.length > 0 ? (
            <div className="space-y-4">
              {portfolios.map((portfolio, index) => (
                <PortfolioCard
                  key={portfolio.id}
                  rank={index + 1}
                  icon={portfolio.icon}
                  name={portfolio.name}
                  subtitle={portfolio.subtitle}
                  metrics={portfolio.metrics}
                  onClick={() => handlePortfolioClick(portfolio.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                bg-gray-800 border-2 border-gray-700 mb-6">
                <svg 
                  className="w-10 h-10 text-gray-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No Portfolios Yet
              </h3>
              <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                Be the first to test your portfolio against this scenario!
              </p>
              <button
                onClick={() => router.push('/kronos')}
                className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold 
                  rounded-xl transition-all duration-300 shadow-xl hover:scale-105"
              >
                Submit Your Portfolio
              </button>
            </div>
          )}

          {/* Submit Portfolio CTA */}
          {portfolios.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}


