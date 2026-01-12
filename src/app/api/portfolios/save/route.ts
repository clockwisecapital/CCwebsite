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

    const supabase = createServerSupabaseClient();

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

    // Create portfolio record
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        conversation_id: actualConversationId,
        name: `${intakeData.firstName || 'My'}'s Portfolio`,
        portfolio_data: intakeData.portfolio,
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
