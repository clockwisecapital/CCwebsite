'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiThumbsUp, 
  FiMessageSquare, 
  FiBarChart2, 
  FiClock,
  FiAward,
  FiShare2,
} from 'react-icons/fi';
import type { ScenarioQuestionWithAuthor } from '@/types/community';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import PortfolioSelectionModal from './PortfolioSelectionModal';

interface PostCardProps {
  question: ScenarioQuestionWithAuthor;
  onLike?: (questionId: string) => Promise<void>;
  onUnlike?: (questionId: string) => Promise<void>;
  onTest?: (questionId: string) => void;
}

export default function PostCard({ question, onLike, onUnlike, onTest }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(question.likes_count);
  const [isLiked, setIsLiked] = useState(question.is_liked_by_user || false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Sync local state when question prop changes (e.g., after page refresh)
  useEffect(() => {
    setLocalLikes(question.likes_count);
    setIsLiked(question.is_liked_by_user || false);
  }, [question.id, question.likes_count, question.is_liked_by_user]);

  // Format timestamp
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format author name
  const getAuthorName = () => {
    const author = question.author;
    if (!author) return 'Anonymous';
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name}`;
    }
    return author.email?.split('@')[0] || 'Anonymous';
  };

  // Handle like/unlike
  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    
    try {
      if (isLiked) {
        // Unlike
        setLocalLikes(prev => Math.max(0, prev - 1));
        setIsLiked(false);
        if (onUnlike) {
          await onUnlike(question.id);
        }
      } else {
        // Like
        setLocalLikes(prev => prev + 1);
        setIsLiked(true);
        if (onLike) {
          await onLike(question.id);
        }
      }
    } catch (error) {
      // Revert on error
      setLocalLikes(question.likes_count);
      setIsLiked(question.is_liked_by_user || false);
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle test button click
  const handleTestClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (!user) {
      router.push('/login');
      return;
    }
    setShowPortfolioModal(true);
  };

  const handlePortfolioSelect = (portfolioId: string, portfolioName: string) => {
    // Close modal
    setShowPortfolioModal(false);
    
    // Call parent's onTest handler which runs real Kronos scoring
    if (onTest) {
      // Store selected portfolio info for the test
      sessionStorage.setItem('scenarioTestPortfolioId', portfolioId);
      sessionStorage.setItem('scenarioTestPortfolioName', portfolioName);
      
      // Trigger the real test (parent handles Kronos API call)
      onTest(question.id);
    }
  };

  const handleTopPortfolios = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/scenario-testing/${question.id}/top-portfolios`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText('https://clockwisecapital.com/kronos');
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl sm:rounded-2xl border border-gray-700 
        hover:border-teal-500/50 shadow-lg hover:shadow-xl transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 md:px-5 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 border border-teal-400/30 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs sm:text-sm">
              {getAuthorName().charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold text-white truncate">{getAuthorName()}</p>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
              <span className="truncate max-w-[100px] sm:max-w-none">@{(question.author && question.author.email) ? question.author.email.split('@')[0] : 'investor'}</span>
              <span className="flex-shrink-0">•</span>
              <span className="inline-flex items-center gap-1 flex-shrink-0">
                <FiClock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {getTimeAgo(question.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Banner - Clickable to view top portfolios */}
      <div className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4">
        <button
          onClick={handleTopPortfolios}
          className="w-full rounded-lg sm:rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-500 px-4 sm:px-5 md:px-6 py-5 sm:py-6 md:py-8 text-center border border-teal-400/20 hover:from-teal-600 hover:via-emerald-600 hover:to-blue-600 transition-all cursor-pointer"
        >
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white leading-snug break-words">
            {question.question_text || question.title}
          </p>
        </button>
      </div>

      {/* Economic Cycle Tag & Testing Count */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 md:px-5 pb-3 sm:pb-4">
        {question.tags && question.tags.length > 0 ? (
          <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold
            bg-purple-500/20 border border-purple-500/30 text-purple-300 capitalize"
          >
            {question.tags[0]} Cycle
          </span>
        ) : (
          <div />
        )}
        <div className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gray-800/50 border border-gray-700">
          <FiBarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-400 mr-1.5 sm:mr-2" />
          <span className="text-[10px] sm:text-xs font-semibold text-white">{question.tests_count}</span>
          <span className="text-[10px] sm:text-xs text-gray-400 ml-1 sm:ml-1.5">
            <span className="hidden xs:inline">Investors Testing</span>
            <span className="xs:hidden">Testing</span>
          </span>
        </div>
      </div>

      {/* Historical Analog */}
      {question.historical_period && Array.isArray(question.historical_period) && 
       question.historical_period.length > 0 && (
        <div className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4">
          <p className="text-[10px] sm:text-xs text-gray-400 flex items-start sm:items-center gap-1.5 sm:gap-2 break-words">
            <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-teal-500/20 border border-teal-500/30 flex-shrink-0 mt-0.5 sm:mt-0">
              <FiAward className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-400" />
            </span>
            <span className="flex-1">
              <span className="hidden sm:inline">Historical analog: </span>
              <span className="sm:hidden">Analog: </span>
              {question.historical_period[0].start}-{question.historical_period[0].end} — {question.historical_period[0].label}
            </span>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4">
        <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FiThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
            <span className="font-semibold text-white">{localLikes.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 xs:gap-0 border-t border-gray-700 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 bg-gray-900/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-colors
              ${isLiked 
                ? 'text-teal-400' 
                : 'text-gray-400 hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <FiThumbsUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLiking ? 'animate-pulse' : ''}`} />
            Like
          </button>
          <button
            onClick={handleShare}
            className="relative flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-colors text-gray-400 hover:text-white"
          >
            <FiShare2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Share
            {showCopied && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs bg-teal-500 text-white rounded whitespace-nowrap">
                Copied!
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleTestClick}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-gray-200 
              border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-teal-500 transition-colors flex-1 xs:flex-initial whitespace-nowrap"
          >
            <FiBarChart2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Test My Portfolio</span>
            <span className="xs:hidden">Test Portfolio</span>
          </button>
          <button
            onClick={handleTopPortfolios}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-teal-400 
              bg-teal-500/10 border border-teal-500/30 rounded-lg hover:bg-teal-500/20 transition-colors flex-1 xs:flex-initial whitespace-nowrap"
          >
            <FiAward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Top Portfolios
          </button>
        </div>
      </div>

      {/* Portfolio Selection Modal */}
      <PortfolioSelectionModal
        isOpen={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        onPortfolioSelect={handlePortfolioSelect}
        questionId={question.id}
      />
    </div>
  );
}
