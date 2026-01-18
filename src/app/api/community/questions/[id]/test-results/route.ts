/**
 * API to save and retrieve test results for scenario questions
 * Stores portfolio scores in question_tests table for leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

interface SaveTestResultRequest {
  portfolioId: string;
  portfolioName: string;
  score: number;
  expectedReturn: number;
  upside: number;
  downside: number;
  comparisonData?: any;
}

/**
 * POST - Save a test result for a question
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const questionId = id;
    const body: SaveTestResultRequest = await request.json();
    
    // Validate required fields
    if (!body.portfolioId || typeof body.score !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: portfolioId, score' },
        { status: 400 }
      );
    }
    
    // Check if test already exists for this portfolio + question
    const { data: existing } = await supabase
      .from('question_tests')
      .select('id, score')
      .eq('question_id', questionId)
      .eq('portfolio_id', body.portfolioId)
      .eq('user_id', user.id)
      .single();
    
    if (existing) {
      // Update existing test if new score is better
      if (body.score > existing.score) {
        const { data, error } = await supabase
          .from('question_tests')
          .update({
            score: body.score,
            expected_return: body.expectedReturn,
            upside: body.upside,
            downside: body.downside,
            comparison_data: body.comparisonData || {},
            metadata: {
              portfolio_name: body.portfolioName,
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating test result:', error);
          return NextResponse.json(
            { error: 'Failed to update test result' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          testResult: data,
          updated: true,
          message: 'Score improved! Updated leaderboard.'
        });
      } else {
        // Score not better, don't update
        return NextResponse.json({
          success: true,
          testResult: existing,
          updated: false,
          message: 'Previous score was better.'
        });
      }
    }
    
    // Insert new test result
    const { data, error } = await supabase
      .from('question_tests')
      .insert({
        question_id: questionId,
        portfolio_id: body.portfolioId,
        user_id: user.id,
        score: body.score,
        expected_return: body.expectedReturn,
        upside: body.upside,
        downside: body.downside,
        comparison_data: body.comparisonData || {},
        is_public: true,
        metadata: {
          portfolio_name: body.portfolioName
        }
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving test result:', error);
      return NextResponse.json(
        { error: 'Failed to save test result' },
        { status: 500 }
      );
    }
    
    // Increment tests_count on the question
    // Note: increment_tests_count RPC function should be created in database
    const { error: rpcError } = await supabase.rpc('increment_tests_count' as any, { question_id: questionId });
    if (rpcError) {
      console.warn('Failed to increment test count:', rpcError);
    }
    
    return NextResponse.json({
      success: true,
      testResult: data,
      updated: false,
      message: 'Test result saved to leaderboard!'
    });
    
  } catch (error) {
    console.error('Test result API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch top scoring portfolios for a question
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    const questionId = id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Fetch top scoring tests for this question
    const { data: tests, error } = await supabase
      .from('question_tests')
      .select(`
        id,
        score,
        expected_return,
        upside,
        downside,
        created_at,
        metadata,
        portfolio_id,
        user_id,
        portfolios:portfolio_id (
          id,
          name,
          portfolio_data
        ),
        users:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('question_id', questionId)
      .eq('is_public', true)
      .order('score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching top portfolios:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }
    
    // Transform data for frontend
    const topPortfolios = tests?.map(test => {
      const metadata = test.metadata as any;
      const portfolios = test.portfolios as any;
      const users = test.users as any;
      
      return {
        id: test.id,
        portfolioId: test.portfolio_id,
        portfolioName: metadata?.portfolio_name || portfolios?.name || 'Unknown Portfolio',
        score: test.score,
        expectedReturn: test.expected_return,
        upside: test.upside,
        downside: test.downside,
        createdAt: test.created_at,
        userId: test.user_id,
        userName: users?.raw_user_meta_data?.full_name || 
                 users?.raw_user_meta_data?.username ||
                 users?.email?.split('@')[0] ||
                 'Anonymous',
        holdings: portfolios?.portfolio_data?.holdings || []
      };
    }) || [];
    
    return NextResponse.json({
      success: true,
      topPortfolios,
      count: topPortfolios.length
    });
    
  } catch (error) {
    console.error('Get top portfolios API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
