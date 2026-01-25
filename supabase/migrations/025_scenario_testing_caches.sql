-- =====================================================================================
-- Scenario Testing Cache System
-- =====================================================================================
-- Adds persistent caching for:
-- 1. TIME Portfolio scores against historical analogs
-- 2. Asset class returns from Yahoo Finance
-- 
-- Performance Impact:
-- - TIME portfolio: 8-12s → 0.2s per test
-- - Asset returns: 12-15s → 0.1s per analog
-- =====================================================================================

-- =====================================================================================
-- TIME PORTFOLIO ANALOG CACHE
-- =====================================================================================
-- Stores pre-computed TIME portfolio scores for each historical analog
-- Similar to clockwise_portfolio_cache but for TIME portfolio only
-- Must be regenerated after TIME rebalancing (monthly)

CREATE TABLE IF NOT EXISTS time_portfolio_analog_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Historical analog identification
  analog_id VARCHAR(50) NOT NULL,
  analog_name VARCHAR(100) NOT NULL,
  analog_period VARCHAR(100) NOT NULL,
  
  -- TIME portfolio holdings snapshot (at time of cache generation)
  holdings JSONB NOT NULL,
  holdings_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
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
  
  -- Scenario metadata
  scenario_id VARCHAR(50),
  scenario_name VARCHAR(100),
  
  -- Cache management
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique analog-version combinations
  UNIQUE(analog_id, version)
);

-- Indexes for fast lookups
CREATE INDEX idx_time_analog_cache_analog ON time_portfolio_analog_cache(analog_id, version);
CREATE INDEX idx_time_analog_cache_version ON time_portfolio_analog_cache(version);
CREATE INDEX idx_time_analog_cache_updated ON time_portfolio_analog_cache(updated_at);

-- =====================================================================================
-- ASSET RETURNS CACHE
-- =====================================================================================
-- Stores historical asset class returns from Yahoo Finance
-- Prevents redundant API calls for the same analog/asset class combinations
-- Data is immutable (historical returns don't change), but cache supports versioning

CREATE TABLE IF NOT EXISTS asset_returns_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cache key components
  analog_id VARCHAR(50) NOT NULL,
  asset_class VARCHAR(50) NOT NULL,
  
  -- Date range (for verification)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Return value (decimal, e.g., -0.339 for -33.9%)
  return_value DECIMAL(10,8) NOT NULL,
  
  -- Data source tracking
  source VARCHAR(50) NOT NULL DEFAULT 'yahoo_finance', -- 'yahoo_finance' or 'verified_data'
  etf_ticker VARCHAR(10), -- ETF used for calculation
  
  -- Data quality
  is_validated BOOLEAN DEFAULT false,
  validation_date TIMESTAMP WITH TIME ZONE,
  
  -- Cache management
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique analog-asset-version combinations
  UNIQUE(analog_id, asset_class, version)
);

-- Indexes for fast lookups
CREATE INDEX idx_asset_returns_cache_lookup 
ON asset_returns_cache(analog_id, version);

CREATE INDEX idx_asset_returns_cache_combo 
ON asset_returns_cache(analog_id, asset_class, version);

CREATE INDEX idx_asset_returns_cache_source 
ON asset_returns_cache(source);

-- =====================================================================================
-- HELPER FUNCTIONS
-- =====================================================================================

