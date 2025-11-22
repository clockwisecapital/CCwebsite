/**
 * Database Utility Functions
 * 
 * High-level database operations for Clockwise Capital
 * Integrates with existing FSM system and session management
 */

import { createAdminSupabaseClient } from './server'
import type { 
  Conversation, 
  ConversationInsert,
  Message, 
  MessageInsert,
  UserData,
  UserDataInsert,
  SessionData,
  DisplaySpec,
  Json
} from './types.js'

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

/**
 * Create a new conversation record
 */
export async function createConversation(data: {
  userEmail?: string
  sessionId: string
  metadata?: Record<string, unknown>
}): Promise<Conversation | null> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const conversationData: ConversationInsert = {
      user_email: data.userEmail ?? null,
      session_id: data.sessionId,
      metadata: (data.metadata as Json) || {}
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(conversationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    return conversation
  } catch (error) {
    console.error('Database error creating conversation:', error)
    return null
  }
}

/**
 * Get conversation by session ID
 */
export async function getConversationBySessionId(sessionId: string): Promise<Conversation | null> {
  try {
    const supabase = createAdminSupabaseClient()

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is expected for new sessions
        return null
      }
      console.error('Error fetching conversation:', error)
      return null
    }

    return conversation
  } catch (error) {
    console.error('Database error fetching conversation:', error)
    return null
  }
}

/**
 * Update conversation metadata
 */
export async function updateConversation(
  conversationId: string,
  updates: { metadata?: Json; user_email?: string }
): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient()

    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)

    if (error) {
      console.error('Error updating conversation:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Database error updating conversation:', error)
    return false
  }
}

// ============================================================================
// MESSAGE MANAGEMENT
// ============================================================================

/**
 * Save a message to the database
 */
export async function saveMessage(data: {
  conversationId: string
  role: 'user' | 'assistant'
  content?: string
  displaySpec?: DisplaySpec | { blocks: Array<{ type: string; content: string }> }
  metadata?: Record<string, unknown>
}): Promise<Message | null> {
  try {
    const supabase = createAdminSupabaseClient()

    // Ensure at least one of content or displaySpec is provided to satisfy DB check
    const ensuredContent = data.content ?? (data.displaySpec ? null : '')

    const messageData: MessageInsert = {
      conversation_id: data.conversationId,
      role: data.role,
      content: ensuredContent,
      display_spec: (data.displaySpec as unknown as Json) || null,
      metadata: (data.metadata as Json) || {}
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('Error saving message:', error)
      return null
    }

    return message
  } catch (error) {
    console.error('Database error saving message:', error)
    return null
  }
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  try {
    const supabase = createAdminSupabaseClient()

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('seq', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return messages || []
  } catch (error) {
    console.error('Database error fetching messages:', error)
    return []
  }
}

// ============================================================================
// USER DATA MANAGEMENT
// ============================================================================

/**
 * Save or update user data (goals, portfolio, analysis)
 */
export async function saveUserData(data: {
  conversationId: string
  goals?: SessionData['goals']
  portfolio?: SessionData['portfolio']
  analysis?: SessionData['analysis'] | Record<string, unknown>
}): Promise<UserData | null> {
  try {
    const supabase = createAdminSupabaseClient()

    // Check if user data already exists
    const { data: existing } = await supabase
      .from('user_data')
      .select('*')
      .eq('conversation_id', data.conversationId)
      .single()

    const userData = {
      conversation_id: data.conversationId,
      goals: (data.goals as Json) || null,
      portfolio_data: (data.portfolio as Json) || null,
      analysis_results: (data.analysis as unknown as Json) || null
    }

    if (existing) {
      // Update existing record
      const { data: updated, error } = await supabase
        .from('user_data')
        .update(userData)
        .eq('conversation_id', data.conversationId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user data:', error)
        return null
      }

      return updated
    } else {
      // Create new record
      const { data: created, error } = await supabase
        .from('user_data')
        .insert(userData as UserDataInsert)
        .select()
        .single()

      if (error) {
        console.error('Error creating user data:', error)
        return null
      }

      return created
    }
  } catch (error) {
    console.error('Database error saving user data:', error)
    return null
  }
}

/**
 * Get user data by conversation ID
 */
export async function getUserData(conversationId: string): Promise<UserData | null> {
  try {
    const supabase = createAdminSupabaseClient()

    const { data: userData, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is expected for new conversations
        return null
      }
      console.error('Error fetching user data:', error)
      return null
    }

    return userData
  } catch (error) {
    console.error('Database error fetching user data:', error)
    return null
  }
}

