/**
 * API to save and retrieve test results for scenario questions
 * Stores portfolio scores in question_tests table for leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * Calculate and save SPY ETF benchmark average from all test results
 * Simple approach: fetch all tests, calculate average, save to question
 * Note: Field name is sp500_avg_return for backwards compatibility, but represents SPY ETF
 */
async function updateSP500Average(questionId: string) {
  try {
    console.log('📊 Calculating SPY benchmark average for question:', questionId);
    const supabase = await createServerSupabaseClient();
    
    // Fetch all test results for this question
    const { data: tests, error } = await supabase
      .from('question_tests')
      .select('comparison_data')
      .eq('question_id', questionId);
    
    if (error || !tests || tests.length === 0) {
      console.log('⚠️ No test results found, SPY benchmark average not available yet');
      return;
    }
    
    // Extract benchmark returns and best/worst year from comparison data
    const benchmarkData = tests
      .map((test: any, index: number) => {
        const compData = test.comparison_data;
        const userReturn = compData?.userPortfolio?.benchmarkReturn;
        const timeReturn = compData?.timePortfolio?.benchmarkReturn;
        const bestYear = compData?.userPortfolio?.benchmarkBestYear;
        const worstYear = compData?.userPortfolio?.benchmarkWorstYear;
        console.log(`  Test ${index + 1} benchmark data:`, { 
          hasCompData: !!compData, 
          userReturn, 
          timeReturn,
          bestYear,
          worstYear,
          userKeys: compData?.userPortfolio ? Object.keys(compData.userPortfolio) : [],
          timeKeys: compData?.timePortfolio ? Object.keys(compData.timePortfolio) : []
        });
        return { 
          avgReturn: userReturn || timeReturn,
          bestYear,
          worstYear
        };
      })
      .filter((data): data is { avgReturn: number; bestYear: number | null | undefined; worstYear: number | null | undefined } => 
        data.avgReturn !== null && data.avgReturn !== undefined);
    
    console.log(`📊 Found ${benchmarkData.length} valid SPY benchmark returns out of ${tests.length} tests`);
    console.log('🔍 Benchmark data sample:', benchmarkData.slice(0, 3));
    
    if (benchmarkData.length === 0) {
      console.log('⚠️ No SPY benchmark data in test results yet');
      return;
    }
    
    // Calculate average return across all tests
    const avgReturn = benchmarkData.reduce((sum, data) => sum + data.avgReturn, 0) / benchmarkData.length;
    
    // Get best/worst year from ANY test that has these values
    // (All tests for same question should have same best/worst since it's the same historical period)
    const testsWithRange = benchmarkData.filter(data => 
      data.bestYear !== null && data.bestYear !== undefined &&
      data.worstYear !== null && data.worstYear !== undefined
    );
    
    console.log(`🎯 Found ${testsWithRange.length} tests with best/worst year data`);
    if (testsWithRange.length > 0) {
      console.log('📈 Sample range data:', testsWithRange[0]);
    }
    
    const bestYear = testsWithRange.length > 0 ? testsWithRange[0].bestYear : null;
    const worstYear = testsWithRange.length > 0 ? testsWithRange[0].worstYear : null;
    
    // First, get current metadata
    const { data: questionData } = await supabase
      .from('scenario_questions')
      .select('metadata')
      .eq('id', questionId)
      .single();
    
    // Merge with existing metadata
    const currentMetadata = (questionData?.metadata as any) || {};
    const updatedMetadata = {
      ...currentMetadata,
      sp500_avg_return: avgReturn, // Note: Field name kept for backwards compatibility, represents SPY ETF
      spy_best_year: bestYear,     // Best year return for SPY in this scenario (from Monte Carlo)
      spy_worst_year: worstYear,   // Worst year return for SPY in this scenario (from Monte Carlo)
      sp500_test_count: benchmarkData.length,
      sp500_updated_at: new Date().toISOString()
    };
    
    // Save to question metadata
    const { error: updateError } = await supabase
      .from('scenario_questions')
      .update({ metadata: updatedMetadata })
      .eq('id', questionId);
    
    if (updateError) {
      console.error('❌ Failed to save SPY benchmark average:', updateError);
    } else {
      const bestStr = (bestYear !== null && bestYear !== undefined) ? `${(bestYear * 100).toFixed(1)}%` : 'N/A';
      const worstStr = (worstYear !== null && worstYear !== undefined) ? `${(worstYear * 100).toFixed(1)}%` : 'N/A';
      console.log(`✅ SPY benchmark saved: Avg ${(avgReturn * 100).toFixed(1)}%, Best ${bestStr}, Worst ${worstStr} (${benchmarkData.length} tests)`);
    }
  } catch (error) {
    console.error('❌ Error calculating SPY benchmark average:', error);
  }
}

/**
 * Run SPY ETF benchmark test for a question
 * This runs in the background to benchmark user portfolio performance
 */
async function runSP500BenchmarkTest(questionId: string) {
  try {
    console.log('📊 Running SPY ETF benchmark test for question:', questionId);
    
    const supabase = await createServerSupabaseClient();
    
    // Get question details including metadata
    const { data: question } = await supabase
      .from('scenario_questions')
      .select('title, question_text, metadata')
      .eq('id', questionId)
      .single();
    
    if (!question) return;
    
    // Check for stored analog ID for consistency
    const metadata = question.metadata as any;
    const storedAnalogId = metadata?.analog_id;
    
    if (storedAnalogId) {
      console.log(`✅ Using stored analog for SPY benchmark: ${storedAnalogId}`);
    } else {
      console.log(`⚠️ No stored analog - SPY benchmark will use AI selection`);
    }
    
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
      storedAnalogId || true // Use stored analog for consistency, or AI if legacy question
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
      .select('id, score, metadata')
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
        console.log('📊 comparison_data.userPortfolio.benchmarkReturn:', updatePayload.comparison_data?.userPortfolio?.benchmarkReturn);
        console.log('📊 comparison_data.timePortfolio.benchmarkReturn:', updatePayload.comparison_data?.timePortfolio?.benchmarkReturn);
        
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
        
        // Always calculate S&P 500 average (even when updating)
        await updateSP500Average(questionId);
        
        return NextResponse.json({
          success: true,
          testResult: data,
          updated: true,
          message: 'Score improved! Updated leaderboard.'
        });
      } else {
        // Score not better, but still update comparison_data (it contains important metadata)
        console.log('⏭️ Score not better than existing, updating comparison_data only');
        
        const { data, error } = await supabase
          .from('question_tests')
          .update({
            comparison_data: body.comparisonData || {},
            metadata: {
              ...(existing.metadata as any || {}),
              updated_at: new Date().toISOString()
            }
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating comparison_data:', error);
        } else {
          console.log('✅ Updated comparison_data with latest benchmark stats');
        }
        
        // Calculate S&P 500 average from ALL tests
        await updateSP500Average(questionId);
        
        return NextResponse.json({
          success: true,
          testResult: data || existing,
          updated: false,
          message: 'Previous score was better. Metadata updated.'
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
    console.log('📊 comparison_data.userPortfolio.benchmarkReturn:', insertPayload.comparison_data?.userPortfolio?.benchmarkReturn);
    console.log('📊 comparison_data.timePortfolio.benchmarkReturn:', insertPayload.comparison_data?.timePortfolio?.benchmarkReturn);
    
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
    
    // Calculate and save S&P 500 average (simple and synchronous)
    await updateSP500Average(questionId);
    
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
