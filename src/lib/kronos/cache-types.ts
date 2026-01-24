/**
 * Clockwise Portfolio Cache Types
 * 
 * Types for pre-computed portfolio scores against historical economic cycles
 */

// JSON type compatible with Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface CachedPortfolioScore {
  id?: string;
  portfolio_id: string;
  portfolio_name: string;
  analog_id: string;
  analog_name: string;
  analog_period: string;
  
  // Scoring results
  score: number;
  label: string;
  color: string;
  
  // Performance metrics
  portfolio_return: number;
  benchmark_return: number;
  outperformance: number;
  portfolio_drawdown: number;
  benchmark_drawdown: number;
  return_score: number;
  drawdown_score: number;
  
  // Monte Carlo estimates
  estimated_upside?: number | null;
  estimated_downside?: number | null;
  
  // Scenario metadata
  scenario_id?: string | null;
  scenario_name?: string | null;
  
  // Holdings snapshot (stored as JSON in database)
  holdings: Json;
  
  // Cache management
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface CacheInsertData {
  portfolio_id: string;
  portfolio_name: string;
  analog_id: string;
  analog_name: string;
  analog_period: string;
  score: number;
  label: string;
  color: string;
  portfolio_return: number;
  benchmark_return: number;
  outperformance: number;
  portfolio_drawdown: number;
  benchmark_drawdown: number;
  return_score: number;
  drawdown_score: number;
  estimated_upside?: number | null;
  estimated_downside?: number | null;
  scenario_id?: string | null;
  scenario_name?: string | null;
  holdings: Json;
  version: number;
}

export interface CacheLookupResult {
  found: boolean;
  portfolios: CachedPortfolioScore[];
  version: number;
  source: 'database' | 'computed';
}

export interface CacheStats {
  version: number | null;
  total_entries: number | null;
  unique_analogs: number | null;
  unique_portfolios: number | null;
  first_entry: string | null;
  last_update: string | null;
  avg_score: number | null;
}
