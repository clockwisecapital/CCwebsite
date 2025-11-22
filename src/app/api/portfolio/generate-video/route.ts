import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client for script generation
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    // Validate HeyGen API key
    if (!process.env.HEYGEN_API_KEY) {
      console.error('❌ HEYGEN_API_KEY is not set');
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    const { analysisResult, userData } = await req.json();
    const firstName = userData?.firstName || 'there';

    console.log('🎬 Starting video generation process...', { firstName });

    // Step 1: Generate video script using Claude
    console.log('📝 Generating video script with Claude for:', firstName);
    const script = await generateVideoScript(analysisResult, firstName);
    console.log('✅ Script generated:', script.substring(0, 100) + '...');

    // Step 2: Use variant-b avatar and voice (the selected standard)
    const avatarId = '3ebd326145b149ecbcb4e6d85df4fc1f'; // Variant B avatar
    const voiceId = '68a63c5eb8304b4f92a97efea30c50f8'; // Variant B voice

    console.log(`🎥 Calling HeyGen API with avatar: ${avatarId} voice: ${voiceId}`);
    const heygenResponse = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'talking_photo',
              talking_photo_id: avatarId,
            },
            voice: {
              type: 'text',
              input_text: script,
              voice_id: voiceId,
              speed: 1.1,
            },
          },
        ],
        dimension: {
          width: 1280,
          height: 720,
        },
      }),
    });

    if (!heygenResponse.ok) {
      const errorData = await heygenResponse.json();
      console.error('❌ HeyGen API error:', errorData);
      throw new Error(`HeyGen API failed: ${JSON.stringify(errorData)}`);
    }

    const heygenData = await heygenResponse.json();
    console.log('✅ HeyGen video generation started:', heygenData);

    return NextResponse.json({
      success: true,
      videoId: heygenData.data.video_id,
      status: 'pending',
      message: 'Video generation started',
    });

  } catch (error) {
    console.error('❌ Video generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function generateVideoScript(analysisResult: unknown, firstName: string): Promise<string> {
  const prompt = `You are creating a VERY SHORT video script for an AI avatar named Kronos to present portfolio analysis results.

## Analysis Results:
${JSON.stringify(analysisResult, null, 2)}

## Requirements:
1. **Length**: EXACTLY 20 seconds when spoken (approximately 45-50 words MAX)
2. **Tone**: Professional, direct, and punchy
3. **Structure**:
   - Brief greeting using "Hey ${firstName}" (3 seconds / 8 words)
   - ONE key insight about market cycle (8 seconds / 18 words)
   - ONE key portfolio recommendation (7 seconds / 16 words)
   - Quick call to action (2 seconds / 6 words)
4. **Style**: 
   - Ultra-concise, every word counts
   - NO filler words
   - Get straight to the point
   - Be specific with ONE key number/percentage

## Important:
- Do NOT use markdown or formatting
- Do NOT include stage directions or [pauses]
- Write ONLY the spoken words
- Keep it under 50 words TOTAL
- Make it punchy and memorable

Generate the video script now:`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
    temperature: 0.7,
    messages: [{
      role: 'user',
      content: prompt,
    }],
  });

  const script = message.content[0].type === 'text' ? message.content[0].text : '';
  
  // Clean up any potential formatting
  return script
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '') // Remove italic markdown
    .replace(/\[.*?\]/g, '') // Remove stage directions
    .replace(/\n\n+/g, ' ') // Replace multiple newlines with space
    .trim();
}
