'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import CommentCard from './CommentCard';
import { FiMessageSquare, FiSend } from 'react-icons/fi';
import type { QuestionCommentWithAuthor, CreateCommentInput } from '@/types/community';

interface CommentThreadProps {
  questionId: string;
}

export default function CommentThread({ questionId }: CommentThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<QuestionCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [questionId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/community/questions/${questionId}/comments`, { headers });
      const data = await response.json();

      if (response.ok && data.success) {
        setComments(data.comments);
      } else {
        console.error('Failed to fetch comments:', data.error);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      // Redirect to home
      window.location.href = '/';
      return;
    }

    if (!commentText.trim()) return;

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const commentData: CreateCommentInput = {
        question_id: questionId,
        content: commentText.trim()
      };

      const response = await fetch(`/api/community/questions/${questionId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commentData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add new comment to the list
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
      } else {
        console.error('Failed to post comment:', data.error);
        alert(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (parentCommentId: string, content: string) => {
    if (!user) {
      window.location.href = '/';
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const commentData: CreateCommentInput = {
        question_id: questionId,
        content: content.trim(),
        parent_comment_id: parentCommentId
      };

      const response = await fetch(`/api/community/questions/${questionId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commentData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add reply to parent comment
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data.comment]
            };
          }
          return comment;
        }));
      } else {
        throw new Error(data.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-white">
          <FiMessageSquare className="w-5 h-5" />
          <h2 className="text-xl font-bold">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h2>
        </div>
      </div>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="relative">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts on this scenario..."
            rows={3}
            disabled={isSubmitting}
            className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-xl 
              text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 
              focus:border-transparent transition-all resize-none
              disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={5000}
          />
          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="absolute bottom-3 right-3 p-2 bg-teal-600 hover:bg-teal-700 text-white 
              rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:bg-teal-600"
          >
            <FiSend className="w-5 h-5" />
          </button>
          <p className="mt-2 text-xs text-gray-500">
            {commentText.length}/5000 characters
          </p>
        </form>
      ) : (
        <div className="p-6 bg-gray-800 border-2 border-gray-700 rounded-xl text-center">
          <p className="text-gray-400 mb-4">Sign in to join the discussion</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold 
              rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent 
            rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
            bg-gray-800 border-2 border-gray-700 mb-4">
            <FiMessageSquare className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={handleReplySubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
