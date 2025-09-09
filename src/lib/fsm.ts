/*
=====================================================================================
                        FSM ORCHESTRATOR - HYBRID AI CONVERSATION SYSTEM
=====================================================================================
This is the core orchestration engine for the Clockwise Capital portfolio analysis
chatbot. It implements a Finite State Machine (FSM) pattern that guides users 
through a structured conversation flow while leveraging AI for natural language 
understanding and data extraction.

ARCHITECTURE OVERVIEW:
- FSM stages: qualify → goals → portfolio → analyze → explain → CTA
- Hybrid approach: AI extraction + structured validation
- Session-based memory management
- DisplaySpec rendering for frontend consistency

FLOW DESIGN:
1. Users start with qualification/welcome
2. AI extracts investment goals from natural language
3. AI extracts portfolio data or handles new investors
4. System analyzes data and provides recommendations
5. Conversation ends with booking consultation CTA
=====================================================================================
*/

import { SessionMemory, sessionManager } from './session';
import * as fs from 'fs';
import * as path from 'path';

// ==================================================================================
//                                   TYPE DEFINITIONS
// ==================================================================================

/**
 * Context object passed to each stage handler containing user input and session info
 */
interface ConversationContext {
  sessionId: string;
  userMessage: string;
  conversationHistory: any[];
}

/**
 * Investment goals data structure - all fields extracted via AI from user messages
 */
interface GoalsData {
  goal_type?: 'growth' | 'income' | 'balanced' | 'preservation' | 'lump_sum';
  goal_amount?: number;          // Target dollar amount
  horizon_years?: number;        // Investment timeline
  risk_tolerance?: 'low' | 'medium' | 'high';
  liquidity_needs?: 'low' | 'medium' | 'high';
  target_return?: number;        // Optional expected return percentage
}

/**
 * Portfolio data structure - supports existing investors and new investor flows
 */
interface PortfolioData {
  allocations?: {
    stocks?: number;
    bonds?: number;
    cash?: number;
    commodities?: number;
    real_estate?: number;
    alternatives?: number;
  };
  currency?: string;
  top_positions?: Array<{ name: string; weight: number; }>;
  sectors?: Array<{ name: string; weight: number; }>;
}

// ==================================================================================
//                               MAIN FSM ORCHESTRATOR CLASS
// ==================================================================================

/**
 * FSMOrchestrator - The main conversation controller
 * 
 * This class implements the core FSM pattern that routes user messages to appropriate
 * stage handlers based on the current conversation state. Each stage collects specific
 * data and advances when completion criteria are met.
 * 
 * KEY RESPONSIBILITIES:
 * - Route messages to correct stage handler
 * - Manage session state and persistence
 * - Coordinate between AI extraction and structured validation
 * - Return consistent DisplaySpec responses for frontend rendering
 */
export class FSMOrchestrator {
  
  /**
   * MAIN ENTRY POINT - Process user message through FSM
   * 
   * This is the primary method called by the chat API. It:
   * 1. Retrieves or creates user session
   * 2. Routes to appropriate stage handler
   * 3. Returns structured response with DisplaySpec blocks
   * 
   * @param context - Contains sessionId, userMessage, and conversation history
   * @returns DisplaySpec response with blocks for frontend rendering
   */
  async processMessage(context: ConversationContext) {
    console.log('=== FSM ORCHESTRATOR START ===');
    console.log('Session ID:', context.sessionId);
    console.log('User Message:', context.userMessage);

    // ============================================================================
    // SESSION MANAGEMENT - Get existing session or create new one
    // ============================================================================
    let session = sessionManager.getSession(context.sessionId);
    
    if (!session) {
      console.log('🆕 Creating new session for:', context.sessionId);
      session = sessionManager.createSession(context.sessionId);
    } else {
      console.log('♻️  Using existing session:', context.sessionId);
    }

    // Log current state for debugging
    console.log('📊 Current Session State:');
    console.log('  - Stage:', session.stage);
    console.log('  - Completed Slots:', session.completed_slots);
    console.log('  - Missing Slots:', session.missing_slots);
    console.log('  - Goals Data:', session.goals);

    console.log(`\n🔀 Routing to ${session.stage.toUpperCase()} stage handler...`);

    // ============================================================================
    // STAGE ROUTING - Direct to appropriate handler based on current stage
    // ============================================================================
    let result;
    switch (session.stage) {
      case 'qualify':
        result = await this.handleQualifyStage(session, context);
        break;
      case 'goals':
        result = await this.handleGoalsStage(session, context);
        break;
      case 'portfolio':
        result = await this.handlePortfolioStage(session, context);
        break;
      case 'analyze':
        result = await this.handleAnalyzeStage(session, context);
        break;
      default:
        result = await this.handleDefaultStage(session, context);
    }

    console.log('📤 Result Overview:', {
      stage: result.session?.stage,
      blocksCount: result.displaySpec?.blocks?.length,
      completedSlots: result.session?.completed_slots?.length
    });

    return result;
  }

  // ============================================================================
  //                              STAGE 1: QUALIFICATION HANDLER
  // ============================================================================
  
