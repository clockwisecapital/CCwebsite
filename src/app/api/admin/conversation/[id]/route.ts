/**
 * Individual Conversation Detail API
 * 
 * GET /api/admin/conversation/[id] - Get detailed conversation data
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth/admin'
import { createAdminSupabaseClient } from '@/lib/supabase/index'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminToken(request)
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminSupabaseClient()
    const conversationId = params.id

    // ========================================================================
    // GET CONVERSATION DETAILS
    // ========================================================================
    
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    // ========================================================================
    // GET ALL MESSAGES
    // ========================================================================
    
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('seq', { ascending: true })
      .order('created_at', { ascending: true })

    // ========================================================================
    // GET USER DATA
    // ========================================================================
    
    const { data: userData } = await supabase
      .from('user_data')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()

    // ========================================================================
    // ENRICH CONVERSATION DATA
    // ========================================================================
    
    const safeMessages = messages || []

    const enrichedConversation = {
      ...conversation,
      messageCount: safeMessages.length,
      messages: safeMessages.map(msg => ({
        ...msg,
        display_spec: msg.display_spec ? JSON.parse(JSON.stringify(msg.display_spec)) : null
      })) || [],
      userData: userData ? {
        goals: userData.goals,
        portfolio: userData.portfolio_data,
        analysis: userData.analysis_results,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      } : null,
      leadScore: calculateLeadScore(
        { 
          ...conversation, 
          metadata: conversation.metadata && typeof conversation.metadata === 'object' 
            ? (conversation.metadata as Record<string, unknown>) 
            : undefined
        }, 
        userData ? {
          goals: userData.goals as Record<string, unknown> | undefined,
          portfolio_data: userData.portfolio_data as { portfolio_value?: number } | undefined,
          analysis_results: userData.analysis_results as Record<string, unknown> | undefined
        } : null, 
        safeMessages
      ),
      timeline: generateConversationTimeline(
        { 
          ...conversation, 
          metadata: conversation.metadata && typeof conversation.metadata === 'object' 
            ? (conversation.metadata as Record<string, unknown>) 
            : undefined
        }, 
        safeMessages, 
        userData ? {
          goals: userData.goals as Record<string, unknown> | undefined,
          portfolio_data: userData.portfolio_data as { portfolio_value?: number } | undefined,
          analysis_results: userData.analysis_results as Record<string, unknown> | undefined,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        } : null)
    }

    return NextResponse.json({
      success: true,
      data: enrichedConversation
    })

  } catch (error) {
    console.error('Conversation detail API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch conversation details' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

type ConversationData = {
  id: string
  user_email: string | null
  created_at: string
  updated_at: string
  session_id: string
  metadata?: Record<string, unknown>
}

type UserDataRecord = {
  goals?: Record<string, unknown>
  portfolio_data?: { portfolio_value?: number }
  analysis_results?: Record<string, unknown>
}

type MessageRecord = {
  id: string
  role: 'user' | 'assistant'
  content: string | null
  display_spec?: unknown
  created_at: string
}

const calculateLeadScore = (conversation: ConversationData, userData: UserDataRecord | null, messages: MessageRecord[]): {
  total: number
  breakdown: Record<string, number>
} => {
  const breakdown: Record<string, number> = {
    'Email Provided': 0,
    'Goals Completed': 0,
    'Portfolio Data': 0,
    'Analysis Completed': 0,
    'High Portfolio Value': 0,
    'Recent Activity': 0,
    'Message Engagement': 0
  }

  // Email provided (+20 points)
  if (conversation.user_email) breakdown['Email Provided'] = 20

  // Goals completed (+25 points)
  if (userData?.goals) breakdown['Goals Completed'] = 25

  // Portfolio data provided (+25 points)
  if (userData?.portfolio_data) breakdown['Portfolio Data'] = 25

  // Analysis completed (+30 points)
  if (userData?.analysis_results) breakdown['Analysis Completed'] = 30

  // High portfolio value (+20 points for >$100k)
  const portfolioValue = userData?.portfolio_data?.portfolio_value
  if (portfolioValue && portfolioValue > 100000) breakdown['High Portfolio Value'] = 20

  // Recent activity (+10 points if within 24 hours)
  const lastActivity = new Date(conversation.updated_at)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  if (lastActivity > dayAgo) breakdown['Recent Activity'] = 10

  // Message engagement (+15 points for >5 messages)
  if (messages && messages.length > 5) breakdown['Message Engagement'] = 15

  const total = Math.min(Object.values(breakdown).reduce((sum, score) => sum + score, 0), 100)

  return { total, breakdown }
}

function generateConversationTimeline(conversation: ConversationData, messages: MessageRecord[], userData: (UserDataRecord & { created_at: string; updated_at: string }) | null): Array<{
  timestamp: string
  event: string
  description: string
  type: 'conversation' | 'data' | 'message'
}> {
  const timeline: Array<{
    timestamp: string
    event: string
    description: string
    type: 'conversation' | 'data' | 'message'
  }> = []

  // Conversation started
  timeline.push({
    timestamp: conversation.created_at,
    event: 'Conversation Started',
    description: `New conversation initiated${conversation.user_email ? ` by ${conversation.user_email}` : ''}`,
    type: 'conversation'
  })

  // Add message milestones
  if (messages && messages.length > 0) {
    const firstMessage = messages[0]
    const lastMessage = messages[messages.length - 1]

    timeline.push({
      timestamp: firstMessage.created_at,
      event: 'First Message',
      description: `User sent first message: "${firstMessage.content?.substring(0, 50)}..."`,
      type: 'message'
    })

    if (messages.length > 1) {
      timeline.push({
        timestamp: lastMessage.created_at,
        event: 'Latest Message',
        description: `${lastMessage.role === 'user' ? 'User' : 'Assistant'}: "${lastMessage.content?.substring(0, 50)}..."`,
        type: 'message'
      })
    }
  }

  // Data collection milestones
  if (userData) {
    if (userData.goals) {
      timeline.push({
        timestamp: userData.created_at,
        event: 'Goals Collected',
        description: `Investment goals captured: ${userData.goals.goal_type || 'Unknown type'}`,
        type: 'data'
      })
    }

    if (userData.portfolio_data) {
      const portfolio = userData.portfolio_data as { portfolio_value?: number; new_investor?: boolean }
      timeline.push({
        timestamp: userData.created_at,
        event: 'Portfolio Data',
        description: portfolio.new_investor 
          ? 'Identified as new investor'
          : `Portfolio value: $${portfolio.portfolio_value?.toLocaleString() || 'Unknown'}`,
        type: 'data'
      })
    }

    if (userData.analysis_results) {
      timeline.push({
        timestamp: userData.updated_at,
        event: 'Analysis Completed',
        description: 'Portfolio analysis generated and delivered',
        type: 'data'
      })
    }
  }

  // Sort by timestamp
  return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}
