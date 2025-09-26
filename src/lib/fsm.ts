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
import { saveSessionState } from './supabase/index';
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
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }>;
}

/**
 * SIMPLIFIED: 3-step data collection structure
 * Step 1: Goal selection, Step 2: Amount & Timeline, Step 3: Portfolio Holdings
 */
interface SimplifiedGoalsData {
  goal_type?: 'growth' | 'income' | 'both';     // Step 1: Simple selection
  target_amount?: number;                        // Step 2: Combined amount
  timeline_years?: number;                       // Step 2: Combined timeline
}

/**
 * SIMPLIFIED: Portfolio holdings focused on value and positions
 */
interface SimplifiedPortfolioData {
  portfolio_value?: number;                      // Step 3: Total portfolio value
  holdings?: Array<{ name: string; value: number; }>; // Step 3: Actual positions with dollar values
  new_investor?: boolean;                        // Step 3: Special flow detection
}

/**
 * LEGACY: Original investment goals data structure - KEEP for analysis compatibility
 * This will be populated via data transformation from simplified collection
 */
interface GoalsData {
  goal_type?: 'growth' | 'income' | 'balanced' | 'preservation' | 'lump_sum';
  goal_amount?: number;          // Derived from target_amount
  horizon_years?: number;        // Derived from timeline_years
  risk_tolerance?: 'low' | 'medium' | 'high';    // Inferred from goal_type
  liquidity_needs?: 'low' | 'medium' | 'high';   // Inferred from goal_type
  target_return?: number;        // Optional expected return percentage
}

