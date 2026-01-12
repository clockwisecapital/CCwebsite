/**
 * Portfolio Detail API
 * Get, update, or delete a specific portfolio
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch specific portfolio (RLS ensures user can only access own)
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      portfolio,
    });
    
  } catch (error) {
    console.error('Portfolio get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, is_public } = body;
    
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Update portfolio (RLS ensures user can only update own)
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_public !== undefined) updateData.is_public = is_public;
    
    const { data: portfolio, error: updateError } = await supabase
      .from('portfolios')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (updateError || !portfolio) {
      return NextResponse.json(
        { error: 'Failed to update portfolio' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        is_public: portfolio.is_public,
      },
    });
    
  } catch (error) {
    console.error('Portfolio update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete portfolio (RLS ensures user can only delete own)
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete portfolio' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
    
  } catch (error) {
    console.error('Portfolio delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

