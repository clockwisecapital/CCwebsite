-- Create helper function to increment tests_count on questions
CREATE OR REPLACE FUNCTION increment_tests_count(question_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE scenario_questions
  SET tests_count = tests_count + 1,
      last_activity_at = NOW()
  WHERE id = question_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION increment_tests_count IS 'Increment test count when a portfolio is tested against a question';
