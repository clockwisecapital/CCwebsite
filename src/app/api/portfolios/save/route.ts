/**
 * Portfolio Save API
 * Saves user portfolio analysis to database after account creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, conversationId, intakeData, analysisResult } = body;

    if (!userId || !intakeData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Look up actual conversation UUID from session_id if needed
    let actualConversationId = null;
    if (conversationId) {
      // Check if it's a UUID or a session_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(conversationId)) {
        // Already a UUID
        actualConversationId = conversationId;
      } else {
        // It's a session_id, look up the conversation
        const { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('session_id', conversationId)
          .single();
        
        if (conversation) {
          actualConversationId = conversation.id;
        }
      }
    }

    // Calculate scores from analysis result
    const portfolioScore = analysisResult?.portfolioScore || null;
    const goalProbability = analysisResult?.cycleAnalysis?.goalAnalysis?.probability || null;
    const riskScore = parseFloat(analysisResult?.riskLevel || '0');
    const cycleScore = analysisResult?.cycleScore || null;

    // Create portfolio record with holdings data
    const portfolioDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Build comprehensive portfolio_data with holdings
    // If no specific holdings, use proxy holdings from analysis result
    let holdings = intakeData.specificHoldings || [];
    
    if (holdings.length === 0 && analysisResult?.portfolioComparison?.userPortfolio?.positions) {
      // Convert analysis positions to holdings format
      holdings = analysisResult.portfolioComparison.userPortfolio.positions.map((pos: any) => ({
        ticker: pos.ticker,
        name: pos.name,
        percentage: pos.weight,
        currentPrice: pos.currentPrice,
        value: (intakeData.portfolio.totalValue * pos.weight) / 100
      }));
      console.log(`📊 Using ${holdings.length} proxy holdings from analysis:`, 
        holdings.map((h: any) => `${h.ticker} (${h.percentage}%)`).join(', '));
    }
    
    const portfolioData = {
      ...intakeData.portfolio,
      holdings: holdings,
      totalValue: intakeData.portfolio.totalValue,
      allocations: {
        stocks: intakeData.portfolio.stocks,
        bonds: intakeData.portfolio.bonds,
        cash: intakeData.portfolio.cash,
        realEstate: intakeData.portfolio.realEstate,
        commodities: intakeData.portfolio.commodities,
        alternatives: intakeData.portfolio.alternatives,
      }
    };
    
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        conversation_id: actualConversationId,
        name: intakeData.portfolioName || `${intakeData.firstName || 'My'}'s Portfolio - ${portfolioDate}`,
        portfolio_data: portfolioData,
        intake_data: intakeData,
        analysis_results: analysisResult,
        portfolio_score: portfolioScore,
        goal_probability: goalProbability,
        risk_score: riskScore,
        cycle_score: cycleScore,
        is_public: false,
        tested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (portfolioError) {
      console.error('Portfolio save error:', portfolioError);
      return NextResponse.json(
        { success: false, error: 'Failed to save portfolio' },
        { status: 500 }
      );
    }

    // Link conversation to user if we have a conversation ID
    if (actualConversationId) {
      const { error: linkError } = await supabase.rpc('link_conversation_to_user', {
        p_conversation_id: actualConversationId,
        p_user_id: userId,
        p_email: intakeData.email,
      });

      if (linkError) {
        console.error('Conversation link error:', linkError);
        // Non-critical error, continue
      }
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        score: portfolio.portfolio_score,
      },
    });
  } catch (error) {
    console.error('Save portfolio error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
