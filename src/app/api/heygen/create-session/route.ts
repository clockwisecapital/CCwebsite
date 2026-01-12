import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { avatarId, voiceId, contextId, language = 'en' } = body;

    // Validate required fields
    if (!avatarId || !voiceId || !contextId) {
      return NextResponse.json(
        { error: 'avatarId, voiceId, and contextId are required' },
        { status: 400 }
      );
    }

    // Validate UUID format for avatarId and contextId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(avatarId)) {
      return NextResponse.json(
        { error: 'avatarId must be a valid UUID format (e.g., 12345678-1234-1234-1234-123456789abc)' },
        { status: 400 }
      );
    }
    if (!uuidRegex.test(contextId)) {
      return NextResponse.json(
        { error: 'contextId must be a valid UUID format (e.g., 12345678-1234-1234-1234-123456789abc)' },
        { status: 400 }
      );
    }

    const apiKey = process.env.HEYGEN_LIVEAVATAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HEYGEN_LIVEAVATAR_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Create session token
    const response = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'FULL',
        avatar_id: avatarId,
        avatar_persona: {
          voice_id: voiceId,
          context_id: contextId,
          language: language,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('HeyGen API error:', errorData);
      console.error('Response status:', response.status);
      console.error('API Key present:', !!apiKey);
      console.error('API Key starts with:', apiKey?.substring(0, 10) + '...');
      return NextResponse.json(
        { error: 'Failed to create session', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('HeyGen API response data:', JSON.stringify(data, null, 2));
    
    // HeyGen API returns nested structure: { code, data: { session_id, session_token }, message }
    const sessionId = data.data?.session_id;
    const sessionToken = data.data?.session_token;
    
    console.log('Session ID:', sessionId);
    console.log('Session Token:', sessionToken);
    
    if (!sessionId || !sessionToken) {
      console.error('Missing session data from HeyGen response');
      return NextResponse.json(
        { error: 'Invalid response from HeyGen API' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      sessionId,
      sessionToken,
    });
  } catch (error) {
    console.error('Error creating HeyGen session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

