-- Migration: Add function to increment tests_count
-- Created: 2026-01-20
-- Purpose: Atomically increment the tests_count when a new test is saved

-- Create or replace the increment_tests_count function
CREATE OR REPLACE FUNCTION increment_tests_count(question_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE scenario_questions
  SET 
    tests_count = tests_count + 1,
    last_activity_at = NOW()
  WHERE id = question_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION increment_tests_count IS 'Atomically increments the tests_count for a scenario question and updates last_activity_at';
