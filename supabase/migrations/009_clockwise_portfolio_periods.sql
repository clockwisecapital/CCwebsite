-- Migration: Store yearly portfolio performance metrics
-- This table stores period-by-period breakdown (2023, 2024, YTD, etc.)
-- allowing the Admin Dashboard to display metrics without requiring CSV re-upload

CREATE TABLE IF NOT EXISTS public.clockwise_portfolio_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_name TEXT NOT NULL,
  period_name TEXT NOT NULL, -- '2023', '2024', 'YTD', '1Y', '3Y', '5Y', etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Returns
  portfolio_return NUMERIC,
  benchmark_return NUMERIC,
  excess_return NUMERIC,
  
  -- Risk Metrics - Portfolio
  portfolio_std_dev NUMERIC,
  portfolio_alpha NUMERIC,
  portfolio_beta NUMERIC,
  portfolio_sharpe_ratio NUMERIC,
  portfolio_max_drawdown NUMERIC,
  portfolio_up_capture NUMERIC,
  portfolio_down_capture NUMERIC,
  
  -- Risk Metrics - Benchmark
  benchmark_std_dev NUMERIC,
  benchmark_sharpe_ratio NUMERIC,
  benchmark_max_drawdown NUMERIC,
  
  -- Context
  risk_free_rate NUMERIC,
  num_months INTEGER,
  
  -- Metadata
  as_of_date DATE,
  data_start_date DATE,
  data_end_date DATE,
  generated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint per portfolio + period
  UNIQUE(portfolio_name, period_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_periods_name ON public.clockwise_portfolio_periods(portfolio_name);
CREATE INDEX IF NOT EXISTS idx_portfolio_periods_period ON public.clockwise_portfolio_periods(period_name);
CREATE INDEX IF NOT EXISTS idx_portfolio_periods_as_of_date ON public.clockwise_portfolio_periods(as_of_date DESC);

-- RLS policies
ALTER TABLE public.clockwise_portfolio_periods ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for client-facing features if needed)
CREATE POLICY "Allow public read access"
  ON public.clockwise_portfolio_periods
  FOR SELECT
  USING (true);

-- Allow admin write access
CREATE POLICY "Allow admin write access"
  ON public.clockwise_portfolio_periods
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clockwise_portfolio_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portfolio_periods_timestamp
  BEFORE UPDATE ON public.clockwise_portfolio_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_clockwise_portfolio_periods_updated_at();

-- Comment
COMMENT ON TABLE public.clockwise_portfolio_periods IS 'Stores yearly/periodic portfolio performance metrics for historical tracking and display';