-- Function to get cached TIME portfolio score
CREATE OR REPLACE FUNCTION get_cached_time_score(
  p_analog_id VARCHAR(50),
  p_version INTEGER DEFAULT 1
)
RETURNS TABLE (
  analog_id VARCHAR(50),
  analog_name VARCHAR(100),
  score DECIMAL(5,2),
  portfolio_return DECIMAL(8,6),
  portfolio_drawdown DECIMAL(8,6),
  holdings JSONB,
  holdings_date TIMESTAMP WITH TIME ZONE,
  label VARCHAR(50),
  color VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.analog_id,
    t.analog_name,
    t.score,
    t.portfolio_return,
    t.portfolio_drawdown,
    t.holdings,
    t.holdings_date,
    t.label,
    t.color
  FROM time_portfolio_analog_cache t
  WHERE t.analog_id = p_analog_id
    AND t.version = p_version;
END;
$$ LANGUAGE plpgsql;

-- Function to get cached asset returns for an analog
CREATE OR REPLACE FUNCTION get_cached_asset_returns(
  p_analog_id VARCHAR(50),
  p_version INTEGER DEFAULT 1
)
RETURNS TABLE (
  asset_class VARCHAR(50),
  return_value DECIMAL(10,8),
  source VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.asset_class,
    a.return_value,
    a.source
  FROM asset_returns_cache a
  WHERE a.analog_id = p_analog_id
    AND a.version = p_version
  ORDER BY a.asset_class;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- CACHE STATISTICS VIEWS
-- =====================================================================================

CREATE OR REPLACE VIEW time_analog_cache_stats AS
SELECT 
  version,
  COUNT(*) as total_entries,
  COUNT(DISTINCT analog_id) as unique_analogs,
  ROUND(AVG(score), 2) as avg_score,
  MIN(created_at) as first_entry,
  MAX(updated_at) as last_update,
  MAX(holdings_date) as latest_holdings_date
FROM time_portfolio_analog_cache
GROUP BY version
ORDER BY version DESC;

CREATE OR REPLACE VIEW asset_returns_cache_stats AS
SELECT 
  version,
  COUNT(*) as total_entries,
  COUNT(DISTINCT analog_id) as unique_analogs,
  COUNT(DISTINCT asset_class) as unique_asset_classes,
  COUNT(*) FILTER (WHERE source = 'yahoo_finance') as yahoo_entries,
  COUNT(*) FILTER (WHERE source = 'verified_data') as verified_entries,
  COUNT(*) FILTER (WHERE is_validated = true) as validated_entries,
  MIN(created_at) as first_entry,
  MAX(updated_at) as last_update
FROM asset_returns_cache
GROUP BY version
ORDER BY version DESC;

-- =====================================================================================
-- TRIGGERS
-- =====================================================================================

-- Update timestamp on modification for TIME cache
CREATE OR REPLACE FUNCTION update_time_analog_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_analog_cache_timestamp
BEFORE UPDATE ON time_portfolio_analog_cache
FOR EACH ROW
EXECUTE FUNCTION update_time_analog_cache_timestamp();

-- Update timestamp on modification for asset returns cache
CREATE OR REPLACE FUNCTION update_asset_returns_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_asset_returns_cache_timestamp
BEFORE UPDATE ON asset_returns_cache
FOR EACH ROW
EXECUTE FUNCTION update_asset_returns_cache_timestamp();

-- =====================================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================================

-- Enable RLS on both tables
ALTER TABLE time_portfolio_analog_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_returns_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cache is reference data)
CREATE POLICY "TIME analog cache is readable by everyone" 
ON time_portfolio_analog_cache
FOR SELECT 
USING (true);

CREATE POLICY "Asset returns cache is readable by everyone" 
ON asset_returns_cache
FOR SELECT 
USING (true);

-- Allow authenticated users to write (for cache generation scripts)
CREATE POLICY "TIME analog cache is writable by authenticated users" 
ON time_portfolio_analog_cache
FOR ALL 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Asset returns cache is writable by authenticated users" 
ON asset_returns_cache
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- =====================================================================================
-- GRANTS
-- =====================================================================================

GRANT SELECT ON time_portfolio_analog_cache TO anon, authenticated;
GRANT SELECT ON asset_returns_cache TO anon, authenticated;
GRANT SELECT ON time_analog_cache_stats TO anon, authenticated;
GRANT SELECT ON asset_returns_cache_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cached_time_score TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cached_asset_returns TO anon, authenticated;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE time_portfolio_analog_cache IS 
'Pre-computed TIME portfolio scores against historical economic cycles. Regenerate after TIME rebalancing (monthly).';

COMMENT ON TABLE asset_returns_cache IS 
'Persistent cache for historical asset class returns from Yahoo Finance. Prevents redundant API calls for immutable historical data.';

COMMENT ON COLUMN asset_returns_cache.is_validated IS 
'Whether the return value has been manually verified against trusted sources.';

COMMENT ON COLUMN time_portfolio_analog_cache.holdings_date IS 
'Date when the cached holdings were current. Used to detect stale cache after rebalancing.';
