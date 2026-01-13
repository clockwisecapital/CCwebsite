/**
 * API Route: /api/community/questions/[id]/comments
 * Handles listing and creating comments on questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CreateCommentInput } from '@/types/community';

// =====================================================================================
// GET /api/community/questions/[id]/comments
// List comments for a question
// =====================================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    // Get current user (optional)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch comments with author details
    const { data: comments, error } = await supabase
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
      .eq('question_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Comments query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error.message },
        { status: 500 }
      );
    }
    
    // If user is authenticated, check which comments they've liked
    if (user && comments && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);
      
      const likedCommentIds = new Set(likes?.map(l => l.comment_id) || []);
      
      // Add is_liked_by_user flag
      comments.forEach((c: any) => {
        c.is_liked_by_user = likedCommentIds.has(c.id);
      });
    }
    
    // Organize comments into threads (top-level and replies)
    const topLevelComments = comments?.filter(c => !c.parent_comment_id) || [];
    const repliesMap = new Map();
    
    comments?.forEach(c => {
      if (c.parent_comment_id) {
        if (!repliesMap.has(c.parent_comment_id)) {
          repliesMap.set(c.parent_comment_id, []);
        }
        repliesMap.get(c.parent_comment_id).push(c);
      }
    });
    
    // Add replies to top-level comments
    topLevelComments.forEach((c: any) => {
      c.replies = repliesMap.get(c.id) || [];
    });
    
    return NextResponse.json({
      success: true,
      comments: topLevelComments
    });
    
  } catch (error: any) {
    console.error('Unexpected error in GET /api/community/questions/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================================
// POST /api/community/questions/[id]/comments
// Create a new comment on a question
// =====================================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in to comment' },
        { status: 401 }
      );
    }
    
    // Check if question exists
    const { data: question, error: questionError } = await supabase
      .from('scenario_questions')
      .select('id')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body: CreateCommentInput = await request.json();
    
    // Validate content
    if (!body.content || body.content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    if (body.content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment must be 5000 characters or less' },
        { status: 400 }
      );
    }
    
    // If replying to a comment, validate parent exists
    if (body.parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('question_comments')
        .select('id, question_id')
        .eq('id', body.parent_comment_id)
        .single();
      
      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
      
      if (parentComment.question_id !== id) {
        return NextResponse.json(
          { error: 'Parent comment does not belong to this question' },
          { status: 400 }
        );
      }
    }
    
    // Insert comment
    const { data: comment, error: insertError } = await supabase
      .from('question_comments')
      .insert({
        question_id: id,
        user_id: user.id,
        parent_comment_id: body.parent_comment_id || null,
        content: body.content.trim()
      })
      .select(`
        *,
        author:users!question_comments_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .single();
    
    if (insertError) {
      console.error('Comment insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create comment', details: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      comment
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Unexpected error in POST /api/community/questions/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
