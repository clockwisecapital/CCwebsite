// Finite State Machine orchestrator for conversation flow

import { client } from './openai';
import { DisplaySpecSchema, GoalsSchema, PortfolioSchema } from './schemas';
import { sessionManager, SessionMemory } from './session';
import { collectGoals, GoalsData } from './tools/collect-goals';
import { collectPortfolio } from './tools/collect-portfolio';

export interface PortfolioData {
  allocations: {
    stocks: number;
    bonds: number;
    cash: number;
    commodities: number;
    real_estate: number;
    alternatives: number;
  };
  currency: string;
  top_positions?: Array<{ name: string; weight: number }>;
  sectors?: Array<{ name: string; weight: number }>;
}

export interface ConversationContext {
  sessionId: string;
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class FSMOrchestrator {
  
  async processMessage(context: ConversationContext) {
    console.log('\n🎯 FSM ORCHESTRATOR START');
    console.log('📥 Input Context:');
    console.log('  - Session ID:', context.sessionId);
    console.log('  - User Message:', `"${context.userMessage}"`);
    console.log('  - Message Type:', typeof context.userMessage);
    console.log('  - Message Trimmed:', `"${context.userMessage.trim()}"`);
    console.log('  - Conversation History:', context.conversationHistory?.length || 0, 'items');
    
    let session = sessionManager.getSession(context.sessionId);
    
    if (!session) {
      console.log('🆕 Creating new session for:', context.sessionId);
      session = sessionManager.createSession(context.sessionId);
    } else {
      console.log('♻️  Using existing session:', context.sessionId);
      console.log('🔍 Session validation - Created:', session.created_at);
      console.log('🔍 Session validation - Stage:', session.stage);
      
      // Detect potential session contamination
      if (session.stage !== 'qualify' && session.completed_slots.length === 0) {
        console.log('⚠️  WARNING: Suspicious session state detected - may be contaminated');
        console.log('🔄 Creating fresh session to prevent data leakage...');
        sessionManager.clearSession(context.sessionId);
        session = sessionManager.createSession();
      }
    }

    console.log('📊 Current Session State:');
    console.log('  - Stage:', session.stage);
    console.log('  - Completed Slots:', session.completed_slots);
    console.log('  - Missing Slots:', session.missing_slots);
    console.log('  - Key Facts:', session.key_facts);
    console.log('  - Goals Data:', session.goals);
    console.log('  - Portfolio Data:', session.portfolio);

    console.log(`\n🔀 Routing to ${session.stage.toUpperCase()} stage handler...`);

    let result;
    try {
      // Route to appropriate stage handler
      switch (session.stage) {
        case 'qualify':
          console.log('🎯 Calling handleQualifyStage');
          result = await this.handleQualifyStage(session, context);
          break;
        case 'goals':
          console.log('🎯 Calling handleGoalsStage');
          result = await this.handleGoalsStage(session, context);
          break;
        case 'portfolio':
          console.log('🎯 Calling handlePortfolioStage');
          result = await this.handlePortfolioStage(session, context);
          break;
        case 'analyze':
          console.log('🎯 Calling handleAnalyzeStage');
          result = await this.handleAnalyzeStage(session, context);
          break;
        case 'explain':
          console.log('🎯 Calling handleExplainStage');
          result = await this.handleExplainStage(session, context);
          break;
        case 'cta':
          console.log('🎯 Calling handleCTAStage');
          result = await this.handleCTAStage(session, context);
          break;
        case 'end':
          console.log('🎯 Calling handleEndStage');
          result = await this.handleEndStage(session, context);
          break;
        default:
          console.error('❌ Unknown stage:', session.stage);
          throw new Error(`Unknown stage: ${session.stage}`);
      }

      console.log('✅ Stage handler completed successfully');
      console.log('📤 Result Overview:');
      console.log('  - Has DisplaySpec:', !!result?.displaySpec);
      console.log('  - DisplaySpec Blocks:', result?.displaySpec?.blocks?.length || 0);
      console.log('  - Session Stage:', result?.session?.stage);
      console.log('  - Session Completed Slots:', result?.session?.completed_slots?.length || 0);
      console.log('🎯 FSM ORCHESTRATOR END\n');

      return result;
    } catch (error: any) {
      console.error('❌ FSM Stage Handler Error:', error);
      console.error('Error Stack:', error.stack);
      throw error;
    }
  }

  private async handleQualifyStage(session: SessionMemory, context: ConversationContext) {
    const systemPrompt = `
You are a portfolio advisor from Clockwise Capital. You're in the QUALIFY stage.

Your goal: Get the user to agree to run a portfolio analysis.

${sessionManager.getWorkingHeader(session)}

Keep it brief and engaging. Ask if they'd like to analyze their portfolio.
If they agree, respond with excitement and advance to goals collection.

Respond with a DisplaySpec JSON containing:
- summary_bullets: Welcome message and what you'll do
- cta_group: Button to "Start Analysis" if they're ready
    `;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...this.buildConversationHistory(context.conversationHistory),
        { role: "user", content: context.userMessage }
      ],
      response_format: { 
        type: "json_schema", 
        json_schema: { 
          name: "DisplaySpec", 
          schema: DisplaySpecSchema, 
          strict: true 
        } 
      }
    });

    // Check if user agreed to analysis
    if (context.userMessage.toLowerCase().includes('yes') || 
        context.userMessage.toLowerCase().includes('analyze') ||
        context.userMessage.toLowerCase().includes('start')) {
      sessionManager.advanceStage(session);
    }

    return this.formatResponse(response, session);
  }

  private async handleGoalsStage(session: SessionMemory, context: ConversationContext) {
    console.log('🎯 HYBRID GOALS STAGE HANDLER START');
    console.log('📥 Input Message:', `"${context.userMessage}"`);
    
    // Step 1: AI extracts structured data (background processing)
    const aiExtraction = await this.aiExtractGoals(context.userMessage, session);
    console.log('🤖 AI Extraction Result:', aiExtraction);
    
    // Step 2: Update session with AI-extracted data
    if (Object.keys(aiExtraction).length > 0) {
      console.log('✅ Found new goal data, updating session...');
      session.goals = { ...session.goals, ...aiExtraction };
      
      // Update slot tracking
      session.completed_slots = this.getCompletedGoalSlots(session.goals);
      session.missing_slots = this.getMissingGoalSlots(session.goals);
      
      sessionManager.updateSession(session.session_id, session);
      console.log('📊 Updated Goals:', session.goals);
      console.log('📊 Completed Slots:', session.completed_slots);
    }

    // Step 3: Check if stage complete
    if (session.completed_slots.length === 5) { // All goals collected
      console.log('🎉 All goals completed! Advancing to portfolio stage...');
      session.stage = 'portfolio';
      sessionManager.updateSession(session.session_id, session);
      
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
        session: session,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // Step 4: Generate unified response with AI conversation + hard-coded structure
    return await this.buildUnifiedGoalsResponse(session, context);
  }

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
- "I want to reach $1 million by age 40. That's 12 years from now" → {"goal_amount": 1000000, "horizon_years": 12, "goal_type": "growth"}
- "aggressive growth" → {"goal_type": "growth"}
- "high risk" → {"risk_tolerance": "high"}  
- "$500,000" → {"goal_amount": 500000}
- "10 years" → {"horizon_years": 10}
- "low liquidity" → {"liquidity_needs": "low"}
- "I need $500k in 5 years for retirement" → {"goal_amount": 500000, "horizon_years": 5, "goal_type": "lump_sum"}

IMPORTANT: Parse dollar amounts like "$1 million", "$1M", "1 million dollars" as 1000000.
Parse time references like "12 years from now", "in 10 years" as horizon_years.
If someone wants to "reach" or "achieve" a target amount, use goal_type "growth".

Return {} if no clear data found.
`;

      console.log('🤖 Making OpenAI API call...');

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

  private async buildUnifiedGoalsResponse(session: SessionMemory, context: ConversationContext) {
    // Hard-coded progress template
    const progressText = `Progress: ${session.completed_slots.length}/5 goals collected`;
    const completedLabels = this.getCompletedGoalLabels(session.completed_slots);
    
    // AI generates conversational response text
    const conversationalText = await this.generateConversationalText(session, context);
    
    // Single unified DisplaySpec response
    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              progressText,
              completedLabels.length > 0 ? `✓ ${completedLabels.join(', ')}` : "Let's get started..."
            ])
          },
          {
            type: "conversation_text",
            content: JSON.stringify([conversationalText])
          },
          {
            type: "cta_group",
            content: JSON.stringify([{ 
              label: "Continue", 
              action: "continue" 
            }])
          }
        ]
      },
      session: session,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }

  private async generateConversationalText(session: SessionMemory, context: ConversationContext): Promise<string> {
    try {
      const nextNeeded = session.missing_slots[0];
      const prompt = `
You are a friendly portfolio advisor collecting investment goals.

User just said: "${context.userMessage}"
Progress: ${session.completed_slots.length}/5 goals collected
Completed: ${session.completed_slots.join(', ')}
Next needed: ${nextNeeded}

Generate a natural, conversational response (2-3 sentences max) that:
1. Briefly acknowledges what they shared
2. Asks for the next missing piece: ${nextNeeded}
3. Provides helpful context or examples if needed

Keep it warm, professional, and focused on getting the next piece of information.
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content || "What would you like to share next?";
    } catch (error) {
      console.error('❌ Conversational text generation error:', error);
      // Fallback to hard-coded question
      const nextNeeded = session.missing_slots[0];
      const fallbackQuestions: Record<string, string> = {
        'goal_type': 'What is your main investment objective?',
        'goal_amount': 'What is your target investment amount?',
        'horizon_years': 'What is your investment time horizon in years?',
        'risk_tolerance': 'What is your risk tolerance: low, medium, or high?',
        'liquidity_needs': 'What are your liquidity needs: low, medium, or high?'
      };
      return fallbackQuestions[nextNeeded] || "What would you like to share next?";
    }
  }

  private getCompletedGoalLabels(completedSlots: string[]): string[] {
    const labelMap: Record<string, string> = {
      'goal_type': 'Investment type',
      'goal_amount': 'Target amount', 
      'horizon_years': 'Time horizon',
      'risk_tolerance': 'Risk tolerance',
      'liquidity_needs': 'Liquidity needs'
    };
    
    return completedSlots.map(slot => labelMap[slot]).filter(Boolean);
  }

  private getCompletedPortfolioLabels(portfolio: PortfolioData | undefined): string[] {
    const completedSlots = this.getCompletedPortfolioSlots(portfolio);
    const labelMap: Record<string, string> = {
      'allocations': 'Portfolio allocation',
      'currency': 'Currency',
      'top_positions': 'Top holdings',
      'sectors': 'Sector breakdown'
    };
    return completedSlots.map(slot => labelMap[slot]).filter(Boolean);
  }

  private async aiExtractPortfolio(userMessage: string, session: SessionMemory): Promise<Partial<PortfolioData>> {
    console.log('🤖 AI PORTFOLIO EXTRACTION START');
    console.log('  - User Message:', userMessage);
    console.log('  - Missing Slots:', session.missing_slots);
    console.log('  - OpenAI API Key Present:', !!process.env.OPENAI_API_KEY);
    
    // Ensure we always return an object, never undefined
    let result: Partial<PortfolioData> = {};
    
    try {
      const prompt = `
Extract portfolio data from this user message: "${userMessage}"

Context - we still need: ${session.missing_slots.join(', ')}
Current allocation: ${session.portfolio?.allocations ? this.getAllocationsSum(session.portfolio.allocations) : 0}%

Return ONLY a JSON object with any clearly identifiable values:
{
  "allocations": {
    "stocks": number (0-100),
    "bonds": number (0-100), 
    "cash": number (0-100),
    "commodities": number (0-100),
    "real_estate": number (0-100),
    "alternatives": number (0-100)
  },
  "currency": "USD|EUR|GBP|CAD|etc",
  "top_positions": [{"name": "string", "weight": number}] (optional),
  "sectors": [{"name": "string", "weight": number}] (optional),
  "suggest_default": boolean (true if user has no specific preferences)
}

Examples:
- "60% stocks, 40% bonds" → {"allocations": {"stocks": 60, "bonds": 40}}
- "I hold Apple, Microsoft, Google" → {"top_positions": [{"name": "Apple", "weight": 0}, {"name": "Microsoft", "weight": 0}, {"name": "Google", "weight": 0}]}
- "Technology 60%, Healthcare 20%, Financials 20%" → {"sectors": [{"name": "Technology", "weight": 60}, {"name": "Healthcare", "weight": 20}, {"name": "Financials", "weight": 20}]}
- "My biggest holdings are AAPL 10%, TSLA 8%, QQQ 15%" → {"top_positions": [{"name": "AAPL", "weight": 10}, {"name": "TSLA", "weight": 8}, {"name": "QQQ", "weight": 15}]}
- "No preference" → {"suggest_default": true}
- "USD portfolio" → {"currency": "USD"}

SECTOR TO ASSET CLASS MAPPING:
- Technology, Healthcare, Financials, Consumer sectors → stocks
- Government bonds, corporate bonds, fixed income → bonds
- Cash, money market → cash
- Gold, oil, commodities → commodities
- REITs, real estate → real_estate
- Private equity, hedge funds → alternatives

Return {} if no clear data found.
`;

      console.log('🤖 Making OpenAI API call...');

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
          max_tokens: 150,
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

  private getCompletedPortfolioSlots(portfolio: PortfolioData | undefined): string[] {
    const completedSlots: string[] = [];
    
    if (!portfolio) return completedSlots;
    
    // Required slots
    if (portfolio.allocations && this.getAllocationsSum(portfolio.allocations) === 100) {
      completedSlots.push('allocations');
    }
    
    if (portfolio.currency) {
      completedSlots.push('currency');
    }
    
    // Optional slots (for enhanced analysis)
    if (portfolio.top_positions && portfolio.top_positions.length > 0) {
      completedSlots.push('top_positions');
    }
    
    if (portfolio.sectors && portfolio.sectors.length > 0) {
      completedSlots.push('sectors');
    }
    
    return completedSlots;
  }

  private getDefaultAllocation(goals: GoalsData): { [key: string]: number } {
    console.log('💡 Generating default allocation for goals:', goals);
    
    // Base allocation on risk tolerance and goals
    if (goals.risk_tolerance === 'high' && goals.goal_type === 'growth') {
      return { stocks: 80, bonds: 15, cash: 5 };
    } else if (goals.risk_tolerance === 'medium') {
      return { stocks: 60, bonds: 30, cash: 10 };
    } else if (goals.risk_tolerance === 'low' || goals.goal_type === 'preservation') {
      return { stocks: 30, bonds: 60, cash: 10 };
    } else {
      // Balanced default
      return { stocks: 60, bonds: 30, cash: 10 };
    }
  }

  private updatePortfolioSlots(session: SessionMemory): void {
    const portfolio = session.portfolio;
    const completed: string[] = [];
    const missing: string[] = [];

    // Check required slots
    const allocSum = this.getAllocationsSum(portfolio.allocations || {});
    if (allocSum === 100) {
      completed.push('allocations');
    } else {
      missing.push('allocations');
    }

    if (portfolio.currency) {
      completed.push('currency');
    } else {
      missing.push('currency');
    }

    // Check optional slots (don't add to missing - these are truly optional)
    if (portfolio.top_positions && portfolio.top_positions.length > 0) {
      completed.push('top_positions');
    }
    
    if (portfolio.sectors && portfolio.sectors.length > 0) {
      completed.push('sectors');
    }

    // Update session slot tracking (only portfolio-related slots)
    session.completed_slots = session.completed_slots.filter(slot => 
      !['allocations', 'currency', 'top_positions', 'sectors'].includes(slot)
    ).concat(completed);
    
    session.missing_slots = missing;
    
    console.log('📊 Updated Portfolio Slots - Completed:', completed, 'Missing:', missing);
  }

  private getMissingPortfolioSlots(portfolio: PortfolioData | undefined): string[] {
    const requiredSlots = ['allocations', 'currency'];
    const completedSlots = this.getCompletedPortfolioSlots(portfolio);
    return requiredSlots.filter(slot => !completedSlots.includes(slot));
  }

  private isPortfolioComplete(portfolio: PortfolioData | undefined): boolean {
    if (!portfolio) return false;
    
    const allocationsSum = portfolio.allocations ? this.getAllocationsSum(portfolio.allocations) : 0;
    return allocationsSum === 100 && !!portfolio.currency;
  }

  private getAllocationsSum(allocations: any): number {
    if (!allocations) return 0;
    
    const sum = (allocations.stocks || 0) + 
                (allocations.bonds || 0) + 
                (allocations.cash || 0) + 
                (allocations.commodities || 0) + 
                (allocations.real_estate || 0) + 
                (allocations.alternatives || 0);
    
    return Math.round(sum * 100) / 100; // Round to 2 decimal places
  }

  private formatAllocations(allocations: any): string {
    if (!allocations) return 'Not set';
    
    const parts: string[] = [];
    if (allocations.stocks > 0) parts.push(`${allocations.stocks}% stocks`);
    if (allocations.bonds > 0) parts.push(`${allocations.bonds}% bonds`);
    if (allocations.cash > 0) parts.push(`${allocations.cash}% cash`);
    if (allocations.commodities > 0) parts.push(`${allocations.commodities}% commodities`);
    if (allocations.real_estate > 0) parts.push(`${allocations.real_estate}% real estate`);
    if (allocations.alternatives > 0) parts.push(`${allocations.alternatives}% alternatives`);
    
    return parts.join(', ');
  }

  private getAllocationRows(allocations: any): string[][] {
    if (!allocations) return [];
    
    const rows: string[][] = [];
    if (allocations.stocks > 0) rows.push(['Stocks', `${allocations.stocks}%`]);
    if (allocations.bonds > 0) rows.push(['Bonds', `${allocations.bonds}%`]);
    if (allocations.cash > 0) rows.push(['Cash', `${allocations.cash}%`]);
    if (allocations.commodities > 0) rows.push(['Commodities', `${allocations.commodities}%`]);
    if (allocations.real_estate > 0) rows.push(['Real Estate', `${allocations.real_estate}%`]);
    if (allocations.alternatives > 0) rows.push(['Alternatives', `${allocations.alternatives}%`]);
    
    return rows;
  }

  private async buildUnifiedPortfolioResponse(session: SessionMemory, context: ConversationContext) {
    const allocationsSum = session.portfolio?.allocations ? this.getAllocationsSum(session.portfolio.allocations) : 0;
    const missingSlots = this.getMissingPortfolioSlots(session.portfolio);
    const completedSlots = this.getCompletedPortfolioSlots(session.portfolio);
    
    // Determine specific next step
    let promptText: string;
    let progressText: string;

    if (missingSlots.includes('allocations')) {
      progressText = `Progress: ${completedSlots.length}/2 portfolio details collected`;
      
      if (allocationsSum === 0) {
        promptText = `Now I need your portfolio allocation percentages. Please provide them in this specific format:

"X% stocks, Y% bonds, Z% cash"

The percentages must add up to 100%. You can include:
- Stocks (equities)
- Bonds (fixed income) 
- Cash (money market)
- Real Estate (REITs)
- Commodities (gold, oil, etc.)
- Alternatives (private equity, hedge funds)

Example: "60% stocks, 30% bonds, 10% cash"`;
      } else {
        promptText = `You have ${allocationsSum}% allocated. Please specify the remaining ${100 - allocationsSum}% using the same format:

"X% bonds, Y% cash" (or whatever asset classes you prefer)

This must total exactly ${100 - allocationsSum}% to complete your portfolio.`;
      }
    } else if (missingSlots.includes('currency')) {
      progressText = `Progress: 1/2 portfolio details collected`;
      promptText = `Perfect! Your allocations total 100%. Now please specify your portfolio currency:

"USD" (for US Dollars)
"EUR" (for Euros)  
"GBP" (for British Pounds)
"CAD" (for Canadian Dollars)

Just the currency code is fine.`;
    } else {
      // Required slots complete - offer optional detail collection
      const hasOptionalData = completedSlots.some(slot => ['top_positions', 'sectors'].includes(slot));
      
      if (!hasOptionalData) {
        progressText = `Portfolio setup complete! (Optional: add holdings detail)`;
        promptText = `Perfect! I have your basic portfolio allocation. 

For more detailed analysis, would you like to share:
- Your top stock holdings? (e.g., "My biggest positions are Apple 10%, Tesla 8%, Microsoft 6%")
- Your sector breakdown? (e.g., "60% Technology, 20% Healthcare, 20% Financials")

Or simply say "Continue" to proceed with the analysis.`;
      } else {
        progressText = `Portfolio setup complete with enhanced details!`;
        promptText = `Excellent! I have your detailed portfolio information. Ready to run a comprehensive analysis.`;
      }
    }

    const blocks: any[] = [
      {
        type: "summary_bullets",
        content: JSON.stringify([
          progressText,
          ...(completedSlots.length > 0 ? [`✓ ${this.getCompletedPortfolioLabels(session.portfolio).join(', ')}`] : []),
          ...(allocationsSum > 0 ? [`Current allocation: ${allocationsSum}%`] : [])
        ])
      },
      {
        type: "conversation_text",
        content: JSON.stringify([promptText])
      }
    ];

    // Add allocation table if we have any
    if (session.portfolio?.allocations && allocationsSum > 0) {
      blocks.splice(1, 0, {
        type: "table",
        content: JSON.stringify({
          title: "Current Allocation",
          columns: ["Asset Class", "Allocation"],
          rows: this.getAllocationRows(session.portfolio.allocations)
        })
      });
    }

    // Only add Continue button if portfolio is complete (like goals stage)
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

  private async handlePortfolioStage(session: SessionMemory, context: ConversationContext) {
    console.log('🎯 HYBRID PORTFOLIO STAGE HANDLER START');
    console.log('📥 Input Message:', context.userMessage);

    // Step 1: AI extracts structured data from user message
    console.log('🔍 DEBUG: About to call aiExtractPortfolio with:', context.userMessage);
    const aiExtraction = await this.aiExtractPortfolio(context.userMessage, session) || {};
    console.log('🤖 AI Extraction Result:', aiExtraction);
    console.log('🔍 DEBUG: aiExtraction type:', typeof aiExtraction);
    console.log('🔍 DEBUG: aiExtraction keys:', Object.keys(aiExtraction));

    // Step 2: Update session with any extracted data
    if (aiExtraction && Object.keys(aiExtraction).length > 0) {
      console.log('📝 Updating session with AI extraction:', aiExtraction);
      
      // Handle default allocation suggestion
      if ((aiExtraction as any).suggest_default) {
        console.log('💡 User has no preference - suggesting default allocation');
        const defaultAllocation = this.getDefaultAllocation(session.goals);
        // Ensure portfolio object exists before accessing allocations
        if (!session.portfolio) {
          session.portfolio = {};
        }
        session.portfolio.allocations = { 
          ...(session.portfolio.allocations || {}), 
          ...defaultAllocation 
        };
      } else if (aiExtraction.allocations) {
        // Ensure portfolio object exists before accessing allocations
        if (!session.portfolio) {
          session.portfolio = {};
        }
        session.portfolio.allocations = { 
          ...(session.portfolio.allocations || {}), 
          ...aiExtraction.allocations 
        };
      }
      
      if (aiExtraction.currency) {
        // Ensure portfolio object exists before accessing currency
        if (!session.portfolio) {
          session.portfolio = {};
        }
        session.portfolio.currency = aiExtraction.currency;
      }
      
      // Handle optional top positions (same object safety pattern)
      if (aiExtraction.top_positions && Array.isArray(aiExtraction.top_positions)) {
        if (!session.portfolio) {
          session.portfolio = {};
        }
        session.portfolio.top_positions = [
          ...(session.portfolio.top_positions || []),
          ...aiExtraction.top_positions
        ];
        console.log('📈 Added top positions:', aiExtraction.top_positions);
      }
      
      // Handle optional sectors (same object safety pattern)
      if (aiExtraction.sectors && Array.isArray(aiExtraction.sectors)) {
        if (!session.portfolio) {
          session.portfolio = {};
        }
        session.portfolio.sectors = [
          ...(session.portfolio.sectors || []),
          ...aiExtraction.sectors
        ];
        console.log('📊 Added sectors:', aiExtraction.sectors);
      }
      
      // Update slot tracking
      this.updatePortfolioSlots(session);
      
      // Save session
      sessionManager.updateSession(session.session_id, session);
    } 
    console.log('📊 Updated Portfolio:', session.portfolio);
    console.log('📊 Completed Slots:', session.completed_slots);

    // Step 3: Check if stage complete (allocations sum to 100% and currency set)
    if (this.isPortfolioComplete(session.portfolio)) {
      console.log('🎉 Portfolio complete! Advancing to analyze stage...');
      session.stage = 'analyze';
      sessionManager.updateSession(session.session_id, session);
      
      return {
        displaySpec: {
          blocks: [
            {
              type: "summary_bullets",
              content: JSON.stringify([
                "🎉 Portfolio allocation complete!",
                `Currency: ${session.portfolio.currency}`,
                `Allocation: ${this.formatAllocations(session.portfolio.allocations)}`
              ])
            },
            {
              type: "table",
              content: JSON.stringify({
                title: "Portfolio Breakdown",
                columns: ["Asset Class", "Allocation"],
                rows: this.getAllocationRows(session.portfolio.allocations)
              })
            },
            {
              type: "conversation_text", 
              content: JSON.stringify(["Perfect! Your portfolio allocation is complete and sums to 100%. Now I'll analyze how this aligns with your investment goals and risk profile."])
            },
            {
              type: "cta_group",
              content: JSON.stringify([{ label: "Run Portfolio Analysis", action: "continue" }])
            }
          ]
        },
        session: session,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }

    // Step 4: Generate unified response with AI conversation + hard-coded structure
    return await this.buildUnifiedPortfolioResponse(session, context);
  }

  private async handleAnalyzeStage(session: SessionMemory, context: ConversationContext) {
    // This will call run_analysis tool in M2
    // For M1, just confirm data and advance to explain
    sessionManager.updateSession(context.sessionId, {
      analysis_result: { placeholder: 'Analysis will be implemented in M2' }
    });
    sessionManager.advanceStage(session);
    
    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "Data collection complete - ready for analysis.",
              "Analysis engine will be implemented in M2.",
              "Proceeding to summary stage."
            ])
          }
        ]
      },
      session: sessionManager.getSession(context.sessionId),
      usage: null
    };
  }

  private async handleExplainStage(session: SessionMemory, context: ConversationContext) {
  const systemPrompt = `
You are in the EXPLAIN stage. Provide a clear summary of collected data.

${sessionManager.getWorkingHeader(session)}

Show a confirmation summary of:
- Goals collected
- Portfolio allocations
- Next steps

This is M1 - just confirm data collection is complete.
In M2, this will show actual analysis results.

Respond with DisplaySpec JSON containing:
- summary_bullets: Data collection summary
- table: Portfolio allocations if available
- cta_group: "Looks Good" button to proceed
    `;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...this.buildConversationHistory(context.conversationHistory),
        { role: "user", content: context.userMessage }
      ],
      response_format: { 
        type: "json_schema", 
        json_schema: { 
          name: "DisplaySpec", 
          schema: DisplaySpecSchema, 
          strict: true 
        } 
      }
    });

    return this.formatResponse(response, session);
  }

  private async handleCTAStage(session: SessionMemory, context: ConversationContext) {
    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "Data collection complete!",
              "M1 milestone achieved",
              "Ready for M2 analysis implementation"
            ])
          },
          {
            type: "cta_group",
            content: JSON.stringify([
              {
                label: "Start New Analysis",
                action: "restart"
              }
            ])
          }
        ]
      },
      session,
      usage: null
    };
  }

  private async handleEndStage(session: SessionMemory, context: ConversationContext) {
    return {
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify(["Session completed"])
          }
        ]
      },
      session,
      usage: null
    };
  }

  private buildConversationHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>) {
    return history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private formatResponse(response: any, session: SessionMemory) {
    const content = response.choices?.[0]?.message?.content;
    let displaySpec;
    
    try {
      displaySpec = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      displaySpec = {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify(["Error processing response. Please try again."])
          }
        ]
      };
    }

    return {
      displaySpec,
      session,
      usage: response.usage
    };
  }

  // Helper methods for goals stage (proven pattern)
  private getCompletedGoalSlots(goals: any): string[] {
    const completedSlots: string[] = [];
    if (goals?.goal_type) completedSlots.push('goal_type');
    if (goals?.goal_amount) completedSlots.push('goal_amount');
    if (goals?.horizon_years) completedSlots.push('horizon_years');
    if (goals?.risk_tolerance) completedSlots.push('risk_tolerance');
    if (goals?.liquidity_needs) completedSlots.push('liquidity_needs');
    return completedSlots;
  }

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

  private getMissingGoalSlots(goals: any): string[] {
    const requiredSlots = ['goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs'];
    const completedSlots = this.getCompletedGoalSlots(goals);
    return requiredSlots.filter(slot => !completedSlots.includes(slot));
  }

  private isGoalsComplete(goals: any): boolean {
    return this.getMissingGoalSlots(goals).length === 0;
  }

  // Unified response builder for goals stage (proven pattern)
  private async buildUnifiedGoalsResponse(session: SessionMemory, context: ConversationContext) {
    const completedSlots = this.getCompletedGoalSlots(session.goals);
    const missingSlots = this.getMissingGoalSlots(session.goals);
    const completedLabels = this.getCompletedGoalLabels(session.goals);
    
    // Generate specific prompt based on what's missing
    let promptText: string;
    if (missingSlots.includes('goal_type')) {
      promptText = "What type of investment goal do you have? For example: 'growth', 'income', 'balanced', 'preservation', or 'lump sum'?";
    } else if (missingSlots.includes('goal_amount')) {
      promptText = "What's your target investment amount? Please provide a specific dollar amount like '$500,000' or '$1 million'.";
    } else if (missingSlots.includes('horizon_years')) {
      promptText = "What's your investment timeline? Please specify in years, like '10 years' or 'by age 65'.";
    } else if (missingSlots.includes('risk_tolerance')) {
      promptText = "What's your comfort level with investment risk? Please choose: 'low', 'medium', or 'high' risk tolerance.";
    } else if (missingSlots.includes('liquidity_needs')) {
      promptText = "How much access to your funds do you need? Please choose: 'low', 'medium', or 'high' liquidity needs.";
    } else {
      promptText = "I have all your investment goals. Ready to proceed to portfolio analysis?";
    }

    const blocks: any[] = [
      {
        type: "summary_bullets",
        content: JSON.stringify([
          `Progress: ${completedSlots.length}/5 investment details collected`,
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
}

export const fsmOrchestrator = new FSMOrchestrator();
