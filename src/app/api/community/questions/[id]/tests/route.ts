/**
 * API Route: /api/community/questions/[id]/tests
 * Handles submitting and retrieving test results (leaderboard)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CreateQuestionTestInput } from '@/types/community';

// =====================================================================================
// GET /api/community/questions/[id]/tests
// Get test results (leaderboard) for a question
// =====================================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Fetch test results with portfolio and user details
    const { data: tests, error } = await supabase
      .from('question_tests')
      .select(`
        *,
        portfolio:portfolios(
          id,
          name,
          user_id
        ),
        user:users!question_tests_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('question_id', id)
      .eq('is_public', true)
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Tests query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch test results', details: error.message },
        { status: 500 }
      );
    }
    
    // Format as leaderboard entries
    const leaderboard = tests?.map((test: any, index) => ({
      rank: index + 1,
      portfolio_id: test.portfolio_id,
      portfolio_name: test.portfolio?.name || 'Unknown Portfolio',
      user_id: test.user_id,
      username: test.user?.first_name && test.user?.last_name 
        ? `${test.user.first_name} ${test.user.last_name}`
        : test.user?.email?.split('@')[0],
      display_name: test.user?.first_name && test.user?.last_name 
        ? `${test.user.first_name} ${test.user.last_name}`
        : undefined,
      score: test.score,
      expected_return: test.expected_return,
      upside: test.upside,
      downside: test.downside,
      tested_at: test.created_at
    })) || [];
    
    return NextResponse.json({
      success: true,
      leaderboard,
      total: tests?.length || 0
    });
    
  } catch (error: any) {
    console.error('Unexpected error in GET /api/community/questions/[id]/tests:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================================
// POST /api/community/questions/[id]/tests
// Submit a new test result
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
        { error: 'Unauthorized - please sign in to submit test results' },
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
    const body: CreateQuestionTestInput = await request.json();
    
    // Validate required fields
    if (!body.portfolio_id) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      );
    }
    
    if (typeof body.score !== 'number' || body.score < 0 || body.score > 100) {
      return NextResponse.json(
        { error: 'Score must be a number between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Verify portfolio belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, user_id')
      .eq('id', body.portfolio_id)
      .single();
    
    if (portfolioError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }
    
    if (portfolio.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only submit tests for your own portfolios' },
        { status: 403 }
      );
    }
    
    // Check if user has already tested this portfolio on this question
    const { data: existingTest } = await supabase
      .from('question_tests')
      .select('id')
      .eq('question_id', id)
      .eq('portfolio_id', body.portfolio_id)
      .eq('user_id', user.id)
      .single();
    
    if (existingTest) {
      // Update existing test instead of creating new one
      const { data: updatedTest, error: updateError } = await supabase
        .from('question_tests')
        .update({
          score: body.score,
          expected_return: body.expected_return,
          upside: body.upside,
          downside: body.downside,
          comparison_data: body.comparison_data,
          is_public: body.is_public !== undefined ? body.is_public : true
        })
        .eq('id', existingTest.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Test update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update test result', details: updateError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        test: updatedTest,
        message: 'Test result updated successfully'
      });
    }
    
    // Insert new test result
    const { data: test, error: insertError } = await supabase
      .from('question_tests')
      .insert({
        question_id: id,
        portfolio_id: body.portfolio_id,
        user_id: user.id,
        score: body.score,
        expected_return: body.expected_return,
        upside: body.upside,
        downside: body.downside,
        comparison_data: body.comparison_data || {},
        is_public: body.is_public !== undefined ? body.is_public : true
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Test insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit test result', details: insertError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      test,
      message: 'Test result submitted successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Unexpected error in POST /api/community/questions/[id]/tests:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
