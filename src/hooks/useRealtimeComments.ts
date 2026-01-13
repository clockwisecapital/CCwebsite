/**
 * Custom Hook: useRealtimeComments
 * Subscribes to real-time updates for comments on a question
 * Automatically adds new comments to the list
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { QuestionCommentWithAuthor } from '@/types/community';

export function useRealtimeComments(questionId: string, onNewComment?: (comment: any) => void) {
  const [newCommentCount, setNewCommentCount] = useState(0);

  useEffect(() => {
    if (!questionId) return;

    let channel: RealtimeChannel;

    // Subscribe to new comments
    const subscribeToComments = () => {
      channel = supabase
        .channel(`comments:${questionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'question_comments',
            filter: `question_id=eq.${questionId}`
          },
          async (payload) => {
            // New comment added
            setNewCommentCount(prev => prev + 1);

            // Optionally fetch full comment details with author
            if (onNewComment) {
              try {
                const { data, error } = await supabase
                  .from('question_comments')
                  .select(`
                    *,
                    author:users!question_comments_user_id_fkey(
                      id,
                      email,
                      first_name,
                      last_name
                    )
                  `)
                  .eq('id', payload.new.id)
                  .single();

                if (!error && data) {
                  onNewComment(data);
                }
              } catch (error) {
                console.error('Error fetching new comment details:', error);
              }
            }
          }
        )
        .subscribe();
    };

    subscribeToComments();

    // Cleanup subscription
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [questionId, onNewComment]);

  return { newCommentCount };
}
