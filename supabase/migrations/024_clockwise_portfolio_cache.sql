-- =====================================================================================
-- Clockwise Portfolio Cycle Cache
-- =====================================================================================
-- Pre-computed scores for Clockwise standard portfolios against historical analogs
-- Eliminates need to re-compute fixed allocation portfolios on every test
-- 
-- Cache Strategy:
-- - 4 Clockwise portfolios (Max Growth, Growth, Moderate, Max Income)
-- - 4 Historical analogs (COVID_CRASH, DOT_COM_BUST, RATE_SHOCK, STAGFLATION)
-- - Total: 16 cached combinations
-- =====================================================================================

CREATE TABLE IF NOT EXISTS clockwise_portfolio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Portfolio identification
  portfolio_id VARCHAR(50) NOT NULL,
  portfolio_name VARCHAR(100) NOT NULL,
  
  -- Economic cycle (historical analog)
  analog_id VARCHAR(50) NOT NULL,
  analog_name VARCHAR(100) NOT NULL,
  analog_period VARCHAR(100) NOT NULL,
  
  -- Scoring results
  score DECIMAL(5,2) NOT NULL,
  label VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  
  -- Performance metrics
  portfolio_return DECIMAL(8,6) NOT NULL,
  benchmark_return DECIMAL(8,6) NOT NULL,
  outperformance DECIMAL(8,6) NOT NULL,
  portfolio_drawdown DECIMAL(8,6) NOT NULL,
  benchmark_drawdown DECIMAL(8,6) NOT NULL,
  return_score DECIMAL(5,2) NOT NULL,
  drawdown_score DECIMAL(5,2) NOT NULL,
  
  -- Monte Carlo estimates
  estimated_upside DECIMAL(8,6),
  estimated_downside DECIMAL(8,6),
  
  -- Scenario metadata
  scenario_id VARCHAR(50),
  scenario_name VARCHAR(100),
  
  -- Holdings snapshot (for reference)
  holdings JSONB NOT NULL,
  
  -- Cache management
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique portfolio-analog-version combinations
  UNIQUE(portfolio_id, analog_id, version)
);

-- =====================================================================================
-- Indexes for fast lookups
-- =====================================================================================

-- Primary lookup: Get all portfolios for a specific analog
CREATE INDEX idx_clockwise_cache_analog 
ON clockwise_portfolio_cache(analog_id, version) 
WHERE version = 1;  -- Partial index on current version only

-- Lookup by portfolio
CREATE INDEX idx_clockwise_cache_portfolio 
ON clockwise_portfolio_cache(portfolio_id, version);

-- Composite lookup for specific portfolio-analog combo
CREATE INDEX idx_clockwise_cache_combo 
ON clockwise_portfolio_cache(portfolio_id, analog_id, version);

-- Version management
CREATE INDEX idx_clockwise_cache_version 
ON clockwise_portfolio_cache(version);

-- =====================================================================================
-- Helper Functions
-- =====================================================================================

-- Function to get current cache version
CREATE OR REPLACE FUNCTION get_current_cache_version()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(version) FROM clockwise_portfolio_cache),
    1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get cache for a specific analog
CREATE OR REPLACE FUNCTION get_cached_clockwise_scores(
  p_analog_id VARCHAR(50),
  p_version INTEGER DEFAULT NULL
)
RETURNS TABLE (
  portfolio_id VARCHAR(50),
  portfolio_name VARCHAR(100),
  score DECIMAL(5,2),
  portfolio_return DECIMAL(8,6),
  portfolio_drawdown DECIMAL(8,6),
  estimated_upside DECIMAL(8,6),
  estimated_downside DECIMAL(8,6),
  holdings JSONB,
  label VARCHAR(50),
  color VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.portfolio_id,
    c.portfolio_name,
    c.score,
    c.portfolio_return,
    c.portfolio_drawdown,
    c.estimated_upside,
    c.estimated_downside,
    c.holdings,
    c.label,
    c.color
  FROM clockwise_portfolio_cache c
  WHERE c.analog_id = p_analog_id
    AND c.version = COALESCE(p_version, get_current_cache_version())
  ORDER BY c.score DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- Cache Statistics View
-- =====================================================================================

CREATE OR REPLACE VIEW clockwise_cache_stats AS
SELECT 
  version,
  COUNT(*) as total_entries,
  COUNT(DISTINCT analog_id) as unique_analogs,
  COUNT(DISTINCT portfolio_id) as unique_portfolios,
  MIN(created_at) as first_entry,
  MAX(updated_at) as last_update,
  ROUND(AVG(score), 2) as avg_score
FROM clockwise_portfolio_cache
GROUP BY version
ORDER BY version DESC;

-- =====================================================================================
-- Row Level Security (RLS)
-- =====================================================================================

-- Enable RLS
ALTER TABLE clockwise_portfolio_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cache is reference data)
CREATE POLICY "Cache is readable by everyone" 
ON clockwise_portfolio_cache
FOR SELECT 
USING (true);

-- Allow authenticated users to write (for cache generation script)
-- In production, you may want to restrict this further
CREATE POLICY "Cache is writable by authenticated users" 
ON clockwise_portfolio_cache
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- =====================================================================================
-- Triggers
-- =====================================================================================

-- Update timestamp on modification
CREATE OR REPLACE FUNCTION update_clockwise_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clockwise_cache_timestamp
BEFORE UPDATE ON clockwise_portfolio_cache
FOR EACH ROW
EXECUTE FUNCTION update_clockwise_cache_timestamp();

-- =====================================================================================
-- Initial Data Check
-- =====================================================================================

-- Grant permissions
GRANT SELECT ON clockwise_portfolio_cache TO anon, authenticated;
GRANT SELECT ON clockwise_cache_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cached_clockwise_scores TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_current_cache_version TO anon, authenticated;

-- Add helpful comment
COMMENT ON TABLE clockwise_portfolio_cache IS 
'Pre-computed scores for Clockwise standard portfolios across historical economic cycles. Provides instant lookups instead of re-computing fixed allocation portfolios on every scenario test.';
