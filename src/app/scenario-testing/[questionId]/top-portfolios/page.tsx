'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FiArrowLeft, FiAward, FiTrendingUp, FiUsers } from 'react-icons/fi';
import type { QuestionLeaderboardEntry, ScenarioQuestionWithAuthor } from '@/types/community';

type ScoreTier = {
  label: string;
  text: string;
  border: string;
  bg: string;
};

const getScoreTier = (score: number): ScoreTier => {
  if (score >= 90) {
    return { label: 'Excellent', text: 'text-green-400', border: 'border-green-500/50', bg: 'bg-green-500/20' };
  }
  if (score >= 75) {
    return { label: 'Strong', text: 'text-teal-400', border: 'border-teal-500/50', bg: 'bg-teal-500/20' };
  }
  if (score >= 60) {
    return { label: 'Moderate', text: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-500/20' };
  }
  return { label: 'Weak', text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/20' };
};

export default function TopPortfoliosPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.questionId as string;

  const [question, setQuestion] = useState<ScenarioQuestionWithAuthor | null>(null);
  const [leaderboard, setLeaderboard] = useState<QuestionLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        }
      } catch (error) {
        console.error('Failed to fetch question:', error);
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
          setLeaderboard(data.leaderboard || []);
        } else {
          // Use sample data if API fails
          setLeaderboard(getSampleLeaderboard());
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        // Use sample data on error
        setLeaderboard(getSampleLeaderboard());
      }
    };

    Promise.all([fetchQuestionDetails(), fetchLeaderboard()]).finally(() => setLoading(false));
  }, [questionId]);

  const averageReturn = useMemo(() => {
    if (!leaderboard.length) return 0;
    const total = leaderboard.reduce((sum, entry) => sum + (entry.expected_return || 0), 0);
    return total / leaderboard.length;
  }, [leaderboard]);

  const period = question?.historical_period?.[0];

  const getSampleLeaderboard = (): QuestionLeaderboardEntry[] => [
    {
      rank: 1,
      portfolio_id: 'sample-port-1',
      portfolio_name: 'Tech Growth Fund',
      user_id: 'sample-user-1',
      username: 'Alex Chen',
      display_name: 'Alex Chen',
      score: 87.5,
      expected_return: 0.156,
      upside: 0.285,
      downside: -0.065,
      tested_at: new Date().toISOString()
    },
    {
      rank: 2,
      portfolio_id: 'sample-port-2',
      portfolio_name: 'Balanced Index',
      user_id: 'sample-user-2',
      username: 'Jordan Smith',
      display_name: 'Jordan Smith',
      score: 78.3,
      expected_return: 0.124,
      upside: 0.215,
      downside: -0.085,
      tested_at: new Date().toISOString()
    },
    {
      rank: 3,
      portfolio_id: 'sample-port-3',
      portfolio_name: 'Value Dividend',
      user_id: 'sample-user-3',
      username: 'Morgan Davis',
      display_name: 'Morgan Davis',
      score: 72.1,
      expected_return: 0.098,
      upside: 0.178,
      downside: -0.045,
      tested_at: new Date().toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/scenario-testing/questions')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Top Portfolios</span>
        </button>

        {loading ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 text-center text-gray-400">
            Loading top portfolios...
          </div>
        ) : !question ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 text-center text-gray-400">
            Question not found.
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-lg mb-6">
              <div className="px-6 pt-6 pb-4">
                <div className="rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-500 px-6 py-7 text-center border border-teal-400/20">
                  <h1 className="text-xl md:text-2xl font-semibold text-white leading-snug">
                    {question.question_text || question.title}
                  </h1>
                </div>
              </div>
              {period && (
                <div className="px-6 pb-5">
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/30">
                      <FiAward className="w-3 h-3 text-teal-400" />
                    </span>
                    Based on {period.start}-{period.end} ({period.label}) scenario analysis
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-center hover:border-teal-500/50 transition-colors">
                <p className="text-2xl font-bold text-white">{question.tests_count.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Investors Testing</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-center hover:border-teal-500/50 transition-colors">
                <p className="text-2xl font-bold text-teal-400">
                  {averageReturn >= 0 ? '+' : ''}{(averageReturn * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">Avg Return</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-center hover:border-teal-500/50 transition-colors">
                <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
                <p className="text-xs text-gray-400">Top Portfolios</p>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-700 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-white">
                  Winning Portfolios for "{question.title}"
                </h2>
                <p className="text-xs text-gray-400">Tap to compare vs TIME</p>
              </div>
              <div className="divide-y divide-gray-800">
                {leaderboard.length === 0 ? (
                  <div className="px-6 py-8 text-sm text-gray-400">
                    No test results yet. Be the first to run a test.
                  </div>
                ) : (
                  leaderboard.map((entry) => {
                    const tier = getScoreTier(entry.score);
                    return (
                      <button
                        key={entry.portfolio_id}
                        onClick={() => router.push(`/scenario-testing/${questionId}/top-portfolios/${entry.portfolio_id}`)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-b-0 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            entry.rank === 1
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : entry.rank === 2
                                ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                : entry.rank === 3
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                  : 'bg-gray-700 text-gray-300'
                          }`}>
                            {entry.rank}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">{entry.portfolio_name}</p>
                            <p className="text-xs text-gray-400">
                              {(entry.display_name || entry.username || 'Investor')} • {(entry.expected_return * 100).toFixed(1)}% expected return
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border ${tier.border} ${tier.bg} text-right flex-shrink-0`}>
                          <p className={`text-sm font-bold ${tier.text}`}>{entry.score.toFixed(0)}</p>
                          <p className={`text-[10px] font-semibold ${tier.text}`}>{tier.label}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-5 bg-gray-900/50 border border-gray-700 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-gray-200 mb-2">Scenario Score Guide</p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  90-100 Excellent
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  75-89 Strong
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  60-74 Moderate
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  0-59 Weak
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
