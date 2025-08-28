// Tool contract for collecting and validating investment goals

import { sessionManager } from '../session';

export interface GoalsData {
  goal_type: 'income' | 'lump_sum' | 'balanced' | 'preservation' | 'growth';
  goal_amount: number;
  horizon_years: number;
  risk_tolerance: 'low' | 'medium' | 'high';
  liquidity_needs: 'low' | 'medium' | 'high';
  target_return?: number;
}

export async function collectGoals(
  sessionId: string, 
  goalsData: Partial<GoalsData>
): Promise<{ goals_id: string; normalized: Partial<GoalsData>; validation_errors: string[]; slots_filled: string[] }> {
  
  const validation_errors: string[] = [];
  const slots_filled: string[] = [];
  
  // Get existing session data
  const session = sessionManager.getSession(sessionId);
  const existingGoals = session?.goals || {};
  
  // Merge new data with existing data
  const mergedGoals: Partial<GoalsData> = {
    ...existingGoals,
    ...goalsData
  };

  // Validate and track what we have - handle nullable values
  if (mergedGoals.goal_type && mergedGoals.goal_type !== null) {
    if (['income', 'lump_sum', 'balanced', 'preservation', 'growth'].includes(mergedGoals.goal_type)) {
      slots_filled.push('goal_type');
    }
  }
  
  if (mergedGoals.goal_amount !== undefined && mergedGoals.goal_amount !== null && mergedGoals.goal_amount > 0) {
    slots_filled.push('goal_amount');
  }
  
  if (mergedGoals.horizon_years !== undefined && mergedGoals.horizon_years !== null && mergedGoals.horizon_years > 0) {
    slots_filled.push('horizon_years');
  }
  
  if (mergedGoals.risk_tolerance && mergedGoals.risk_tolerance !== null && ['low', 'medium', 'high'].includes(mergedGoals.risk_tolerance)) {
    slots_filled.push('risk_tolerance');
  }
  
  if (mergedGoals.liquidity_needs && mergedGoals.liquidity_needs !== null && ['low', 'medium', 'high'].includes(mergedGoals.liquidity_needs)) {
    slots_filled.push('liquidity_needs');
  }

  console.log('Slots filled:', slots_filled);
  console.log('Merged goals:', mergedGoals);

  // If validation fails, don't update session
  if (validation_errors.length > 0) {
    return {
      goals_id: '',
      normalized: mergedGoals,
      validation_errors,
      slots_filled: []
    };
  }

  const goals_id = `goals_${sessionId}_${Date.now()}`;
  
  // Update session with merged goals data
  if (session) {
    sessionManager.updateSession(sessionId, {
      goals: mergedGoals
    });
    
    // Update completed slots
    sessionManager.updateSlots(session, slots_filled);
    
    // Add/update key facts
    session.key_facts = session.key_facts.filter(fact => 
      !fact.startsWith('goal=') && 
      !fact.startsWith('amount=') && 
      !fact.startsWith('horizon=') && 
      !fact.startsWith('risk=')
    );
    
    if (mergedGoals.goal_type) {
      session.key_facts.push(`goal=${mergedGoals.goal_type}`);
    }
    if (mergedGoals.goal_amount) {
      session.key_facts.push(`amount=$${mergedGoals.goal_amount.toLocaleString()}`);
    }
    if (mergedGoals.horizon_years) {
      session.key_facts.push(`horizon=${mergedGoals.horizon_years}y`);
    }
    if (mergedGoals.risk_tolerance) {
      session.key_facts.push(`risk=${mergedGoals.risk_tolerance}`);
    }
  }

  return {
    goals_id,
    normalized: mergedGoals,
    validation_errors: [],
    slots_filled
  };
}
