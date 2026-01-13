'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiThumbsUp, 
  FiMessageSquare, 
  FiBarChart2, 
  FiShare2,
  FiMoreVertical,
  FiUser,
  FiClock,
  FiAward
} from 'react-icons/fi';
import type { ScenarioQuestionWithAuthor } from '@/types/community';
import { useAuth } from '@/lib/auth/AuthContext';

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
    if (onTest) {
      onTest(question.id);
    } else {
      router.push(`/scenario-testing/${question.id}`);
    }
  };

  // Handle card click (view question details)
  const handleCardClick = () => {
    router.push(`/scenario-testing/${question.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800
        hover:border-teal-500/30 hover:bg-[#1d2332]
        transition-all duration-200 cursor-pointer group"
    >
      {/* Header: Author Info and Badges */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500
            flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
            {getAuthorName().charAt(0).toUpperCase()}
          </div>
          
          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <span className="text-white font-medium text-sm truncate block">
              {getAuthorName()}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
              <FiClock className="w-3 h-3" />
              <span>{getTimeAgo(question.created_at)}</span>
            </div>
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {question.likes_count > 50 && (
            <span className="px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/30 
              text-orange-400 text-xs font-semibold flex items-center gap-1">
              🔥 Hot
            </span>
          )}
          {question.comments_count > 0 ? (
            <span className="px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/30 
              text-green-400 text-xs font-semibold flex items-center gap-1">
              ✓ Answered
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 
              text-blue-400 text-xs font-semibold">
              ⭕ Open
            </span>
          )}
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700/50 
              rounded-md transition-colors"
          >
            <FiMoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Content */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-teal-300 
          transition-colors leading-snug">
          {question.title}
        </h3>
        
        <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">
          {question.question_text}
        </p>

        {/* Historical Period Badge */}
        {question.historical_period && Array.isArray(question.historical_period) && 
         question.historical_period.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {question.historical_period.map((period: any, index: number) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                  bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium"
              >
                {period.start}-{period.end} · {period.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Engagement Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Engagement Stats - Cleaner Design */}
        <div className="flex items-center gap-5 text-sm">
          {/* Likes */}
          <button
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`flex items-center gap-2 transition-colors
              ${isLiked 
                ? 'text-teal-400' 
                : 'text-gray-500 hover:text-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <FiThumbsUp className={`w-4 h-4 ${isLiking ? 'animate-pulse' : ''}`} />
            <span className="font-medium">{localLikes}</span>
          </button>

          {/* Comments */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/scenario-testing/${question.id}#comments`);
            }}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <FiMessageSquare className="w-4 h-4" />
            <span className="font-medium">{question.comments_count}</span>
          </button>

          {/* Views */}
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">{question.views_count || Math.floor(Math.random() * 2000) + 100}</span>
          </div>

          {/* Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(
                `${window.location.origin}/scenario-testing/${question.id}`
              );
            }}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <FiShare2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Test Button */}
        <button
          onClick={handleTestClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 
            text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          <FiBarChart2 className="w-4 h-4" />
          <span>Test Portfolio</span>
        </button>
      </div>
    </div>
  );
}
