'use client';

import React, { useState } from 'react';
import { FiUser, FiClock, FiThumbsUp, FiMessageCircle, FiSend } from 'react-icons/fi';
import { useAuth } from '@/lib/auth/AuthContext';
import type { QuestionCommentWithAuthor } from '@/types/community';

interface CommentCardProps {
  comment: QuestionCommentWithAuthor;
  onReply?: (parentCommentId: string, content: string) => Promise<void>;
  isReply?: boolean;
}

export default function CommentCard({ comment, onReply, isReply = false }: CommentCardProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const author = comment.author;
    if (author.first_name && author.last_name) {
      return `${author.first_name} ${author.last_name}`;
    }
    return author.email?.split('@')[0] || 'Anonymous';
  };

  // Handle reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!replyText.trim() || !onReply) return;

    setIsSubmitting(true);

    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Failed to submit reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${isReply ? 'ml-8 md:ml-12' : ''}`}>
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
        {/* Comment Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-teal-500/20 
            flex items-center justify-center flex-shrink-0 border-2 border-teal-500/30">
            <FiUser className="w-4 h-4 md:w-5 md:h-5 text-teal-400" />
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm">
                {getAuthorName()}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <FiClock className="w-3 h-3" />
              <span>{getTimeAgo(comment.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Comment Content */}
        <div className="mb-3">
          <p className="text-gray-200 text-sm md:text-base whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-3">
          {/* Like Button */}
          <button
            onClick={() => {
              // TODO: Implement comment like functionality
              console.log('Like comment:', comment.id);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold 
              transition-all duration-200 ${
              comment.is_liked_by_user
                ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FiThumbsUp className="w-3.5 h-3.5" />
            <span>{comment.likes_count}</span>
          </button>

          {/* Reply Button */}
          {!isReply && user && onReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold 
                bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <FiMessageCircle className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && onReply && (
          <form onSubmit={handleReplySubmit} className="mt-4 relative">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              disabled={isSubmitting}
              className="w-full px-3 py-2 pr-10 bg-gray-900 border border-gray-700 rounded-lg 
                text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-teal-500 
                focus:border-transparent transition-all resize-none
                disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={5000}
            />
            <button
              type="submit"
              disabled={isSubmitting || !replyText.trim()}
              className="absolute bottom-2 right-2 p-1.5 bg-teal-600 hover:bg-teal-700 text-white 
                rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:bg-teal-600"
            >
              <FiSend className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">{replyText.length}/5000</p>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                }}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onReply={onReply}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
