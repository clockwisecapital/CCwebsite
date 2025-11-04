import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      );
    }

    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🔍 Checking video status for: ${videoId}`);

    // Call HeyGen API to check video status
    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ HeyGen status check failed:', errorData);
      throw new Error(`HeyGen API failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Video status:', data);

    return NextResponse.json({
      success: true,
      status: data.data.status, // 'pending', 'processing', 'completed', 'failed'
      videoUrl: data.data.video_url,
      thumbnailUrl: data.data.thumbnail_url,
    });

  } catch (error) {
    console.error('❌ Video status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check video status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
