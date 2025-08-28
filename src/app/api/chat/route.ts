// Main conversation endpoint using FSM orchestrator and OpenAI Responses API

import { NextRequest, NextResponse } from "next/server";
import { fsmOrchestrator } from "@/lib/fsm";
import { sessionManager } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    console.log('Chat API called');
    console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { 
      message, 
      sessionId, 
      conversationHistory = [] 
    } = body as {
      message: string;
      sessionId: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!message || !sessionId) {
      console.log('❌ Missing required fields - message:', !!message, 'sessionId:', !!sessionId);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('📝 Processing message:');
    console.log('  - Session ID:', sessionId);
    console.log('  - User Message:', `"${message}"`);
    console.log('  - Message Length:', message.length);
    console.log('  - Conversation History Length:', conversationHistory?.length || 0);
    console.log('  - Last History Item:', conversationHistory?.[conversationHistory.length - 1]);

    console.log('\n🔄 Calling FSM Orchestrator...');
    const result = await fsmOrchestrator.processMessage({
      sessionId,
      userMessage: message,
      conversationHistory: conversationHistory || []
    });

    console.log('\n✅ FSM Processing Complete');
    console.log('FSM result structure:');
    console.log('  - Has displaySpec:', !!result?.displaySpec);
    console.log('  - Has session:', !!result?.session);
    console.log('  - Session stage:', result?.session?.stage);
    console.log('  - Completed slots:', result?.session?.completed_slots?.length || 0);
    console.log('  - Missing slots:', result?.session?.missing_slots?.length || 0);
    console.log('Full FSM result:', JSON.stringify(result, null, 2));

    if (!result || !result.session) {
      console.error('❌ Invalid FSM result - returning error response');
      return NextResponse.json({ 
        displaySpec: {
          blocks: [{
            type: 'summary_bullets',
            content: JSON.stringify(['I apologize, but I encountered an error. Please try again or contact support if the issue persists.'])
          }]
        },
        session: { stage: 'qualify', completed_slots: [], missing_slots: [], key_facts: [] }
      }, { status: 200 });
    }

    console.log('✅ Returning successful response');
    console.log('=== CHAT API REQUEST END ===\n');
    return NextResponse.json({
      displaySpec: result.displaySpec,
      session: result.session ? {
        id: result.session.session_id,
        stage: result.session.stage,
        completed_slots: result.session.completed_slots,
        missing_slots: result.session.missing_slots,
        key_facts: result.session.key_facts
      } : null,
      usage: result.usage || null
    });
  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    console.error('Error stack:', error.stack);
    console.log('=== CHAT API REQUEST END (ERROR) ===\n');
    return NextResponse.json({
      displaySpec: {
        blocks: [
          {
            type: "summary_bullets",
            content: JSON.stringify([
              "Sorry, I encountered an error processing your request.",
              "Please try again or contact support if the issue persists."
            ])
          },
          {
            type: "cta_group",
            content: JSON.stringify([
              {
                label: "Try Again",
                action: "retry"
              }
            ])
          }
        ]
      },
      error: error.message
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    version: 'M1',
    features: ['fsm_orchestrator', 'session_memory', 'displayspec_rendering']
  });
}
