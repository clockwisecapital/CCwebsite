/**
 * Supabase Database Types
 * 
 * TypeScript definitions for our Clockwise Capital database schema
 * These types ensure type safety across the application
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          user_email: string | null
          session_id: string
          created_at: string
          updated_at: string
          metadata?: Json
        }
        Insert: {
          id?: string
          user_email: string | null
          session_id: string
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_email?: string | null
          session_id?: string
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string | null
          display_spec: Json | null
          created_at: string
          seq?: number | null
          metadata?: Json
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content?: string | null
          display_spec?: Json | null
          created_at?: string
          seq?: number | null
          metadata?: Json
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string | null
          display_spec?: Json | null
          created_at?: string
          seq?: number | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      user_data: {
        Row: {
          id: string
          conversation_id: string
          goals: Json | null
          portfolio_data: Json | null
          analysis_results: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          goals?: Json | null
          portfolio_data?: Json | null
          analysis_results?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          goals?: Json | null
          portfolio_data?: Json | null
          analysis_results?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_data_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      intake_forms: {
        Row: {
          id: string
          conversation_id: string
          session_id: string
          age: number | null
          experience_level: 'Beginner' | 'Intermediate' | 'Advanced' | null
          risk_tolerance: 'low' | 'medium' | 'high' | null
          first_name: string | null
          last_name: string | null
          email: string | null
          goal_amount: number | null
          goal_description: string | null
          time_horizon: number | null
          monthly_contribution: number | null
          portfolio_total_value: number | null
          portfolio_stocks: number | null
          portfolio_bonds: number | null
          portfolio_cash: number | null
          portfolio_real_estate: number | null
          portfolio_commodities: number | null
          portfolio_alternatives: number | null
          portfolio_description: string | null
          specific_holdings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          session_id: string
          age?: number | null
          experience_level?: 'Beginner' | 'Intermediate' | 'Advanced' | null
          risk_tolerance?: 'low' | 'medium' | 'high' | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          goal_amount?: number | null
          goal_description?: string | null
          time_horizon?: number | null
          monthly_contribution?: number | null
          portfolio_total_value?: number | null
          portfolio_stocks?: number | null
          portfolio_bonds?: number | null
          portfolio_cash?: number | null
          portfolio_real_estate?: number | null
          portfolio_commodities?: number | null
          portfolio_alternatives?: number | null
          portfolio_description?: string | null
          specific_holdings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          session_id?: string
          age?: number | null
          experience_level?: 'Beginner' | 'Intermediate' | 'Advanced' | null
          risk_tolerance?: 'low' | 'medium' | 'high' | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          goal_amount?: number | null
          goal_description?: string | null
          time_horizon?: number | null
          monthly_contribution?: number | null
          portfolio_total_value?: number | null
          portfolio_stocks?: number | null
          portfolio_bonds?: number | null
          portfolio_cash?: number | null
          portfolio_real_estate?: number | null
          portfolio_commodities?: number | null
          portfolio_alternatives?: number | null
          portfolio_description?: string | null
          specific_holdings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_forms_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      tgt_price: {
        Row: {
          Ticker: string
          'Consensus Tgt Price': number | null
        }
        Insert: {
          Ticker: string
          'Consensus Tgt Price'?: number | null
        }
        Update: {
          Ticker?: string
          'Consensus Tgt Price'?: number | null
        }
        Relationships: []
      }
      holding_weights: {
        Row: {
          StockTicker: string
          SecurityName: string | null
          Shares: string | null
          Price: number | null
          MarketValue: string | null
          Weightings: string | null
        }
        Insert: {
          StockTicker: string
          SecurityName?: string | null
          Shares?: string | null
          Price?: number | null
          MarketValue?: string | null
          Weightings?: string | null
        }
        Update: {
          StockTicker?: string
          SecurityName?: string | null
          Shares?: string | null
          Price?: number | null
          MarketValue?: string | null
          Weightings?: string | null
        }
        Relationships: []
      }
      index_sector_targets: {
        Row: {
          'Ticker Index': string
          'Clockwise tgt': number | null
        }
        Insert: {
          'Ticker Index': string
          'Clockwise tgt'?: number | null
        }
        Update: {
          'Ticker Index'?: string
          'Clockwise tgt'?: number | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string
          username: string
          password_hash: string
          role: 'master' | 'advisor'
          firm_name: string | null
          display_name: string | null
          email: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          role: 'master' | 'advisor'
          firm_name?: string | null
          display_name?: string | null
          email?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          role?: 'master' | 'advisor'
          firm_name?: string | null
          display_name?: string | null
          email?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_assignments: {
        Row: {
          id: string
          conversation_id: string
          assigned_to_firm: string
          assigned_by: string
          notes: string | null
          assigned_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          assigned_to_firm: string
          assigned_by: string
          notes?: string | null
          assigned_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          assigned_to_firm?: string
          assigned_by?: string
          notes?: string | null
          assigned_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      time_portfolio_cache: {
        Row: {
          id: string
          cache_key: string
          positions: Json
          top_positions: Json
          expected_return: number
          year1_return: number
          portfolio_upside: number
          portfolio_downside: number
          portfolio_median: number
          time_horizon: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cache_key?: string
          positions: Json
          top_positions: Json
          expected_return: number
          year1_return: number
          portfolio_upside: number
          portfolio_downside: number
          portfolio_median: number
          time_horizon?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cache_key?: string
          positions?: Json
          top_positions?: Json
          expected_return?: number
          year1_return?: number
          portfolio_upside?: number
          portfolio_downside?: number
          portfolio_median?: number
          time_horizon?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      volatility_cache: {
        Row: {
          id: string
          ticker: string
          volatility: number
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticker: string
          volatility: number
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticker?: string
          volatility?: number
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      message_role: 'user' | 'assistant'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types for easier usage
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type TgtPrice = Database['public']['Tables']['tgt_price']['Row']
export type TgtPriceInsert = Database['public']['Tables']['tgt_price']['Insert']
export type TgtPriceUpdate = Database['public']['Tables']['tgt_price']['Update']

export type HoldingWeight = Database['public']['Tables']['holding_weights']['Row']
export type HoldingWeightInsert = Database['public']['Tables']['holding_weights']['Insert']
export type HoldingWeightUpdate = Database['public']['Tables']['holding_weights']['Update']

export type UserData = Database['public']['Tables']['user_data']['Row']
export type UserDataInsert = Database['public']['Tables']['user_data']['Insert']
export type UserDataUpdate = Database['public']['Tables']['user_data']['Update']

export type IntakeForm = Database['public']['Tables']['intake_forms']['Row']
export type IntakeFormInsert = Database['public']['Tables']['intake_forms']['Insert']
export type IntakeFormUpdate = Database['public']['Tables']['intake_forms']['Update']

export type IndexSectorTarget = Database['public']['Tables']['index_sector_targets']['Row']
export type IndexSectorTargetInsert = Database['public']['Tables']['index_sector_targets']['Insert']
export type IndexSectorTargetUpdate = Database['public']['Tables']['index_sector_targets']['Update']

export type AdminUser = Database['public']['Tables']['admin_users']['Row']
export type AdminUserInsert = Database['public']['Tables']['admin_users']['Insert']
export type AdminUserUpdate = Database['public']['Tables']['admin_users']['Update']

export type ClientAssignment = Database['public']['Tables']['client_assignments']['Row']
export type ClientAssignmentInsert = Database['public']['Tables']['client_assignments']['Insert']
export type ClientAssignmentUpdate = Database['public']['Tables']['client_assignments']['Update']

// Application-specific types
export interface SessionData {
  goals?: {
    goal_type?: 'growth' | 'income' | 'both'
    target_amount?: number
    timeline_years?: number
  }
  portfolio?: {
    portfolio_value?: number
    holdings?: Array<{ name: string; value: number }>
    new_investor?: boolean
  }
  analysis?: {
    beta?: number
    volatility?: number
    risk_score?: number
    recommendations?: string[]
  }
}

export interface DisplaySpec {
  blocks: DisplayBlock[]
  meta?: {
    timestamp?: string
    sources_count?: number
    cost_estimate?: number
    version?: string
  }
}

export interface DisplayBlock {
  type: 'summary_bullets' | 'stat_group' | 'table' | 'chart' | 'sources' | 'cta_group' | 'conversation_text'
  content: string
}
