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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0a1525] to-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white via-teal-100 to-blue-100 bg-clip-text text-transparent">
            My Account
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage your profile, questions, and portfolio tests</p>
        </div>

        {/* Profile Card */}
        <div className="relative bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-900/90 rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-2xl backdrop-blur-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-teal-500/10 rounded-full blur-3xl -z-0" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-teal-500/30 to-blue-500/30 flex items-center justify-center border-4 border-teal-500/40 shadow-lg shadow-teal-500/20">
                    <FiUser className="w-8 h-8 sm:w-12 sm:h-12 text-teal-300" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-gray-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{getDisplayName()}</h2>
                  <p className="text-gray-400 flex items-center gap-2 mt-1 text-sm sm:text-base">
                    <FiMail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{profile?.email}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                    <FiClock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    Member since {profile?.created_at ? getTimeAgo(profile.created_at) : 'N/A'}
                  </p>
                </div>
              </div>

              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-teal-500/25 hover:scale-105 w-full sm:w-auto text-sm sm:text-base"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : null}
            </div>

            {/* Edit Profile Form */}
            {isEditingProfile && (
              <div className="p-4 sm:p-6 bg-gray-900/70 rounded-xl sm:rounded-2xl border border-gray-700/50 backdrop-blur-sm mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Edit Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-teal-500/25 text-sm sm:text-base"
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
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 text-sm sm:text-base"
                  >
                    <FiX className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="group relative p-4 sm:p-5 bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl sm:rounded-2xl border border-gray-700/50 hover:border-teal-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm mb-2">
                    <FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                    <span>Portfolios</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{portfolios.length}</p>
                </div>
              </div>
              
              <div className="group relative p-4 sm:p-5 bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl sm:rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm mb-2">
                    <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    <span>Questions</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{questions.length}</p>
                </div>
              </div>
              
              <div className="group relative p-4 sm:p-5 bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl sm:rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm mb-2">
                    <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    <span>Tests Run</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{tests.length}</p>
                </div>
              </div>
              
              <div className="group relative p-4 sm:p-5 bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl sm:rounded-2xl border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm mb-2">
                    <FiThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                    <span>Total Likes</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {questions.reduce((sum, q) => sum + q.likes_count, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative mb-6 sm:mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab('portfolios')}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'portfolios'
                  ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg shadow-teal-500/25'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700/80 border border-gray-700/50'
              }`}
            >
              <FiBriefcase className="w-4 h-4" />
              <span className="hidden sm:inline">My Portfolios</span>
              <span className="sm:hidden">Portfolios</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'portfolios' 
                  ? 'bg-white/20' 
                  : 'bg-gray-700'
              }`}>
                {portfolios.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('questions')}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'questions'
                  ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg shadow-teal-500/25'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700/80 border border-gray-700/50'
              }`}
            >
              <FiFileText className="w-4 h-4" />
              <span className="hidden sm:inline">My Questions</span>
              <span className="sm:hidden">Questions</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'questions' 
                  ? 'bg-white/20' 
                  : 'bg-gray-700'
              }`}>
                {questions.length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('tests')}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'tests'
                  ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg shadow-teal-500/25'
                  : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700/80 border border-gray-700/50'
              }`}
            >
              <FiBarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Test History</span>
              <span className="sm:hidden">Tests</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'tests' 
                  ? 'bg-white/20' 
                  : 'bg-gray-700'
              }`}>
                {tests.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'portfolios' && (
          <div className="space-y-3 sm:space-y-4">
            {portfolios.length > 0 ? (
              portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  onClick={() => router.push(`/dashboard`)}
                  className="relative group bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl sm:rounded-2xl border border-gray-700/50 p-4 sm:p-6 hover:border-teal-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-teal-500/10 backdrop-blur-sm overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/5 to-blue-500/5 rounded-full blur-2xl group-hover:from-teal-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
                  
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FiBriefcase className="w-5 h-5 text-teal-400 flex-shrink-0" />
                        <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-teal-400 transition-colors truncate">
                          {portfolio.name}
                        </h3>
                      </div>
                      {portfolio.description && (
                        <p className="text-gray-400 mb-3 text-sm sm:text-base line-clamp-2">{portfolio.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <FiClock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>Created {getTimeAgo(portfolio.created_at)}</span>
                        </div>
                        {portfolio.portfolio_score && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/10 rounded-full border border-teal-500/20">
                            <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-teal-400 flex-shrink-0" />
                            <span className="text-teal-400 font-semibold">Score: {portfolio.portfolio_score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl sm:rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-full flex items-center justify-center border-2 border-teal-500/30">
                  <FiBriefcase className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400" />
                </div>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">No portfolios yet</p>
                <button
                  onClick={() => router.push('/kronos')}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-teal-500/25 hover:scale-105 text-sm sm:text-base"
                >
                  Create Your First Portfolio
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-3 sm:space-y-4">
            {questions.length > 0 ? (
              questions.map((question) => (
                <div
                  key={question.id}
                  onClick={() => router.push(`/scenario-testing/${question.id}`)}
                  className="relative group bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl sm:rounded-2xl border border-gray-700/50 p-4 sm:p-6 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-500/10 backdrop-blur-sm overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-2xl group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start gap-2 mb-2">
                      <FiFileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                        {question.title}
                      </h3>
                    </div>
                    <p className="text-gray-300 mb-4 text-sm sm:text-base line-clamp-2">{question.question_text}</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <FiClock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{getTimeAgo(question.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-500/10 rounded-full border border-pink-500/20">
                        <FiThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400 flex-shrink-0" />
                        <span className="text-pink-400 font-semibold">{question.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                        <FiMessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-blue-400 font-semibold">{question.comments_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
                        <FiBarChart2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-purple-400 font-semibold">{question.tests_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl sm:rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border-2 border-blue-500/30">
                  <FiFileText className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                </div>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">No questions created yet</p>
                <button
                  onClick={() => router.push('/scenario-testing/questions')}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 text-sm sm:text-base"
                >
                  Create Your First Question
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="space-y-3 sm:space-y-4">
            {tests.length > 0 ? (
              tests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => router.push(`/scenario-testing/${test.question_id}/results?testId=${test.id}&portfolioId=${test.portfolio_id}`)}
                  className="relative group bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl sm:rounded-2xl border border-gray-700/50 p-4 sm:p-6 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 backdrop-blur-sm overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
                  
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <FiBarChart2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                          {(test.question as any)?.title || 'Unknown Question'}
                        </h3>
                      </div>
                      <p className="text-gray-400 mb-3 text-sm sm:text-base flex items-center gap-1.5">
                        <FiBriefcase className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{(test.portfolio as any)?.name || 'Unknown Portfolio'}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <FiClock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{getTimeAgo(test.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                          <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                          <span className="text-green-400 font-semibold">{(test.expected_return * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                        <p className="text-2xl sm:text-3xl font-bold text-purple-300">{test.score}</p>
                        <p className="text-xs text-gray-400 mt-0.5">score</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl sm:rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border-2 border-purple-500/30">
                  <FiBarChart2 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                </div>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">No test results yet</p>
                <button
                  onClick={() => router.push('/scenario-testing/questions')}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105 text-sm sm:text-base"
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
