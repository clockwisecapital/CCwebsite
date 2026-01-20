'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { 
  FiUser, 
  FiMail, 
  FiEdit2, 
  FiSave, 
  FiX, 
  FiFileText,
  FiBarChart2,
  FiTrendingUp,
  FiClock,
  FiThumbsUp,
  FiMessageSquare,
  FiBriefcase
} from 'react-icons/fi';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface UserQuestion {
  id: string;
  title: string;
  question_text: string;
  likes_count: number;
  comments_count: number;
  tests_count: number;
  created_at: string;
}

interface UserTest {
  id: string;
  question_id: string;
  portfolio_id: string;
  score: number;
  expected_return: number;
  created_at: string;
  question: {
    title: string;
  };
  portfolio: {
    name: string;
  };
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<UserQuestion[]>([]);
  const [tests, setTests] = useState<UserTest[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'portfolios' | 'questions' | 'tests'>('portfolios');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchUserData();
    }
  }, [user, authLoading, router]);

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
        setEditFirstName(profileData.first_name || '');
        setEditLastName(profileData.last_name || '');
      }

      // Fetch user's questions
      const { data: questionsData } = await supabase
        .from('scenario_questions')
        .select('id, title, question_text, likes_count, comments_count, tests_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (questionsData) {
        setQuestions(questionsData);
      }

      // Fetch user's test results
      const { data: testsData } = await supabase
        .from('question_tests')
        .select(`
          id,
          question_id,
          portfolio_id,
          score,
          expected_return,
          created_at,
          question:scenario_questions(title),
          portfolio:portfolios(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (testsData) {
        setTests(testsData as any);
      }

      // Fetch portfolios
      const portfoliosResponse = await fetch('/api/portfolios/list', { headers });
      const portfoliosData = await portfoliosResponse.json();
      
      if (portfoliosResponse.ok && portfoliosData.portfolios) {
        setPortfolios(portfoliosData.portfolios);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editFirstName.trim() || null,
          last_name: editLastName.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        first_name: editFirstName.trim() || null,
        last_name: editLastName.trim() || null
      } : null);

      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) return profile.first_name;
    return profile?.email.split('@')[0] || 'User';
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return then.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20 
        flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">My Account</h1>
          <p className="text-gray-400">Manage your profile, questions, and portfolio tests</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center 
                border-4 border-teal-500/30">
                <FiUser className="w-10 h-10 text-teal-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{getDisplayName()}</h2>
                <p className="text-gray-400 flex items-center gap-2 mt-1">
                  <FiMail className="w-4 h-4" />
                  {profile?.email}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Member since {profile?.created_at ? getTimeAgo(profile.created_at) : 'N/A'}
                </p>
              </div>
            </div>

            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 
                  text-white font-semibold rounded-lg transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : null}
          </div>

          {/* Edit Profile Form */}
          {isEditingProfile && (
            <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                      text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 
                      focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                      text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 
                      focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 
                    text-white font-semibold rounded-lg transition-colors disabled:opacity-50 
                    disabled:cursor-not-allowed"
                >
                  <FiSave className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditFirstName(profile?.first_name || '');
                    setEditLastName(profile?.last_name || '');
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 
                    text-white font-semibold rounded-lg transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <FiBriefcase className="w-4 h-4" />
                <span>Portfolios</span>
              </div>
              <p className="text-2xl font-bold text-white">{portfolios.length}</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <FiFileText className="w-4 h-4" />
                <span>Questions</span>
              </div>
              <p className="text-2xl font-bold text-white">{questions.length}</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <FiBarChart2 className="w-4 h-4" />
                <span>Tests Run</span>
              </div>
              <p className="text-2xl font-bold text-white">{tests.length}</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <FiThumbsUp className="w-4 h-4" />
                <span>Total Likes</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {questions.reduce((sum, q) => sum + q.likes_count, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('portfolios')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold 
              transition-all whitespace-nowrap ${
              activeTab === 'portfolios'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            <FiBriefcase className="w-4 h-4" />
            My Portfolios ({portfolios.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold 
              transition-all whitespace-nowrap ${
              activeTab === 'questions'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            <FiFileText className="w-4 h-4" />
            My Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold 
              transition-all whitespace-nowrap ${
              activeTab === 'tests'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
          >
            <FiBarChart2 className="w-4 h-4" />
            Test History ({tests.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'portfolios' && (
          <div className="space-y-4">
            {portfolios.length > 0 ? (
              portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  onClick={() => router.push(`/dashboard`)}
                  className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-teal-500/50 
                    transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-teal-400 
                        transition-colors mb-2">
                        {portfolio.name}
                      </h3>
                      {portfolio.description && (
                        <p className="text-gray-400 mb-3">{portfolio.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          <span>Created {getTimeAgo(portfolio.created_at)}</span>
                        </div>
                        {portfolio.portfolio_score && (
                          <div className="flex items-center gap-1">
                            <FiTrendingUp className="w-4 h-4" />
                            <span>Score: {portfolio.portfolio_score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                <FiBriefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No portfolios yet</p>
                <button
                  onClick={() => router.push('/kronos')}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold 
                    rounded-lg transition-colors"
                >
                  Create Your First Portfolio
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            {questions.length > 0 ? (
              questions.map((question) => (
                <div
                  key={question.id}
                  onClick={() => router.push(`/scenario-testing/${question.id}`)}
                  className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-teal-500/50 
                    transition-colors cursor-pointer group"
                >
                  <h3 className="text-xl font-bold text-white group-hover:text-teal-400 
                    transition-colors mb-2">
                    {question.title}
                  </h3>
                  <p className="text-gray-300 mb-4">{question.question_text}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      <span>{getTimeAgo(question.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiThumbsUp className="w-4 h-4" />
                      <span>{question.likes_count} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMessageSquare className="w-4 h-4" />
                      <span>{question.comments_count} comments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiBarChart2 className="w-4 h-4" />
                      <span>{question.tests_count} tests</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                <FiFileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No questions created yet</p>
                <button
                  onClick={() => router.push('/scenario-testing/questions')}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold 
                    rounded-lg transition-colors"
                >
                  Create Your First Question
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-4">
            {tests.length > 0 ? (
              tests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => router.push(`/scenario-testing/${test.question_id}/results?testId=${test.id}&portfolioId=${test.portfolio_id}`)}
                  className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-teal-500/50 
                    transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-teal-400 
                        transition-colors mb-1">
                        {(test.question as any)?.title || 'Unknown Question'}
                      </h3>
                      <p className="text-gray-400 mb-3">
                        Portfolio: {(test.portfolio as any)?.name || 'Unknown Portfolio'}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          <span>{getTimeAgo(test.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiTrendingUp className="w-4 h-4" />
                          <span>Return: {(test.expected_return * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-teal-400">{test.score}</p>
                      <p className="text-xs text-gray-500">score</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                <FiBarChart2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No test results yet</p>
                <button
                  onClick={() => router.push('/scenario-testing/questions')}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold 
                    rounded-lg transition-colors"
                >
                  Test Your First Portfolio
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
