-- =====================================================================================
-- Enable RLS on Reference/Cache Tables
-- =====================================================================================
-- Migration to address Supabase security warnings by enabling Row Level Security
-- on reference and cache tables that were missing RLS policies.
--
-- All these tables are accessed via service role (which bypasses RLS) or are 
-- unused, so enabling RLS will not break existing functionality.
-- =====================================================================================

-- =====================================================================================
-- 1. TICKER_CLASSIFICATIONS
-- =====================================================================================
-- AI-powered ticker to asset class classifications cache
-- Currently accessed via service role only (createAdminSupabaseClient)

ALTER TABLE ticker_classifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access (reference data)
CREATE POLICY "Ticker classifications are readable by everyone" 
ON ticker_classifications
FOR SELECT 
USING (true);

-- Allow authenticated users and service role to write (for cache updates)
CREATE POLICY "Ticker classifications are writable by authenticated users" 
ON ticker_classifications
FOR ALL 
USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE ticker_classifications IS 
'AI-powered ticker to asset class classifications with caching. Accessed via service role.';

-- =====================================================================================
-- 2. QUESTION_SP500_BENCHMARKS
-- =====================================================================================
-- S&P 500 benchmark test results for scenario questions
-- Table exists but is currently unused (dead code in runSP500BenchmarkTest function)

ALTER TABLE question_sp500_benchmarks ENABLE ROW LEVEL SECURITY;

-- Allow public read access (benchmark data)
CREATE POLICY "SP500 benchmarks are readable by everyone"
ON question_sp500_benchmarks
FOR SELECT 
USING (true);

-- Allow authenticated users to write benchmark results
CREATE POLICY "SP500 benchmarks are writable by authenticated users"
ON question_sp500_benchmarks
FOR ALL 
USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE question_sp500_benchmarks IS 
'S&P 500 benchmark test results for scenario questions. Public read, authenticated write.';

-- =====================================================================================
-- 3. INDEX_SCENARIO_RETURNS
-- =====================================================================================
-- Historical index scenario returns (bull/expected/bear forecasts)
-- Currently accessed via service role only (createAdminSupabaseClient)
-- Note: This table was created manually, not via migration

ALTER TABLE index_scenario_returns ENABLE ROW LEVEL SECURITY;

-- Allow public read access (reference data)
CREATE POLICY "Index scenario returns are readable by everyone"
ON index_scenario_returns
FOR SELECT 
USING (true);

-- Allow authenticated users and service role to write (for data updates)
CREATE POLICY "Index scenario returns are writable by authenticated users"
ON index_scenario_returns
FOR ALL 
USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE index_scenario_returns IS 
'Historical index scenario returns for portfolio analysis. Accessed via service role.';

-- =====================================================================================
-- GRANTS
-- =====================================================================================

-- Grant read access to all users (anon and authenticated)
GRANT SELECT ON ticker_classifications TO anon, authenticated;
GRANT SELECT ON question_sp500_benchmarks TO anon, authenticated;
GRANT SELECT ON index_scenario_returns TO anon, authenticated;

-- =====================================================================================
-- VERIFICATION
-- =====================================================================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 028 complete: RLS enabled on ticker_classifications, question_sp500_benchmarks, and index_scenario_returns';
END $$;
