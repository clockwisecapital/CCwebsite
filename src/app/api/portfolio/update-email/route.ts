import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, userData } = await req.json();

    if (!conversationId || !userData) {
      return NextResponse.json(
        { error: 'Missing conversationId or userData' },
        { status: 400 }
      );
    }

    // Here you would update the conversation in your database with the user's email information
    // For now, we'll just log it and return success
    console.log('Updating conversation:', conversationId, 'with user data:', userData);

    // TODO: Implement actual database update
    // Example:
    // await db.conversations.update({
    //   where: { id: conversationId },
    //   data: {
    //     email: userData.email,
    //     firstName: userData.firstName,
    //     lastName: userData.lastName,
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully',
    });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    );
  }
}
