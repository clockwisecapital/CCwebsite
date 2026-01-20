-- Migration: Add indexes for leaderboard performance
-- Created: 2026-01-20
-- Purpose: Optimize queries for top portfolios and user rankings

-- Index for fetching top portfolios by question (ordered by score)
CREATE INDEX IF NOT EXISTS idx_question_tests_score 
ON question_tests(question_id, score DESC, created_at DESC)
WHERE is_public = true;

-- Index for user's test history
CREATE INDEX IF NOT EXISTS idx_question_tests_user 
ON question_tests(user_id, question_id, created_at DESC);

-- Index for portfolio-specific results
CREATE INDEX IF NOT EXISTS idx_question_tests_portfolio 
ON question_tests(portfolio_id, question_id, created_at DESC);

-- Composite index for leaderboard with filtering
CREATE INDEX IF NOT EXISTS idx_question_tests_leaderboard 
ON question_tests(question_id, is_public, score DESC, expected_return DESC)
WHERE is_public = true;

-- Add comments
COMMENT ON INDEX idx_question_tests_score IS 'Optimizes top portfolios queries ordered by score';
COMMENT ON INDEX idx_question_tests_user IS 'Optimizes user test history queries';
COMMENT ON INDEX idx_question_tests_portfolio IS 'Optimizes portfolio-specific test queries';
COMMENT ON INDEX idx_question_tests_leaderboard IS 'Optimizes leaderboard queries with public filter';
