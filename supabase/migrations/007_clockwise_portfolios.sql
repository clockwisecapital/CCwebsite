-- Migration: Create clockwise_portfolios table
-- This table stores Clockwise model portfolio performance data
-- Used by both Admin Dashboard and Review Tab

-- Create the clockwise_portfolios table
CREATE TABLE IF NOT EXISTS clockwise_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  
  -- 3-Year Cumulative Performance Metrics
  return_3y DECIMAL(8,4),           -- e.g., 1.1074 for 110.74%
  std_dev DECIMAL(8,4),             -- e.g., 0.148 for 14.8%
  alpha DECIMAL(8,4),               -- e.g., 0.068 for 6.8%
  beta DECIMAL(8,4),                -- e.g., 0.89
  sharpe_ratio DECIMAL(8,4),        -- e.g., 1.42
  max_drawdown DECIMAL(8,4),        -- e.g., -0.214 for -21.4%
  up_capture DECIMAL(8,4),          -- e.g., 1.51
  down_capture DECIMAL(8,4),        -- e.g., 0.53
  
  -- Benchmark flag
  is_benchmark BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_clockwise_portfolios_updated_at ON clockwise_portfolios;
CREATE TRIGGER update_clockwise_portfolios_updated_at
  BEFORE UPDATE ON clockwise_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_clockwise_portfolios_display_order ON clockwise_portfolios(display_order);

-- Enable RLS
ALTER TABLE clockwise_portfolios ENABLE ROW LEVEL SECURITY;

-- Allow all operations (admin will be authenticated)
CREATE POLICY "Allow all operations on clockwise_portfolios" ON clockwise_portfolios
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON clockwise_portfolios TO authenticated;

-- Insert initial data based on the image provided
-- Values from the 3-Year Cumulative Performance table
INSERT INTO clockwise_portfolios (name, display_order, return_3y, std_dev, alpha, beta, sharpe_ratio, max_drawdown, up_capture, down_capture, is_benchmark) VALUES
  ('Max Growth', 1, 1.1074, 0.148, 0.068, 0.89, 1.42, -0.214, 1.51, 0.53, FALSE),
  ('Moderate', 2, 0.5696, 0.088, 0.033, 0.43, 1.18, -0.109, 0.53, 0.28, FALSE),
  ('Max Income', 3, 0.2320, 0.047, -0.008, 0.20, 0.54, -0.056, 0.28, 0.28, FALSE),
  ('Growth', 4, 0.7798, 0.128, 0.044, 0.64, 1.16, -0.177, 1.09, 0.53, FALSE),
  ('S&P 500', 5, 0.3500, 0.165, 0.000, 1.00, 0.85, -0.240, 1.00, 1.00, TRUE)
ON CONFLICT (name) DO UPDATE SET
  return_3y = EXCLUDED.return_3y,
  std_dev = EXCLUDED.std_dev,
  alpha = EXCLUDED.alpha,
  beta = EXCLUDED.beta,
  sharpe_ratio = EXCLUDED.sharpe_ratio,
  max_drawdown = EXCLUDED.max_drawdown,
  up_capture = EXCLUDED.up_capture,
  down_capture = EXCLUDED.down_capture,
  display_order = EXCLUDED.display_order,
  is_benchmark = EXCLUDED.is_benchmark,
  updated_at = NOW();

-- Add comments for documentation
COMMENT ON TABLE clockwise_portfolios IS 'Stores Clockwise model portfolio 3-year cumulative performance metrics';
COMMENT ON COLUMN clockwise_portfolios.return_3y IS '3-year cumulative return as decimal (1.1074 = 110.74%)';
COMMENT ON COLUMN clockwise_portfolios.std_dev IS 'Standard deviation as decimal (0.148 = 14.8%)';
COMMENT ON COLUMN clockwise_portfolios.alpha IS 'Alpha vs benchmark as decimal';
COMMENT ON COLUMN clockwise_portfolios.beta IS 'Beta vs benchmark';
COMMENT ON COLUMN clockwise_portfolios.sharpe_ratio IS 'Risk-adjusted return measure';
COMMENT ON COLUMN clockwise_portfolios.max_drawdown IS 'Maximum peak-to-trough decline as negative decimal';
COMMENT ON COLUMN clockwise_portfolios.up_capture IS 'Up capture ratio vs benchmark';
COMMENT ON COLUMN clockwise_portfolios.down_capture IS 'Down capture ratio vs benchmark';
COMMENT ON COLUMN clockwise_portfolios.is_benchmark IS 'TRUE if this is the benchmark (S&P 500)';

