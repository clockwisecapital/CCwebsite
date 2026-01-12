import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Start session - received body:', JSON.stringify(body));
    const { sessionToken } = body;

    console.log('Session token present:', !!sessionToken);
    console.log('Session token value:', sessionToken?.substring(0, 20) + '...');

    if (!sessionToken) {
      console.error('Session token is missing from request body');
      return NextResponse.json(
        { error: 'sessionToken is required' },
        { status: 400 }
      );
    }

    // Start the session
    const response = await fetch('https://api.liveavatar.com/v1/sessions/start', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('HeyGen start session error:', errorData);
      return NextResponse.json(
        { error: 'Failed to start session', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      livekitUrl: data.livekit_url,
      livekitToken: data.livekit_client_token,
      sessionId: data.session_id,
    });
  } catch (error) {
    console.error('Error starting HeyGen session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

