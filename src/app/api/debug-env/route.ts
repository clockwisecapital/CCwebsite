import { NextResponse } from 'next/server';

/**
 * Debug endpoint to verify environment variables in production
 * GET /api/debug-env
 */
export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasJWTSecret: !!process.env.JWT_SECRET,
    openaiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    timestamp: new Date().toISOString()
  });
}