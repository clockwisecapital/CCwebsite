-- Create table for S&P 500 benchmark test results
CREATE TABLE IF NOT EXISTS question_sp500_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES scenario_questions(id) ON DELETE CASCADE,
  expected_return DECIMAL(10, 4) NOT NULL,
  upside DECIMAL(10, 4) NOT NULL,
  downside DECIMAL(10, 4) NOT NULL,
  score DECIMAL(10, 2) NOT NULL,
  test_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast queries by question
CREATE INDEX IF NOT EXISTS idx_sp500_benchmarks_question 
ON question_sp500_benchmarks(question_id, created_at DESC);

-- Add comments
COMMENT ON TABLE question_sp500_benchmarks IS 'Stores S&P 500 benchmark test results for each scenario question';
COMMENT ON COLUMN question_sp500_benchmarks.expected_return IS 'Expected return of S&P 500 for this scenario';
COMMENT ON COLUMN question_sp500_benchmarks.upside IS 'Upside potential of S&P 500';
COMMENT ON COLUMN question_sp500_benchmarks.downside IS 'Downside risk of S&P 500';
COMMENT ON COLUMN question_sp500_benchmarks.score IS 'Performance score of S&P 500';
COMMENT ON COLUMN question_sp500_benchmarks.test_data IS 'Full test comparison data';
-