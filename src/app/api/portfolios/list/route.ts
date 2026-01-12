/**
 * Portfolio List API
 * Returns all portfolios for the authenticated user
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch user's portfolios (RLS automatically filters by user_id)
    const { data: portfolios, error: fetchError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('Portfolio fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch portfolios' },
        { status: 500 }
      );
    }
    
    // Format response
    const formattedPortfolios = (portfolios || []).map(p => {
      const portfolioData = p.portfolio_data as any;
      const intakeData = p.intake_data as any;
      const metadata = p.metadata as any;
      
      return {
        id: p.id,
        name: p.name || 'Untitled Portfolio',
        description: p.description,
        created_at: p.created_at,
        updated_at: p.updated_at,
        tested_at: p.tested_at,
        
        // Scores
        portfolio_score: p.portfolio_score,
        goal_probability: p.goal_probability,
        risk_score: p.risk_score,
        cycle_score: p.cycle_score,
        
        // Portfolio data summary
        total_value: portfolioData?.totalValue,
        allocation: p.portfolio_data,
        
        // Risk level from intake
        risk_tolerance: intakeData?.riskTolerance,
        
        // Scenario info (if applicable)
        scenario_id: metadata?.scenario_id,
        scenario_name: metadata?.scenario_name,
        is_scenario_test: metadata?.is_scenario_test || false,
        
        // Visibility
        is_public: p.is_public,
      };
    });
    
    return NextResponse.json({
      success: true,
      portfolios: formattedPortfolios,
      count: formattedPortfolios.length,
    });
    
  } catch (error) {
    console.error('Portfolio list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

