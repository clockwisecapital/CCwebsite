/**
 * API to save and retrieve test results for scenario questions
 * Stores portfolio scores in question_tests table for leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * Run S&P 500 benchmark test for a question
 * This runs in the background to benchmark user portfolio performance
 */
async function runSP500BenchmarkTest(questionId: string) {
  try {
    console.log('📊 Running S&P 500 benchmark test for question:', questionId);
    
    const supabase = await createServerSupabaseClient();
    
    // Get question details
    const { data: question } = await supabase
      .from('scenario_questions')
      .select('title, question_text')
      .eq('id', questionId)
      .single();
    
    if (!question) return;
    
    // Create a standard S&P 500 portfolio (100% SPY)
    const sp500Holdings = [
      {
        ticker: 'SPY',
        name: 'SPDR S&P 500 ETF',
        weight: 1.0, // 100%
        assetClass: 'us-large-cap' // Use proper asset class for Kronos
      }
    ];
    
    // Run Kronos scoring directly (not through HTTP API)
    const { scorePortfolio } = await import('@/lib/kronos/scoring');
    const scoreResult = await scorePortfolio(
      question.question_text || question.title,
      sp500Holdings,
      true // Use AI
    );
    
    // Save S&P 500 benchmark result (use any to bypass TypeScript table check)
    const { error: insertError } = await (supabase as any).from('question_sp500_benchmarks').insert({
      question_id: questionId,
      expected_return: scoreResult.portfolioReturn,
      upside: 0, // ScoreResult doesn't have Monte Carlo data in basic scoring
      downside: 0,
      score: scoreResult.score,
      test_data: scoreResult
    });
    
    if (insertError) {
      console.error('Failed to save S&P 500 benchmark:', insertError);
      return;
    }
    
    console.log('✅ S&P 500 benchmark saved:', {
      return: (scoreResult.portfolioReturn * 100).toFixed(1) + '%',
      score: scoreResult.score.toFixed(1)
    });
    
  } catch (error) {
    console.error('S&P 500 benchmark test error:', error);
    // Don't throw - this is a background operation
  }
}

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
    
    console.log('📥 API received test result');
    console.log('📊 Has comparisonData:', !!body.comparisonData);
    console.log('📊 comparisonData type:', typeof body.comparisonData);
    console.log('📊 comparisonData:', body.comparisonData);
    
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
        const updatePayload = {
          score: body.score,
          expected_return: body.expectedReturn,
          upside: body.upside,
          downside: body.downside,
          comparison_data: body.comparisonData || {},
          metadata: {
            portfolio_name: body.portfolioName,
            updated_at: new Date().toISOString()
          }
        };
        
        console.log('🔄 Updating existing test in database');
        console.log('📊 comparison_data keys:', Object.keys(updatePayload.comparison_data || {}));
        
        const { data, error } = await supabase
          .from('question_tests')
          .update(updatePayload)
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
        
        console.log('✅ Updated in database, returned data has comparison_data:', !!data.comparison_data);
        console.log('📊 Returned comparison_data keys:', Object.keys(data.comparison_data || {}));
        
        return NextResponse.json({
          success: true,
          testResult: data,
          updated: true,
          message: 'Score improved! Updated leaderboard.'
        });
      } else {
        // Score not better, don't update
        console.log('⏭️ Score not better than existing, skipping update');
        return NextResponse.json({
          success: true,
          testResult: existing,
          updated: false,
          message: 'Previous score was better.'
        });
      }
    }
    
    // Insert new test result
    const insertPayload = {
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
    };
    
    console.log('💾 Inserting into database:', {
      ...insertPayload,
      comparison_data: insertPayload.comparison_data ? 'Present' : 'Missing'
    });
    console.log('📊 comparison_data keys:', Object.keys(insertPayload.comparison_data || {}));
    
    const { data, error } = await supabase
      .from('question_tests')
      .insert(insertPayload)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving test result:', error);
      return NextResponse.json(
        { error: 'Failed to save test result' },
        { status: 500 }
      );
    }
    
    console.log('✅ Saved to database, returned data has comparison_data:', !!data.comparison_data);
    console.log('📊 Returned comparison_data keys:', Object.keys(data.comparison_data || {}));
    
    // Increment tests_count on the question
    console.log('📈 Incrementing tests_count for question:', questionId);
    const { error: rpcError } = await supabase.rpc('increment_tests_count' as any, { question_id: questionId });
    if (rpcError) {
      console.error('❌ Failed to increment test count:', rpcError);
    } else {
      console.log('✅ Successfully incremented tests_count');
    }
    
    // Also run S&P 500 benchmark test in background (don't await - fire and forget)
    runSP500BenchmarkTest(questionId).catch(err => 
      console.warn('S&P 500 benchmark test failed:', err)
    );
    
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
        comparison_data,
        portfolios:portfolio_id (
          id,
          name,
          portfolio_data
        ),
        users:user_id (
          id,
          email,
          first_name,
          last_name
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
      
      // Build user display name
      let userName = 'Anonymous';
      if (users) {
        if (users.first_name && users.last_name) {
          userName = `${users.first_name} ${users.last_name}`;
        } else if (users.first_name) {
          userName = users.first_name;
        } else if (users.email) {
          userName = users.email.split('@')[0];
        }
      }
      
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
        userName,
        holdings: portfolios?.portfolio_data?.holdings || [],
        comparisonData: test.comparison_data || null // Include full comparison data
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
