/**
 * Clockwise Portfolio Cache Types
 * 
 * Types for pre-computed portfolio scores against historical economic cycles
 */

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
  estimated_upside?: number;
  estimated_downside?: number;
  
  // Scenario metadata
  scenario_id?: string;
  scenario_name?: string;
  
  // Holdings snapshot
  holdings: Array<{
    ticker: string;
    weight: number;
    assetClass: string;
  }>;
  
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
  estimated_upside?: number;
  estimated_downside?: number;
  scenario_id?: string;
  scenario_name?: string;
  holdings: Array<{
    ticker: string;
    weight: number;
    assetClass: string;
  }>;
  version: number;
}

export interface CacheLookupResult {
  found: boolean;
  portfolios: CachedPortfolioScore[];
  version: number;
  source: 'database' | 'computed';
}

export interface CacheStats {
  version: number;
  total_entries: number;
  unique_analogs: number;
  unique_portfolios: number;
  first_entry: string;
  last_update: string;
  avg_score: number;
}