// ============================================================================
// INTEGRATED SESSION MANAGEMENT
// ============================================================================

/**
 * Initialize or restore a conversation session
 * This integrates with your existing FSM system
 */
export async function initializeSession(sessionId: string, userEmail?: string): Promise<{
  conversation: Conversation | null
  userData: UserData | null
  messages: Message[]
}> {
  try {
    // Try to get existing conversation
    let conversation = await getConversationBySessionId(sessionId)
    
    // If no conversation exists, create one immediately (email optional)
    if (!conversation) {
      conversation = await createConversation({
        userEmail,
        sessionId,
        metadata: { initialized_at: new Date().toISOString() }
      })
    }

    // Get user data and messages if conversation exists
    let userData: UserData | null = null
    let messages: Message[] = []

    if (conversation) {
      // If an email was provided later, set it
      if (userEmail && conversation.user_email !== userEmail) {
        await updateConversation(conversation.id, { user_email: userEmail })
        // refresh conversation entity minimally
        conversation.user_email = userEmail
      }
      userData = await getUserData(conversation.id)
      messages = await getConversationMessages(conversation.id)
    }

    return {
      conversation,
      userData,
      messages
    }
  } catch (error) {
    console.error('Error initializing session:', error)
    return {
      conversation: null,
      userData: null,
      messages: []
    }
  }
}

/**
 * Save complete session state
 * This is called after each FSM stage completion
 */
export async function saveSessionState(data: {
  sessionId: string
  userEmail?: string
  stage: string
  goals?: SessionData['goals']
  portfolio?: SessionData['portfolio']
  analysis?: SessionData['analysis'] | Record<string, unknown>
  lastMessage?: {
    role: 'user' | 'assistant'
    content?: string
    displaySpec?: DisplaySpec | { blocks: Array<{ type: string; content: string }> }
  }
}): Promise<boolean> {
  try {
    // Get or create conversation
    let conversation = await getConversationBySessionId(data.sessionId)
    
    if (!conversation) {
      conversation = await createConversation({
        userEmail: data.userEmail,
        sessionId: data.sessionId,
        metadata: { stage: data.stage }
      })
    }

    if (!conversation) {
      console.error('Cannot save session state without conversation')
      return false
    }

    // Update email if provided later
    if (data.userEmail && conversation.user_email !== data.userEmail) {
      await updateConversation(conversation.id, { user_email: data.userEmail })
      conversation.user_email = data.userEmail
    }

    // Update conversation metadata with current stage
    await updateConversation(conversation.id, {
      metadata: ({ 
        stage: data.stage,
        last_updated: new Date().toISOString()
      } as unknown) as Json
    })

    // Save user data if provided
    if (data.goals || data.portfolio || data.analysis) {
      await saveUserData({
        conversationId: conversation.id,
        goals: data.goals,
        portfolio: data.portfolio,
        analysis: data.analysis
      })
    }

    // Save message if provided
    if (data.lastMessage) {
      await saveMessage({
        conversationId: conversation.id,
        role: data.lastMessage.role,
        content: data.lastMessage.content,
        displaySpec: data.lastMessage.displaySpec
      })
    }

    return true
  } catch (error) {
    console.error('Error saving session state:', error)
    return false
  }
}

