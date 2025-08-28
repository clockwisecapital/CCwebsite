// Session memory management for FSM state and slot tracking

export type Stage = 'qualify' | 'goals' | 'portfolio' | 'analyze' | 'explain' | 'cta' | 'end';

export interface SessionMemory {
  // Working header (sent every turn)
  stage: Stage;
  completed_slots: string[];
  missing_slots: string[];
  key_facts: string[];
  
  // Session data (server side)
  goals?: any;
  portfolio?: any;
  analysis_result?: any;
  charts_meta?: any;
  research_sources?: any[];
  
  // Search budget tracking
  search_count: number;
  search_budget_exceeded: boolean;
  
  // Session metadata
  session_id: string;
  created_at: string;
  updated_at: string;
}

export class SessionManager {
  private sessions: Map<string, SessionMemory> = new Map();

  createSession(sessionId: string): SessionMemory {
    const session: SessionMemory = {
      stage: 'qualify',
      completed_slots: [],
      missing_slots: ['goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs', 'allocations', 'currency'],
      key_facts: [],
      search_count: 0,
      search_budget_exceeded: false,
      session_id: sessionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): SessionMemory | null {
    return this.sessions.get(sessionId) || null;
  }

  updateSession(sessionId: string, updates: Partial<SessionMemory>): SessionMemory | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const updatedSession = {
      ...session,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Generate working header for model context
  getWorkingHeader(session: SessionMemory): string {
    return `
CURRENT STATE:
Stage: ${session.stage}
Completed Slots: ${session.completed_slots.join(', ') || 'none'}
Missing Slots: ${session.missing_slots.join(', ') || 'none'}
Key Facts: ${session.key_facts.join(', ') || 'none'}
Search Budget: ${session.search_count}/5 (${session.search_budget_exceeded ? 'EXCEEDED' : 'available'})
    `.trim();
  }

  // Update slot completion status
  updateSlots(session: SessionMemory, completedSlots: string[]): void {
    const allRequiredSlots = [
      'goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs',
      'allocations', 'currency'
    ];

    session.completed_slots = [...new Set([...session.completed_slots, ...completedSlots])];
    session.missing_slots = allRequiredSlots.filter(slot => !session.completed_slots.includes(slot));
  }

  // Check if ready to advance to next stage
  canAdvanceStage(session: SessionMemory): boolean {
    switch (session.stage) {
      case 'qualify':
        return true; // User engagement triggers advance
      case 'goals':
        return ['goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs']
          .every(slot => session.completed_slots.includes(slot));
      case 'portfolio':
        return ['allocations', 'currency'].every(slot => session.completed_slots.includes(slot));
      case 'analyze':
        return !!session.analysis_result;
      case 'explain':
        return true; // User acknowledgment triggers advance
      case 'cta':
        return true; // Booking or report triggers end
      default:
        return false;
    }
  }

  // Advance to next stage
  advanceStage(session: SessionMemory): Stage {
    const stageFlow: Record<Stage, Stage> = {
      'qualify': 'goals',
      'goals': 'portfolio', 
      'portfolio': 'analyze',
      'analyze': 'explain',
      'explain': 'cta',
      'cta': 'end',
      'end': 'end'
    };

    if (this.canAdvanceStage(session)) {
      session.stage = stageFlow[session.stage];
    }

    return session.stage;
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();
