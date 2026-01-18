-- Seed TIME-favorable scenario questions
-- These questions are designed to showcase TIME portfolio's strengths
-- Creates mock community users for realistic feed experience

-- Create mock community users and seed questions
DO $$
DECLARE
  user1_id UUID := gen_random_uuid();
  user2_id UUID := gen_random_uuid();
  user3_id UUID := gen_random_uuid();
  user4_id UUID := gen_random_uuid();
BEGIN
  -- Create mock users in auth.users table
  -- These are community members who post scenario questions
  
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES
    (
      user1_id,
      'sarah.investor@example.com',
      crypt('mock_password_123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('full_name', 'Sarah Chen', 'username', 'sarahc_investor')
    ),
    (
      user2_id,
      'mike.portfolio@example.com',
      crypt('mock_password_123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('full_name', 'Mike Rodriguez', 'username', 'mike_trader')
    ),
    (
      user3_id,
      'alex.markets@example.com',
      crypt('mock_password_123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('full_name', 'Alex Thompson', 'username', 'alexthompson')
    ),
    (
      user4_id,
      'jordan.finance@example.com',
      crypt('mock_password_123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('full_name', 'Jordan Lee', 'username', 'jordanlee_finance')
    )
  ON CONFLICT (id) DO NOTHING;

  -- Insert example questions that favor TIME's positioning
  INSERT INTO scenario_questions (
    user_id,
    title,
    description,
    question_text,
    tags
  ) VALUES
    (
      user1_id,
      'Strong Economic Expansion',
      'Test your portfolio against a Goldilocks scenario of sustained economic growth with low unemployment and stable inflation.',
      'What if the economy continues to grow with GDP at 3-4% and unemployment stays low?',
      ARRAY['growth', 'goldilocks', 'expansion']
    ),
    (
      user2_id,
      'Tech Innovation Cycle',
      'Evaluate how your portfolio performs during a multi-year AI-driven productivity boom similar to past tech revolutions.',
      'What if we''re in the early stages of an AI-driven productivity boom that lasts 5+ years?',
      ARRAY['growth', 'ai-supercycle', 'technology', 'innovation']
    ),
    (
      user3_id,
      'Market Recovery Rally',
      'Stress test your portfolio''s ability to capture upside during strong market recoveries following corrections.',
      'What happens if the market rallies 20-30% over the next 6-12 months after a correction?',
      ARRAY['growth', 'recovery', 'rally', 'upside']
    ),
    (
      user4_id,
      'Goldilocks Environment',
      'See how your portfolio performs in ideal conditions with moderate inflation and strong economic growth.',
      'What if inflation moderates to 2% while economic growth remains strong at 3%?',
      ARRAY['balanced', 'goldilocks', 'optimal', 'growth']
    ),
    (
      user1_id,
      'Market Volatility Test',
      'Test your portfolio''s resilience against extreme market volatility and sudden crashes like COVID or Black Monday.',
      'If the market drops 20% in a single month, what happens to my portfolio?',
      ARRAY['stress-test', 'volatility', 'crash', 'defense']
    ),
    (
      user3_id,
      'AI Bubble Risk',
      'Assess your portfolio''s exposure to a potential AI bubble burst, similar to the Dot-Com crash of 2000-2002.',
      'I''m concerned about AI bubble risk - how exposed is my portfolio?',
      ARRAY['stress-test', 'ai-supercycle', 'bubble', 'tech-crash']
    )
  ON CONFLICT DO NOTHING;
  
END $$;

-- Note: The first 4 questions are TIME-favorable (growth/goldilocks scenarios)
-- The last 2 are stress tests for balanced comparison
COMMENT ON TABLE scenario_questions IS 'Includes TIME-favorable questions that showcase growth positioning';
