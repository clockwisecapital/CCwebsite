/**
 * API Route: /api/community/questions/[id]/like
 * Handles liking and unliking questions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// =====================================================================================
// POST /api/community/questions/[id]/like
// Like a question
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
        { error: 'Unauthorized - please sign in to like questions' },
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
    
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('question_likes')
      .select('id')
      .eq('question_id', id)
      .eq('user_id', user.id)
      .single();
    
    if (existingLike) {
      return NextResponse.json(
        { error: 'You have already liked this question' },
        { status: 400 }
      );
    }
    
    // Get current likes count
    const { data: currentQuestion } = await supabase
      .from('scenario_questions')
      .select('likes_count')
      .eq('id', id)
      .single();
    
    // Insert like
    const { error: insertError } = await supabase
      .from('question_likes')
      .insert({
        question_id: id,
        user_id: user.id
      });
    
    if (insertError) {
      console.error('Like insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to like question', details: insertError.message },
        { status: 500 }
      );
    }
    
    // Manually increment likes_count (in case trigger doesn't work)
    const newLikesCount = (currentQuestion?.likes_count || 0) + 1;
    await supabase
      .from('scenario_questions')
      .update({ 
        likes_count: newLikesCount,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', id);
    
    // Fetch updated question with new count
    const { data: updatedQuestion } = await supabase
      .from('scenario_questions')
      .select('likes_count')
      .eq('id', id)
      .single();
    
    console.log('✅ Question liked:', {
      questionId: id,
      userId: user.id,
      newLikesCount: updatedQuestion?.likes_count
    });
    
    return NextResponse.json({
      success: true,
      message: 'Question liked successfully',
      likes_count: updatedQuestion?.likes_count || 0
    });
    
  } catch (error: any) {
    console.error('Unexpected error in POST /api/community/questions/[id]/like:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================================
// DELETE /api/community/questions/[id]/like
// Unlike a question
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
    
    // Get current likes count
    const { data: currentQuestion } = await supabase
      .from('scenario_questions')
      .select('likes_count')
      .eq('id', id)
      .single();
    
    // Delete like
    const { error: deleteError } = await supabase
      .from('question_likes')
      .delete()
      .eq('question_id', id)
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Unlike error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unlike question', details: deleteError.message },
        { status: 500 }
      );
    }
    
    // Manually decrement likes_count (in case trigger doesn't work)
    const newLikesCount = Math.max(0, (currentQuestion?.likes_count || 0) - 1);
    await supabase
      .from('scenario_questions')
      .update({ 
        likes_count: newLikesCount
      })
      .eq('id', id);
    
    // Fetch updated question with new count
    const { data: updatedQuestion } = await supabase
      .from('scenario_questions')
      .select('likes_count')
      .eq('id', id)
      .single();
    
    console.log('❌ Question unliked:', {
      questionId: id,
      userId: user.id,
      newLikesCount: updatedQuestion?.likes_count
    });
    
    return NextResponse.json({
      success: true,
      message: 'Question unliked successfully',
      likes_count: updatedQuestion?.likes_count || 0
    });
    
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/community/questions/[id]/like:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