// ============================================================================
// INTAKE FORMS
// ============================================================================

/**
 * Save intake form submission
 * Stores all intake form data in structured fields
 */
export async function saveIntakeForm(data: {
  conversationId: string
  sessionId: string
  avatarVariant?: 'control' | 'variant-b'
  intakeData: {
    age?: number
    experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced'
    riskTolerance?: 'low' | 'medium' | 'high'
    firstName?: string
    lastName?: string
    email?: string
    goalAmount?: number
    goalDescription?: string
    timeHorizon?: number
    monthlyContribution?: number
    portfolio: {
      totalValue?: number
      stocks: number
      bonds: number
      cash: number
      realEstate: number
      commodities: number
      alternatives: number
    }
    portfolioDescription?: string
    specificHoldings?: Array<{
      name: string
      ticker?: string
      percentage: number
    }>
  }
}): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { error } = await supabase
      .from('intake_forms')
      .insert({
        conversation_id: data.conversationId,
        session_id: data.sessionId,
        avatar_variant: data.avatarVariant || 'variant-b',
        age: data.intakeData.age,
        experience_level: data.intakeData.experienceLevel,
        risk_tolerance: data.intakeData.riskTolerance,
        first_name: data.intakeData.firstName,
        last_name: data.intakeData.lastName,
        email: data.intakeData.email,
        goal_amount: data.intakeData.goalAmount,
        goal_description: data.intakeData.goalDescription,
        time_horizon: data.intakeData.timeHorizon,
        monthly_contribution: data.intakeData.monthlyContribution,
        portfolio_total_value: data.intakeData.portfolio.totalValue,
        portfolio_stocks: data.intakeData.portfolio.stocks,
        portfolio_bonds: data.intakeData.portfolio.bonds,
        portfolio_cash: data.intakeData.portfolio.cash,
        portfolio_real_estate: data.intakeData.portfolio.realEstate,
        portfolio_commodities: data.intakeData.portfolio.commodities,
        portfolio_alternatives: data.intakeData.portfolio.alternatives,
        portfolio_description: data.intakeData.portfolioDescription,
        specific_holdings: data.intakeData.specificHoldings as Json || null,
      })

    if (error) {
      console.error('Error saving intake form:', error)
      return false
    }

    console.log('✅ Intake form saved successfully')
    return true
  } catch (error) {
    console.error('Database error saving intake form:', error)
    return false
  }
}

/**
 * Get intake form by conversation ID
 */
export async function getIntakeForm(conversationId: string) {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('intake_forms')
      .select('*')
      .eq('conversation_id', conversationId)
      .single()

    if (error) {
      console.error('Error fetching intake form:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Database error fetching intake form:', error)
    return null
  }
}

/**
 * Get all intake forms (for admin/reporting)
 */
export async function getAllIntakeForms(limit = 100) {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('intake_forms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching intake forms:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Database error fetching intake forms:', error)
    return []
  }
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Get conversation analytics (for admin/reporting)
 */
export async function getConversationAnalytics(timeframe: 'day' | 'week' | 'month' = 'week') {
  try {
    const supabase = createAdminSupabaseClient()
    
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching analytics:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Database error fetching analytics:', error)
    return []
  }
}

/**
 * Submit user rating for their experience
 * Updates the intake form with rating and timestamp
 */
export async function submitUserRating(
  sessionId: string,
  rating: number
): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Get conversation by session ID
    const conversation = await getConversationBySessionId(sessionId)
    if (!conversation) {
      console.error('Conversation not found for session:', sessionId)
      return false
    }

    // Update the intake form with the rating
    const { error } = await supabase
      .from('intake_forms')
      .update({
        user_rating: rating,
        rating_submitted_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('conversation_id', conversation.id)

    if (error) {
      console.error('Error saving user rating:', error)
      return false
    }

    console.log('✅ User rating saved successfully:', { sessionId, rating })
    return true
  } catch (error) {
    console.error('Database error saving rating:', error)
    return false
  }
}

