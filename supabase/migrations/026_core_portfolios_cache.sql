-- =====================================================================================
-- Core Portfolios Cache System
-- =====================================================================================
-- Persistent caching for Clockwise Core Portfolio analysis results
-- (Max Growth, Growth, Moderate, Max Income)
-- 
-- Performance Impact:
-- - Core portfolio analysis: 8-12s → 0.2s per request
-- - Cache TTL: 24 hours (portfolios don't change frequently)
-- =====================================================================================

-- =====================================================================================
-- CORE PORTFOLIOS CACHE TABLE
-- =====================================================================================
-- Stores pre-computed analysis results for each Core Portfolio
-- Must be regenerated when portfolio allocations change

CREATE TABLE IF NOT EXISTS core_portfolios_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Portfolio identification
  portfolio_id VARCHAR(50) NOT NULL UNIQUE,
  portfolio_name VARCHAR(100) NOT NULL,
  
  -- Portfolio configuration
  description TEXT,
  risk_level VARCHAR(50) NOT NULL,
  allocations JSONB NOT NULL,
  
  -- Analysis results from Kronos
  expected_return DECIMAL(10,6) NOT NULL,
  expected_best_year DECIMAL(10,6) NOT NULL,
  expected_worst_year DECIMAL(10,6) NOT NULL,
  upside DECIMAL(10,6) NOT NULL,
  downside DECIMAL(10,6) NOT NULL,
  volatility DECIMAL(10,6) NOT NULL,
  
  -- Asset allocation breakdown for display
  asset_allocation JSONB,
  
  -- Top positions for the portfolio
  top_positions JSONB,
  
  -- Kronos metadata
  kronos_data JSONB,
  
  -- Time horizon used for analysis
  time_horizon INTEGER NOT NULL DEFAULT 1, -- in years
  
  -- Cache management
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- INDEXES
-- =====================================================================================

-- Fast lookups by portfolio_id
CREATE INDEX idx_core_portfolios_cache_portfolio_id 
ON core_portfolios_cache(portfolio_id);

-- Check cache freshness
CREATE INDEX idx_core_portfolios_cache_updated 
ON core_portfolios_cache(updated_at);

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

-- Update timestamp on modification
CREATE OR REPLACE FUNCTION update_core_portfolios_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_core_portfolios_cache_timestamp
BEFORE UPDATE ON core_portfolios_cache
FOR EACH ROW
EXECUTE FUNCTION update_core_portfolios_cache_timestamp();

-- =====================================================================================
-- HELPER FUNCTIONS
-- =====================================================================================

-- Function to get all cached core portfolios
CREATE OR REPLACE FUNCTION get_all_cached_core_portfolios()
RETURNS TABLE (
  portfolio_id VARCHAR(50),
  portfolio_name VARCHAR(100),
  description TEXT,
  risk_level VARCHAR(50),
  expected_return DECIMAL(10,6),
  expected_best_year DECIMAL(10,6),
  expected_worst_year DECIMAL(10,6),
  volatility DECIMAL(10,6),
  asset_allocation JSONB,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.portfolio_id,
    c.portfolio_name,
    c.description,
    c.risk_level,
    c.expected_return,
    c.expected_best_year,
    c.expected_worst_year,
    c.volatility,
    c.asset_allocation,
    c.updated_at
  FROM core_portfolios_cache c
  ORDER BY 
    CASE c.risk_level 
      WHEN 'aggressive' THEN 1
      WHEN 'growth' THEN 2
      WHEN 'moderate' THEN 3
      WHEN 'conservative' THEN 4
      ELSE 5
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to get a specific cached core portfolio
CREATE OR REPLACE FUNCTION get_cached_core_portfolio(
  p_portfolio_id VARCHAR(50)
)
RETURNS TABLE (
  portfolio_id VARCHAR(50),
  portfolio_name VARCHAR(100),
  description TEXT,
  risk_level VARCHAR(50),
  allocations JSONB,
  expected_return DECIMAL(10,6),
  expected_best_year DECIMAL(10,6),
  expected_worst_year DECIMAL(10,6),
  upside DECIMAL(10,6),
  downside DECIMAL(10,6),
  volatility DECIMAL(10,6),
  asset_allocation JSONB,
  top_positions JSONB,
  time_horizon INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.portfolio_id,
    c.portfolio_name,
    c.description,
    c.risk_level,
    c.allocations,
    c.expected_return,
    c.expected_best_year,
    c.expected_worst_year,
    c.upside,
    c.downside,
    c.volatility,
    c.asset_allocation,
    c.top_positions,
    c.time_horizon,
    c.updated_at
  FROM core_portfolios_cache c
  WHERE c.portfolio_id = p_portfolio_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- CACHE STATISTICS VIEW
-- =====================================================================================

CREATE OR REPLACE VIEW core_portfolios_cache_stats AS
SELECT 
  COUNT(*) as total_portfolios,
  COUNT(DISTINCT risk_level) as unique_risk_levels,
  ROUND(AVG(expected_return * 100), 2) as avg_expected_return_pct,
  MIN(updated_at) as oldest_cache,
  MAX(updated_at) as newest_cache,
  EXTRACT(EPOCH FROM (NOW() - MIN(updated_at))) / 3600 as oldest_age_hours
FROM core_portfolios_cache;

-- =====================================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================================

-- Enable RLS
ALTER TABLE core_portfolios_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cache is reference data)
CREATE POLICY "Core portfolios cache is readable by everyone" 
ON core_portfolios_cache
FOR SELECT 
USING (true);

-- Allow authenticated users and service role to write
CREATE POLICY "Core portfolios cache is writable by authenticated users" 
ON core_portfolios_cache
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- =====================================================================================
-- GRANTS
-- =====================================================================================

GRANT SELECT ON core_portfolios_cache TO anon, authenticated;
GRANT SELECT ON core_portfolios_cache_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_cached_core_portfolios TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cached_core_portfolio TO anon, authenticated;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE core_portfolios_cache IS 
'Pre-computed analysis results for Clockwise Core Portfolios using Kronos analyzer. Cache TTL: 24 hours.';

COMMENT ON COLUMN core_portfolios_cache.allocations IS 
'Raw portfolio allocations (stocks, bonds, cash, etc.) as percentages.';

COMMENT ON COLUMN core_portfolios_cache.asset_allocation IS 
'Formatted asset allocation breakdown for UI display.';

COMMENT ON COLUMN core_portfolios_cache.top_positions IS 
'Top holdings/positions in the portfolio for detailed view.';
