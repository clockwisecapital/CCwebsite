import { NextRequest, NextResponse } from 'next/server';
import { submitUserRating } from '@/lib/supabase/index';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, rating } = await req.json();

    // Validate inputs
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 10' },
        { status: 400 }
      );
    }

    console.log('💯 Submitting rating:', { conversationId, rating });

    // Save rating to database
    const success = await submitUserRating(conversationId, rating);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    console.log('✅ Rating saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
    });

  } catch (error) {
    console.error('❌ Rating submission error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit rating',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
