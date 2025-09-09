// Streaming SSE endpoint for real-time conversation flow

import { NextRequest } from "next/server";
import { fsmOrchestrator } from "@/lib/fsm";
import { sessionManager } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    const body = await req.json();
    const { 
      message, 
      sessionId, 
      conversationHistory = [] 
    } = body as {
      message: string;
      sessionId: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };

    if (!message?.trim() || !sessionId?.trim()) {
      return new Response('Message and sessionId are required', { status: 400 });
    }

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get or create session
          let session = sessionManager.getSession(sessionId);
          if (!session) {
            session = sessionManager.createSession(sessionId);
          }

          // Send session state first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'session_state',
            data: {
              stage: session.stage,
              completed_slots: session.completed_slots,
              missing_slots: session.missing_slots,
              key_facts: session.key_facts
            }
          })}\n\n`));

          // Process through FSM orchestrator
          const result = await fsmOrchestrator.processMessage({
            sessionId,
            userMessage: message,
            conversationHistory
          });

          // Stream the DisplaySpec blocks
          if (result.displaySpec?.blocks) {
            for (const block of result.displaySpec.blocks) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'displayspec_block',
                data: block
              })}\n\n`));
              
              // Small delay between blocks for better UX
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          // Send final session update
          const updatedSession = sessionManager.getSession(sessionId);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'session_update',
            data: {
              stage: updatedSession?.stage || session.stage,
              completed_slots: updatedSession?.completed_slots || session.completed_slots,
              missing_slots: updatedSession?.missing_slots || session.missing_slots,
              key_facts: updatedSession?.key_facts || session.key_facts
            }
          })}\n\n`));

          // Send completion signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            data: { usage: result.usage }
          })}\n\n`));

          controller.close();

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Streaming error:', error);
          
          // Send error in SSE format
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            data: {
              message: 'Sorry, I encountered an error. Please try again.',
              error: errorMessage
            }
          })}\n\n`));
          
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error: unknown) {
    console.error('Stream setup error:', error);
    return new Response('Stream setup failed', { status: 500 });
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
