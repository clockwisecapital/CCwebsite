-- Create ticker_classifications table for caching AI-powered asset class classifications
CREATE TABLE IF NOT EXISTS ticker_classifications (
  ticker TEXT PRIMARY KEY,
  asset_class TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ticker_classifications_updated_at 
  ON ticker_classifications(updated_at);

-- Add comment
COMMENT ON TABLE ticker_classifications IS 'AI-powered ticker to asset class classifications with caching';
COMMENT ON COLUMN ticker_classifications.ticker IS 'Stock/ETF ticker symbol (uppercase)';
COMMENT ON COLUMN ticker_classifications.asset_class IS 'Kronos asset class classification';
COMMENT ON COLUMN ticker_classifications.confidence IS 'Classification confidence (0-1)';
COMMENT ON COLUMN ticker_classifications.reasoning IS 'AI reasoning for classification';