  /**
   * QUALIFY STAGE - Welcome and onboard new users
   * 
   * This is the entry point for new conversations. It:
   * - Welcomes users with friendly introduction
   * - Explains what the analysis will cover
   * - Waits for user consent to begin
   * - Advances to goals stage when user agrees
   * 
   * ADVANCEMENT CRITERIA: User says "yes", "analyze", "start", or similar
   */
  private async handleQualifyStage(session: SessionMemory, context: ConversationContext) {
    console.log('🎯 QUALIFY STAGE HANDLER');

    const response = {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "Welcome to Clockwise Capital's Portfolio Analysis! 🚀",
              "We're excited to assist you in assessing your portfolio to align with your financial goals."
            ])
          },
          {
            type: "conversation_text",
            content: JSON.stringify([
              "Here's what we'll do: understand your financial goals and aspirations, assess your risk tolerance and liquidity needs, and analyze your current portfolio allocations to suggest improvements."
            ])
          },
          {
            type: "cta_group",
            content: JSON.stringify([{ label: "Let's Begin", action: "start" }])
          }
        ]
      }
    };

    // Check if user agreed to analysis - simple keyword detection
    if (context.userMessage.toLowerCase().includes('yes') || 
        context.userMessage.toLowerCase().includes('analyze') ||
        context.userMessage.toLowerCase().includes('start')) {
      sessionManager.advanceStage(session);
    }

    return this.formatResponse(response, session);
  }

  // ============================================================================
  //                              STAGE 2: GOALS COLLECTION HANDLER
  // ============================================================================
  
  /**
   * GOALS STAGE - Collect investment goals via hybrid AI extraction
   * 
   * This stage implements the PROVEN HYBRID PATTERN for reliable data collection:
   * 1. AI extracts structured data from natural language
   * 2. Session state is updated with extracted data
   * 3. Completion is checked and stage advances when all required slots filled
   * 4. Unified response builder generates contextual prompts
   * 
   * REQUIRED SLOTS (5 total):
   * - goal_type: growth|income|balanced|preservation|lump_sum
   * - goal_amount: target dollar amount
   * - horizon_years: investment timeline in years
   * - risk_tolerance: low|medium|high
   * - liquidity_needs: low|medium|high
   * 
   * ADVANCEMENT CRITERIA: All 5 required slots completed
   */
  private async handleGoalsStage(session: SessionMemory, context: ConversationContext) {
    console.log('🎯 HYBRID GOALS STAGE HANDLER START');
    
    // ========================================================================
    // SAFETY: Initialize goals object if missing to prevent TypeErrors
    // ========================================================================
    if (!session.goals) {
      console.log('🔧 Initializing goals object...');
      session.goals = {};
    }

    // ========================================================================
    // STEP 1: AI EXTRACTION - Parse user message into structured data
    // ========================================================================
    const aiExtraction = await this.aiExtractGoals(context.userMessage, session) || {};
    console.log('🤖 AI Extraction Result:', aiExtraction);

    // ========================================================================
    // STEP 2: SESSION UPDATE - Merge extracted data safely
    // ========================================================================
    if (aiExtraction && Object.keys(aiExtraction).length > 0) {
      console.log('✅ Found new goals data, updating session...');
      
      // Update goals properties safely using spread operator
      session.goals = { ...(session.goals || {}), ...aiExtraction };
      
      // Update slot tracking for progress display
      this.updateGoalSlots(session);
      sessionManager.updateSession(session.session_id, session);
    }

    // ========================================================================
    // STEP 3: COMPLETION CHECK - Advance to portfolio stage when complete
    // ========================================================================
    if (this.isGoalsComplete(session.goals)) {
      console.log('🎉 Goals collection complete! Advancing to portfolio stage...');
      session.stage = 'portfolio';
      sessionManager.updateSession(session.session_id, session);
      
      // Return completion summary with encouraging message
      return {
        displaySpec: {
          blocks: [
            {
              type: "summary_bullets",
              content: JSON.stringify([
                "🎉 Goals collection complete!",
                `Investment type: ${session.goals.goal_type}`,
                `Target amount: $${session.goals.goal_amount?.toLocaleString()}`,
                `Time horizon: ${session.goals.horizon_years} years`
              ])
            },
            {
              type: "conversation_text", 
              content: JSON.stringify(["Perfect! I have all your investment goals. Now let's discuss your current portfolio allocation to see how it aligns with your objectives."])
            },
            {
              type: "cta_group",
              content: JSON.stringify([{ label: "Continue to Portfolio Analysis", action: "continue" }])
            }
          ]
        },
        session,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // ========================================================================
    // STEP 4: UNIFIED RESPONSE - Generate contextual prompt for missing data
    // ========================================================================
    return await this.buildUnifiedGoalsResponse(session, context);
  }

  // ============================================================================
  //                              AI EXTRACTION METHODS
  // ============================================================================
  
  /**
   * AI GOALS EXTRACTION - Parse natural language into structured goals data
   * 
   * This method uses OpenAI GPT-4o-mini to extract investment goals from user messages.
   * It's designed to be robust and handle various ways users express their goals.
   * 
   * KEY FEATURES:
   * - JSON-only response format for reliability
   * - Context-aware prompting based on missing slots
   * - Comprehensive examples for better extraction accuracy
   * - Error handling with empty object fallback
   * 
   * EXTRACTION TARGETS:
   * - goal_type: growth, income, balanced, preservation, lump_sum
   * - goal_amount: dollar amounts (handles "$1M", "1 million", etc.)
   * - horizon_years: time references ("10 years", "in 5 years")
   * - risk_tolerance: low, medium, high
   * - liquidity_needs: low, medium, high
   * 
   * @param userMessage - Raw user input to extract from
   * @param session - Current session for context about missing slots
   * @returns Partial goals object with extracted data or empty object
   */
  private async aiExtractGoals(userMessage: string, session: SessionMemory): Promise<Partial<GoalsData>> {
    console.log('🤖 AI EXTRACTION START');
    console.log('  - User Message:', userMessage);
    console.log('  - Missing Slots:', session.missing_slots);
    console.log('  - OpenAI API Key Present:', !!process.env.OPENAI_API_KEY);
    
    try {
      const prompt = `
Extract investment goal data from this user message: "${userMessage}"

Context - we still need: ${session.missing_slots.join(', ')}

Return ONLY a JSON object with any clearly identifiable values:
{
  "goal_type": "growth|income|balanced|preservation|lump_sum",
  "goal_amount": number (raw number, no formatting),
  "horizon_years": number,
  "risk_tolerance": "low|medium|high", 
  "liquidity_needs": "low|medium|high"
}

Examples:
- "I am looking for growth" → {"goal_type": "growth"}
- "I would like 100,000 dollars in 12 years" → {"goal_amount": 100000, "horizon_years": 12}
- "Growth in 12 years 100,000 dollars" → {"goal_type": "growth", "goal_amount": 100000, "horizon_years": 12}
- "my goal type is growth" → {"goal_type": "growth"}
- "100k in 10 years" → {"goal_amount": 100000, "horizon_years": 10}
- "I want to grow my money" → {"goal_type": "growth"}
- "Looking for income generation" → {"goal_type": "income"}
- "I need balanced approach" → {"goal_type": "balanced"}
- "Capital preservation is key" → {"goal_type": "preservation"}
- "I need 500k for retirement" → {"goal_amount": 500000, "goal_type": "lump_sum"}
- "50 thousand dollars" → {"goal_amount": 50000}
- "$1M goal" → {"goal_amount": 1000000}
- "1.5 million" → {"goal_amount": 1500000}
- "quarter million" → {"goal_amount": 250000}
- "half a million" → {"goal_amount": 500000}
- "5 years from now" → {"horizon_years": 5}
- "within 20 years" → {"horizon_years": 20}
- "in fifteen years" → {"horizon_years": 15}
- "by 2030" → {"horizon_years": 6}
- "I'm conservative" → {"risk_tolerance": "low"}
- "moderate risk" → {"risk_tolerance": "medium"}
- "I can handle volatility" → {"risk_tolerance": "high"}
- "aggressive investor" → {"risk_tolerance": "high"}
- "very safe approach" → {"risk_tolerance": "low"}
- "I need quick access" → {"liquidity_needs": "high"}
- "don't need cash soon" → {"liquidity_needs": "low"}
- "some flexibility needed" → {"liquidity_needs": "medium"}
- "emergency access important" → {"liquidity_needs": "high"}
- "long-term locked up okay" → {"liquidity_needs": "low"}

CRITICAL PARSING RULES:
- "growth" = goal_type: "growth"
- Numbers like "100,000", "100k", "100K" = goal_amount: 100000
- Time like "12 years", "in 12 years" = horizon_years: 12
- Always extract what you can find, even partial data

Return {} if absolutely no data found.
`;

      console.log('🤖 Making OpenAI API call...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 100,
          temperature: 0.1
        })
      });

      const data = await response.json();
      console.log('🤖 Full API Response:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('❌ OpenAI API Error:', data);
        return {};
      }
      
      const rawContent = data.choices?.[0]?.message?.content;
      console.log('🤖 AI Raw Response:', rawContent);
      
      if (!rawContent) {
        console.log('❌ No content in AI response');
        return {};
      }
      
      const extracted = JSON.parse(rawContent || '{}');
      console.log('🤖 AI Extraction Result:', extracted);
      
      return extracted;
    } catch (error) {
      console.error('❌ AI extraction error:', error);
      return {};
    }
  }

  // ============================================================================
  //                              GOALS STAGE HELPER METHODS
  // ============================================================================
  
  /**
   * HELPER: Get completed goal slots for progress tracking
   * 
   * Scans the goals object to determine which required slots have been filled.
   * Used for progress display and completion checking.
   * 
   * @param goals - Current goals data object
   * @returns Array of completed slot names
   */
  private getCompletedGoalSlots(goals: any): string[] {
    const completedSlots: string[] = [];
    if (goals?.goal_type) completedSlots.push('goal_type');
    if (goals?.goal_amount) completedSlots.push('goal_amount');
    if (goals?.horizon_years) completedSlots.push('horizon_years');
    if (goals?.risk_tolerance) completedSlots.push('risk_tolerance');
    if (goals?.liquidity_needs) completedSlots.push('liquidity_needs');
    return completedSlots;
  }

  /**
   * HELPER: Convert completed slot names to user-friendly labels
   * 
   * Maps internal slot names to human-readable labels for display in the UI.
   * Used in progress bullets and completion summaries.
   * 
   * @param goals - Current goals data object
   * @returns Array of human-readable labels for completed slots
   */
  private getCompletedGoalLabels(goals: any): string[] {
    const completedSlots = this.getCompletedGoalSlots(goals);
    const labelMap: Record<string, string> = {
      'goal_type': 'Investment goal',
      'goal_amount': 'Target amount',
      'horizon_years': 'Time horizon',
      'risk_tolerance': 'Risk tolerance',
      'liquidity_needs': 'Liquidity needs'
    };
    return completedSlots.map(slot => labelMap[slot]).filter(Boolean);
  }

  /**
   * HELPER: Get missing goal slots that still need collection
   * 
   * Compares required slots against completed slots to determine what's missing.
   * Used to generate targeted prompts and check completion status.
   * 
   * @param goals - Current goals data object
   * @returns Array of missing slot names that still need to be collected
   */
  private getMissingGoalSlots(goals: any): string[] {
    const requiredSlots = ['goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs'];
    const completedSlots = this.getCompletedGoalSlots(goals);
    return requiredSlots.filter(slot => !completedSlots.includes(slot));
  }

  // Generate contextual, conversational response for goals
  private async generateContextualGoalsResponse(
    userMessage: string, 
    missingSlots: string[], 
    completedSlots: string[]
  ): Promise<string> {
    try {
      const context = {
        stage: 'goals',
        userMessage: userMessage,
        progress: `${completedSlots.length}/5 investment details collected`,
        completed: completedSlots,
        missing: missingSlots,
        nextNeeded: missingSlots[0] || 'complete'
      };

      const prompt = `You are a conversational AI portfolio advisor. The user said: "${userMessage}"

CONTEXT:
- Current stage: Investment Goals Collection  
- Progress: ${context.progress}
- Completed: ${completedSlots.join(', ') || 'none'}
- Still need: ${missingSlots.join(', ') || 'complete'}

RESPONSE RULES:
1. Always acknowledge what the user said first (be understanding)
2. Then redirect to the specific information needed for goals collection
3. Be conversational but focused on getting required data
4. Use specific, clear language about what's needed next

REQUIRED DATA SLOTS:
- goal_type: "growth", "income", "balanced", "preservation" 
- goal_amount: Dollar amount they want to reach
- horizon_years: Number of years to reach goal
- risk_tolerance: "low", "medium", "high"  
- liquidity_needs: "low", "medium", "high"

EXAMPLES:
User: "No thanks" → "I understand you might have hesitations. To provide the best investment guidance, I need to understand your goals. Are you looking for growth, income, or something else?"

User: "I'm not sure" → "That's completely understandable! Let's break it down step by step. Are you primarily looking to grow your money over time, or do you need regular income from your investments?"

User: "I want to retire" → "That's a great goal! Retirement planning is important. To help create a strategy, what dollar amount would you like to have saved for retirement?"

Generate a conversational response that acknowledges the user's input and redirects to collecting the next required information. Be specific about what format you need.

TONE: Professional but conversational, like talking to a knowledgeable friend.

Generate a single conversational response (2-3 sentences max):`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.7
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Conversational AI Error:', data);
        return this.getFallbackPrompt(missingSlots);
      }
      
      const aiResponse = data.choices?.[0]?.message?.content?.trim();
      return aiResponse || this.getFallbackPrompt(missingSlots);
      
    } catch (error) {
      console.error('❌ Conversational response error:', error);
      return this.getFallbackPrompt(missingSlots);
    }
  }

  // Fallback to structured prompts if AI fails
  private getFallbackPrompt(missingSlots: string[]): string {
    if (missingSlots.includes('goal_type')) {
      return "What type of investment goal are you working toward? For example: growth, income, or balanced?";
    } else if (missingSlots.includes('goal_amount')) {
      return "What's your target amount? Feel free to share a specific number like '$500,000' or '$1 million'.";
    } else if (missingSlots.includes('horizon_years')) {
      return "What's your timeline for this investment? How many years are you planning?";
    } else if (missingSlots.includes('risk_tolerance')) {
      return "How comfortable are you with market volatility? Would you say low, medium, or high risk tolerance?";
    } else if (missingSlots.includes('liquidity_needs')) {
      return "How important is it to access these funds quickly if needed? Low, medium, or high liquidity needs?";
    } else {
      return "Perfect! I have all your investment goals. Ready to discuss your current portfolio?";
    }
  }

  // Build unified response for goals stage following proven pattern
  private async buildUnifiedGoalsResponse(session: SessionMemory, context: ConversationContext) {
    const completedSlots = this.getCompletedGoalSlots(session.goals);
    const missingSlots = this.getMissingGoalSlots(session.goals);
    const completedLabels = this.getCompletedGoalLabels(session.goals);

    // Generate contextual AI response
    let promptText: string;
    try {
      promptText = await this.generateContextualGoalsResponse(context.userMessage, missingSlots, completedSlots);
    } catch (error) {
      console.error('❌ Failed to generate contextual response, using fallback:', error);
      promptText = this.getFallbackPrompt(missingSlots);
    }

    const blocks: any[] = [
      {
        type: "summary_bullets",
        content: JSON.stringify([
          `Progress: ${completedSlots.length}/5 investment goals collected`,
          ...(completedLabels.length > 0 ? [`✓ ${completedLabels.join(', ')}`] : [])
        ])
      },
      {
        type: "conversation_text",
        content: JSON.stringify([promptText])
      }
    ];

    // Only add Continue button when complete
    if (missingSlots.length === 0) {
      blocks.push({
        type: "cta_group",
        content: JSON.stringify([{ label: "Continue", action: "continue" }])
      });
    }

    return {
      displaySpec: { blocks },
      session: session,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  private isGoalsComplete(goals: any): boolean {
    return this.getMissingGoalSlots(goals).length === 0;
  }

  private updateGoalSlots(session: SessionMemory): void {
    const goalSlots = ['goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs'];
    const currentCompleted = this.getCompletedGoalSlots(session.goals);
    
    // Update only goals-related slots, preserve others
    const otherSlots = session.completed_slots.filter(slot => !goalSlots.includes(slot));
    session.completed_slots = [...otherSlots, ...currentCompleted];
    session.missing_slots = this.getMissingGoalSlots(session.goals);
  }

  // ============================================================================
  //                              STAGE 3: PORTFOLIO COLLECTION HANDLER
  // ============================================================================
  
  /**
   * PORTFOLIO STAGE - Collect portfolio data with special flows for new investors
   * 
   * This stage handles multiple user types and scenarios:
   * 1. EXISTING INVESTORS: Extract allocation percentages, currency, optional details
   * 2. NEW INVESTORS: Detect "no investments" and create encouraging flow
   * 3. ALLOCATION SUGGESTIONS: Handle "suggest allocation" requests
   * 
   * SPECIAL FLOWS:
   * - new_investor: Users who haven't started investing yet
   * - suggest_default: Users requesting allocation recommendations
   * - skip_optional: Users who want to proceed without optional details
   * 
   * REQUIRED SLOTS (2 core + 2 optional):
   * - allocations: Asset percentages that sum to ~100%
   * - currency: USD, EUR, GBP, etc.
   * - top_positions: Optional individual holdings
   * - sectors: Optional sector exposure
   * 
   * ADVANCEMENT CRITERIA: Valid allocations + currency (optional details offered)
   */
  private async handlePortfolioStage(session: SessionMemory, context: ConversationContext) {
    console.log('🎯 HYBRID PORTFOLIO STAGE HANDLER START');
    console.log('📥 Input Message:', context.userMessage);

    // ========================================================================
    // SAFETY: Initialize portfolio object if missing to prevent TypeErrors
    // ========================================================================
    if (!session.portfolio) {
      console.log('🔧 Initializing portfolio object...');
      session.portfolio = {};
    }

    // ========================================================================
    // STEP 1: AI EXTRACTION - Parse user message for portfolio data/flags
    // ========================================================================
    const aiExtraction = await this.aiExtractPortfolio(context.userMessage, session) || {};
    console.log('🤖 AI Extraction Result:', aiExtraction);

    // ========================================================================
    // STEP 2: SESSION UPDATE - Handle different user types and data extraction
    // ========================================================================
    if (aiExtraction && Object.keys(aiExtraction).length > 0) {
      console.log('✅ Found new portfolio data, updating session...');

      // ======================================================================
      // SPECIAL FLOW 1: NEW INVESTOR - Users who haven't started investing
      // ======================================================================
      if ((aiExtraction as any).new_investor) {
        console.log('🆕 New investor detected - creating special flow');
        session.portfolio.new_investor = true;
        session.portfolio.allocations = { stocks: 0, bonds: 0, cash: 0 }; // Zero allocation
        session.portfolio.currency = 'USD';
        session.stage = 'analyze'; // Skip to analysis with special new investor handling
        sessionManager.updateSession(session.session_id, session);
        
        // Return encouraging message and advance to strategy creation
        return {
          displaySpec: {
            blocks: [
              {
                type: "summary_bullets",
                content: JSON.stringify([
                  "🌟 Perfect! You're ready to start your investment journey",
                  "We'll create a personalized strategy based on your goals",
                  "This analysis will help you understand what to invest in"
                ])
              },
              {
                type: "conversation_text", 
                content: JSON.stringify(["No worries about not having investments yet! That's exactly why you're here. Based on your goals, I'll create a tailored investment strategy that shows you exactly what to invest in and why. Let me analyze the best approach for your situation."])
              },
              {
                type: "cta_group",
                content: JSON.stringify([{ label: "Create My Investment Strategy", action: "continue" }])
              }
            ]
          },
          session: session,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
      }

      // ======================================================================
      // SPECIAL FLOW 2: ALLOCATION SUGGESTION - Users requesting recommendations
      // ======================================================================
      if ((aiExtraction as any).suggest_default) {
        const defaultAllocation = this.getDefaultAllocation(session.goals);
        session.portfolio.allocations = { ...(session.portfolio.allocations || {}), ...defaultAllocation };
        session.portfolio.currency = session.portfolio.currency || 'USD'; // Set default currency
        console.log('📊 Applied default allocation based on goals:', defaultAllocation);
        console.log('💱 Set default currency: USD');
      } 
      // ======================================================================
      // NORMAL FLOW: EXISTING INVESTORS - Extract allocation percentages
      // ======================================================================
      else if (aiExtraction.allocations) {
        // Only update allocations if not already complete, or if it's a complete replacement
        const currentAllocations = session.portfolio.allocations || {};
        const isCurrentComplete = this.isValidAllocation(currentAllocations);
        const isNewComplete = this.isValidAllocation(aiExtraction.allocations);
        
        if (!isCurrentComplete || isNewComplete) {
          session.portfolio.allocations = { ...(session.portfolio.allocations || {}), ...aiExtraction.allocations };
          console.log('📊 Updated allocations from user input:', aiExtraction.allocations);
        } else {
          console.log('📊 Skipping allocation update - current allocation already complete:', currentAllocations);
        }
      }

      if (aiExtraction.currency) {
        session.portfolio.currency = aiExtraction.currency;
        console.log('💱 Updated currency:', aiExtraction.currency);
      }

      // Handle optional fields (don't overwrite, just add/update)
      if (aiExtraction.top_positions && aiExtraction.top_positions.length > 0) {
        session.portfolio.top_positions = aiExtraction.top_positions;
        console.log('📈 Updated top positions:', aiExtraction.top_positions);
      }

      if (aiExtraction.sectors && aiExtraction.sectors.length > 0) {
        session.portfolio.sectors = aiExtraction.sectors;
        console.log('🏭 Updated sectors:', aiExtraction.sectors);
      }

      if ((aiExtraction as any).skip_optional) {
        console.log('⏭️ User chose to skip optional details');
      }

      // Update slot tracking
      this.updatePortfolioSlots(session);
      sessionManager.updateSession(session.session_id, session);
    }

    // Step 3: Check completion and advance
    if (this.isPortfolioComplete(session.portfolio)) {
      console.log('🎉 Portfolio collection complete! Advancing to analyze stage...');
      session.stage = 'analyze';
      sessionManager.updateSession(session.session_id, session);
      
      return {
        displaySpec: {
          blocks: [
            {
              type: "summary_bullets",
              content: JSON.stringify([
                "🎉 Portfolio allocation complete!",
                `Total allocation: ${Object.values(session.portfolio.allocations || {}).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0)}%`,
                `Currency: ${session.portfolio.currency || 'USD'}`
              ])
            },
            {
              type: "conversation_text", 
              content: JSON.stringify(["Perfect! I have your complete portfolio allocation. Let me analyze this against your investment goals and market conditions."])
            },
            {
              type: "cta_group",
              content: JSON.stringify([{ label: "Continue to Analysis", action: "continue" }])
            }
          ]
        },
        session: session,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // Step 4: Generate unified response
    return await this.buildUnifiedPortfolioResponse(session, context);
  }

  private async handleDefaultStage(session: SessionMemory, context: ConversationContext) {
    return {
      displaySpec: {
        blocks: [
          {
            type: "conversation_text",
            content: JSON.stringify(["I'm not sure how to help with that. Let's start over."])
          }
        ]
      },
      session,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  private formatResponse(response: any, session: SessionMemory) {
    return {
      ...response,
      session: session,
      usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  private async aiExtractPortfolio(userMessage: string, session: SessionMemory): Promise<Partial<PortfolioData>> {
    try {
      console.log('🤖 Extracting portfolio data from:', userMessage);
      
      const prompt = `
Extract portfolio data from this user message: "${userMessage}"

Return ONLY a JSON object with any clearly identifiable values:
{
  "allocations": {
    "stocks": 60,
    "bonds": 30, 
    "cash": 10,
    "commodities": 0,
    "real_estate": 0,
    "alternatives": 0
  },
  "currency": "USD",
  "top_positions": [
    {"name": "Apple", "weight": 5.2},
    {"name": "Microsoft", "weight": 4.8}
  ],
  "sectors": [
    {"name": "Technology", "weight": 25.0},
    {"name": "Healthcare", "weight": 15.0}
  ],
  "suggest_default": true,
  "skip_optional": false,
  "new_investor": false
}

IMPORTANT MAPPINGS:
- crypto, cryptocurrency, bitcoin → alternatives
- REIT, REITs → real_estate  
- gold, silver, oil → commodities
- equities → stocks
- fixed income, treasury → bonds

SPECIAL CASES - SET THESE FLAGS:
- "suggest an allocation", "recommend allocation", "what should I invest in" → {"suggest_default": true}
- "I don't have investments", "no portfolio", "never invested", "new to investing", "just starting" → {"new_investor": true}
- "I have no money invested", "haven't started investing", "looking to start" → {"new_investor": true}
- "skip" or "no thanks" or "proceed" → {"skip_optional": true}

Examples:
- "90% stocks, 5% crypto, 5% cash" → {"allocations": {"stocks": 90, "alternatives": 5, "cash": 5}, "currency": "USD"}
- "My portfolio is 60% stocks, 30% bonds, 10% cash" → {"allocations": {"stocks": 60, "bonds": 30, "cash": 10}, "currency": "USD"}
- "Can you suggest an allocation?" → {"suggest_default": true}
- "I don't have any investments yet" → {"new_investor": true}
- "I'm new to investing" → {"new_investor": true}
- "What should I invest in?" → {"suggest_default": true}
- "I haven't started investing" → {"new_investor": true}

Return empty object {} if no portfolio data found.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ OpenAI API error:', response.status, errorData);
        return {};
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.log('⚠️ No content from AI extraction');
        return {};
      }

      const extracted = JSON.parse(content);
      console.log('✅ AI extracted portfolio data:', extracted);
      
      return extracted || {};
      
    } catch (error) {
      console.error('❌ Portfolio AI extraction error:', error);
      return {};
    }
  }

  // Portfolio helper methods (proven pattern)
  private getCompletedPortfolioSlots(portfolio: any): string[] {
    const completedSlots: string[] = [];
    if (portfolio?.allocations && this.isValidAllocation(portfolio.allocations)) {
      completedSlots.push('allocations');
    }
    if (portfolio?.currency) {
      completedSlots.push('currency');
    }
    if (portfolio?.top_positions && Array.isArray(portfolio.top_positions) && portfolio.top_positions.length > 0) {
      completedSlots.push('top_positions');
    }
    if (portfolio?.sectors && Array.isArray(portfolio.sectors) && portfolio.sectors.length > 0) {
      completedSlots.push('sectors');
    }
    return completedSlots;
  }

  private getCompletedPortfolioLabels(portfolio: any): string[] {
    const completedSlots = this.getCompletedPortfolioSlots(portfolio);
    const labelMap: Record<string, string> = {
      'allocations': 'Portfolio allocation',
      'currency': 'Currency',
      'top_positions': 'Top holdings',
      'sectors': 'Sector exposure'
    };
    return completedSlots.map(slot => labelMap[slot]).filter(Boolean);
  }

  private getMissingPortfolioSlots(portfolio: any): string[] {
    const requiredSlots = ['allocations', 'currency'];
    const optionalSlots = ['top_positions', 'sectors'];
    const completedSlots = this.getCompletedPortfolioSlots(portfolio);
    
    // Required slots must be completed
    const missingRequired = requiredSlots.filter(slot => !completedSlots.includes(slot));
    
    // Optional slots are collected if user provides them
    const missingOptional = optionalSlots.filter(slot => !completedSlots.includes(slot));
    
    return [...missingRequired, ...missingOptional];
  }

  private isPortfolioComplete(portfolio: any): boolean {
    // Require allocations and currency, then offer optional fields
    const requiredSlots = ['allocations', 'currency'];
    const completedSlots = this.getCompletedPortfolioSlots(portfolio);
    const hasRequired = requiredSlots.every(slot => completedSlots.includes(slot));
    
    // If required slots complete but no optional data offered yet, don't complete
    if (hasRequired && !portfolio.optional_offered) {
      return false; // Will prompt for sectors/holdings first
    }
    
    return hasRequired;
  }

  private isValidAllocation(allocations: any): boolean {
    if (!allocations || typeof allocations !== 'object') return false;
    
    const total = Object.values(allocations).reduce((sum: number, val: any) => {
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
    
    // Allow some tolerance for rounding (98-102%)
    return total >= 98 && total <= 102 && total > 0;
  }

  private updatePortfolioSlots(session: SessionMemory): void {
    const portfolioSlots = ['allocations', 'currency'];
    const currentCompleted = this.getCompletedPortfolioSlots(session.portfolio);
    
    // Update only portfolio-related slots, preserve others
    const otherSlots = session.completed_slots.filter(slot => !portfolioSlots.includes(slot));
    session.completed_slots = [...otherSlots, ...currentCompleted];
    session.missing_slots = this.getMissingPortfolioSlots(session.portfolio);
  }

  private getDefaultAllocation(goals: any): any {
    const riskLevel = goals?.risk_tolerance || 'medium';
    const horizon = goals?.horizon_years || 10;
    
    // Conservative defaults based on risk and time horizon
    if (riskLevel === 'low' || horizon < 5) {
      return { stocks: 40, bonds: 50, cash: 10 };
    } else if (riskLevel === 'high' && horizon > 15) {
      return { stocks: 80, bonds: 15, cash: 5 };
    } else {
      return { stocks: 60, bonds: 30, cash: 10 }; // Balanced default
    }
  }

  // Unified response builder for portfolio stage
  private async buildUnifiedPortfolioResponse(session: SessionMemory, context: ConversationContext) {
    const completedSlots = this.getCompletedPortfolioSlots(session.portfolio);
    const missingSlots = this.getMissingPortfolioSlots(session.portfolio);
    const completedLabels = this.getCompletedPortfolioLabels(session.portfolio);
    
    let promptText: string;
    let showTable = false;
    let tableData: any = null;

    if (missingSlots.includes('allocations')) {
      promptText = "Please share your current portfolio allocation as percentages. For example: 'My portfolio is 60% stocks, 30% bonds, 10% cash'. If you don't have investments yet, just say 'I'm new to investing' or 'suggest an allocation' for a recommendation.";
    } else if (missingSlots.includes('currency')) {
      promptText = "What currency is your portfolio in? For example: 'USD', 'EUR', or 'GBP'.";
      
      // Show current allocation table
      if (session.portfolio?.allocations) {
        showTable = true;
        const allocations = session.portfolio.allocations;
        tableData = {
          title: "Current Portfolio Allocation",
          columns: ["Asset Class", "Allocation"],
          rows: Object.entries(allocations)
            .filter(([_, value]) => (value as number) > 0)
            .map(([key, value]) => [
              key.charAt(0).toUpperCase() + key.slice(1),
              `${value}%`
            ])
        };
      }
    } else if (!session.portfolio?.optional_offered) {
      // Required fields complete, now offer optional details
      promptText = "Great! Now I'd like to get more details to provide better analysis. Can you share your top stock holdings (like 'Apple 8%, Microsoft 6%') or sector exposure (like 'Technology 30%, Healthcare 15%')? You can also say 'skip' to proceed with basic analysis.";
      
      // Mark that we've offered optional fields
      session.portfolio.optional_offered = true;
      sessionManager.updateSession(session.session_id, session);
      
      // Show current allocation table
      showTable = true;
      const allocations = session.portfolio.allocations;
      tableData = {
        title: "Current Portfolio Allocation",
        columns: ["Asset Class", "Allocation"],
        rows: Object.entries(allocations)
          .filter(([_, value]) => (value as number) > 0)
          .map(([key, value]) => [
            key.charAt(0).toUpperCase() + key.slice(1),
            `${value}%`
          ])
      };
    } else {
      promptText = "Perfect! I have your portfolio details. Ready to proceed with analysis?";
    }

    const blocks: any[] = [
      {
        type: "summary_bullets",
        content: JSON.stringify([
          `Progress: ${completedSlots.length}/3 portfolio details collected`,
          ...(completedLabels.length > 0 ? [`✓ ${completedLabels.join(', ')}`] : [])
        ])
      }
    ];

    if (showTable && tableData) {
      blocks.push({
        type: "table",
        content: JSON.stringify(tableData)
      });
    }

    blocks.push({
      type: "conversation_text",
      content: JSON.stringify([promptText])
    });

    // Only add Continue button when complete
    if (missingSlots.length === 0) {
      blocks.push({
        type: "cta_group",
        content: JSON.stringify([{ label: "Continue", action: "continue" }])
      });
    }

    return {
      displaySpec: { blocks },
      session: session,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  // ============================================================================
  //                              STAGE 4: ANALYZE HANDLER WITH WEB SEARCH
  // ============================================================================
  
  /**
   * ANALYZE STAGE - Portfolio analysis with client-controlled market context
   * 
   * This stage performs comprehensive portfolio analysis by:
   * 1. Loading market context from configuration file (client-controlled)
   * 2. Analyzing portfolio against investment goals
   * 3. Identifying risks and opportunities
   * 4. Providing actionable recommendations
   * 5. Leading to consultation booking CTA
   * 
   * SPECIAL HANDLING:
   * - New investors: Focus on strategy creation vs current portfolio analysis
   * - Existing investors: Deep dive into allocation optimization
   * - Market context: Static analysis provided by client via market-context.json
   * 
   * ADVANCEMENT CRITERIA: Analysis complete → CTA/Booking stage
   */
  private async handleAnalyzeStage(session: SessionMemory, context: ConversationContext) {
    console.log('🎯 ANALYZE STAGE HANDLER START');
    console.log('📊 Analyzing portfolio against goals with client-controlled market context...');

    // ========================================================================
    // STEP 1: LOAD MARKET CONTEXT - Read from configuration file
    // ========================================================================
    console.log('🚀 STEP 1: Loading market context from configuration...');
    const marketData = await this.gatherMarketData(session.goals, session.portfolio);
    console.log('📋 STEP 1: Market context loaded:', JSON.stringify(marketData, null, 2));
    
    // Note: No search counting needed since we're using static context
    console.log('📄 Using static market context - no API calls required');
    
    // ========================================================================
    // STEP 2: PORTFOLIO ANALYSIS - Generate insights using AI + static market context
    // ========================================================================
    const analysis = await this.analyzePortfolioWithAI(session.goals, session.portfolio, marketData);
    
    // Store analysis in session
    session.analysis_result = analysis;
    session.stage = 'explain';
    sessionManager.updateSession(session.session_id, session);

    // ========================================================================
    // STEP 3: RETURN ANALYSIS RESULTS - Display insights and recommendations
    // ========================================================================
    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "🎯 Portfolio Analysis Complete!",
              `Risk Level: ${analysis.riskLevel}`,
              `Market Context: ${analysis.marketContext}`
            ])
          },
          {
            type: "conversation_text",
            content: JSON.stringify([analysis.recommendation])
          },
          {
            type: "table",
            content: JSON.stringify({
              title: "Key Metrics",
              columns: ["Metric", "Your Portfolio", "Recommendation"],
              rows: analysis.metrics || []
            })
          },
          {
            type: "cta_group",
            content: JSON.stringify([
              { 
                label: marketData?.metadata?.bookingConfiguration?.consultationLabel || "Book Free Consultation", 
                action: "external_link",
                url: marketData?.metadata?.bookingConfiguration?.calendlyUrl || "https://calendly.com/clockwisecapital/appointments",
                target: "_blank"
              },
              { 
                label: "Start Over", 
                action: "restart_conversation" 
              }
            ])
          }
        ]
      },
      session: session,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  /**
   * GATHER MARKET DATA - Load static market context from configuration file
   * 
   * Reads current market analysis from market-context.json:
   * - Client-controlled market commentary and insights
   * - Economic cycle positioning and analysis
   * - Technology and company cycle context
   * - Risk factors and investment opportunities
   */
  private async gatherMarketData(goals: any, portfolio: any): Promise<any> {
    try {
      console.log('📄 Loading market context from configuration file...');
      
      // Construct path to market context file
      const marketContextPath = path.join(process.cwd(), 'market-context.json');
      console.log('📁 Reading from:', marketContextPath);
      
      // Check if file exists
      if (!fs.existsSync(marketContextPath)) {
        console.warn('⚠️ Market context file not found, using fallback');
        return { 
          status: 'fallback', 
          content: 'Standard market analysis - market context file not available',
          search_executed: false 
        };
      }

      // Read and parse the market context file
      const fileContent = fs.readFileSync(marketContextPath, 'utf8');
      const marketConfig = JSON.parse(fileContent);
      
      console.log('✅ Market context loaded successfully');
      console.log('📊 Context version:', marketConfig.version);
      console.log('📅 Last updated:', marketConfig.lastUpdated);
      
      // Extract the market context content
      const marketContext = marketConfig.marketContext || 'No market context available';
      
      return {
        status: 'success',
        content: marketContext,
        metadata: {
          version: marketConfig.version,
          lastUpdated: marketConfig.lastUpdated,
          updatedBy: marketConfig.updatedBy,
          keyMetrics: marketConfig.keyMetrics,
          investmentTheme: marketConfig.investmentTheme,
          riskFactors: marketConfig.riskFactors,
          opportunities: marketConfig.opportunities
        },
        search_executed: false
      };

    } catch (error) {
      console.error('❌ Market context loading error:', error);
      
      // Provide detailed error information
      if (error instanceof SyntaxError) {
        console.error('❌ Invalid JSON format in market-context.json');
      }
      
      return { 
        status: 'fallback', 
        content: 'Using baseline market analysis - configuration file error',
        search_executed: false 
      };
    }
  }

  /**
   * BUILD MARKET SEARCH QUERY - Create targeted search based on user profile
   * 
   * Generates specific search terms based on:
   * - Investment goals and timeline
   * - Risk tolerance preferences  
   * - Current market conditions relevance
   * - Portfolio optimization opportunities
   * - TIME ETF and SPY comparison data
   */
  private buildMarketSearchQuery(goals: any, portfolio: any): string {
    let query = 'current market conditions ';
    
    // Always include TIME ETF and SPY for comparison
    query += 'TIME ETF performance SPY S&P 500 comparison ';
    
    // Add timeline-specific context
    if (goals?.horizon_years) {
      if (goals.horizon_years <= 3) {
        query += 'short-term investment outlook ';
      } else if (goals.horizon_years <= 7) {
        query += 'medium-term market trends ';
      } else {
        query += 'long-term economic outlook ';
      }
    }
    
    // Add risk-relevant market data
    if (goals?.risk_tolerance) {
      const riskLevel = goals.risk_tolerance.toLowerCase();
      if (riskLevel === 'low') {
        query += 'bond yields interest rates economic stability ';
      } else if (riskLevel === 'medium') {
        query += 'balanced portfolio market volatility ';
      } else {
        query += 'growth stocks market opportunities ';
      }
    }
    
    // Add specific portfolio context if available
    if (portfolio?.top_positions && portfolio.top_positions.length > 0) {
      const topHoldings = portfolio.top_positions.slice(0, 3).map((pos: any) => pos.name).join(' ');
      query += `${topHoldings} current performance `;
    }
    
    // Add goal-specific context
    if (goals?.goal_type) {
      const goalType = goals.goal_type.toLowerCase();
      const riskLevel = goals?.risk_tolerance?.toLowerCase() || 'medium';
      query += `${goalType} investment ${riskLevel} risk portfolio sector allocation `;
    }
    
    return query;
  }

  /**
   * ANALYZE PORTFOLIO WITH AI - Generate comprehensive analysis using market data
   */
  private async analyzePortfolioWithAI(goals: any, portfolio: any, marketData: any): Promise<any> {
    try {
      console.log('🧠 Performing AI portfolio analysis...');
      
      // Get user's top holdings for personalization
      const topHoldings = portfolio?.top_positions?.slice(0, 3).map((pos: any) => pos.name).join(', ') || 'Not specified';
      
      // Extract Clockwise portfolio information from market data
      const clockwisePortfolios = marketData?.metadata?.clockwisePortfolios || {};
      const salesNarrative = marketData?.metadata?.salesNarrative || {};

      const analysisPrompt = `
You are a Clockwise Capital portfolio advisor analyzing a client's investment approach. Your goal is to create positive doubt about their current strategy and guide them toward booking a consultation to discuss Clockwise's superior solutions.

CLIENT PROFILE:
- Goal: ${goals?.goal_type} of $${goals?.goal_amount?.toLocaleString()} over ${goals?.horizon_years} years
- Risk Profile: ${goals?.risk_tolerance} risk tolerance, ${goals?.liquidity_needs} liquidity needs
- Top Holdings: ${topHoldings}
- Current Allocation: ${portfolio?.allocations?.stocks || 0}% stocks, ${portfolio?.allocations?.bonds || 0}% bonds, ${portfolio?.allocations?.alternatives || 0}% alternatives

CURRENT MARKET REALITY:
${marketData?.content || 'Standard market conditions'}

CLOCKWISE SOLUTIONS TO REFERENCE:
- TIME ETF (NYSE: TIME): Active managed hedged growth fund that rebalances daily to adapt to technology and economic cycles. Minimum investment: <$50
- Clockwise Diversified Growth Portfolios: AI & human expert managed, broadly diversified ETF portfolios with monthly rebalancing. Minimum: $50k+
- Clockwise Diversified Income Portfolios: AI & human expert managed for maximum risk-adjusted income with monthly rebalancing. Minimum: $50k+

ANALYSIS STRATEGY - CREATE POSITIVE DOUBT:
1. Acknowledge their current approach has merit, BUT highlight critical gaps and hidden risks
2. Show how market complexities require expertise they may not have considered
3. Demonstrate how Clockwise's adaptive, cycle-aware approach addresses these blind spots
4. Position consultation as essential for navigating today's challenging market environment

RESPONSE TONE: Optimistic about their potential success, but concerned about their current path in these complex times.

IMPORTANT: Use the market context as background knowledge to inform your analysis, but write completely original responses. Do NOT copy text directly from the market context - synthesize it into personalized insights.

Provide analysis in this JSON format that drives toward consultation booking:
{
  "riskLevel": "Low/Medium/High",
  "beta": "Portfolio beta vs market",
  "volatility": "Annual volatility estimate", 
  "correlation_matrix": "Correlation with TIME/SPY",
  "sector_concentration": "Top sector concentration %",
  "cycle_stage": "Current market cycle risks",
  "gap_to_goal": "Potential years behind target without optimization",
  "marketContext": "Write a CUSTOM market summary using the provided context as background knowledge. Focus on how current conditions create risks for THEIR specific portfolio and goals. Make it personal and concerning.",
  "recommendation": "Write a CUSTOM recommendation using market context as background. Create doubt about their current approach while positioning Clockwise solutions as the answer. Reference specific Clockwise portfolios but make the language original and tailored to their situation.",
  "metrics": [
    ["Current Risk Level", "X/10", "Needs professional management"],
    ["Market Timing", "Static approach", "Daily adaptation needed"], 
    ["Expert Guidance", "DIY strategy", "Professional oversight required"],
    ["Portfolio Optimization", "Suboptimal", "Clockwise solutions available"]
  ]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: analysisPrompt }],
          response_format: { type: 'json_object' },
          max_tokens: 800,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      
      console.log('✅ Portfolio analysis complete');
      return analysis;

    } catch (error) {
      console.error('❌ Portfolio analysis error:', error);
      
      // Fallback analysis with sales-oriented approach
      return {
        riskLevel: goals?.risk_tolerance || 'Medium',
        marketContext: portfolio?.new_investor 
          ? 'Today\'s market presents unique challenges for new investors. With elevated valuations and increasing complexity, starting with professional guidance gives you a significant advantage in building wealth efficiently.'
          : 'Current market dynamics reveal several concerning trends for individual investors. The combination of stretched valuations, cycle transitions, and sector concentration risks suggests your portfolio may face headwinds that require professional navigation.',
        recommendation: portfolio?.new_investor 
          ? 'Starting your investment journey with professional management positions you for long-term success. Clockwise\'s TIME ETF offers daily adaptation to market cycles, while our Diversified Portfolios provide comprehensive risk management. Book a consultation to discover which solution aligns best with your goals.'
          : 'Your current portfolio shows initiative, but today\'s market environment demands more sophisticated approaches. Clockwise\'s cycle-aware strategies and daily rebalancing capabilities address risks that traditional portfolios miss. Schedule a consultation to explore how our adaptive solutions can optimize your path to financial goals.',
        metrics: [
          ['Current Risk Level', '7/10', 'Needs professional management'],
          ['Market Timing', 'Static approach', 'Daily adaptation needed'],
          ['Expert Guidance', 'DIY strategy', 'Professional oversight required'],
          ['Portfolio Optimization', 'Suboptimal', 'Clockwise solutions available']
        ]
      };
    }
  }
}

export const fsmOrchestrator = new FSMOrchestrator();
