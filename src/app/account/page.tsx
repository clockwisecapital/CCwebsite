'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import CorePortfoliosModal from '@/components/features/core-portfolios/CorePortfoliosModal';
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
  FiBriefcase,
  FiChevronDown,
  FiChevronUp,
  FiActivity,
  FiTrash2
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
  const [activeTab, setActiveTab] = useState<'portfolios' | 'questions'>('portfolios');
  
  // Expanded portfolio state
  const [expandedPortfolio, setExpandedPortfolio] = useState<string | null>(null);
  
  // Core Portfolios modal state
  const [showCorePortfoliosModal, setShowCorePortfoliosModal] = useState(false);

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

  const handleDeletePortfolio = async (portfolioId: string, portfolioName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${portfolioName}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete portfolio');
      }

      // Remove from local state
      setPortfolios(prev => prev.filter(p => p.id !== portfolioId));
      
      // Close expanded view if this portfolio was open
      if (expandedPortfolio === portfolioId) {
        setExpandedPortfolio(null);
      }

      alert('Portfolio deleted successfully');
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      alert('Failed to delete portfolio. Please try again.');
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <h1 
              style={{ fontSize: '28px' }}
              className="font-bold text-white bg-gradient-to-r from-white via-teal-100 to-blue-100 bg-clip-text text-transparent"
            >
              My Account
            </h1>
            <a
              href="https://wwws.betterment.com/clockwise-capital-llc/app/signup/?advisor_token=wJVA-fvpQ9g"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-teal-500/25 hover:scale-105 w-full sm:w-auto text-sm sm:text-base"
            >
              New Account
            </a>
          </div>
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
                  <h2 
                    style={{ fontSize: '22px' }}
                    className="font-bold text-white truncate"
                  >
                    {getDisplayName()}
                  </h2>
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
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-teal-500/25 hover:scale-105 w-full sm:w-auto text-sm sm:text-base"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <a
                    href="https://clients.betterment.com/clockwise-capital-llc/app/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-gray-500/25 w-full sm:w-auto text-sm sm:text-base"
                  >
                    <FiBriefcase className="w-4 h-4" />
                    Portfolio Login
                  </a>
                </div>
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
                    <span>Tests</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">{tests.length}</p>
                </div>
              </div>
              
              <div className="group relative p-4 sm:p-5 bg-gradient-to-br from-gray-900/70 to-gray-800/70 rounded-xl sm:rounded-2xl border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all duration-300" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm mb-2">
                    <FiThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                    <span>Likes</span>
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
              onClick={() => router.push('/scenario-testing/questions')}
              className="relative flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/25 hover:scale-105"
            >
              <FiBriefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Explore Portfolios</span>
              <span className="sm:hidden">Explore</span>
            </button>

            <button
              onClick={() => setShowCorePortfoliosModal(true)}
              className="relative flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-sm sm:text-base bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-teal-500/25"
            >
              <FiFileText className="w-4 h-4" />
              <span className="hidden sm:inline">Core Portfolios</span>
              <span className="sm:hidden">Portfolios</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
            {portfolios.length > 0 ? (
              portfolios.map((portfolio) => {
                const isExpanded = expandedPortfolio === portfolio.id;
                const holdings = portfolio.allocation?.holdings || [];
                
                return (
                  <div
                    key={portfolio.id}
                    className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg border border-gray-700/50 hover:border-teal-500/50 transition-all duration-300 backdrop-blur-sm overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/5 to-blue-500/5 rounded-full blur-2xl transition-all duration-300" />
                    
                    {/* Header - Clickable to expand/collapse */}
                    <div 
                      onClick={() => setExpandedPortfolio(isExpanded ? null : portfolio.id)}
                      className="relative z-10 p-3 sm:p-4 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <FiBriefcase className="w-4 h-4 text-teal-400 flex-shrink-0" />
                            <h3 className="text-lg sm:text-xl font-semibold text-white transition-colors truncate">
                              {portfolio.name}
                            </h3>
                          </div>
                          {portfolio.description && (
                            <p className="text-gray-400 mb-2 text-xs sm:text-sm line-clamp-1">{portfolio.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <FiClock className="w-3 h-3 flex-shrink-0" />
                              <span>{getTimeAgo(portfolio.created_at)}</span>
                            </div>
                            {portfolio.portfolio_score && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 rounded-full border border-teal-500/20">
                                <FiTrendingUp className="w-3 h-3 text-teal-400 flex-shrink-0" />
                                <span className="text-teal-400 font-semibold">{portfolio.portfolio_score}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <FiChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <FiChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content - Holdings */}
                    {isExpanded && (
                      <div className="relative z-10 border-t border-gray-700/50 p-3 sm:p-4">
                        <h4 className="text-sm font-semibold text-white mb-3">Portfolio Holdings</h4>
                        
                        {holdings.length > 0 ? (
                          <div className="space-y-2 mb-4">
                            {holdings.map((holding: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">{holding.ticker || holding.symbol}</p>
                                  {holding.name && (
                                    <p className="text-xs text-gray-400 truncate">{holding.name}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-teal-400">
                                    {holding.percentage ? `${holding.percentage.toFixed(1)}%` : 
                                     holding.allocation ? `${(holding.allocation * 100).toFixed(1)}%` : 'N/A'}
                                  </p>
                                  {holding.value && (
                                    <p className="text-xs text-gray-400">${holding.value.toLocaleString()}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 mb-4">No holdings data available</p>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/scenario-testing/questions');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
                          >
                            <FiActivity className="w-4 h-4" />
                            Test Portfolio
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePortfolio(portfolio.id, portfolio.name);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300 text-sm"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 sm:py-16 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl sm:rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-full flex items-center justify-center border-2 border-teal-500/30">
                  <FiBriefcase className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400" />
                </div>
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">No portfolios yet</p>
                <button
                  onClick={() => router.push('/kronos')}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-teal-500/25 hover:scale-105 text-sm sm:text-base"
                >
                  Create Your First Portfolio
                </button>
              </div>
            )}
          </div>

      </div>

      {/* Core Portfolios Modal */}
      <CorePortfoliosModal
        isOpen={showCorePortfoliosModal}
        onClose={() => setShowCorePortfoliosModal(false)}
      />
    </div>
  );
}
