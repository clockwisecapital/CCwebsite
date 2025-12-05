/**
 * Admin Dashboard Data API
 * 
 * GET /api/admin/dashboard - Get dashboard analytics and conversation data
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/auth/admin'
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
      
      // Calculate lead score - transform userInfo to expected format
      const transformedUserInfo = userInfo ? {
        goals: userInfo.goals,
        portfolio_data: userInfo.portfolio_data as { portfolio_value?: number } | undefined,
        analysis_results: userInfo.analysis_results
      } : null
      const leadScore = calculateLeadScore(conversation, transformedUserInfo)
      
      // Extract key metrics
      const goals = userInfo?.goals as Record<string, unknown>
      const portfolio = userInfo?.portfolio_data as Record<string, unknown> & { 
        portfolio_value?: number; 
        holdings?: unknown[]; 
        new_investor?: boolean;
        stocks?: number;
        bonds?: number;
        cash?: number;
      }
      const analysis = userInfo?.analysis_results as AnalysisResults | null
      
      // Extract analysis metrics
      const analysisMetrics = analysis ? {
        expectedReturn: analysis.userPortfolio?.expectedReturn ?? 
                        analysis.comparison?.userPortfolio?.expectedReturn ?? null,
        timeExpectedReturn: analysis.timePortfolio?.expectedReturn ?? 
                           analysis.comparison?.timePortfolio?.expectedReturn ?? null,
        positionsCount: analysis.userPortfolio?.positions?.length || 0
      } : null
      
      return {
        ...conversation,
        leadScore,
        status: getConversationStatus(conversation, userInfo || null),
        goals: {
          type: (goals?.goal_type || goals?.type || null) as string | null,
          amount: (goals?.goal_amount || goals?.amount || null) as number | null,
          timeline: (goals?.horizon_years || goals?.timeline || null) as number | null
        },
        portfolio: {
          value: portfolio?.portfolio_value,
          holdings: portfolio?.holdings?.length || 0,
          newInvestor: portfolio?.new_investor,
          allocation: portfolio ? {
            stocks: portfolio.stocks || 0,
            bonds: portfolio.bonds || 0,
            cash: portfolio.cash || 0
          } : null
        },
        hasAnalysis: !!analysis,
        analysisMetrics,
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

    // ========================================================================
    // PORTFOLIO ANALYSIS INSIGHTS
    // ========================================================================
    
    const portfolioInsights = calculatePortfolioInsights(userData || [])

    return NextResponse.json({
      success: true,
      data: {
        stats,
        insights,
        portfolioInsights,
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

function calculateLeadScore(conversation: { user_email?: string | null; updated_at: string }, userData: { goals?: unknown; portfolio_data?: { portfolio_value?: number }; analysis_results?: unknown } | null): number {
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

function getConversationStatus(conversation: { user_email?: string | null }, userData: { goals?: unknown; portfolio_data?: unknown; analysis_results?: unknown } | null): string {
  if (userData?.analysis_results) return 'Completed'
  if (userData?.portfolio_data) return 'Portfolio Collected'
  if (userData?.goals) return 'Goals Collected'
  if (conversation.user_email) return 'Email Captured'
  return 'In Progress'
}

// Unused helper function - commented out for now
// function getGoalTypeLabel(type: string | undefined | null): string {
//   switch (type) {
//     case 'Retirement':
//       return 'Retirement'
//     case 'Wealth Creation':
//       return 'Wealth Creation'
//     case 'Education':
//       return 'Education'
//     case 'Major Purchase':
//       return 'Major Purchase'
//     case 'Business':
//       return 'Business'
//     default:
//       return 'Unknown'
//   }
// }

// Unused helper function - commented out for now
// function getPortfolioSizeRange(value: number | undefined | null): string {
//   if (value === undefined || value === null) return 'Unknown'
//   if (value < 50000) return '$1-$50k'
//   if (value < 250000) return '$50k-$250k'
//   if (value < 1000000) return '$250k-$1M'
//   return '$1M+'
// }

function getGoalTypeDistribution(conversations: Array<{ goals?: { type?: string | null } }>): Record<string, number> {
  const distribution: Record<string, number> = {}
  conversations.forEach(c => {
    const goalType = c.goals?.type || 'Unknown'
    distribution[goalType] = (distribution[goalType] || 0) + 1
  })
  return distribution
}

function getPortfolioSizeDistribution(conversations: Array<{ portfolio?: { value?: number; newInvestor?: boolean } }>): Record<string, number> {
  const distribution: Record<string, number> = {
    'Newinvestor': 0,
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

// ============================================================================
// PORTFOLIO ANALYSIS INSIGHTS
// ============================================================================

interface AnalysisResults {
  userPortfolio?: {
    expectedReturn?: number
    totalValue?: number
    positions?: Array<{
      ticker: string
      name: string
      weight: number
      expectedReturn?: number | null
      monteCarlo?: {
        median: number
        upside: number
        downside: number
        volatility: number
      } | null
    }>
  }
  timePortfolio?: {
    expectedReturn?: number
    totalValue?: number
  }
  comparison?: {
    userPortfolio?: {
      expectedReturn?: number
      totalValue?: number
    }
    timePortfolio?: {
      expectedReturn?: number
    }
  }
}

interface PortfolioData {
  portfolio_value?: number
  stocks?: number
  bonds?: number
  cash?: number
  realEstate?: number
  commodities?: number
  alternatives?: number
  holdings?: Array<unknown>
}

interface UserDataRecord {
  analysis_results?: unknown
  portfolio_data?: unknown
}

function calculatePortfolioInsights(userDataList: UserDataRecord[]): {
  avgExpectedReturn: number | null
  avgPortfolioValue: number | null
  totalAUM: number
  assetAllocationDistribution: Record<string, number>
  riskDistribution: { low: number; medium: number; high: number }
  completedAnalysisWithData: number
  avgTimePortfolioReturn: number | null
  returnComparison: {
    userAvg: number | null
    timeAvg: number | null
    difference: number | null
  }
} {
  const analysisData: AnalysisResults[] = []
  const portfolioData: PortfolioData[] = []
  
  // Extract analysis and portfolio data
  userDataList.forEach(ud => {
    if (ud.analysis_results) {
      analysisData.push(ud.analysis_results as AnalysisResults)
    }
    if (ud.portfolio_data) {
      portfolioData.push(ud.portfolio_data as PortfolioData)
    }
  })
  
  // Calculate average expected return from analysis results
  const expectedReturns: number[] = []
  const timeReturns: number[] = []
  
  analysisData.forEach(analysis => {
    // Try different paths where expected return might be stored
    const userReturn = analysis.userPortfolio?.expectedReturn ?? 
                       analysis.comparison?.userPortfolio?.expectedReturn
    const timeReturn = analysis.timePortfolio?.expectedReturn ?? 
                       analysis.comparison?.timePortfolio?.expectedReturn
    
    if (typeof userReturn === 'number' && !isNaN(userReturn)) {
      expectedReturns.push(userReturn)
    }
    if (typeof timeReturn === 'number' && !isNaN(timeReturn)) {
      timeReturns.push(timeReturn)
    }
  })
  
  const avgExpectedReturn = expectedReturns.length > 0
    ? expectedReturns.reduce((sum, r) => sum + r, 0) / expectedReturns.length
    : null
    
  const avgTimePortfolioReturn = timeReturns.length > 0
    ? timeReturns.reduce((sum, r) => sum + r, 0) / timeReturns.length
    : null
  
  // Calculate average portfolio value and total AUM
  const portfolioValues: number[] = []
  portfolioData.forEach(pd => {
    if (typeof pd.portfolio_value === 'number' && pd.portfolio_value > 0) {
      portfolioValues.push(pd.portfolio_value)
    }
  })
  
  const avgPortfolioValue = portfolioValues.length > 0
    ? portfolioValues.reduce((sum, v) => sum + v, 0) / portfolioValues.length
    : null
    
  const totalAUM = portfolioValues.reduce((sum, v) => sum + v, 0)
  
  // Calculate asset allocation distribution (aggregated percentages)
  const assetAllocation = {
    stocks: 0,
    bonds: 0,
    cash: 0,
    realEstate: 0,
    commodities: 0,
    alternatives: 0
  }
  let allocationCount = 0
  
  portfolioData.forEach(pd => {
    const hasAllocation = pd.stocks !== undefined || pd.bonds !== undefined || 
                          pd.cash !== undefined || pd.realEstate !== undefined
    if (hasAllocation) {
      assetAllocation.stocks += pd.stocks || 0
      assetAllocation.bonds += pd.bonds || 0
      assetAllocation.cash += pd.cash || 0
      assetAllocation.realEstate += pd.realEstate || 0
      assetAllocation.commodities += pd.commodities || 0
      assetAllocation.alternatives += pd.alternatives || 0
      allocationCount++
    }
  })
  
  // Average the allocations
  const assetAllocationDistribution: Record<string, number> = {}
  if (allocationCount > 0) {
    assetAllocationDistribution['Stocks'] = Math.round(assetAllocation.stocks / allocationCount)
    assetAllocationDistribution['Bonds'] = Math.round(assetAllocation.bonds / allocationCount)
    assetAllocationDistribution['Cash'] = Math.round(assetAllocation.cash / allocationCount)
    assetAllocationDistribution['Real Estate'] = Math.round(assetAllocation.realEstate / allocationCount)
    assetAllocationDistribution['Commodities'] = Math.round(assetAllocation.commodities / allocationCount)
    assetAllocationDistribution['Alternatives'] = Math.round(assetAllocation.alternatives / allocationCount)
  }
  
  // Calculate risk distribution based on Monte Carlo volatility
  const riskDistribution = { low: 0, medium: 0, high: 0 }
  
  analysisData.forEach(analysis => {
    const positions = analysis.userPortfolio?.positions || []
    if (positions.length > 0) {
      // Calculate weighted average volatility
      let totalVolatility = 0
      let totalWeight = 0
      
      positions.forEach(pos => {
        if (pos.monteCarlo?.volatility && pos.weight) {
          totalVolatility += pos.monteCarlo.volatility * pos.weight
          totalWeight += pos.weight
        }
      })
      
      if (totalWeight > 0) {
        const avgVolatility = totalVolatility / totalWeight
        // Classify risk: low (<15%), medium (15-25%), high (>25%)
        if (avgVolatility < 0.15) {
          riskDistribution.low++
        } else if (avgVolatility < 0.25) {
          riskDistribution.medium++
        } else {
          riskDistribution.high++
        }
      }
    }
  })
  
  return {
    avgExpectedReturn,
    avgPortfolioValue,
    totalAUM,
    assetAllocationDistribution,
    riskDistribution,
    completedAnalysisWithData: analysisData.length,
    avgTimePortfolioReturn,
    returnComparison: {
      userAvg: avgExpectedReturn,
      timeAvg: avgTimePortfolioReturn,
      difference: avgExpectedReturn !== null && avgTimePortfolioReturn !== null
        ? avgExpectedReturn - avgTimePortfolioReturn
        : null
    }
  }
}
