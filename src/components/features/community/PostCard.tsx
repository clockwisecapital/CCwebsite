'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiThumbsUp, 
  FiMessageSquare, 
  FiBarChart2, 
  FiShare2,
  FiClock,
  FiAward,
  FiSend
} from 'react-icons/fi';
import type { ScenarioQuestionWithAuthor } from '@/types/community';
import { useAuth } from '@/lib/auth/AuthContext';
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
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{ author: string; text: string; timestamp: string }>>([]);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

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
    // Save to session storage for the test results page
    sessionStorage.setItem('scenarioTestPortfolioId', portfolioId);
    sessionStorage.setItem('scenarioTestPortfolioName', portfolioName);
    
    // Navigate directly to the portfolio comparison view
    router.push(`/scenario-testing/${question.id}/top-portfolios/${portfolioId}`);
    setShowPortfolioModal(false);
  };

  const handleTopPortfolios = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/scenario-testing/${question.id}/top-portfolios`);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    
    const now = new Date();
    setComments(prev => [...prev, {
      author: user.email?.split('@')[0] || 'You',
      text: commentText,
      timestamp: 'now'
    }]);
    setCommentText('');
  };

  const fetchComments = async () => {
    if (loadingComments || comments.length > 0) return; // Don't refetch if already loaded
    
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/community/questions/${question.id}/comments`);
      const data = await response.json();
      
      if (response.ok && data.comments) {
        setComments(data.comments.map((c: any) => ({
          author: c.author_name || c.author_email?.split('@')[0] || 'Anonymous',
          text: c.content || c.text,
          timestamp: getTimeAgo(c.created_at)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      // Fall back to empty comments if fetch fails
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 
        hover:border-teal-500/50 shadow-lg hover:shadow-xl transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 border border-teal-400/30 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {getAuthorName().charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{getAuthorName()}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>@{(question.author && question.author.email) ? question.author.email.split('@')[0] : 'investor'}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <FiClock className="w-3 h-3" />
                {getTimeAgo(question.created_at)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(
              `${window.location.origin}/scenario-testing/${question.id}`
            );
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-300 
            border border-gray-600 rounded-full hover:bg-gray-700 hover:border-teal-500 transition-colors"
        >
          <FiShare2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>

      {/* Question Banner */}
      <div className="px-5 pb-4">
        <div className="rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-500 px-6 py-8 text-center border border-teal-400/20">
          <p className="text-lg md:text-xl font-semibold text-white leading-snug">
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
            <FiThumbsUp className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-white">{localLikes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiMessageSquare className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white">{question.comments_count}</span>
            <span className="text-gray-400">comments</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-700 px-5 py-3 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors
              ${isLiked 
                ? 'text-teal-400' 
                : 'text-gray-400 hover:text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <FiThumbsUp className={`w-4 h-4 ${isLiking ? 'animate-pulse' : ''}`} />
            Like
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newShowComments = !showComments;
              setShowComments(newShowComments);
              if (newShowComments) {
                fetchComments();
              }
            }}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <FiMessageSquare className="w-4 h-4" />
            Comment
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestClick}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 
              border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-teal-500 transition-colors"
          >
            <FiBarChart2 className="w-4 h-4" />
            Test My Portfolio
          </button>
          <button
            onClick={handleTopPortfolios}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-teal-400 
              bg-teal-500/10 border border-teal-500/30 rounded-lg hover:bg-teal-500/20 transition-colors"
          >
            <FiAward className="w-4 h-4" />
            Top Portfolios
          </button>
        </div>
      </div>

      {/* Inline Comments */}
      {showComments && (
        <div className="border-t border-gray-700 px-5 py-4 bg-gray-950/50">
          {/* Loading State */}
          {loadingComments && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-teal-500 rounded-full animate-spin" />
                Loading comments...
              </div>
            </div>
          )}

          {/* Comments List */}
          {!loadingComments && comments.length > 0 && (
            <div className="mb-4 space-y-3">
              {comments.map((comment, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 
                    flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{comment.author}</p>
                    <p className="text-sm text-gray-300 mt-0.5">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{comment.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Comments State */}
          {!loadingComments && comments.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          )}

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex items-end gap-2 border-t border-gray-800 pt-3">
            <div className="flex-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={user ? "Write a comment..." : "Sign in to comment..."}
                disabled={!user}
                className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-600"
              />
            </div>
            <button
              type="submit"
              disabled={!commentText.trim() || !user}
              className="p-2 text-teal-400 hover:bg-teal-500/10 rounded-lg 
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title={!user ? "Sign in to comment" : "Post comment"}
            >
              <FiSend className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

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
