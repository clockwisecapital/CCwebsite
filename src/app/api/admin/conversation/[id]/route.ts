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
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    console.log('Getting conversation details for ID:', id)
    const supabase = createAdminSupabaseClient()
    const conversationId = id

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
    // GET INTAKE FORM DATA
    // ========================================================================
    
    const { data: intakeForm } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()

    // ========================================================================
    // ENRICH CONVERSATION DATA
    // ========================================================================
    
    const safeMessages = messages || []

    // Parse analysis results for detailed display
    const analysisResults = userData?.analysis_results as AnalysisResultsData | null
    const portfolioData = userData?.portfolio_data as PortfolioDataRecord | null
    
    // Get portfolio value from multiple possible sources
    const portfolioValue = portfolioData?.portfolio_value || 
                          intakeForm?.portfolio_total_value || 
                          0

    // Check if we have portfolio comparison data (new format) or just AI analysis (old format)
    const hasPortfolioComparison = !!(analysisResults?.userPortfolio?.expectedReturn || 
                                      analysisResults?.comparison?.userPortfolio?.expectedReturn)

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
      // Structured portfolio analysis data for UI display
      portfolioAnalysis: analysisResults ? {
        userPortfolio: {
          expectedReturn: analysisResults.userPortfolio?.expectedReturn ?? 
                         analysisResults.comparison?.userPortfolio?.expectedReturn ?? null,
          totalValue: analysisResults.userPortfolio?.totalValue ?? 
                     portfolioValue,
          positions: analysisResults.userPortfolio?.positions || [],
          topPositions: analysisResults.userPortfolio?.topPositions || 
                       (analysisResults.userPortfolio?.positions || []).slice(0, 5),
          isUsingProxy: analysisResults.userPortfolio?.isUsingProxy || false,
          proxyMessage: analysisResults.userPortfolio?.proxyMessage
        },
        timePortfolio: {
          expectedReturn: analysisResults.timePortfolio?.expectedReturn ?? 
                         analysisResults.comparison?.timePortfolio?.expectedReturn ?? null,
          totalValue: analysisResults.timePortfolio?.totalValue ?? portfolioValue,
          positions: analysisResults.timePortfolio?.positions || [],
          topPositions: analysisResults.timePortfolio?.topPositions || 
                       (analysisResults.timePortfolio?.positions || []).slice(0, 5)
        },
        timeHorizon: analysisResults.timeHorizon || intakeForm?.time_horizon || null,
        returnDifference: calculateReturnDifference(analysisResults),
        // Include AI analysis metrics for older records without Monte Carlo data
        aiAnalysis: !hasPortfolioComparison ? {
          riskLevel: (analysisResults as Record<string, unknown>)?.riskLevel,
          beta: (analysisResults as Record<string, unknown>)?.beta,
          volatility: (analysisResults as Record<string, unknown>)?.volatility,
          marketImpact: (analysisResults as Record<string, unknown>)?.marketImpact,
          portfolioImpact: (analysisResults as Record<string, unknown>)?.portfolioImpact,
          goalImpact: (analysisResults as Record<string, unknown>)?.goalImpact,
          metrics: (analysisResults as Record<string, unknown>)?.metrics,
        } : null
      } : null,
      // Asset allocation - prioritize intake form data (more reliable)
      assetAllocation: intakeForm ? {
        stocks: intakeForm.portfolio_stocks || portfolioData?.stocks || 0,
        bonds: intakeForm.portfolio_bonds || portfolioData?.bonds || 0,
        cash: intakeForm.portfolio_cash || portfolioData?.cash || 0,
        realEstate: intakeForm.portfolio_real_estate || portfolioData?.realEstate || 0,
        commodities: intakeForm.portfolio_commodities || portfolioData?.commodities || 0,
        alternatives: intakeForm.portfolio_alternatives || portfolioData?.alternatives || 0
      } : portfolioData ? {
        stocks: portfolioData.stocks || 0,
        bonds: portfolioData.bonds || 0,
        cash: portfolioData.cash || 0,
        realEstate: portfolioData.realEstate || 0,
        commodities: portfolioData.commodities || 0,
        alternatives: portfolioData.alternatives || 0
      } : null,
      // Risk metrics from Monte Carlo data
      riskMetrics: analysisResults?.userPortfolio?.positions 
        ? calculateRiskMetrics(analysisResults.userPortfolio.positions)
        : null,
      // Intake form context
      intakeFormData: intakeForm ? {
        age: intakeForm.age,
        experienceLevel: intakeForm.experience_level,
        riskTolerance: intakeForm.risk_tolerance,
        firstName: intakeForm.first_name,
        lastName: intakeForm.last_name,
        goalAmount: intakeForm.goal_amount,
        goalDescription: intakeForm.goal_description,
        timeHorizon: intakeForm.time_horizon,
        monthlyContribution: intakeForm.monthly_contribution,
        portfolioTotalValue: intakeForm.portfolio_total_value,
        specificHoldings: intakeForm.specific_holdings
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
    console.error('Failed to fetch conversation details:', error)
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

// Portfolio Analysis Types
interface PositionData {
  ticker: string
  name: string
  weight: number
  currentPrice?: number
  targetPrice?: number | null
  expectedReturn?: number | null
  monteCarlo?: {
    median: number
    upside: number
    downside: number
    volatility: number
    simulations?: number
  } | null
  isProxy?: boolean
  assetClass?: string
}

interface PortfolioDataRecord {
  portfolio_value?: number
  stocks?: number
  bonds?: number
  cash?: number
  realEstate?: number
  commodities?: number
  alternatives?: number
  holdings?: unknown[]
  new_investor?: boolean
}

interface AnalysisResultsData {
  userPortfolio?: {
    expectedReturn?: number
    totalValue?: number
    positions?: PositionData[]
    topPositions?: PositionData[]
    isUsingProxy?: boolean
    proxyMessage?: string
  }
  timePortfolio?: {
    expectedReturn?: number
    totalValue?: number
    positions?: PositionData[]
    topPositions?: PositionData[]
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
  timeHorizon?: number
}

function calculateReturnDifference(analysis: AnalysisResultsData): number | null {
  const userReturn = analysis.userPortfolio?.expectedReturn ?? 
                     analysis.comparison?.userPortfolio?.expectedReturn
  const timeReturn = analysis.timePortfolio?.expectedReturn ?? 
                     analysis.comparison?.timePortfolio?.expectedReturn
  
  if (typeof userReturn === 'number' && typeof timeReturn === 'number') {
    return userReturn - timeReturn
  }
  return null
}

function calculateRiskMetrics(positions: PositionData[]): {
  portfolioVolatility: number | null
  maxUpside: number | null
  maxDownside: number | null
  medianReturn: number | null
  riskLevel: 'low' | 'medium' | 'high' | null
} {
  if (!positions || positions.length === 0) {
    return {
      portfolioVolatility: null,
      maxUpside: null,
      maxDownside: null,
      medianReturn: null,
      riskLevel: null
    }
  }

  let totalVolatility = 0
  let totalUpside = 0
  let totalDownside = 0
  let totalMedian = 0
  let totalWeight = 0

  positions.forEach(pos => {
    if (pos.monteCarlo && pos.weight) {
      totalVolatility += pos.monteCarlo.volatility * pos.weight
      totalUpside += pos.monteCarlo.upside * pos.weight
      totalDownside += pos.monteCarlo.downside * pos.weight
      totalMedian += pos.monteCarlo.median * pos.weight
      totalWeight += pos.weight
    }
  })

  if (totalWeight === 0) {
    return {
      portfolioVolatility: null,
      maxUpside: null,
      maxDownside: null,
      medianReturn: null,
      riskLevel: null
    }
  }

  const portfolioVolatility = totalVolatility / totalWeight
  const maxUpside = totalUpside / totalWeight
  const maxDownside = totalDownside / totalWeight
  const medianReturn = totalMedian / totalWeight

  // Classify risk: low (<15%), medium (15-25%), high (>25%)
  let riskLevel: 'low' | 'medium' | 'high'
  if (portfolioVolatility < 0.15) {
    riskLevel = 'low'
  } else if (portfolioVolatility < 0.25) {
    riskLevel = 'medium'
  } else {
    riskLevel = 'high'
  }

  return {
    portfolioVolatility,
    maxUpside,
    maxDownside,
    medianReturn,
    riskLevel
  }
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
