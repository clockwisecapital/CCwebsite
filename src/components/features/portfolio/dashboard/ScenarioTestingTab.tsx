'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiTrendingUp, FiMessageSquare, FiClock, FiTarget, FiAward, FiBarChart2 } from 'react-icons/fi';
import { useAuth } from '@/lib/auth/AuthContext';
import ScenarioAuthModal from '@/components/features/auth/ScenarioAuthModal';
import FinishAccountButton from '@/components/features/auth/FinishAccountButton';
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
  // Intake form data for autofill
  email?: string;
  firstName?: string;
  lastName?: string;
}

export default function ScenarioTestingTab({ 
  portfolioData: _portfolioData, 
  portfolioId, 
  onNext: _onNext, 
  onBack: _onBack,
  email,
  firstName,
  lastName
}: ScenarioTestingTabProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<ScenarioQuestionWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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

  const requireAuth = (action: () => void) => {
    if (!user) {
      setPendingAction(() => action);
      setShowAuthPrompt(true);
      return false;
    }
    return true;
  };

  const handleQuestionClick = (questionId: string) => {
    if (!requireAuth(() => handleQuestionClick(questionId))) return;
    router.push(`/scenario-testing/${questionId}`);
  };

  const handleTestPortfolio = (questionId?: string) => {
    if (!requireAuth(() => handleTestPortfolio(questionId))) return;
    
    if (portfolioId) {
      sessionStorage.setItem('scenarioTestPortfolioId', portfolioId);
      if (questionId) {
        router.push(`/scenario-testing/${questionId}`);
      } else {
        router.push('/scenario-testing/questions');
      }
    } else {
      router.push('/kronos');
    }
  };

  const handleViewTopPortfolios = (questionId: string) => {
    if (!requireAuth(() => handleViewTopPortfolios(questionId))) return;
    router.push(`/scenario-testing/${questionId}/top-portfolios`);
  };

  const handleGoToCommunity = () => {
    if (!requireAuth(() => handleGoToCommunity())) return;
    if (portfolioId) {
      sessionStorage.setItem('scenarioTestPortfolioId', portfolioId);
    }
    router.push('/scenario-testing/questions');
  };

  const handleAuthSuccess = () => {
    setShowAuthPrompt(false);
    // Execute the pending action if there is one
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Section with Test Button */}
      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-blue-800 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <FiBarChart2 className="w-6 h-6 text-teal-400" />
              Scenario Testing Lab
            </div>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              Test your portfolio against real-world economic scenarios and see how it compares 
              to top-performing portfolios from the community.
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={() => handleTestPortfolio()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 
              bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg 
              transition-all hover:scale-105 shadow-lg"
          >
            <FiTarget className="w-5 h-5" />
            Test My Portfolio
          </button>
        </div>
      </div>

      {/* Portfolio Status */}
      {portfolioId && (
        <div className="bg-gradient-to-r from-teal-900/30 to-blue-900/30 border border-teal-500/30 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">✨ Your portfolio is ready for testing!</p>
              <p className="text-xs text-gray-300 mt-1">Select any scenario below or visit the community to explore all questions.</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Trending Questions Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <FiTrendingUp className="w-6 h-6 text-teal-400" />
              Trending Questions
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Top 3 scenarios from the community • <button onClick={handleGoToCommunity} className="text-teal-400 hover:text-teal-300 font-semibold">View all {questions.length}+</button>
            </p>
          </div>
          <button
            onClick={handleGoToCommunity}
            className="px-4 py-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 
              hover:border-teal-500/50 rounded-lg text-teal-400 hover:text-teal-300 text-sm font-semibold 
              transition-all flex items-center gap-2 group"
          >
            Full Community
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Questions List - Community Style Preview */}
        {!loading && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 
                  hover:border-teal-500/50 shadow-lg hover:shadow-xl transition-all group"
              >
                {/* Question Header with Author */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 border border-teal-400/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {question.author?.first_name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {question.author?.first_name && question.author?.last_name 
                          ? `${question.author.first_name} ${question.author.last_name}`
                          : question.author?.email?.split('@')[0] || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <FiClock className="w-3 h-3" />
                        <span>{question.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg 
                      flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                </div>

                {/* Question Banner - Community Style */}
                <div className="px-5 pt-4 pb-4">
                  <div className="rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-500 px-6 py-6 text-center border border-teal-400/20">
                    <p className="text-base md:text-lg font-semibold text-white leading-snug">
                      {question.question_text || question.title}
                    </p>
                  </div>
                </div>

                {/* Historical Analog */}
                {question.historical_period && Array.isArray(question.historical_period) && 
                 question.historical_period.length > 0 && (
                  <div className="px-5 pb-4">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/30">
                        <FiAward className="w-3 h-3 text-teal-400" />
                      </span>
                      Historical analog: {question.historical_period[0].start}-{question.historical_period[0].end} — {question.historical_period[0].label}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span className="font-semibold text-white">{question.likes_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMessageSquare className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-white">{question.comments_count}</span>
                      <span className="text-gray-400">comments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiTarget className="w-4 h-4 text-green-400" />
                      <span className="font-semibold text-white">{question.tests_count}</span>
                      <span className="text-gray-400">tests</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between border-t border-gray-700 px-5 py-3 bg-gray-900/50">
                  <button
                    onClick={() => handleQuestionClick(question.id)}
                    className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                  >
                    View Details
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestPortfolio(question.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-teal-400 
                        bg-teal-500/10 border border-teal-500/30 rounded-lg hover:bg-teal-500/20 transition-colors"
                    >
                      <FiTarget className="w-4 h-4" />
                      Test Portfolio
                    </button>
                    <button
                      onClick={() => handleViewTopPortfolios(question.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-200 
                        border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-teal-500 transition-colors"
                    >
                      <FiAward className="w-4 h-4" />
                      Top Portfolios
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && questions.length === 0 && (
          <div className="text-center py-12 bg-gray-900/40 rounded-xl border border-gray-700">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageSquare className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 mb-4">No scenario questions available yet.</p>
            <button
              onClick={handleGoToCommunity}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 
                text-white font-semibold rounded-lg transition-colors"
            >
              Explore Community
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>


      {/* Info Section */}
      <div className="bg-gradient-to-br from-blue-900/20 to-teal-900/20 rounded-xl p-5 border border-blue-800/30">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              💡 How Scenario Testing Works
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              Each scenario represents a real historical period or economic condition. When you test your portfolio, 
              we analyze how your allocation would have performed and compare it against optimized portfolios designed 
              for that specific environment.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-teal-400 font-semibold">
                <FiClock className="w-3 h-3" />
                Historical Analysis
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 font-semibold">
                <FiTarget className="w-3 h-3" />
                Portfolio Comparison
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <ScenarioAuthModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onSuccess={handleAuthSuccess}
        defaultEmail={email}
        defaultFirstName={firstName}
        defaultLastName={lastName}
      />
    </div>
  );
}


