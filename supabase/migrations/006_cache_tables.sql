-- ============================================================================
-- Cache Tables for Portfolio Analysis
-- ============================================================================
-- These tables store cached data to speed up portfolio analysis.
-- Caches are refreshed by Inngest scheduled jobs.
-- ============================================================================

-- TIME Portfolio Cache
-- Stores pre-computed TIME portfolio analysis (refreshed every 6 hours)
CREATE TABLE IF NOT EXISTS time_portfolio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(50) NOT NULL UNIQUE DEFAULT 'default',
  positions JSONB NOT NULL,
  top_positions JSONB NOT NULL,
  expected_return DECIMAL(10, 6) NOT NULL,
  year1_return DECIMAL(10, 6) NOT NULL,
  portfolio_upside DECIMAL(10, 6) NOT NULL,
  portfolio_downside DECIMAL(10, 6) NOT NULL,
  portfolio_median DECIMAL(10, 6) NOT NULL,
  time_horizon INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_time_portfolio_cache_key ON time_portfolio_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_time_portfolio_cache_updated ON time_portfolio_cache(updated_at);

-- Volatility Cache
-- Stores historical volatility for tickers (refreshed daily)
CREATE TABLE IF NOT EXISTS volatility_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(20) NOT NULL,
  volatility DECIMAL(10, 6) NOT NULL,
  source VARCHAR(50) DEFAULT 'yahoo_finance',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ticker)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_volatility_cache_ticker ON volatility_cache(ticker);
CREATE INDEX IF NOT EXISTS idx_volatility_cache_updated ON volatility_cache(updated_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
DROP TRIGGER IF EXISTS update_time_portfolio_cache_updated_at ON time_portfolio_cache;
CREATE TRIGGER update_time_portfolio_cache_updated_at
  BEFORE UPDATE ON time_portfolio_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_volatility_cache_updated_at ON volatility_cache;
CREATE TRIGGER update_volatility_cache_updated_at
  BEFORE UPDATE ON volatility_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies (for security)
-- ============================================================================
-- Cache tables are read-only for authenticated users, write access via service role

ALTER TABLE time_portfolio_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE volatility_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access to all (cache is not sensitive)
CREATE POLICY "Allow public read access on time_portfolio_cache"
  ON time_portfolio_cache FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on volatility_cache"
  ON volatility_cache FOR SELECT
  USING (true);

-- Only service role can insert/update (via Inngest jobs)
CREATE POLICY "Allow service role write on time_portfolio_cache"
  ON time_portfolio_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role write on volatility_cache"
  ON volatility_cache FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

