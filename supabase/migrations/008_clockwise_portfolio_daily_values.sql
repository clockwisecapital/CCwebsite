-- Migration: Create clockwise_portfolio_daily_values table
-- This table stores the raw daily portfolio values from uploaded CSVs
-- Used for historical reference and metric recalculation

-- Create the clockwise_portfolio_daily_values table
CREATE TABLE IF NOT EXISTS clockwise_portfolio_daily_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  as_of_date DATE NOT NULL UNIQUE,
  data JSONB NOT NULL,  -- Stores the daily values for all portfolios
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_clockwise_portfolio_daily_values_updated_at ON clockwise_portfolio_daily_values;
CREATE TRIGGER update_clockwise_portfolio_daily_values_updated_at
  BEFORE UPDATE ON clockwise_portfolio_daily_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for date lookups
CREATE INDEX IF NOT EXISTS idx_clockwise_portfolio_daily_values_date ON clockwise_portfolio_daily_values(as_of_date DESC);

-- Enable RLS
ALTER TABLE clockwise_portfolio_daily_values ENABLE ROW LEVEL SECURITY;

-- Allow all operations (admin will be authenticated)
CREATE POLICY "Allow all operations on clockwise_portfolio_daily_values" ON clockwise_portfolio_daily_values
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON clockwise_portfolio_daily_values TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE clockwise_portfolio_daily_values IS 'Stores raw daily portfolio values from CSV uploads for historical reference';
COMMENT ON COLUMN clockwise_portfolio_daily_values.as_of_date IS 'The latest date in the uploaded CSV';
COMMENT ON COLUMN clockwise_portfolio_daily_values.data IS 'JSONB containing daily values for all portfolios';