// ============================================================================
// PORTFOLIO DATA
// ============================================================================

/**
 * Get target prices for tickers
 */
export async function getTgtPrices(tickers: string[]): Promise<Map<string, number>> {
  try {
    const supabase = createAdminSupabaseClient()
    
    console.log(`📊 Querying tgt_price table for ${tickers.length} tickers:`, tickers.slice(0, 10).join(', '), '...');
    
    const { data, error } = await supabase
      .from('tgt_price')
      .select('*')
      .in('Ticker', tickers)

    if (error) {
      console.error('❌ Error fetching TGT prices:', error)
      return new Map()
    }

    console.log(`✅ tgt_price query returned ${data?.length || 0} rows`);

    const pricesMap = new Map<string, number>()
    
    if (data) {
      console.log('📋 Sample row structure:', data[0]);
      
      data.forEach((row) => {
        // Use the correct column name from database schema
        const priceRaw = row['Consensus Tgt Price'];
        
        if (priceRaw !== null && priceRaw !== undefined) {
          // Parse the price (it might be a string)
          const priceStr = String(priceRaw);
          
          // Skip invalid values like #N/A, N/A, etc.
          if (priceStr.includes('#N/A') || priceStr.toUpperCase() === 'N/A' || priceStr.trim() === '') {
            console.warn(`  ⚠️ ${row.Ticker}: Invalid target price "${priceStr}" - skipping`);
            return;
          }
          
          const price = parseFloat(priceStr);
          
          if (!isNaN(price) && price > 0) {
            pricesMap.set(row.Ticker, price);
            console.log(`  ✓ ${row.Ticker}: $${price.toFixed(2)}`);
          } else {
            console.warn(`  ⚠️ ${row.Ticker}: Could not parse price "${priceStr}" to valid number`);
          }
        } else {
          console.warn(`  ⚠️ ${row.Ticker}: price is ${priceRaw} (null/undefined)`);
        }
      })
    }

    return pricesMap
  } catch (error) {
    console.error('❌ Database error fetching TGT prices:', error)
    return new Map()
  }
}

/**
 * Get all holding weights (TIME portfolio positions)
 */
export async function getHoldingWeights(): Promise<Array<{
  stockTicker: string;
  securityName: string;
  shares: number;
  price: number;
  marketValue: number;
  weightings: number;
}>> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('holding_weights')
      .select('*')
      .order('Weightings', { ascending: false })

    if (error) {
      console.error('Error fetching holding weights:', error)
      return []
    }

    if (!data) {
      return []
    }

    return data.map((row) => ({
      stockTicker: row.StockTicker,
      securityName: row.SecurityName || '',
      shares: typeof row.Shares === 'string' ? parseFloat(row.Shares) : (row.Shares || 0),
      price: row.Price || 0,
      marketValue: typeof row.MarketValue === 'string' ? parseFloat(row.MarketValue) : (row.MarketValue || 0),
      weightings: typeof row.Weightings === 'string' ? parseFloat(row.Weightings) : (row.Weightings || 0)
    }))
  } catch (error) {
    console.error('Database error fetching holding weights:', error)
    return []
  }
}

/**
 * Update price in holding_weights table
 */
export async function updateHoldingPrice(ticker: string, price: number): Promise<boolean> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { error } = await supabase
      .from('holding_weights')
      .update({ Price: price })
      .eq('StockTicker', ticker)

    if (error) {
      console.error(`Error updating price for ${ticker}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Database error updating price for ${ticker}:`, error)
    return false
  }
}

/**
 * Batch update prices in holding_weights table
 */
export async function batchUpdateHoldingPrices(
  updates: Array<{ ticker: string; price: number }>
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const { ticker, price } of updates) {
    const result = await updateHoldingPrice(ticker, price)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  return { success, failed }
}