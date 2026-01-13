/**
 * Custom Hook: useRealtimeQuestion
 * Subscribes to real-time updates for a specific question
 * Updates likes, comments, and test counts automatically
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface QuestionUpdates {
  likes_count?: number;
  comments_count?: number;
  tests_count?: number;
}

export function useRealtimeQuestion(questionId: string) {
  const [updates, setUpdates] = useState<QuestionUpdates>({});

  useEffect(() => {
    if (!questionId) return;

    let channel: RealtimeChannel;

    // Subscribe to question updates
    const subscribeToUpdates = () => {
      channel = supabase
        .channel(`question:${questionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'scenario_questions',
            filter: `id=eq.${questionId}`
          },
          (payload) => {
            // Question updated (likes, comments, tests counts)
            setUpdates({
              likes_count: payload.new.likes_count,
              comments_count: payload.new.comments_count,
              tests_count: payload.new.tests_count
            });
          }
        )
        .subscribe();
    };

    subscribeToUpdates();

    // Cleanup subscription
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [questionId]);

  return updates;
}
