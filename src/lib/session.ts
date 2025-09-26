// Session memory management for FSM state and slot tracking

export type Stage = 'qualify' | 'goals' | 'amount_timeline' | 'portfolio' | 'email_capture' | 'analyze' | 'explain' | 'cta' | 'end';

export interface SessionMemory {
  // Working header (sent every turn)
  stage: Stage;
  completed_slots: string[];
  missing_slots: string[];
  key_facts: string[];
  
  // Session data (server side)
  user_email?: string;
  simplified_goals?: {
    goal_type?: 'growth' | 'income' | 'both';
    target_amount?: number;
    timeline_years?: number;
  };
  simplified_portfolio?: {
    portfolio_value?: number;
    holdings?: Array<{ name: string; value: number; }>;
    new_investor?: boolean;
  };
  goals?: {
    goal_type?: 'growth' | 'income' | 'balanced' | 'preservation' | 'lump_sum';
    goal_amount?: number;
    horizon_years?: number;
    risk_tolerance?: 'low' | 'medium' | 'high';
    liquidity_needs?: 'low' | 'medium' | 'high';
    target_return?: number;
  };
  portfolio?: {
    allocations?: Record<string, number>;
    currency?: string;
    new_investor?: boolean;
    optional_offered?: boolean;
    top_positions?: Array<{ name: string; percentage: number }>;
    sector_exposure?: Array<{ sector: string; percentage: number }>;
  };
  analysis_result?: Record<string, unknown>;
  charts_meta?: Record<string, unknown>;
  research_sources?: Array<{
    title: string;
    url: string;
    publisher?: string;
    asOf?: string;
  }>;
  
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

  // Generate truly unique session ID to prevent collisions
  generateUniqueSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const uuid = crypto.randomUUID ? crypto.randomUUID() : `fallback-${Math.random()}`;
    return `session-${timestamp}-${random}-${uuid}`;
  }

  createSession(sessionId?: string): SessionMemory {
    // Generate unique ID if not provided or if collision detected
    const finalSessionId = sessionId && !this.sessions.has(sessionId) 
      ? sessionId 
      : this.generateUniqueSessionId();
    
    console.log('🆕 Creating new session:', finalSessionId);
    
    // Clean up expired sessions before creating new one
    this.cleanupExpiredSessions();
    
    const session: SessionMemory = {
      stage: 'qualify',
      completed_slots: [],
      missing_slots: ['goal_type', 'goal_amount', 'horizon_years', 'risk_tolerance', 'liquidity_needs', 'allocations', 'currency'],
      key_facts: [],
      search_count: 0,
      search_budget_exceeded: false,
      session_id: finalSessionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.sessions.set(finalSessionId, session);
    console.log('✅ Session created successfully. Total sessions:', this.sessions.size);
    return session;
  }

  getSession(sessionId: string): SessionMemory | null {
    const session = this.sessions.get(sessionId) || null;
    
    if (session) {
      // Check for session expiry
      if (this.isSessionExpired(session)) {
        console.log('⏰ Session expired, removing:', sessionId);
        this.sessions.delete(sessionId);
        return null;
      }
      
      // Log session retrieval for debugging
      console.log('📖 Retrieved session:', sessionId, '- Stage:', session.stage, '- Slots:', session.completed_slots.length);
    }
    
    return session;
  }

  // Create a completely fresh session (for contamination recovery)
  createFreshSession(): SessionMemory {
    const uniqueId = this.generateUniqueSessionId();
    console.log('🔄 Creating fresh session after contamination detection:', uniqueId);
    return this.createSession(uniqueId);
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
    console.log('🗑️ Clearing session:', sessionId);
    this.sessions.delete(sessionId);
    console.log('📊 Total sessions remaining:', this.sessions.size);
  }

  // Check if session is expired (24 hours)
  private isSessionExpired(session: SessionMemory): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    return sessionAge > maxAge;
  }

  // Clean up expired sessions to prevent memory leaks
  cleanupExpiredSessions(): void {
    const beforeCount = this.sessions.size;
    let expiredCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (this.isSessionExpired(session)) {
        this.sessions.delete(sessionId);
        expiredCount++;
        console.log('🧹 Expired session removed:', sessionId);
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 Cleanup complete: ${expiredCount} expired sessions removed. ${beforeCount} → ${this.sessions.size}`);
    }
  }

  // Force clear all sessions (for testing/debugging)
  clearAllSessions(): void {
    const count = this.sessions.size;
    this.sessions.clear();
    console.log(`🧹 Force cleared all ${count} sessions`);
  }

  // Get session count for monitoring
  getSessionCount(): number {
    return this.sessions.size;
  }

  // List all active session IDs (for debugging)
  getActiveSessionIds(): string[] {
    return Array.from(this.sessions.keys());
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
      'goals': 'amount_timeline',
      'amount_timeline': 'portfolio',
      'portfolio': 'email_capture',
      'email_capture': 'analyze',
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
