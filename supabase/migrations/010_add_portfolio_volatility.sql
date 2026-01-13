-- ============================================================================
-- Migration: Add portfolio_volatility column to time_portfolio_cache
-- Created: 2025-01-06
-- Purpose: Fix schema mismatch causing cache save failures
-- ============================================================================

-- Add the missing portfolio_volatility column
ALTER TABLE time_portfolio_cache 
ADD COLUMN IF NOT EXISTS portfolio_volatility DECIMAL(10, 6);

-- Set default value for any existing rows (15% is typical stock portfolio volatility)
UPDATE time_portfolio_cache 
SET portfolio_volatility = 0.15 
WHERE portfolio_volatility IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN time_portfolio_cache.portfolio_volatility IS 'Portfolio-level annualized volatility (standard deviation of returns)';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Successfully added portfolio_volatility column to time_portfolio_cache';
END $$;







