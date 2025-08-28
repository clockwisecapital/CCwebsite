// Finite State Machine orchestrator for conversation flow

import { client } from './openai';
import { DisplaySpecSchema, GoalsSchema, PortfolioSchema } from './schemas';
import { sessionManager, SessionMemory } from './session';
import { collectGoals, GoalsData } from './tools/collect-goals';
import { collectPortfolio } from './tools/collect-portfolio';

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
      console.log('♻️  Using existing session');
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
    console.log('\n🎯 HYBRID GOALS STAGE HANDLER START');
    console.log('📥 Input Message:', `"${context.userMessage}"`);
    
    // Step 1: AI extracts structured data (background processing)
    const aiExtraction = await this.aiExtractGoals(context.userMessage, session);
    console.log('🤖 AI Extraction Result:', aiExtraction);
    
    // Step 2: Update session with AI-extracted data
    if (Object.keys(aiExtraction).length > 0) {
      console.log('✅ Found new goal data, updating session...');
      session.goals = { ...session.goals, ...aiExtraction };
      
      // Update slots based on what we have
      const goalSlots = ['goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs'];
      session.completed_slots = goalSlots.filter(slot => session.goals?.[slot] != null);
      session.missing_slots = goalSlots.filter(slot => !session.completed_slots.includes(slot));
      
      sessionManager.updateSession(session.session_id, session);
      console.log('📊 Updated Goals:', session.goals);
      console.log('📊 Completed Slots:', session.completed_slots);
    }

    // Step 3: Check if goals are complete and advance stage
    if (session.completed_slots.length === 5) {
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
                `Investment type: ${session.goals?.goal_type || 'Unknown'}`,
                `Target amount: $${session.goals?.goal_amount?.toLocaleString() || 'Unknown'}`,
                `Time horizon: ${session.goals?.horizon_years || 'Unknown'} years`
              ])
            },
            {
              type: "conversation_text",
              content: JSON.stringify([
                "Perfect! I have all your investment goals. Now let's discuss your current portfolio allocation to see how it aligns with your objectives."
              ])
            },
            {
              type: "cta_group", 
              content: JSON.stringify([{
                label: "Continue to Portfolio Analysis",
                action: "continue"
              }])
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
- "aggressive growth" → {"goal_type": "growth"}
- "high risk" → {"risk_tolerance": "high"}  
- "$500,000" → {"goal_amount": 500000}
- "10 years" → {"horizon_years": 10}
- "low liquidity" → {"liquidity_needs": "low"}

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

  private async handlePortfolioStage(session: SessionMemory, context: ConversationContext) {
    const systemPrompt = `
You are in the PORTFOLIO stage. Collect portfolio allocation data.

${sessionManager.getWorkingHeader(session)}

Required slots:
- allocations (stocks%, bonds%, cash%, commodities%, real_estate%, alternatives%) - MUST sum to 100%
- currency (ISO code like USD)

Optional slots:
- top_positions (up to 10 holdings with weights)
- sectors (sector breakdown)

Validate that allocations sum to exactly 100%. If not, ask for correction.
Support both manual entry and CSV upload concepts.

Respond with DisplaySpec JSON containing:
- summary_bullets: Portfolio details collected
- table: Show allocation breakdown if provided
- cta_group: "Run Analysis" button when allocations sum to 100%
    `;

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...this.buildConversationHistory(context.conversationHistory),
        { role: "user", content: context.userMessage }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "collect_portfolio",
            description: "Capture and validate portfolio allocation data",
            parameters: PortfolioSchema,
            strict: true
          }
        }
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

    // Process tool calls if any
    if (response.choices[0]?.message?.tool_calls) {
      for (const toolCall of response.choices[0].message.tool_calls) {
        if (toolCall.type === 'function' && toolCall.function?.name === 'collect_portfolio') {
          const args = JSON.parse(toolCall.function.arguments);
          await collectPortfolio(context.sessionId, args);
        }
      }
    }

    // Check if portfolio is valid and advance stage
    if (sessionManager.canAdvanceStage(session)) {
      sessionManager.advanceStage(session);
    }

    return this.formatResponse(response, session);
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
}

export const fsmOrchestrator = new FSMOrchestrator();
