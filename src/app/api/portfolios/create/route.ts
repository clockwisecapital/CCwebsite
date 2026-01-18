/**
 * Portfolio Create API
 * Creates a simple portfolio from the community/scenario testing modal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, portfolio_data, intake_data } = body;

    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    // Parse portfolio_data if it's a string
    const parsedPortfolioData = typeof portfolio_data === 'string' 
      ? JSON.parse(portfolio_data) 
      : portfolio_data;

    // Parse intake_data if it's a string
    const parsedIntakeData = typeof intake_data === 'string'
      ? JSON.parse(intake_data)
      : intake_data;

    // Create portfolio record with holdings data
    const portfolioDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        name: name,
        description: description || null,
        portfolio_data: parsedPortfolioData,
        intake_data: parsedIntakeData,
        is_public: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (portfolioError) {
      console.error('Portfolio create error:', portfolioError);
      return NextResponse.json(
        { success: false, error: 'Failed to create portfolio', details: portfolioError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
      },
    });
  } catch (error) {
    console.error('Create portfolio error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