/**
 * LEGACY: Portfolio data structure - KEEP for analysis compatibility
 * This will be populated via data transformation from simplified collection
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
  private sessionManager = sessionManager;
  private currentSessionData: {
    portfolioValue: string;
    holdings: string;
    portfolioType: string;
  } | null = null;
  private currentSession: SessionMemory | null = null;
  
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
    let session = this.sessionManager.getSession(context.sessionId);
    
    if (!session) {
      console.log('🆕 Creating new session for:', context.sessionId);
      session = this.sessionManager.createSession(context.sessionId);
    } else {
      console.log('♻️  Using existing session:', context.sessionId);
    }

    // Log current state for debugging
    console.log('📊 Current Session State:');
    console.log('  - Stage:', session.stage);
    console.log('  - Completed Slots:', session.completed_slots);
    console.log('  - Missing Slots:', session.missing_slots);
    console.log('  - Goals Data:', session.goals);

    // ============================================================================
    // PERSIST: Save the incoming USER message to Supabase immediately
    // This ensures we capture the full transcript even before email capture.
    // ============================================================================
    try {
      await saveSessionState({
        sessionId: session.session_id,
        userEmail: session.user_email, // may be undefined at this point
        stage: session.stage,
        lastMessage: {
          role: 'user',
          content: context.userMessage
        }
      });
    } catch (e) {
      console.warn('⚠️ Failed to persist user message (non-blocking):', e);
    }

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
      case 'amount_timeline':
        result = await this.handleAmountTimelineStage(session, context);
        break;
      case 'portfolio':
        result = await this.handlePortfolioStage(session, context);
        break;
      case 'email_capture':
        result = await this.handleEmailCaptureStage(session, context);
        break;
      case 'analyze':
        result = await this.handleAnalyzeStage(session);
        break;
      default:
        result = await this.handleDefaultStage(session);
    }

    console.log('📤 Result Overview:', {
      stage: result.session?.stage,
      blocksCount: result.displaySpec?.blocks?.length,
      completedSlots: result.session?.completed_slots?.length
    });

    // ============================================================================
    // PERSIST: Save the ASSISTANT reply (DisplaySpec) to Supabase
    // ============================================================================
    try {
      const assistantPlain = this.flattenDisplaySpecToText(result.displaySpec as any)
      await saveSessionState({
        sessionId: session.session_id,
        userEmail: session.user_email,
        stage: result.session?.stage || session.stage,
        lastMessage: {
          role: 'assistant',
          // Store both structured and plaintext for search/export
          content: assistantPlain || undefined,
          displaySpec: result.displaySpec as any
        }
      });
    } catch (e) {
      console.warn('⚠️ Failed to persist assistant message (non-blocking):', e);
    }

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

    return { ...response, session, usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
  }

  // ============================================================================
  //                              STEP 1: GOAL SELECTION HANDLER (SIMPLIFIED)
  // ============================================================================
  
  /**
   * GOAL SELECTION STAGE - Simple 3-option goal selection
   * 
   * Replaces the complex 5-field goals collection with streamlined approach:
   * 1. Present clear goal options: Growth, Income, Both
   * 2. User selects via buttons or natural language
   * 3. Immediate advancement to amount & timeline stage
   * 
   * REQUIRED COLLECTION (1 field):
   * - goal_type: 'growth' | 'income' | 'both'
   * 
   * ADVANCEMENT CRITERIA: Goal type selected
   */
  private async handleGoalsStage(session: SessionMemory, context: ConversationContext) {
    console.log('🎯 SIMPLIFIED GOAL SELECTION STAGE HANDLER START');
    
    // ========================================================================
    // SAFETY: Initialize simplified goals object if missing
    // ========================================================================
    if (!session.simplified_goals) {
      console.log('🔧 Initializing simplified_goals object...');
      session.simplified_goals = {};
    }

    // ========================================================================
    // STEP 1: DETECT GOAL SELECTION - Simple AI extraction for goal type only
    // ========================================================================
    const goalTypeExtraction = await this.aiExtractGoalType(context.userMessage) || {};
    console.log('🤖 Goal Type Extraction Result:', goalTypeExtraction);

    // ========================================================================
    // STEP 2: SESSION UPDATE - Update goal type if detected
    // ========================================================================
    if (goalTypeExtraction?.goal_type) {
      console.log('✅ Goal type selected:', goalTypeExtraction.goal_type);
      session.simplified_goals.goal_type = goalTypeExtraction.goal_type;
      sessionManager.updateSession(session.session_id, session);

      // Advance to amount_timeline stage
      session.stage = 'amount_timeline';
      sessionManager.updateSession(session.session_id, session);
      
      return {
        displaySpec: {
          blocks: [
            {
              type: "summary_bullets",
              content: JSON.stringify([
                "✅ Investment Goal Selected!",
                `Focus: ${goalTypeExtraction.goal_type.charAt(0).toUpperCase() + goalTypeExtraction.goal_type.slice(1)}`
              ])
            },
            {
              type: "conversation_text", 
              content: JSON.stringify(["Great choice! Now let's talk about your target amount and timeline."])
            },
            {
              type: "cta_group",
              content: JSON.stringify([{ label: "Continue", action: "continue" }])
            }
          ]
        },
        session,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // ========================================================================
    // STEP 3: DEFAULT RESPONSE - Show goal selection options
    // ========================================================================
    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "Step 1 of 3: Investment Goal Selection 🎯",
              "Choose your primary investment focus"
            ])
          },
          {
            type: "conversation_text",
            content: JSON.stringify([
              "What's your main investment goal? You can choose:\n\n" +
              "• **Growth** - Build wealth over time through capital appreciation\n" +
              "• **Income** - Generate regular dividends and interest payments\n" +
              "• **Both** - Balanced approach combining growth and income\n\n" +
              "Just say 'Growth', 'Income', or 'Both' to get started!"
            ])
          },
          {
            type: "cta_group",
            content: JSON.stringify([
              { label: "Growth", action: "growth" },
              { label: "Income", action: "income" },
              { label: "Both", action: "both" }
            ])
          }
        ]
      },
      session,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  // ============================================================================
  //                              STEP 2: AMOUNT & TIMELINE HANDLER (SIMPLIFIED)
  // ============================================================================
  
  /**
   * AMOUNT & TIMELINE STAGE - Collect target amount and investment timeline
   * 
   * Simplified approach collecting both values in one step:
   * 1. Extract target amount and timeline from natural language
   * 2. Single AI call for both values
   * 3. Immediate advancement to portfolio stage
   * 
   * REQUIRED COLLECTION:
   * - target_amount: Dollar amount goal
   * - timeline_years: Investment horizon in years
   * 
   * ADVANCEMENT CRITERIA: Both amount and timeline extracted
   */
  private async handleAmountTimelineStage(session: SessionMemory, context: ConversationContext) {
    console.log('🎯 AMOUNT & TIMELINE STAGE HANDLER START');
    console.log('📥 Input Message:', context.userMessage);
    
    // ========================================================================
    // SAFETY: Initialize simplified goals if missing
    // ========================================================================
    if (!session.simplified_goals) {
      console.log('🔧 Initializing simplified_goals object...');
      session.simplified_goals = {};
    }

    // ========================================================================
    // STEP 1: AI EXTRACTION - Extract amount and timeline together
    // ========================================================================
    const amountTimelineExtraction = await this.aiExtractAmountTimeline(context.userMessage) || {};
    console.log('🤖 Amount & Timeline Extraction Result:', amountTimelineExtraction);

    // ========================================================================
    // STEP 2: SESSION UPDATE - Update both values if detected
    // ========================================================================
    if (amountTimelineExtraction?.target_amount && amountTimelineExtraction?.timeline_years) {
      console.log('✅ Amount and timeline extracted successfully');
      session.simplified_goals.target_amount = amountTimelineExtraction.target_amount;
      session.simplified_goals.timeline_years = amountTimelineExtraction.timeline_years;
      sessionManager.updateSession(session.session_id, session);

      // Advance to portfolio stage
      session.stage = 'portfolio';
      sessionManager.updateSession(session.session_id, session);
      
      return {
        displaySpec: {
          blocks: [
            {
              type: "summary_bullets",
              content: JSON.stringify([
                "✅ Target & Timeline Set!",
                `Goal: $${amountTimelineExtraction.target_amount.toLocaleString()}`,
                `Timeline: ${amountTimelineExtraction.timeline_years} years`
              ])
            },
            {
              type: "conversation_text", 
              content: JSON.stringify(["Perfect! Now let's discuss your current portfolio to create a personalized investment strategy."])
            },
            {
              type: "cta_group",
              content: JSON.stringify([{ label: "Continue to Portfolio", action: "continue" }])
            }
          ]
        },
        session,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // ========================================================================
    // STEP 3: DEFAULT RESPONSE - Ask for amount and timeline
    // ========================================================================
    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "Step 2 of 3: Target Amount & Timeline 💰",
              `Investment goal: ${session.simplified_goals?.goal_type || 'Not set'}`
            ])
          },
          {
            type: "conversation_text",
            content: JSON.stringify([
              "What's your target amount and timeline?\n\n" +
              "You can say things like:\n" +
              "• \"I want $500K in 10 years\"\n" +
              "• \"I need $1 million for retirement in 20 years\"\n" +
              "• \"$100,000 within 5 years\"\n" +
              "• \"I want to grow to $250K over 15 years\"\n\n" +
              "Just tell me your goal amount and when you'd like to reach it!"
            ])
          }
        ]
      },
      session,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  // ============================================================================
  //                              SIMPLIFIED AI EXTRACTION METHODS
  // ============================================================================
  
  /**
   * SIMPLIFIED: AI GOAL TYPE EXTRACTION - Extract only goal type from user input
   * 
   * Simple extraction focused on just the goal type selection
   * 
   * @param userMessage - Raw user input to extract from
   * @returns Goal type object or empty object
   */
  private async aiExtractGoalType(userMessage: string): Promise<Partial<SimplifiedGoalsData>> {
    console.log('🤖 SIMPLIFIED GOAL TYPE EXTRACTION START');
    console.log('  - User Message:', userMessage);
    
    try {
      const prompt = `
Extract investment goal type from this user message: "${userMessage}"

Return ONLY a JSON object with goal type if found:
{
  "goal_type": "growth|income|both"
}

Examples:
- "Growth" → {"goal_type": "growth"}
- "I want growth" → {"goal_type": "growth"}
- "Income" → {"goal_type": "income"}  
- "I need income" → {"goal_type": "income"}
- "Both" → {"goal_type": "both"}
- "Growth and income" → {"goal_type": "both"}
- "Balanced approach" → {"goal_type": "both"}

Return {} if no goal type found.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 50,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        console.error('❌ OpenAI API Error:', response.status);
        return {};
      }
      
      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      
      if (!rawContent) {
        console.log('❌ No content in AI response');
        return {};
      }
      
      const extracted = JSON.parse(rawContent || '{}');
      console.log('🤖 Goal Type Extraction Result:', extracted);
      
      return extracted;
    } catch (error) {
      console.error('❌ Goal type extraction error:', error);
      return {};
    }
  }

  /**
   * SIMPLIFIED: AI AMOUNT & TIMELINE EXTRACTION - Extract target amount and timeline
   * 
   * Simple extraction focused on target amount and investment timeline
   * 
   * @param userMessage - Raw user input to extract from
   * @returns Amount and timeline object or empty object
   */
  private async aiExtractAmountTimeline(userMessage: string): Promise<Partial<SimplifiedGoalsData>> {
    console.log('🤖 SIMPLIFIED AMOUNT & TIMELINE EXTRACTION START');
    console.log('  - User Message:', userMessage);
    
    try {
      const prompt = `
Extract target amount and timeline from this user message: "${userMessage}"

Return ONLY a JSON object with amount and timeline if found:
{
  "target_amount": number (in dollars),
  "timeline_years": number (in years)
}

Examples:
- "I want $500K in 10 years" → {"target_amount": 500000, "timeline_years": 10}
- "I need $3,000 monthly income starting in 5 years" → {"target_amount": 3000, "timeline_years": 5}
- "I want to grow to $1M over 15 years" → {"target_amount": 1000000, "timeline_years": 15}
- "100k in 10 years" → {"target_amount": 100000, "timeline_years": 10}
- "$250,000 by retirement in 20 years" → {"target_amount": 250000, "timeline_years": 20}
- "half a million in 12 years" → {"target_amount": 500000, "timeline_years": 12}
- "2 million dollars within 25 years" → {"target_amount": 2000000, "timeline_years": 25}

PARSING RULES:
- Convert "100k", "100K" → 100000
- Convert "1M", "1 million" → 1000000
- Convert "half a million" → 500000
- Convert "quarter million" → 250000
- Extract years from phrases like "in X years", "over X years", "within X years"
- For monthly income, use the monthly amount as target_amount

Return {} if no amount or timeline found.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 100,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        console.error('❌ OpenAI API Error:', response.status);
        return {};
      }
      
      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      
      if (!rawContent) {
        console.log('❌ No content in AI response');
        return {};
      }
      
      const extracted = JSON.parse(rawContent || '{}');
      console.log('🤖 Amount & Timeline Extraction Result:', extracted);
      
      return extracted;
    } catch (error) {
      console.error('❌ Amount & timeline extraction error:', error);
      return {};
    }
  }

  /**
   * SIMPLIFIED: AI PORTFOLIO EXTRACTION - Extract portfolio value and holdings
   * 
   * Simple extraction focused on portfolio value and main holdings
   * 
   * @param userMessage - Raw user input to extract from
   * @returns Portfolio data object or empty object
   */
  private async aiExtractSimplifiedPortfolio(userMessage: string): Promise<Partial<SimplifiedPortfolioData>> {
    console.log('🤖 SIMPLIFIED PORTFOLIO EXTRACTION START');
    console.log('  - User Message:', userMessage);
    
    try {
      const prompt = `
Extract portfolio information from this user message: "${userMessage}"

Return ONLY a JSON object with portfolio data if found:
{
  "portfolio_value": number (total value in dollars),
  "holdings": [{"name": string, "value": number}],
  "new_investor": boolean
}

Examples:
- "I have $100,000 total" → {"portfolio_value": 100000}
- "My portfolio is worth $250K" → {"portfolio_value": 250000}
- "I have $100K: $60K in Apple, $30K in bonds, $10K cash" → {"portfolio_value": 100000, "holdings": [{"name": "Apple", "value": 60000}, {"name": "bonds", "value": 30000}, {"name": "cash", "value": 10000}]}
- "Portfolio value is 500k with Tesla and Microsoft" → {"portfolio_value": 500000, "holdings": [{"name": "Tesla", "value": 0}, {"name": "Microsoft", "value": 0}]}
- "$250K total: mostly in ETFs and some individual stocks" → {"portfolio_value": 250000, "holdings": [{"name": "ETFs", "value": 0}, {"name": "stocks", "value": 0}]}
- "I'm new to investing with $10K to start" → {"portfolio_value": 10000, "new_investor": true}
- "I haven't started investing yet" → {"new_investor": true}
- "I'm new to investing" → {"new_investor": true}
- "No investments" → {"new_investor": true}
- "I don't have a portfolio" → {"new_investor": true}

PARSING RULES:
- Convert "100k", "100K" → 100000
- Convert "1M", "1 million" → 1000000
- "quarter million" → 250000
- "half million" → 500000
- If holdings are mentioned without values, include them with value: 0

Return {} if no portfolio data found.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 200,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        console.error('❌ OpenAI API Error:', response.status);
        return {};
      }
      
      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      
      if (!rawContent) {
        console.log('❌ No content in AI response');
        return {};
      }
      
      const extracted = JSON.parse(rawContent || '{}');
      console.log('🤖 Portfolio Extraction Result:', extracted);
      
      return extracted;
    } catch (error) {
      console.error('❌ Portfolio extraction error:', error);
      return {};
    }
  }

  /**
   * LEGACY: AI GOALS EXTRACTION - Parse natural language into structured goals data
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
  private getCompletedGoalSlots(goals: GoalsData): string[] {
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
  private getCompletedGoalLabels(goals: GoalsData): string[] {
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
  private getMissingGoalSlots(goals: GoalsData): string[] {
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
    const completedSlots = this.getCompletedGoalSlots(session.goals || {});
    const missingSlots = this.getMissingGoalSlots(session.goals || {});
    const completedGoalLabels = this.getCompletedGoalLabels(session.goals || {});
    this.updateGoalSlots(session);

    // Generate contextual AI response
    let promptText: string;
    try {
      promptText = await this.generateContextualGoalsResponse(context.userMessage, missingSlots, completedSlots);
    } catch (error) {
      console.error('❌ Failed to generate contextual response, using fallback:', error);
      promptText = this.getFallbackPrompt(missingSlots);
    }

    const blocks: Array<{
      type: string;
      content: string;
    }> = [
      {
        type: "summary_bullets",
        content: JSON.stringify([
          `Progress: ${completedSlots.length}/5 investment goals collected`,
          ...(completedGoalLabels.length > 0 ? [`✓ ${completedGoalLabels.join(', ')}`] : [])
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

  private isGoalsComplete(goals: GoalsData | undefined): boolean {
    return this.getMissingGoalSlots(goals || {}).length === 0;
  }

  private updateGoalSlots(session: SessionMemory): void {
    const goalSlots = ['goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs'];
    const currentCompleted = this.getCompletedGoalSlots(session.goals || {});
    
    // Update only goals-related slots, preserve others
    const otherSlots = session.completed_slots.filter(slot => !goalSlots.includes(slot));
    session.completed_slots = [...otherSlots, ...currentCompleted];
    session.missing_slots = this.getMissingGoalSlots(session.goals || {});
  }

  // ============================================================================
  //                              STAGE 3: PORTFOLIO COLLECTION HANDLER
  // ============================================================================
  
  /**
   * SIMPLIFIED PORTFOLIO STAGE - Collect portfolio value and holdings
   * 
   * Simplified approach focusing on:
   * 1. Total portfolio value in dollars
   * 2. Main holdings with dollar amounts (not percentages)
   * 3. New investor detection for special flow
   * 
   * REQUIRED COLLECTION:
   * - portfolio_value: Total value in dollars
   * - holdings: Array of {name, value} or new_investor flag
   * 
   * ADVANCEMENT CRITERIA: Portfolio value provided OR new investor detected
   */
  private async handlePortfolioStage(session: SessionMemory, context: ConversationContext) {
    console.log('🎯 SIMPLIFIED PORTFOLIO STAGE HANDLER START');
    console.log('📥 Input Message:', context.userMessage);

    // ========================================================================
    // SAFETY: Initialize simplified portfolio object if missing
    // ========================================================================
    if (!session.simplified_portfolio) {
      console.log('🔧 Initializing simplified_portfolio object...');
      session.simplified_portfolio = {};
    }

    // ========================================================================
    // STEP 1: AI EXTRACTION - Extract portfolio value and holdings
    // ========================================================================
    const portfolioExtraction = await this.aiExtractSimplifiedPortfolio(context.userMessage) || {};
    console.log('🤖 Portfolio Extraction Result:', portfolioExtraction);

    // ========================================================================
    // STEP 2: SESSION UPDATE - Update portfolio data if detected
    // ========================================================================
    if (portfolioExtraction && Object.keys(portfolioExtraction).length > 0) {
      console.log('✅ Found portfolio data, updating session...');

      // ======================================================================
      // SPECIAL FLOW: NEW INVESTOR - Users who haven't started investing
      // ======================================================================
      if (portfolioExtraction.new_investor) {
        console.log('🆕 New investor detected - creating special flow');
        session.simplified_portfolio.new_investor = true;
        session.simplified_portfolio.portfolio_value = 0;
        session.simplified_portfolio.holdings = [];
        sessionManager.updateSession(session.session_id, session);
        
        // Advance to email capture with new investor flag
        session.stage = 'email_capture';
        sessionManager.updateSession(session.session_id, session);
        
        return {
          displaySpec: {
            blocks: [
              {
                type: "summary_bullets",
                content: JSON.stringify([
                  "🌟 Perfect! You're ready to start your investment journey",
                  "We'll create a personalized strategy based on your goals"
                ])
              },
              {
                type: "conversation_text", 
                content: JSON.stringify(["No worries about not having investments yet! That's exactly why you're here. Based on your goals, I'll create a tailored investment strategy that shows you exactly what to invest in and why."])
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
      // NORMAL FLOW: Update portfolio value and holdings
      // ======================================================================
      if (portfolioExtraction.portfolio_value !== undefined) {
        session.simplified_portfolio.portfolio_value = portfolioExtraction.portfolio_value;
        console.log('💰 Updated portfolio value:', portfolioExtraction.portfolio_value);
      }

      if (portfolioExtraction.holdings && portfolioExtraction.holdings.length > 0) {
        session.simplified_portfolio.holdings = portfolioExtraction.holdings;
        console.log('📊 Updated holdings:', portfolioExtraction.holdings);
      }

      sessionManager.updateSession(session.session_id, session);
    }

    // ========================================================================
    // STEP 3: Check completion and advance
    // ========================================================================
    if (session.simplified_portfolio.portfolio_value !== undefined) {
      console.log('🎉 Portfolio collection complete! Advancing to email capture stage...');
      session.stage = 'email_capture';
      sessionManager.updateSession(session.session_id, session);
      
      const totalValue = session.simplified_portfolio.portfolio_value;
      const holdingsCount = session.simplified_portfolio.holdings?.length || 0;
      
      return {
        displaySpec: {
          blocks: [
            {
              type: "summary_bullets",
              content: JSON.stringify([
                "✅ Portfolio Information Complete!",
                `Portfolio value: $${totalValue.toLocaleString()}`,
                holdingsCount > 0 ? `${holdingsCount} holdings identified` : "Ready for analysis"
              ])
            },
            {
              type: "conversation_text", 
              content: JSON.stringify(["Perfect! I have your portfolio information. Let me analyze this against your investment goals and current market conditions."])
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

    // ========================================================================
    // STEP 4: DEFAULT RESPONSE - Ask for portfolio value
    // ========================================================================
    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "Step 3 of 3: Portfolio Information 💼",
              `Goal: ${session.simplified_goals?.goal_type || 'Not set'} | Target: $${session.simplified_goals?.target_amount?.toLocaleString() || '0'} | Timeline: ${session.simplified_goals?.timeline_years || '0'} years`
            ])
          },
          {
            type: "conversation_text",
            content: JSON.stringify([
              "Now let's talk about your current investments. What's the total value of your portfolio?\n\n" +
              "You can say things like:\n" +
              "• \"I have $100,000 total\"\n" +
              "• \"My portfolio is worth $250K\"\n" +
              "• \"$100K: $60K in stocks, $30K in bonds, $10K cash\"\n" +
              "• \"I haven't started investing yet\"\n" +
              "• \"I'm new to investing with $10K to start\"\n\n" +
              "Feel free to mention specific holdings with their dollar values if you'd like a more detailed analysis!"
            ])
          }
        ]
      },
      session,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  // ============================================================================
  //                              EMAIL CAPTURE STAGE HANDLER
  // ============================================================================
  
  /**
   * EMAIL CAPTURE STAGE - Collect user email before analysis
   * 
   * This stage is positioned right before analysis to maximize conversion:
   * - Users have already invested time sharing goals and portfolio
   * - They're curious about the analysis results
   * - Value-first approach increases email capture rate
   * 
   * REQUIRED COLLECTION:
   * - user_email: Valid email address
   * 
   * ADVANCEMENT CRITERIA: Valid email provided
   */
  private async handleEmailCaptureStage(session: SessionMemory, context: ConversationContext) {
    console.log('📧 EMAIL CAPTURE STAGE HANDLER START');
    console.log('📥 Input Message:', context.userMessage);

    // ========================================================================
    // STEP 1: AI EXTRACTION - Extract email from user input
    // ========================================================================
    const emailExtraction = await this.aiExtractEmail(context.userMessage) || {};
    console.log('🤖 Email Extraction Result:', emailExtraction);

    // ========================================================================
    // STEP 2: SESSION UPDATE - Update email if detected and valid
    // ========================================================================
    if (emailExtraction?.email && this.isValidEmail(emailExtraction.email)) {
      console.log('✅ Valid email captured:', emailExtraction.email);
      session.user_email = emailExtraction.email;
      sessionManager.updateSession(session.session_id, session);

      // Create Supabase conversation with collected data
      console.log('💾 Creating Supabase conversation...');
      try {
        await saveSessionState({
          sessionId: session.session_id,
          userEmail: emailExtraction.email,
          stage: 'email_capture',
          goals: session.simplified_goals,
          portfolio: session.simplified_portfolio,
          lastMessage: {
            role: 'user',
            content: context.userMessage,
            displaySpec: {
              blocks: [
                {
                  type: 'summary_bullets',
                  content: JSON.stringify(['Email captured successfully'])
                }
              ]
            }
          }
        });
        console.log('✅ Supabase conversation created successfully');
      } catch (error) {
        console.error('❌ Failed to create Supabase conversation:', error);
        // Continue anyway - don't block the user flow
      }

      // Advance to analysis stage
      session.stage = 'analyze';
      sessionManager.updateSession(session.session_id, session);
      
      return {
        displaySpec: {
          blocks: [
            {
              type: "summary_bullets",
              content: JSON.stringify([
                "✅ Email Confirmed!",
                `Contact: ${emailExtraction.email}`,
                "Starting your personalized portfolio analysis..."
              ])
            },
            {
              type: "conversation_text", 
              content: JSON.stringify([
                "Perfect! I have everything I need to create your personalized analysis. Let me analyze your portfolio against your goals and current market conditions. This will just take a moment..."
              ])
            },
            {
              type: "cta_group",
              content: JSON.stringify([{ label: "Generate Analysis", action: "continue" }])
            }
          ]
        },
        session,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // ========================================================================
    // STEP 3: VALIDATION ERROR - Invalid email provided
    // ========================================================================
    if (emailExtraction?.email && !this.isValidEmail(emailExtraction.email)) {
      console.log('❌ Invalid email format:', emailExtraction.email);
      
      return {
        displaySpec: {
          blocks: [
            {
              type: "summary_bullets",
              content: JSON.stringify([
                "⚠️ Invalid Email Format",
                "Please provide a valid email address"
              ])
            },
            {
              type: "conversation_text",
              content: JSON.stringify([
                `"${emailExtraction.email}" doesn't look like a valid email address. Please provide a valid email like: john@example.com`
              ])
            }
          ]
        },
        session,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // ========================================================================
    // STEP 4: DEFAULT RESPONSE - Request email with value proposition
    // ========================================================================
    const goalSummary = session.simplified_goals ? 
      `${session.simplified_goals.goal_type} goal of $${session.simplified_goals.target_amount?.toLocaleString()} in ${session.simplified_goals.timeline_years} years` : 
      'your investment goals';
    
    const portfolioSummary = session.simplified_portfolio?.portfolio_value ? 
      `$${session.simplified_portfolio.portfolio_value.toLocaleString()} portfolio` : 
      'your portfolio information';

    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "🎯 Ready for Your Personalized Analysis!",
              `✓ Goals: ${goalSummary}`,
              `✓ Portfolio: ${portfolioSummary}`
            ])
          },
          {
            type: "conversation_text",
            content: JSON.stringify([
              "Excellent! I have everything I need to create your personalized investment analysis.\n\n" +
              "To proceed with your analysis, please provide your email address:\n\n" +
              "• View your personalized portfolio analysis\n" +
              "• Get detailed market insights and recommendations\n" +
              "• Save your session for future reference\n\n" +
              "Just type your email address (e.g., john@example.com)"
            ])
          }
        ]
      },
      session,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  /**
   * AI EMAIL EXTRACTION - Extract email address from user input
   * 
   * @param userMessage - Raw user input to extract from
   * @returns Email object or empty object
   */
  private async aiExtractEmail(userMessage: string): Promise<{ email?: string }> {
    console.log('🤖 AI EMAIL EXTRACTION START');
    console.log('  - User Message:', userMessage);
    
    try {
      const prompt = `
Extract email address from this user message: "${userMessage}"

Return ONLY a JSON object with email if found:
{
  "email": "user@example.com"
}

Examples:
- "john@example.com" → {"email": "john@example.com"}
- "My email is sarah.smith@gmail.com" → {"email": "sarah.smith@gmail.com"}
- "Contact me at mike123@yahoo.com" → {"email": "mike123@yahoo.com"}
- "test@test.co.uk" → {"email": "test@test.co.uk"}
- "user+tag@domain.org" → {"email": "user+tag@domain.org"}

Return {} if no valid email found.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 50,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        console.error('❌ OpenAI API Error:', response.status);
        return {};
      }
      
      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      
      if (!rawContent) {
        console.log('❌ No content in AI response');
        return {};
      }
      
      const extracted = JSON.parse(rawContent || '{}');
      console.log('🤖 Email Extraction Result:', extracted);
      
      return extracted;
    } catch (error) {
      console.error('❌ Email extraction error:', error);
      return {};
    }
  }

  /**
   * EMAIL VALIDATION - Check if email format is valid
   * 
   * @param email - Email string to validate
   * @returns Boolean indicating if email is valid
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async handleDefaultStage(session: SessionMemory) {
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

  private formatResponse(response: {
    displaySpec: { blocks: Array<{ type: string; content: string }> };
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  }, session: SessionMemory) {
    return {
      ...response,
      session: session,
      usage: response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  /**
   * Flatten DisplaySpec into a readable plaintext string for storage in messages.content
   */
  private flattenDisplaySpecToText(spec: any): string {
    if (!spec || !Array.isArray(spec.blocks)) return ''
    const lines: string[] = []
    for (const block of spec.blocks) {
      const type = block?.type
      let parsed: any
      try {
        parsed = typeof block?.content === 'string' ? JSON.parse(block.content) : block?.content
      } catch (_) {
        parsed = block?.content
      }
      if (type === 'summary_bullets' && Array.isArray(parsed)) {
        for (const item of parsed) lines.push(`• ${String(item)}`)
      } else if (type === 'conversation_text' && Array.isArray(parsed)) {
        lines.push(String(parsed.join('\n')))
      } else if (type === 'cta_group' && Array.isArray(parsed)) {
        const labels = parsed.map((b: any) => b?.label).filter(Boolean).join(', ')
        if (labels) lines.push(`CTAs: ${labels}`)
      } else if (type === 'table') {
        lines.push('[table omitted]')
      } else if (type === 'stat_group') {
        lines.push('[stats omitted]')
      } else if (type === 'chart') {
        lines.push('[chart omitted]')
      } else if (type === 'sources') {
        lines.push('[sources included]')
      } else if (parsed) {
        lines.push(String(typeof parsed === 'string' ? parsed : JSON.stringify(parsed)))
      }
    }
    return lines.join('\n').trim()
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
  private async handleAnalyzeStage(session: SessionMemory) {
    console.log('🎯 ANALYZE STAGE HANDLER START');
    console.log('📊 Analyzing portfolio against goals with client-controlled market context...');

    // ========================================================================
    // STEP 1: TRANSFORM SIMPLIFIED DATA TO LEGACY FORMAT FOR ANALYSIS
    // ========================================================================
    const transformedGoals = this.transformSimplifiedGoals(session.simplified_goals || {});
    const transformedPortfolio = this.transformSimplifiedPortfolio(session.simplified_portfolio || {});
    
    // ========================================================================
    // STEP 2: LOAD MARKET CONTEXT - Read from configuration file
    // ========================================================================
    console.log('🚀 Loading market context from configuration...');
    const marketData = await this.gatherMarketData();
    console.log('📋 Market context loaded:', JSON.stringify(marketData, null, 2));
    
    // ========================================================================
    // STEP 3: PORTFOLIO ANALYSIS - Generate insights using AI + static market context
    // ========================================================================
    const analysis = await this.analyzePortfolioWithAI(transformedGoals, transformedPortfolio, marketData, session);
    
    // Store analysis in session
    session.analysis_result = analysis;
    session.stage = 'explain';
    sessionManager.updateSession(session.session_id, session);

    // Save analysis results to Supabase if we have user email
    if (session.user_email) {
      console.log('💾 Saving analysis results to Supabase...');
      try {
        await saveSessionState({
          sessionId: session.session_id,
          userEmail: session.user_email,
          stage: 'analyze',
          goals: session.simplified_goals,
          portfolio: session.simplified_portfolio,
          analysis: {
            ...analysis,
            completed_at: new Date().toISOString(),
            market_context: marketData
          } as any
        });
        console.log('✅ Analysis results saved to Supabase');
      } catch (error) {
        console.error('❌ Failed to save analysis to Supabase:', error);
        // Continue anyway - don't block the user flow
      }
    }

    // ========================================================================
    // STEP 4: RETURN ANALYSIS RESULTS - Display Market/Portfolio/Goal Impact
    // ========================================================================
    
    // Extract market metadata for the chart
    const marketMetadata = (marketData as Record<string, unknown>)?.metadata as Record<string, unknown>;
    
    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "🎯 Portfolio Analysis Complete!"
            ])
          },
          {
            type: "table",
            content: JSON.stringify(this.buildDynamicAnalysisTable(analysis, transformedGoals as Record<string, unknown>, transformedPortfolio as Record<string, unknown>, marketMetadata, session))
          },
          {
            type: "conversation_text",
            content: JSON.stringify(["Market Impact"])
          },
          {
            type: "summary_bullets",
            content: JSON.stringify(this.processImpactData(analysis.marketImpact || analysis.marketContext || "Market analysis unavailable"))
          },
          {
            type: "conversation_text",
            content: JSON.stringify(["Portfolio Impact"])
          },
          {
            type: "summary_bullets",
            content: JSON.stringify(this.processImpactData(analysis.portfolioImpact || "Portfolio impact analysis unavailable"))
          },
          {
            type: "conversation_text",
            content: JSON.stringify(["Goal Impact"])
          },
          {
            type: "summary_bullets",
            content: JSON.stringify(this.processImpactData(analysis.goalImpact || analysis.recommendation || "Goal impact analysis unavailable"))
          },
          {
            type: "cta_group",
            content: JSON.stringify([
              { 
                label: (((marketData as Record<string, unknown>)?.metadata as Record<string, unknown>)?.bookingConfiguration as Record<string, unknown>)?.consultationLabel || "Book Free Consultation", 
                action: "external_link",
                url: (((marketData as Record<string, unknown>)?.metadata as Record<string, unknown>)?.bookingConfiguration as Record<string, unknown>)?.calendlyUrl || "https://calendly.com/clockwisecapital/appointments",
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
  private async gatherMarketData(): Promise<Record<string, unknown>> {
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
   * TRANSFORM SIMPLIFIED GOALS TO LEGACY FORMAT
   * Converts simplified 3-field collection to full goals structure for analysis
   */
  private transformSimplifiedGoals(simplifiedGoals: SimplifiedGoalsData): GoalsData {
    // Infer risk tolerance and liquidity needs from goal type and timeline
    let risk_tolerance: 'low' | 'medium' | 'high' = 'medium';
    let liquidity_needs: 'low' | 'medium' | 'high' = 'medium';
    
    if (simplifiedGoals.goal_type === 'growth') {
      risk_tolerance = 'medium';
      liquidity_needs = 'low';
    } else if (simplifiedGoals.goal_type === 'income') {
      risk_tolerance = 'low';
      liquidity_needs = 'medium';
    } else if (simplifiedGoals.goal_type === 'both') {
      risk_tolerance = 'medium';
      liquidity_needs = 'medium';
    }
    
    // Adjust based on timeline
    if (simplifiedGoals.timeline_years && simplifiedGoals.timeline_years < 5) {
      risk_tolerance = 'low';
      liquidity_needs = 'high';
    } else if (simplifiedGoals.timeline_years && simplifiedGoals.timeline_years > 15) {
      risk_tolerance = risk_tolerance === 'low' ? 'medium' : 'high';
      liquidity_needs = 'low';
    }
    
    return {
      goal_type: (simplifiedGoals.goal_type as 'growth' | 'income' | 'balanced' | 'preservation' | 'lump_sum') || 'balanced',
      goal_amount: simplifiedGoals.target_amount || 100000,
      horizon_years: simplifiedGoals.timeline_years || 10,
      risk_tolerance,
      liquidity_needs
    };
  }
  
  /**
   * TRANSFORM SIMPLIFIED PORTFOLIO TO LEGACY FORMAT
   * Converts dollar values to percentage allocations for analysis
   */
  private transformSimplifiedPortfolio(simplifiedPortfolio: SimplifiedPortfolioData): PortfolioData {
    const totalValue = simplifiedPortfolio.portfolio_value || 0;
    const holdings = simplifiedPortfolio.holdings || [];
    
    // Calculate allocations from holdings
    let allocations = { stocks: 0, bonds: 0, cash: 0, commodities: 0, real_estate: 0, alternatives: 0 };
    
    if (totalValue > 0 && holdings.length > 0) {
      holdings.forEach(holding => {
        const percentage = (holding.value / totalValue) * 100;
        const name = holding.name.toLowerCase();
        
        if (name.includes('stock') || name.includes('equity') || name.includes('apple') || name.includes('tesla') || name.includes('microsoft')) {
          allocations.stocks += percentage;
        } else if (name.includes('bond') || name.includes('treasury') || name.includes('fixed')) {
          allocations.bonds += percentage;
        } else if (name.includes('cash') || name.includes('money market')) {
          allocations.cash += percentage;
        } else if (name.includes('etf')) {
          allocations.stocks += percentage; // Default ETFs to stocks
        } else {
          allocations.alternatives += percentage;
        }
      });
    } else if (simplifiedPortfolio.new_investor) {
      // New investor - no allocations yet
      allocations = { stocks: 0, bonds: 0, cash: 100, commodities: 0, real_estate: 0, alternatives: 0 };
    } else if (totalValue > 0) {
      // Has value but no specific holdings - assume balanced
      allocations = { stocks: 60, bonds: 30, cash: 10, commodities: 0, real_estate: 0, alternatives: 0 };
    }
    
    return {
      allocations,
      currency: 'USD',
      top_positions: holdings.map(h => ({ name: h.name, weight: (h.value / totalValue) * 100 }))
    };
  }
  
  /**
   * ANALYZE PORTFOLIO WITH AI - Generate comprehensive analysis using market data
   */
  private async analyzePortfolioWithAI(goals: unknown, portfolio: unknown, marketData: unknown, session: SessionMemory): Promise<Record<string, unknown>> {
    try {
      console.log('🧠 Performing AI portfolio analysis...');
      
      const goalsData = goals as Record<string, unknown>;
      // Portfolio data is used in the prompt construction below
      const marketDataObj = marketData as Record<string, unknown>;
      
      // Get actual user portfolio data from session
      const actualPortfolioValue = this.getActualPortfolioValue();
      const actualHoldings = this.getActualHoldingsDescription();
      const portfolioType = this.getPortfolioType();
      
      // Store session context for analysis
      this.currentSession = session;
      
      // Store for use in prompt
      this.currentSessionData = {
        portfolioValue: actualPortfolioValue,
        holdings: actualHoldings,
        portfolioType: portfolioType
      };
      
      // Extract Clockwise portfolio information from market data
      // Note: These could be used for future sales narrative customization
      // const clockwisePortfolios = marketDataObj?.metadata?.clockwisePortfolios || {};
      // const salesNarrative = marketDataObj?.metadata?.salesNarrative || {};

      const analysisPrompt = `
You are a Clockwise Capital portfolio advisor analyzing a client's investment approach. Your goal is to create positive doubt about their current strategy and guide them toward booking a consultation to discuss Clockwise's superior solutions.

CLIENT PROFILE:
- Goal: ${goalsData?.goal_type} of $${typeof goalsData?.goal_amount === 'number' ? goalsData.goal_amount.toLocaleString() : 'TBD'} over ${goalsData?.horizon_years} years
- Risk Profile: ${goalsData?.risk_tolerance} risk tolerance, ${goalsData?.liquidity_needs} liquidity needs
- Portfolio Value: $${this.getActualPortfolioValue()} 
- Holdings: ${this.getActualHoldingsDescription()}
- Portfolio Type: ${this.getPortfolioType()}

CURRENT MARKET REALITY:
${marketDataObj?.content || 'Standard market conditions'}

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

Provide analysis in this JSON format with three distinct impact sections:
{
  "riskLevel": "Low/Medium/High",
  "beta": "Portfolio beta vs market",
  "volatility": "Annual volatility estimate", 
  "correlation_matrix": "Correlation with TIME/SPY",
  "sector_concentration": "Top sector concentration %",
  "cycle_stage": "Late-cycle/Mid-cycle/Early-cycle",
  "gap_to_goal": "Potential years behind target without optimization",
  "marketImpact": "Return 3-4 bullet points (start with '•'). BE DYNAMIC AND SPECIFIC to their situation:\n- If they have $" + actualPortfolioValue + ": relate market risks to THEIR portfolio size\n- If they mentioned specific holdings (" + actualHoldings + "): connect market trends to THOSE holdings\n- If new investor: explain why THIS market is challenging for beginners\n- Always tie back to current late-cycle risks but make it PERSONAL to them\nExample for someone with tech holdings: '• Your Apple and Microsoft positions face headwinds as tech valuations reach extremes'\nExample for new investor: '• Starting your investment journey now means navigating one of the most complex market environments in decades'",
  "portfolioImpact": "Return 3-4 bullet points (start with '•'). PERSONALIZE based on what they told you:\n- If they gave specific holdings: analyze THOSE exact holdings and their risks\n- If only gave total value: focus on what's MISSING from their portfolio\n- If new investor: explain what they NEED to consider starting out\n- Always position Clockwise TIME ETF or Diversified Portfolios as the solution to THEIR specific situation\nDO NOT make up allocations they didn't mention. BE SPECIFIC about their actual data.",
  "goalImpact": "Return 3-4 bullet points (start with '•'). Make it DEEPLY PERSONAL using their exact numbers:\n- Calculate and mention specific: 'Your goal of $" + (goalsData?.goal_amount as number || 0).toLocaleString() + " in " + (goalsData?.horizon_years || 0) + " years...'\n- If portfolio value known: 'Your current $" + actualPortfolioValue + " needs X% annual growth...'\n- Create urgency: explain how THEIR specific timeline is at risk\n- Show how Clockwise solutions specifically address THEIR goal/timeline/risk profile\n- If new investor: focus on the importance of starting right with professional guidance\nMake them FEEL the gap between where they are and where they need to be.",
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
      const goalsData = goals as Record<string, unknown>;
      const portfolioData = portfolio as Record<string, unknown>;
      
      return {
        riskLevel: goalsData?.risk_tolerance || 'Medium',
        marketContext: portfolioData?.new_investor 
          ? 'Today\'s market presents unique challenges for new investors. With elevated valuations and increasing complexity, starting with professional guidance gives you a significant advantage in building wealth efficiently.'
          : 'Current market dynamics reveal several concerning trends for individual investors. The combination of stretched valuations, cycle transitions, and sector concentration risks suggests your portfolio may face headwinds that require professional navigation.',
        recommendation: portfolioData?.new_investor 
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
  
  /**
   * BUILD DYNAMIC ANALYSIS TABLE - Create contextual table based on user inputs
   */
  private buildDynamicAnalysisTable(analysis: Record<string, unknown>, goals: Record<string, unknown>, portfolio: Record<string, unknown>, marketMetadata: Record<string, unknown>, session: SessionMemory) {
    const keyMetrics = (marketMetadata?.keyMetrics as Record<string, unknown>) || {};
    const cyclePosition = (keyMetrics?.cyclePosition as Record<string, unknown>) || {};
    
    // Calculate user-specific metrics
    const targetAmount = goals?.goal_amount as number || 0;
    const timelineYears = goals?.horizon_years as number || 0;
    const riskLevel = analysis.riskLevel as string || "Medium";
    const portfolioValue = this.calculatePortfolioValue(portfolio, session);
    const gapToGoal = this.calculateGapToGoal(portfolioValue, targetAmount, timelineYears);
    
    const rows = [
      ["Your Goal Progress", `$${portfolioValue.toLocaleString()} of $${targetAmount.toLocaleString()}`, gapToGoal > 0 ? "behind-target" : "on-track"],
      ["Timeline Risk", `${timelineYears} years to goal`, timelineYears < 10 ? "high-urgency" : timelineYears > 20 ? "low-urgency" : "moderate-urgency"],
      ["Portfolio Risk Level", riskLevel, riskLevel === "High" ? "elevated" : riskLevel === "Low" ? "conservative" : "moderate"],
      ["Market Cycle Stage", cyclePosition?.debtCycle || "Late stage", "caution-advised"],
      ["Current Inflation", keyMetrics?.inflation || "3%", "above-target"],
      ["Market Valuation", keyMetrics?.marketValuation || "~25x earnings", "overvalued"]
    ];
    
    return {
      title: "Your Portfolio Analysis",
      columns: ["Assessment", "Current Status", "Risk Level"],
      rows
    };
  }
  
  /**
   * CALCULATE PORTFOLIO VALUE - Extract total value from simplified portfolio data
   */
  private calculatePortfolioValue(portfolio: Record<string, unknown>, session: SessionMemory): number {
    // First try to get from simplified portfolio data
    if (session.simplified_portfolio?.portfolio_value) {
      return session.simplified_portfolio.portfolio_value;
    }
    
    // Fallback: try to get from allocations if available
    const allocations = portfolio?.allocations as Record<string, number> || {};
    const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    
    // Estimate based on typical portfolio values if allocations exist
    if (totalAllocation > 0) {
      return 100000; // Default estimate
    }
    
    return 0;
  }
  
  
  /**
   * CALCULATE GAP TO GOAL - Determine if user is behind target
   */
  private calculateGapToGoal(currentValue: number, targetAmount: number, timelineYears: number): number {
    if (timelineYears <= 0 || targetAmount <= 0) return 0;
    
    // Simple calculation: what they need vs what they have
    const requiredGrowthRate = Math.pow(targetAmount / Math.max(currentValue, 1), 1 / timelineYears) - 1;
    const marketGrowthRate = 0.07; // Assume 7% market return
    
    return requiredGrowthRate > marketGrowthRate ? requiredGrowthRate - marketGrowthRate : 0;
  }
  
  /**
   * GET ACTUAL PORTFOLIO VALUE - Access real portfolio value from session
   */
  private getActualPortfolioValue(): string {
    if (this.currentSession?.simplified_portfolio?.portfolio_value) {
      return this.currentSession.simplified_portfolio.portfolio_value.toLocaleString();
    }
    return "Not specified";
  }
  
  /**
   * GET ACTUAL HOLDINGS DESCRIPTION - Describe real holdings from session
   */
  private getActualHoldingsDescription(): string {
    if (this.currentSession?.simplified_portfolio?.holdings && this.currentSession.simplified_portfolio.holdings.length > 0) {
      return this.currentSession.simplified_portfolio.holdings
        .map((h: { name: string; value: number }) => `${h.name}: $${h.value.toLocaleString()}`)
        .join(", ");
    }
    if (this.currentSession?.simplified_portfolio?.new_investor) {
      return "New investor - no current holdings";
    }
    return "Portfolio value provided without specific holdings breakdown";
  }
  
  /**
   * GET PORTFOLIO TYPE - Determine investor type from session data
   */
  private getPortfolioType(): string {
    if (this.currentSession?.simplified_portfolio?.new_investor) {
      return "New investor";
    }
    if (this.currentSession?.simplified_portfolio?.holdings && this.currentSession.simplified_portfolio.holdings.length > 0) {
      return "Existing investor with specific holdings";
    }
    if (this.currentSession?.simplified_portfolio?.portfolio_value) {
      return "Existing investor with portfolio value only";
    }
    return "Portfolio information not provided";
  }
  
  /**
   * GET CURRENT SESSION - Access session context for analysis
   */
  private getCurrentSession(): SessionMemory | null {
    return this.currentSession;
  }
  
  /**
   * PROCESS IMPACT DATA - Handle both array and string responses from AI
   */
  private processImpactData(data: unknown): string[] {
    // If it's already an array of strings, clean and return it
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') {
          // Remove bullet point prefix if present
          return item.replace(/^\s*•\s*/, '').trim();
        }
        return String(item);
      }).filter(item => item.length > 0);
    }
    
    // If it's a string, use the existing extractBulletPoints logic
    if (typeof data === 'string') {
      return this.extractBulletPoints(data);
    }
    
    // Fallback for unexpected data types
    console.warn('processImpactData received unexpected type:', typeof data, data);
    return ['Analysis data unavailable'];
  }
  
  /**
   * EXTRACT BULLET POINTS - Convert text to array of bullet points for JSON structure
   */
  private extractBulletPoints(text: string | unknown): string[] {
    // Ensure we have a string to work with
    if (!text || typeof text !== 'string') {
      console.warn('extractBulletPoints received non-string:', typeof text, text);
      return ['Analysis data unavailable'];
    }
    
    // If already has bullet points, split and clean them
    if (text.includes('•')) {
      return text.split('\n')
        .map(line => line.replace(/^•\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    
    // Split by periods and create bullet array
    const sentences = text.split('.').filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
      return sentences.map(s => s.trim()).filter(s => s.length > 0);
    }
    
    // Return as single item array
    return [text.trim()];
  }
}

export const fsmOrchestrator = new FSMOrchestrator();
