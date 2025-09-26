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

export type UserData = Database['public']['Tables']['user_data']['Row']
export type UserDataInsert = Database['public']['Tables']['user_data']['Insert']
export type UserDataUpdate = Database['public']['Tables']['user_data']['Update']

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
