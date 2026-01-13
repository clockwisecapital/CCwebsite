'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import CommentThread from '@/components/features/community/CommentThread';
import HistoricalTimeline from '@/components/features/community/HistoricalTimeline';
import { 
  FiArrowLeft, 
  FiThumbsUp, 
  FiMessageSquare, 
  FiShare2, 
  FiEye, 
  FiUser,
  FiClock,
  FiBarChart2,
  FiAward,
  FiCalendar,
  FiTarget,
  FiTrendingUp
} from 'react-icons/fi';
import type { ScenarioQuestionWithAuthor, QuestionLeaderboardEntry } from '@/types/community';

export default function QuestionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const questionId = params.questionId as string;
  
  const [question, setQuestion] = useState<ScenarioQuestionWithAuthor | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuestionLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    fetchQuestionDetails();
    fetchLeaderboard();
  }, [questionId]);

  const fetchQuestionDetails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/community/questions/${questionId}`, { headers });
      const data = await response.json();

      if (response.ok && data.success) {
        setQuestion(data.question);
      } else {
        console.error('Failed to fetch question:', data.error);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/community/questions/${questionId}/tests?limit=10`, { headers });
      const data = await response.json();

      if (response.ok && data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleLikeToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isLiking || !question) return;

    setIsLiking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const method = question.is_liked_by_user ? 'DELETE' : 'POST';
      const response = await fetch(`/api/community/questions/${questionId}/like`, {
        method,
        headers
      });

      if (response.ok) {
        setQuestion(prev => prev ? {
          ...prev,
          likes_count: prev.is_liked_by_user 
            ? Math.max(0, prev.likes_count - 1) 
            : prev.likes_count + 1,
          is_liked_by_user: !prev.is_liked_by_user
        } : null);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/scenario-testing/${questionId}`;
    navigator.clipboard.writeText(url);
    // TODO: Show toast notification
    alert('Link copied to clipboard!');
  };

  const handleTestPortfolio = () => {
    const portfolioId = sessionStorage.getItem('scenarioTestPortfolioId');
    if (portfolioId) {
      router.push(`/scenario-testing/${questionId}/results`);
    } else {
      router.push(`/scenario-testing/questions`);
    }
  };

  const getAuthorName = () => {
    if (!question) return '';
    const author = question.author;
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name}`;
    }
    return author.email?.split('@')[0] || 'Anonymous';
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20 
        flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Question Not Found</h2>
          <p className="text-gray-400 mb-8">
            The scenario question you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/scenario-testing/questions')}
            className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold 
              rounded-xl transition-colors"
          >
            Browse All Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/scenario-testing/questions')}
          className="flex items-center gap-2 text-gray-400 hover:text-white 
            transition-colors mb-8 group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back to Feed</span>
        </button>

        {/* Question Card */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden mb-8">
          {/* Author Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center 
                  border-2 border-teal-500/30 flex-shrink-0">
                  <FiUser className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">{getAuthorName()}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <FiClock className="w-4 h-4" />
                    <span>{getTimeAgo(question.created_at)}</span>
                  </div>
                </div>
              </div>
              {question.is_featured && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full 
                  bg-accent-gold/20 border border-accent-gold/30 text-accent-gold text-sm font-bold">
                  <FiAward className="w-4 h-4" />
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Question Content */}
          <div className="p-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {question.title}
            </h1>

            <p className="text-xl text-teal-400 font-semibold mb-4">
              {question.question_text}
            </p>

            <p className="text-gray-300 text-lg mb-6 whitespace-pre-wrap">
              {question.description}
            </p>

            {/* Historical Period */}
            {question.historical_period && Array.isArray(question.historical_period) && 
             question.historical_period.length > 0 && (
              <>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {question.historical_period.map((period: any, index: number) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg 
                        bg-blue-500/20 border border-blue-500/30 text-blue-400 font-semibold"
                    >
                      <FiCalendar className="w-4 h-4" />
                      <span>{period.start}-{period.end} · {period.label}</span>
                    </div>
                  ))}
                </div>

                {/* How Testing Works Section */}
                <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border border-teal-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <FiTarget className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">
                        How Portfolio Testing Works
                      </h3>
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">
                        When you test your portfolio against this question, our Kronos system will:
                      </p>
                    </div>
                  </div>

                  <ol className="space-y-3 ml-2">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 
                        flex items-center justify-center text-teal-400 text-sm font-bold">1</span>
                      <p className="text-sm text-gray-300 pt-0.5">
                        <strong className="text-white">Analyze your allocation</strong> - We'll examine your portfolio's 
                        asset mix (stocks, bonds, cash, alternatives, etc.)
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 
                        flex items-center justify-center text-teal-400 text-sm font-bold">2</span>
                      <p className="text-sm text-gray-300 pt-0.5">
                        <strong className="text-white">Find the best historical analog</strong> - Within the selected 
                        period ({question.historical_period[0].start}-{question.historical_period[0].end}), we'll identify 
                        which specific timeframe best matches current market conditions
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 
                        flex items-center justify-center text-teal-400 text-sm font-bold">3</span>
                      <p className="text-sm text-gray-300 pt-0.5">
                        <strong className="text-white">Calculate expected returns</strong> - Based on how similar portfolios 
                        performed during that analog period, we'll project your expected return, upside, and downside scenarios
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 
                        flex items-center justify-center text-teal-400 text-sm font-bold">4</span>
                      <p className="text-sm text-gray-300 pt-0.5">
                        <strong className="text-white">Generate your score</strong> - You'll get a score comparing your 
                        portfolio's risk-adjusted performance to others who tested this scenario
                      </p>
                    </li>
                  </ol>

                  <div className="mt-6 pt-6 border-t border-teal-500/20">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <FiTrendingUp className="w-4 h-4 text-teal-400" />
                      <span className="font-semibold text-teal-400">Historical Period Timeline</span>
                    </div>
                    <HistoricalTimeline
                      startYear={question.historical_period[0].start}
                      endYear={question.historical_period[0].end}
                    />
                  </div>

                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-300 leading-relaxed">
                      <strong>💡 Pro Tip:</strong> The analog matching is dynamic - it considers current market conditions, 
                      cycle positions, and economic indicators to find the most relevant historical comparison within the 
                      selected period. Two people testing the same question today might get different analogs if they test 
                      at different times as conditions evolve.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {question.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-700/50 
                      border border-gray-600 text-gray-300 text-sm hover:bg-gray-700 
                      hover:border-teal-500/50 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-400 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-1.5">
                <FiEye className="w-4 h-4" />
                <span>{question.views_count.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiThumbsUp className="w-4 h-4" />
                <span>{question.likes_count} likes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiMessageSquare className="w-4 h-4" />
                <span>{question.comments_count} comments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiBarChart2 className="w-4 h-4" />
                <span>{question.tests_count} tests</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-6 bg-gray-900/50 border-t border-gray-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLikeToggle}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold 
                    transition-all duration-200 ${
                    question.is_liked_by_user
                      ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FiThumbsUp className="w-5 h-5" />
                  <span>{question.likes_count}</span>
                </button>

                <button
                  onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold 
                    bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <FiMessageSquare className="w-5 h-5" />
                  <span>{question.comments_count}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold 
                    bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <FiShare2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              <button
                onClick={handleTestPortfolio}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 
                  text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 
                  hover:shadow-lg hover:shadow-teal-500/30"
              >
                <FiBarChart2 className="w-5 h-5" />
                <span>Test My Portfolio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <FiAward className="w-6 h-6 text-accent-gold" />
                Leaderboard
              </h2>
              <p className="text-sm text-gray-400">
                Rankings based on risk-adjusted returns and portfolio resilience
              </p>
            </div>
            {leaderboard.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Total Tests</p>
                <p className="text-xl font-bold text-teal-400">{question?.tests_count || 0}</p>
              </div>
            )}
          </div>

          {/* How Scoring Works - Only show if there are results */}
          {leaderboard.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs font-semibold text-yellow-400 mb-2">
                🏆 How Scoring Works
              </p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Scores reflect risk-adjusted expected returns based on the historical analog match. Higher scores 
                indicate portfolios with better balance of upside potential and downside protection for the 
                matched historical period. Each test may use different analog periods depending on when it was run 
                and current market conditions.
              </p>
            </div>
          )}

          {leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.portfolio_id}
                  className="flex items-center justify-between gap-4 p-4 bg-gray-900/50 
                    rounded-lg border border-gray-700 hover:border-teal-500/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center 
                      justify-center border-2 flex-shrink-0 ${
                        entry.rank === 1 ? 'bg-yellow-500/20 border-yellow-500/50' :
                        entry.rank === 2 ? 'bg-gray-400/20 border-gray-400/50' :
                        entry.rank === 3 ? 'bg-orange-600/20 border-orange-600/50' :
                        'bg-teal-500/20 border-teal-500/30'
                      }`}>
                      <span className={`font-bold ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-gray-300' :
                        entry.rank === 3 ? 'text-orange-400' :
                        'text-teal-400'
                      }`}>#{entry.rank}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{entry.portfolio_name}</p>
                      <p className="text-sm text-gray-400">
                        by {entry.display_name || entry.username}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-teal-400">{entry.score.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">score</p>
                    {entry.expected_return !== undefined && (
                      <p className={`text-sm font-semibold mt-1 ${
                        entry.expected_return >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {entry.expected_return >= 0 ? '+' : ''}{(entry.expected_return * 100).toFixed(1)}% exp.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 
                flex items-center justify-center">
                <FiBarChart2 className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400">No test results yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div id="comments" className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <CommentThread questionId={questionId} />
        </div>
      </div>
    </div>
  );
}
