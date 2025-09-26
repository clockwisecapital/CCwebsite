/**
 * Admin Dashboard Data API
 * 
 * GET /api/admin/dashboard - Get dashboard analytics and conversation data
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '../auth/route'
import { createAdminSupabaseClient } from '@/lib/supabase/index'

export async function GET(request: NextRequest) {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'week'
    const limit = parseInt(searchParams.get('limit') || '50')

    // ========================================================================
    // ANALYTICS OVERVIEW
    // ========================================================================
    
    // Total conversations
    const { count: totalConversationsCount, error: totalError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })

    console.log('Total conversations count:', totalConversationsCount, 'Error:', totalError)

    // Conversations by timeframe
    const timeframeDate = getTimeframeDate(timeframe)
    const { count: recentConversationsCount, error: recentError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', timeframeDate.toISOString())

    console.log('Recent conversations count:', recentConversationsCount, 'Error:', recentError)

    // Completed conversations (with analysis)
    const { count: completedConversationsCount, error: completedError } = await supabase
      .from('user_data')
      .select('*', { count: 'exact', head: true })
      .not('analysis_results', 'is', null)

    console.log('Completed conversations count:', completedConversationsCount, 'Error:', completedError)

    // ========================================================================
    // CONVERSATION DETAILS
    // ========================================================================
    
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        user_email,
        session_id,
        created_at,
        updated_at,
        metadata
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
    }

    console.log('Conversations data:', conversations?.length, 'conversations found')

    // ========================================================================
    // USER DATA WITH ANALYSIS
    // ========================================================================
    
    const conversationIds = conversations?.map(c => c.id) || []
    const { data: userData, error: userDataError } = await supabase
      .from('user_data')
      .select('*')
      .in('conversation_id', conversationIds)

    if (userDataError) {
      console.error('Error fetching user data:', userDataError)
    }

    // ========================================================================
    // LEAD SCORING AND ENRICHMENT
    // ========================================================================
    
    const enrichedConversations = conversations?.map(conversation => {
      const userInfo = userData?.find(u => u.conversation_id === conversation.id)
      
      // Calculate lead score
      const leadScore = calculateLeadScore(conversation, userInfo)
      
      // Extract key metrics
      const goals = userInfo?.goals as any
      const portfolio = userInfo?.portfolio_data as any
      const analysis = userInfo?.analysis_results as any
      
      return {
        ...conversation,
        leadScore,
        status: getConversationStatus(conversation, userInfo),
        goals: {
          type: goals?.goal_type,
          amount: goals?.target_amount,
          timeline: goals?.timeline_years
        },
        portfolio: {
          value: portfolio?.portfolio_value,
          holdings: portfolio?.holdings?.length || 0,
          newInvestor: portfolio?.new_investor
        },
        hasAnalysis: !!analysis,
        lastActivity: conversation.updated_at
      }
    }) || []

    // ========================================================================
    // SUMMARY STATISTICS
    // ========================================================================
    
    const stats = {
      total: {
        conversations: totalConversationsCount || 0,
        emails: new Set(conversations?.map(c => c.user_email)).size,
        completed: completedConversationsCount || 0
      },
      recent: {
        conversations: recentConversationsCount || 0,
        timeframe
      },
      conversion: {
        emailCapture: conversations?.filter(c => c.user_email).length || 0,
        analysisCompletion: enrichedConversations.filter(c => c.hasAnalysis).length,
        averageLeadScore: enrichedConversations.reduce((sum, c) => sum + c.leadScore, 0) / enrichedConversations.length || 0
      }
    }

    // ========================================================================
    // GOAL AND PORTFOLIO INSIGHTS
    // ========================================================================
    
    const insights = {
      goalTypes: getGoalTypeDistribution(enrichedConversations),
      portfolioSizes: getPortfolioSizeDistribution(enrichedConversations),
      newInvestors: enrichedConversations.filter(c => c.portfolio.newInvestor).length,
      highValueLeads: enrichedConversations.filter(c => c.leadScore >= 80).length
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        insights,
        conversations: enrichedConversations,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeframeDate(timeframe: string): Date {
  const now = new Date()
  switch (timeframe) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }
}

function calculateLeadScore(conversation: any, userData: any): number {
  let score = 0
  
  // Email provided (+20 points)
  if (conversation.user_email) score += 20
  
  // Goals completed (+25 points)
  if (userData?.goals) score += 25
  
  // Portfolio data provided (+25 points)
  if (userData?.portfolio_data) score += 25
  
  // Analysis completed (+30 points)
  if (userData?.analysis_results) score += 30
  
  // High portfolio value (+20 points for >$100k)
  const portfolioValue = userData?.portfolio_data?.portfolio_value
  if (portfolioValue && portfolioValue > 100000) score += 20
  
  // Recent activity (+10 points if within 24 hours)
  const lastActivity = new Date(conversation.updated_at)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  if (lastActivity > dayAgo) score += 10
  
  return Math.min(score, 100) // Cap at 100
}

function getConversationStatus(conversation: any, userData: any): string {
  if (userData?.analysis_results) return 'Completed'
  if (userData?.portfolio_data) return 'Portfolio Collected'
  if (userData?.goals) return 'Goals Collected'
  if (conversation.user_email) return 'Email Captured'
  return 'In Progress'
}

function getGoalTypeDistribution(conversations: any[]): Record<string, number> {
  const distribution: Record<string, number> = {}
  conversations.forEach(c => {
    const goalType = c.goals?.type || 'Unknown'
    distribution[goalType] = (distribution[goalType] || 0) + 1
  })
  return distribution
}

function getPortfolioSizeDistribution(conversations: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    'New Investor': 0,
    '$1-$50k': 0,
    '$50k-$250k': 0,
    '$250k-$1M': 0,
    '$1M+': 0,
    'Unknown': 0
  }
  
  conversations.forEach(c => {
    const value = c.portfolio?.value
    if (c.portfolio?.newInvestor) {
      distribution['New Investor']++
    } else if (!value) {
      distribution['Unknown']++
    } else if (value < 50000) {
      distribution['$1-$50k']++
    } else if (value < 250000) {
      distribution['$50k-$250k']++
    } else if (value < 1000000) {
      distribution['$250k-$1M']++
    } else {
      distribution['$1M+']++
    }
  })
  
  return distribution
}
