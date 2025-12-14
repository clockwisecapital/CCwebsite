import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminTokenPayload, isMasterRole } from '@/lib/auth/admin';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ClockwisePortfolio {
  id: string;
  name: string;
  display_order: number;
  return_3y: number | null;
  std_dev: number | null;
  alpha: number | null;
  beta: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  up_capture: number | null;
  down_capture: number | null;
  is_benchmark: boolean;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Verify admin authentication using JWT token
 */
async function verifyAdmin(request: NextRequest): Promise<{ isValid: boolean; username?: string; role?: string }> {
  const tokenResult = await getAdminTokenPayload(request);
  
  if (!tokenResult.isAuthenticated || !tokenResult.payload) {
    return { isValid: false };
  }

  return { 
    isValid: true, 
    username: tokenResult.payload.username,
    role: tokenResult.payload.role 
  };
}

/**
 * GET /api/admin/portfolios
 * Fetch all Clockwise portfolios (public access for Review tab)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if this is an admin request or public request
    const { searchParams } = new URL(request.url);
    const isAdminRequest = searchParams.get('admin') === 'true';
    
    // For admin requests, verify authentication
    if (isAdminRequest) {
      const auth = await verifyAdmin(request);
      if (!auth.isValid) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const { data, error } = await supabase
      .from('clockwise_portfolios')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching portfolios:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch portfolios' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as ClockwisePortfolio[]
    });

  } catch (error) {
    console.error('Portfolios GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/portfolios
 * Update portfolio metrics (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdmin(request);
    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only master role can edit portfolios
    const tokenResult = await getAdminTokenPayload(request);
    if (!isMasterRole(tokenResult.payload)) {
      return NextResponse.json(
        { success: false, message: 'Only master admins can edit portfolios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    // Add metadata
    updates.updated_by = auth.username;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('clockwise_portfolios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating portfolio:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as ClockwisePortfolio
    });

  } catch (error) {
    console.error('Portfolios PUT error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/portfolios
 * Add a new portfolio (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdmin(request);
    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only master role can add portfolios
    const tokenResultPost = await getAdminTokenPayload(request);
    if (!isMasterRole(tokenResultPost.payload)) {
      return NextResponse.json(
        { success: false, message: 'Only master admins can add portfolios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    // Add metadata
    body.updated_by = auth.username;

    const { data, error } = await supabase
      .from('clockwise_portfolios')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error creating portfolio:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to create portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as ClockwisePortfolio
    });

  } catch (error) {
    console.error('Portfolios POST error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/portfolios
 * Delete a portfolio (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdmin(request);
    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only master role can delete portfolios
    const tokenResultDelete = await getAdminTokenPayload(request);
    if (!isMasterRole(tokenResultDelete.payload)) {
      return NextResponse.json(
        { success: false, message: 'Only master admins can delete portfolios' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('clockwise_portfolios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting portfolio:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to delete portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio deleted successfully'
    });

  } catch (error) {
    console.error('Portfolios DELETE error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

