/**
 * API Route: /api/community/questions/[id]/tests
 * Handles submitting and retrieving test results (leaderboard)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CreateQuestionTestInput } from '@/types/community';
import { scorePortfolio } from '@/lib/kronos/scoring';
import { extractHoldingsFromPortfolio, validateHoldings, logHoldings, type PortfolioRecord } from '@/lib/kronos/portfolio-extractor';

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
    
    // Check if question exists and get question text
    const { data: question, error: questionError } = await supabase
      .from('scenario_questions')
      .select('id, question_text, title')
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
    
    // Fetch portfolio with full data for scoring
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, user_id, name, portfolio_data, intake_data')
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
    
    // ==================================================================================
    // RUN KRONOS SCORING ENGINE
    // ==================================================================================
    
    let calculatedScore: number;
    let expectedReturn: number;
    let upside: number;
    let downside: number;
    let comparisonData: any = {};
    
    try {
      console.log(`\n🎯 Running Kronos scoring for portfolio ${portfolio.id} on question ${id}`);
      
      // Extract holdings from portfolio data
      const portfolioRecord: PortfolioRecord = {
        id: portfolio.id,
        name: portfolio.name || 'Portfolio',
        portfolio_data: portfolio.portfolio_data,
        intake_data: portfolio.intake_data
      };
      
      const holdings = extractHoldingsFromPortfolio(portfolioRecord);
      
      // Validate holdings
      const validation = validateHoldings(holdings);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `Invalid portfolio holdings: ${validation.error}` },
          { status: 400 }
        );
      }
      
      // Log holdings for debugging
      logHoldings(holdings);
      
      // Use question text for scoring
      const questionText = question.question_text || question.title;
      
      // Score the portfolio
      const scoreResult = await scorePortfolio(questionText, holdings);
      
      // Extract metrics from score result
      calculatedScore = scoreResult.score;
      expectedReturn = scoreResult.portfolioReturn;
      
      // Estimate upside and downside based on the results
      // For MVP, use simplified estimates
      const returnMagnitude = Math.abs(scoreResult.portfolioReturn);
      upside = expectedReturn + (returnMagnitude * 0.5);  // +50% above expected
      downside = expectedReturn - (returnMagnitude * 0.5); // -50% below expected
      
      // Store full score result in comparison_data
      comparisonData = {
        score: scoreResult.score,
        label: scoreResult.label,
        color: scoreResult.color,
        scenarioId: scoreResult.scenarioId,
        scenarioName: scoreResult.scenarioName,
        analogId: scoreResult.analogId,
        analogName: scoreResult.analogName,
        analogPeriod: scoreResult.analogPeriod,
        portfolioReturn: scoreResult.portfolioReturn,
        benchmarkReturn: scoreResult.benchmarkReturn,
        outperformance: scoreResult.outperformance,
        portfolioDrawdown: scoreResult.portfolioDrawdown,
        benchmarkDrawdown: scoreResult.benchmarkDrawdown,
        returnScore: scoreResult.returnScore,
        drawdownScore: scoreResult.drawdownScore,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Scoring complete: ${calculatedScore}/100 (${scoreResult.label})`);
      
    } catch (scoringError) {
      console.error('❌ Scoring error:', scoringError);
      return NextResponse.json(
        { 
          error: 'Failed to score portfolio', 
          details: scoringError instanceof Error ? scoringError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
    // Allow manual score override from body if provided (for testing/admin)
    const finalScore = body.score !== undefined ? body.score : calculatedScore;
    const finalExpectedReturn = body.expected_return !== undefined ? body.expected_return : expectedReturn;
    const finalUpside = body.upside !== undefined ? body.upside : upside;
    const finalDownside = body.downside !== undefined ? body.downside : downside;
    const finalComparisonData = body.comparison_data || comparisonData;
    
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
          score: finalScore,
          expected_return: finalExpectedReturn,
          upside: finalUpside,
          downside: finalDownside,
          comparison_data: finalComparisonData,
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
        scoreData: comparisonData,
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
        score: finalScore,
        expected_return: finalExpectedReturn,
        upside: finalUpside,
        downside: finalDownside,
        comparison_data: finalComparisonData,
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
      scoreData: comparisonData,
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
