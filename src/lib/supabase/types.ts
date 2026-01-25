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
      ticker_classifications: {
        Row: {
          ticker: string
          asset_class: string
          confidence: number
          reasoning: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          ticker: string
          asset_class: string
          confidence: number
          reasoning?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          ticker?: string
          asset_class?: string
          confidence?: number
          reasoning?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
      clockwise_portfolios: {
        Row: {
          id: string
          name: string
          return_3y: number | null
          std_dev: number | null
          alpha: number | null
          beta: number | null
          sharpe_ratio: number | null
          max_drawdown: number | null
          up_capture: number | null
          down_capture: number | null
          is_benchmark: boolean
          updated_at: string | null
          updated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          return_3y?: number | null
          std_dev?: number | null
          alpha?: number | null
          beta?: number | null
          sharpe_ratio?: number | null
          max_drawdown?: number | null
          up_capture?: number | null
          down_capture?: number | null
          is_benchmark?: boolean
          updated_at?: string | null
          updated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          return_3y?: number | null
          std_dev?: number | null
          alpha?: number | null
          beta?: number | null
          sharpe_ratio?: number | null
          max_drawdown?: number | null
          up_capture?: number | null
          down_capture?: number | null
          is_benchmark?: boolean
          updated_at?: string | null
          updated_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      clockwise_portfolio_daily_values: {
        Row: {
          id: string
          as_of_date: string
          data: Json
          uploaded_at: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          as_of_date: string
          data: Json
          uploaded_at?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          as_of_date?: string
          data?: Json
          uploaded_at?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clockwise_portfolio_periods: {
        Row: {
          id: string
          portfolio_name: string
          period_name: string
          start_date: string
          end_date: string
          portfolio_return: number | null
          benchmark_return: number | null
          excess_return: number | null
          portfolio_std_dev: number | null
          portfolio_alpha: number | null
          portfolio_beta: number | null
          portfolio_sharpe_ratio: number | null
          portfolio_max_drawdown: number | null
          portfolio_up_capture: number | null
          portfolio_down_capture: number | null
          benchmark_std_dev: number | null
          benchmark_sharpe_ratio: number | null
          benchmark_max_drawdown: number | null
          risk_free_rate: number | null
          num_months: number | null
          as_of_date: string | null
          data_start_date: string | null
          data_end_date: string | null
          generated_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_name: string
          period_name: string
          start_date: string
          end_date: string
          portfolio_return?: number | null
          benchmark_return?: number | null
          excess_return?: number | null
          portfolio_std_dev?: number | null
          portfolio_alpha?: number | null
          portfolio_beta?: number | null
          portfolio_sharpe_ratio?: number | null
          portfolio_max_drawdown?: number | null
          portfolio_up_capture?: number | null
          portfolio_down_capture?: number | null
          benchmark_std_dev?: number | null
          benchmark_sharpe_ratio?: number | null
          benchmark_max_drawdown?: number | null
          risk_free_rate?: number | null
          num_months?: number | null
          as_of_date?: string | null
          data_start_date?: string | null
          data_end_date?: string | null
          generated_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_name?: string
          period_name?: string
          start_date?: string
          end_date?: string
          portfolio_return?: number | null
          benchmark_return?: number | null
          excess_return?: number | null
          portfolio_std_dev?: number | null
          portfolio_alpha?: number | null
          portfolio_beta?: number | null
          portfolio_sharpe_ratio?: number | null
          portfolio_max_drawdown?: number | null
          portfolio_up_capture?: number | null
          portfolio_down_capture?: number | null
          benchmark_std_dev?: number | null
          benchmark_sharpe_ratio?: number | null
          benchmark_max_drawdown?: number | null
          risk_free_rate?: number | null
          num_months?: number | null
          as_of_date?: string | null
          data_start_date?: string | null
          data_end_date?: string | null
          generated_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
          last_login: string | null
          preferences: Json | null
          metadata: Json | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
          preferences?: Json | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
          last_login?: string | null
          preferences?: Json | null
          metadata?: Json | null
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          id: string
          user_id: string | null
          conversation_id: string | null
          name: string
          description: string | null
          portfolio_data: Json
          intake_data: Json
          analysis_results: Json | null
          portfolio_score: number | null
          goal_probability: number | null
          risk_score: number | null
          cycle_score: number | null
          is_public: boolean
          created_at: string
          updated_at: string
          tested_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          conversation_id?: string | null
          name?: string
          description?: string | null
          portfolio_data: Json
          intake_data: Json
          analysis_results?: Json | null
          portfolio_score?: number | null
          goal_probability?: number | null
          risk_score?: number | null
          cycle_score?: number | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
          tested_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          conversation_id?: string | null
          name?: string
          description?: string | null
          portfolio_data?: Json
          intake_data?: Json
          analysis_results?: Json | null
          portfolio_score?: number | null
          goal_probability?: number | null
          risk_score?: number | null
          cycle_score?: number | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
          tested_at?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      portfolio_rankings: {
        Row: {
          id: string
          portfolio_id: string
          rank: number | null
          score: number
          period: string
          category: string | null
          calculated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          rank?: number | null
          score: number
          period: string
          category?: string | null
          calculated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          rank?: number | null
          score?: number
          period?: string
          category?: string | null
          calculated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_rankings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          }
        ]
      }
      scenario_questions: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          question_text: string
          historical_period: Json
          tags: string[]
          likes_count: number
          comments_count: number
          tests_count: number
          views_count: number
          is_active: boolean
          is_featured: boolean
          is_pinned: boolean
          created_at: string
          updated_at: string
          last_activity_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          question_text: string
          historical_period?: Json
          tags?: string[]
          likes_count?: number
          comments_count?: number
          tests_count?: number
          views_count?: number
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
          last_activity_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          question_text?: string
          historical_period?: Json
          tags?: string[]
          likes_count?: number
          comments_count?: number
          tests_count?: number
          views_count?: number
          is_active?: boolean
          is_featured?: boolean
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
          last_activity_at?: string
          metadata?: Json
        }
        Relationships: []
      }
      question_likes: {
        Row: {
          id: string
          question_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_likes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "scenario_questions"
            referencedColumns: ["id"]
          }
        ]
      }
      question_comments: {
        Row: {
          id: string
          question_id: string
          user_id: string
          parent_comment_id: string | null
          content: string
          likes_count: number
          is_edited: boolean
          is_deleted: boolean
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          question_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          likes_count?: number
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          question_id?: string
          user_id?: string
          parent_comment_id?: string | null
          content?: string
          likes_count?: number
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "question_comments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "scenario_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "question_comments"
            referencedColumns: ["id"]
          }
        ]
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "question_comments"
            referencedColumns: ["id"]
          }
        ]
      }
      question_tests: {
        Row: {
          id: string
          question_id: string
          portfolio_id: string
          user_id: string
          score: number
          expected_return: number
          upside: number
          downside: number
          comparison_data: Json
          is_public: boolean
          created_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          question_id: string
          portfolio_id: string
          user_id: string
          score: number
          expected_return: number
          upside: number
          downside: number
          comparison_data?: Json
          is_public?: boolean
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          question_id?: string
          portfolio_id?: string
          user_id?: string
          score?: number
          expected_return?: number
          upside?: number
          downside?: number
          comparison_data?: Json
          is_public?: boolean
          created_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "question_tests_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "scenario_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_tests_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          }
        ]
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      clockwise_portfolio_cache: {
        Row: {
          id: string
          portfolio_id: string
          portfolio_name: string
          analog_id: string
          analog_name: string
          analog_period: string
          score: number
          label: string
          color: string
          portfolio_return: number
          benchmark_return: number
          outperformance: number
          portfolio_drawdown: number
          benchmark_drawdown: number
          return_score: number
          drawdown_score: number
          estimated_upside: number | null
          estimated_downside: number | null
          scenario_id: string | null
          scenario_name: string | null
          holdings: Json
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          portfolio_name: string
          analog_id: string
          analog_name: string
          analog_period: string
          score: number
          label: string
          color: string
          portfolio_return: number
          benchmark_return: number
          outperformance: number
          portfolio_drawdown: number
          benchmark_drawdown: number
          return_score: number
          drawdown_score: number
          estimated_upside?: number | null
          estimated_downside?: number | null
          scenario_id?: string | null
          scenario_name?: string | null
          holdings: Json
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          portfolio_name?: string
          analog_id?: string
          analog_name?: string
          analog_period?: string
          score?: number
          label?: string
          color?: string
          portfolio_return?: number
          benchmark_return?: number
          outperformance?: number
          portfolio_drawdown?: number
          benchmark_drawdown?: number
          return_score?: number
          drawdown_score?: number
          estimated_upside?: number | null
          estimated_downside?: number | null
          scenario_id?: string | null
          scenario_name?: string | null
          holdings?: Json
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_portfolio_analog_cache: {
        Row: {
          id: string
          analog_id: string
          analog_name: string
          analog_period: string
          holdings: Json
          holdings_date: string
          score: number
          label: string
          color: string
          portfolio_return: number
          benchmark_return: number
          outperformance: number
          portfolio_drawdown: number
          benchmark_drawdown: number
          return_score: number
          drawdown_score: number
          scenario_id: string | null
          scenario_name: string | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          analog_id: string
          analog_name: string
          analog_period: string
          holdings: Json
          holdings_date?: string
          score: number
          label: string
          color: string
          portfolio_return: number
          benchmark_return: number
          outperformance: number
          portfolio_drawdown: number
          benchmark_drawdown: number
          return_score: number
          drawdown_score: number
          scenario_id?: string | null
          scenario_name?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          analog_id?: string
          analog_name?: string
          analog_period?: string
          holdings?: Json
          holdings_date?: string
          score?: number
          label?: string
          color?: string
          portfolio_return?: number
          benchmark_return?: number
          outperformance?: number
          portfolio_drawdown?: number
          benchmark_drawdown?: number
          return_score?: number
          drawdown_score?: number
          scenario_id?: string | null
          scenario_name?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_returns_cache: {
        Row: {
          id: string
          analog_id: string
          asset_class: string
          start_date: string
          end_date: string
          return_value: number
          source: string
          etf_ticker: string | null
          is_validated: boolean
          validation_date: string | null
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          analog_id: string
          asset_class: string
          start_date: string
          end_date: string
          return_value: number
          source?: string
          etf_ticker?: string | null
          is_validated?: boolean
          validation_date?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          analog_id?: string
          asset_class?: string
          start_date?: string
          end_date?: string
          return_value?: number
          source?: string
          etf_ticker?: string | null
          is_validated?: boolean
          validation_date?: string | null
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      core_portfolios_cache: {
        Row: {
          id: string
          portfolio_id: string
          portfolio_name: string
          description: string | null
          risk_level: string
          allocations: Json
          expected_return: number
          expected_best_year: number
          expected_worst_year: number
          upside: number
          downside: number
          volatility: number
          asset_allocation: Json | null
          top_positions: Json | null
          kronos_data: Json | null
          time_horizon: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          portfolio_name: string
          description?: string | null
          risk_level: string
          allocations: Json
          expected_return: number
          expected_best_year: number
          expected_worst_year: number
          upside: number
          downside: number
          volatility: number
          asset_allocation?: Json | null
          top_positions?: Json | null
          kronos_data?: Json | null
          time_horizon?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          portfolio_name?: string
          description?: string | null
          risk_level?: string
          allocations?: Json
          expected_return?: number
          expected_best_year?: number
          expected_worst_year?: number
          upside?: number
          downside?: number
          volatility?: number
          asset_allocation?: Json | null
          top_positions?: Json | null
          kronos_data?: Json | null
          time_horizon?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      clockwise_cache_stats: {
        Row: {
          version: number | null
          total_entries: number | null
          unique_analogs: number | null
          unique_portfolios: number | null
          first_entry: string | null
          last_update: string | null
          avg_score: number | null
        }
        Relationships: []
      }
      time_analog_cache_stats: {
        Row: {
          version: number | null
          total_entries: number | null
          unique_analogs: number | null
          avg_score: number | null
          first_entry: string | null
          last_update: string | null
          latest_holdings_date: string | null
        }
        Relationships: []
      }
      asset_returns_cache_stats: {
        Row: {
          version: number | null
          total_entries: number | null
          unique_analogs: number | null
          unique_asset_classes: number | null
          yahoo_entries: number | null
          verified_entries: number | null
          validated_entries: number | null
          first_entry: string | null
          last_update: string | null
        }
        Relationships: []
      }
      core_portfolios_cache_stats: {
        Row: {
          total_portfolios: number | null
          unique_risk_levels: number | null
          avg_expected_return_pct: number | null
          oldest_cache: string | null
          newest_cache: string | null
          oldest_age_hours: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      link_conversation_to_user: {
        Args: {
          p_conversation_id: string
          p_user_id: string
          p_email: string
        }
        Returns: boolean
      }
      get_current_cache_version: {
        Args: Record<string, never>
        Returns: number
      }
      get_cached_clockwise_scores: {
        Args: {
          p_analog_id: string
          p_version?: number | null
        }
        Returns: Array<{
          portfolio_id: string
          portfolio_name: string
          score: number
          portfolio_return: number
          portfolio_drawdown: number
          estimated_upside: number | null
          estimated_downside: number | null
          holdings: Json
          label: string
          color: string
        }>
      }
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

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Portfolio = Database['public']['Tables']['portfolios']['Row']
export type PortfolioInsert = Database['public']['Tables']['portfolios']['Insert']
export type PortfolioUpdate = Database['public']['Tables']['portfolios']['Update']

export type PortfolioRanking = Database['public']['Tables']['portfolio_rankings']['Row']
export type PortfolioRankingInsert = Database['public']['Tables']['portfolio_rankings']['Insert']
export type PortfolioRankingUpdate = Database['public']['Tables']['portfolio_rankings']['Update']

export type ScenarioQuestion = Database['public']['Tables']['scenario_questions']['Row']
export type ScenarioQuestionInsert = Database['public']['Tables']['scenario_questions']['Insert']
export type ScenarioQuestionUpdate = Database['public']['Tables']['scenario_questions']['Update']

export type QuestionLike = Database['public']['Tables']['question_likes']['Row']
export type QuestionLikeInsert = Database['public']['Tables']['question_likes']['Insert']
export type QuestionLikeUpdate = Database['public']['Tables']['question_likes']['Update']

export type QuestionComment = Database['public']['Tables']['question_comments']['Row']
export type QuestionCommentInsert = Database['public']['Tables']['question_comments']['Insert']
export type QuestionCommentUpdate = Database['public']['Tables']['question_comments']['Update']

export type CommentLike = Database['public']['Tables']['comment_likes']['Row']
export type CommentLikeInsert = Database['public']['Tables']['comment_likes']['Insert']
export type CommentLikeUpdate = Database['public']['Tables']['comment_likes']['Update']

export type QuestionTest = Database['public']['Tables']['question_tests']['Row']
export type QuestionTestInsert = Database['public']['Tables']['question_tests']['Insert']
export type QuestionTestUpdate = Database['public']['Tables']['question_tests']['Update']

export type UserFollow = Database['public']['Tables']['user_follows']['Row']
export type UserFollowInsert = Database['public']['Tables']['user_follows']['Insert']
export type UserFollowUpdate = Database['public']['Tables']['user_follows']['Update']

export type ClockwisePortfolioCache = Database['public']['Tables']['clockwise_portfolio_cache']['Row']
export type ClockwisePortfolioCacheInsert = Database['public']['Tables']['clockwise_portfolio_cache']['Insert']
export type ClockwisePortfolioCacheUpdate = Database['public']['Tables']['clockwise_portfolio_cache']['Update']

export type TimePortfolioAnalogCache = Database['public']['Tables']['time_portfolio_analog_cache']['Row']
export type TimePortfolioAnalogCacheInsert = Database['public']['Tables']['time_portfolio_analog_cache']['Insert']
export type TimePortfolioAnalogCacheUpdate = Database['public']['Tables']['time_portfolio_analog_cache']['Update']

export type AssetReturnsCache = Database['public']['Tables']['asset_returns_cache']['Row']
export type AssetReturnsCacheInsert = Database['public']['Tables']['asset_returns_cache']['Insert']
export type AssetReturnsCacheUpdate = Database['public']['Tables']['asset_returns_cache']['Update']

export type CorePortfoliosCache = Database['public']['Tables']['core_portfolios_cache']['Row']
export type CorePortfoliosCacheInsert = Database['public']['Tables']['core_portfolios_cache']['Insert']
export type CorePortfoliosCacheUpdate = Database['public']['Tables']['core_portfolios_cache']['Update']

export type ClockwiseCacheStats = Database['public']['Views']['clockwise_cache_stats']['Row']
export type TimeAnalogCacheStats = Database['public']['Views']['time_analog_cache_stats']['Row']
export type AssetReturnsCacheStats = Database['public']['Views']['asset_returns_cache_stats']['Row']
export type CorePortfoliosCacheStats = Database['public']['Views']['core_portfolios_cache_stats']['Row']

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
