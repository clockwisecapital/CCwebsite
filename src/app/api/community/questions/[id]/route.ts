/**
 * API Route: /api/community/questions/[id]
 * Handles individual question operations (get, update, delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { UpdateScenarioQuestionInput } from '@/types/community';

// =====================================================================================
// GET /api/community/questions/[id]
// Get a single question with full details
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
    
    // Fetch question with author details
    const { data: question, error } = await supabase
      .from('scenario_questions')
      .select(`
        *,
        author:users!scenario_questions_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // If user is authenticated, check if they've liked it and if they follow the author
    if (user) {
      const [likesResult, followsResult] = await Promise.all([
        supabase
          .from('question_likes')
          .select('id')
          .eq('question_id', id)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', question.user_id)
          .single()
      ]);
      
      (question as any).is_liked_by_user = !!likesResult.data;
      (question as any).is_following_author = !!followsResult.data;
    }
    
    // Increment views count (fire and forget)
    supabase
      .from('scenario_questions')
      .update({ views_count: question.views_count + 1 })
      .eq('id', id)
      .then(() => {});
    
    return NextResponse.json({
      success: true,
      question
    });
    
  } catch (error: any) {
    console.error('Unexpected error in GET /api/community/questions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================================
// PUT /api/community/questions/[id]
// Update a question (only by the author)
// =====================================================================================

export async function PUT(
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
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }
    
    // Check if question exists and user owns it
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('scenario_questions')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    if (existingQuestion.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - you can only edit your own questions' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body: UpdateScenarioQuestionInput = await request.json();
    
    // Validate fields if provided
    if (body.title !== undefined && (body.title.length < 5 || body.title.length > 200)) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 200 characters' },
        { status: 400 }
      );
    }
    
    if (body.description !== undefined && (body.description.length < 10 || body.description.length > 2000)) {
      return NextResponse.json(
        { error: 'Description must be between 10 and 2000 characters' },
        { status: 400 }
      );
    }
    
    if (body.question_text !== undefined && (body.question_text.length < 10 || body.question_text.length > 500)) {
      return NextResponse.json(
        { error: 'Question text must be between 10 and 500 characters' },
        { status: 400 }
      );
    }
    
    // Build update object
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.question_text !== undefined) updateData.question_text = body.question_text.trim();
    if (body.historical_period !== undefined) updateData.historical_period = body.historical_period;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    
    // Update question
    const { data: question, error: updateError } = await supabase
      .from('scenario_questions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        author:users!scenario_questions_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .single();
    
    if (updateError) {
      console.error('Question update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update question', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      question
    });
    
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/community/questions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================================
// DELETE /api/community/questions/[id]
// Delete a question (soft delete by setting is_active = false)
// =====================================================================================

export async function DELETE(
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
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }
    
    // Check if question exists and user owns it
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('scenario_questions')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    if (existingQuestion.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - you can only delete your own questions' },
        { status: 403 }
      );
    }
    
    // Soft delete (set is_active = false)
    const { error: deleteError } = await supabase
      .from('scenario_questions')
      .update({ is_active: false })
      .eq('id', id);
    
    if (deleteError) {
      console.error('Question delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete question', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/community/questions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
