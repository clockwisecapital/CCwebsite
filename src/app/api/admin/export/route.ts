/**
 * Admin Data Export API
 * 
 * GET /api/admin/export - Export conversation data as CSV
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
    const format = searchParams.get('format') || 'csv'
    const timeframe = searchParams.get('timeframe') || 'all'

    // ========================================================================
    // FETCH CONVERSATION DATA
    // ========================================================================
    
    let query = supabase
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

    // Apply timeframe filter
    if (timeframe !== 'all') {
      const timeframeDate = getTimeframeDate(timeframe)
      query = query.gte('created_at', timeframeDate.toISOString())
    }

    const { data: conversations, error: conversationsError } = await query

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch data' },
        { status: 500 }
      )
    }

    // ========================================================================
    // FETCH USER DATA
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
    // ENRICH AND FORMAT DATA
    // ========================================================================
    
    const enrichedData = conversations?.map(conversation => {
      const userInfo = userData?.find(u => u.conversation_id === conversation.id)
      const goals = userInfo?.goals as any
      const portfolio = userInfo?.portfolio_data as any
      const analysis = userInfo?.analysis_results as any

      return {
        // Basic Info
        conversation_id: conversation.id,
        email: conversation.user_email,
        session_id: conversation.session_id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        
        // Goals
        goal_type: goals?.goal_type || '',
        target_amount: goals?.target_amount || '',
        timeline_years: goals?.timeline_years || '',
        
        // Portfolio
        portfolio_value: portfolio?.portfolio_value || '',
        new_investor: portfolio?.new_investor ? 'Yes' : 'No',
        holdings_count: portfolio?.holdings?.length || 0,
        
        // Analysis Status
        has_analysis: analysis ? 'Yes' : 'No',
        analysis_completed_at: userInfo?.updated_at || '',
        
        // Lead Scoring
        lead_score: calculateLeadScore(conversation, userInfo),
        status: getConversationStatus(conversation, userInfo)
      }
    }) || []

    // ========================================================================
    // GENERATE CSV
    // ========================================================================
    
    if (format === 'csv') {
      const csv = generateCSV(enrichedData)
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="clockwise-leads-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // ========================================================================
    // RETURN JSON
    // ========================================================================
    
    return NextResponse.json({
      success: true,
      data: enrichedData,
      count: enrichedData.length,
      exported_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { success: false, message: 'Export failed' },
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
      return new Date(0) // Beginning of time for 'all'
  }
}

function calculateLeadScore(conversation: any, userData: any): number {
  let score = 0
  
  if (conversation.user_email) score += 20
  if (userData?.goals) score += 25
  if (userData?.portfolio_data) score += 25
  if (userData?.analysis_results) score += 30
  
  const portfolioValue = userData?.portfolio_data?.portfolio_value
  if (portfolioValue && portfolioValue > 100000) score += 20
  
  const lastActivity = new Date(conversation.updated_at)
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  if (lastActivity > dayAgo) score += 10
  
  return Math.min(score, 100)
}

function getConversationStatus(conversation: any, userData: any): string {
  if (userData?.analysis_results) return 'Completed'
  if (userData?.portfolio_data) return 'Portfolio Collected'
  if (userData?.goals) return 'Goals Collected'
  if (conversation.user_email) return 'Email Captured'
  return 'In Progress'
}

function generateCSV(data: any[]): string {
  if (data.length === 0) return 'No data available'

  // CSV Headers
  const headers = [
    'Conversation ID',
    'Email',
    'Session ID',
    'Created At',
    'Updated At',
    'Goal Type',
    'Target Amount',
    'Timeline Years',
    'Portfolio Value',
    'New Investor',
    'Holdings Count',
    'Has Analysis',
    'Analysis Completed At',
    'Lead Score',
    'Status'
  ]

  // CSV Rows
  const rows = data.map(row => [
    row.conversation_id,
    row.email,
    row.session_id,
    row.created_at,
    row.updated_at,
    row.goal_type,
    row.target_amount,
    row.timeline_years,
    row.portfolio_value,
    row.new_investor,
    row.holdings_count,
    row.has_analysis,
    row.analysis_completed_at,
    row.lead_score,
    row.status
  ])

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csvContent
}
