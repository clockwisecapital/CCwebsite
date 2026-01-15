-- =====================================================================================
-- Seed Mock Data for Community/Scenario Testing
-- =====================================================================================
-- This migration populates the database with sample questions and test results
-- for demonstration and testing purposes.
--
-- Note: This assumes you have at least one user in the auth.users table.
-- If not, you'll need to create demo users first via the Supabase dashboard
-- or use a separate script.

-- Get the first user ID (or use a specific user if you know their ID)
-- You can modify this to use a specific user UUID
DO $$
DECLARE
  demo_user_id UUID;
  q1_id UUID;
  q2_id UUID;
  q3_id UUID;
  p1_id UUID;
  p2_id UUID;
  p3_id UUID;
  p4_id UUID;
  p5_id UUID;
BEGIN
  -- Get the first authenticated user (you can replace this with a specific UUID)
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
  
  -- If no user exists, exit early
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users table. Please create a user first.';
  END IF;

  -- =====================================================================================
  -- 1. INSERT SAMPLE QUESTIONS
  -- =====================================================================================
  
  -- Question 1: AI Supercycle
  INSERT INTO public.scenario_questions (
    id, user_id, title, description, question_text,
    historical_period, tags, likes_count, comments_count, tests_count, views_count,
    is_active, is_featured, is_pinned, created_at, updated_at, last_activity_at, metadata
  ) VALUES (
    gen_random_uuid(),
    demo_user_id,
    'AI Supercycle',
    'How should portfolios adapt to AI-driven productivity shocks? This question explores whether recent AI advances represent a transformative supercycle like the internet boom, or if valuations are getting ahead of fundamentals.',
    'Is AI a productivity supercycle or just another bubble?',
    '[{"start": "1995", "end": "2000", "label": "Internet Boom"}]'::jsonb,
    ARRAY['ai', 'productivity', 'tech'],
    1203,
    2,
    84,
    3120,
    true,
    true,
    false,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day',
    '{}'::jsonb
  ) RETURNING id INTO q1_id;

  -- Question 2: ETF Volatility
  INSERT INTO public.scenario_questions (
    id, user_id, title, description, question_text,
    historical_period, tags, likes_count, comments_count, tests_count, views_count,
    is_active, is_featured, is_pinned, created_at, updated_at, last_activity_at, metadata
  ) VALUES (
    gen_random_uuid(),
    demo_user_id,
    'ETF Volatility',
    'Risk tactics for volatile macro regimes. Understanding how to position ETF portfolios during periods of high market uncertainty and sector rotation.',
    'How do you handle market volatility with your ETFs?',
    '[{"start": "2020", "end": "2020", "label": "COVID Crash"}]'::jsonb,
    ARRAY['etf', 'volatility', 'risk'],
    847,
    3,
    61,
    1980,
    true,
    false,
    false,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days',
    '{}'::jsonb
  ) RETURNING id INTO q2_id;

  -- Question 3: Fixed Income Focus
  INSERT INTO public.scenario_questions (
    id, user_id, title, description, question_text,
    historical_period, tags, likes_count, comments_count, tests_count, views_count,
    is_active, is_featured, is_pinned, created_at, updated_at, last_activity_at, metadata
  ) VALUES (
    gen_random_uuid(),
    demo_user_id,
    'Fixed Income Focus',
    'Positioning through rate regime changes. How to manage fixed income allocations when interest rates are rising or falling.',
    'What fixed income strategy works best in a hiking cycle?',
    '[{"start": "2004", "end": "2006", "label": "Rate Hikes"}]'::jsonb,
    ARRAY['fixed-income', 'rates', 'bonds'],
    529,
    1,
    45,
    1140,
    true,
    false,
    false,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    '{}'::jsonb
  ) RETURNING id INTO q3_id;

  -- =====================================================================================
  -- 2. CREATE MOCK PORTFOLIOS
  -- =====================================================================================
  
  -- Generate portfolio IDs
  p1_id := gen_random_uuid();
  p2_id := gen_random_uuid();
  p3_id := gen_random_uuid();
  p4_id := gen_random_uuid();
  p5_id := gen_random_uuid();
  
  -- Create 5 mock portfolios for test results
  INSERT INTO public.portfolios (id, user_id, name, portfolio_data, intake_data, created_at, updated_at) VALUES
    (p1_id, demo_user_id, 'Tech Growth Fund', '{"holdings": []}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    (p2_id, demo_user_id, 'Balanced Index', '{"holdings": []}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    (p3_id, demo_user_id, 'Value Dividend', '{"holdings": []}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    (p4_id, demo_user_id, 'Growth Momentum', '{"holdings": []}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    (p5_id, demo_user_id, 'Conservative Allocation', '{"holdings": []}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

  -- =====================================================================================
  -- 3. INSERT MOCK PORTFOLIO TEST RESULTS
  -- =====================================================================================
  
  -- Test results for Question 1: AI Supercycle
  INSERT INTO public.question_tests (
    question_id, portfolio_id, user_id, score, expected_return, upside, downside, is_public, comparison_data, created_at
  ) VALUES
    (q1_id, p1_id, demo_user_id, 87.5, 0.156, 0.285, -0.065, true, '{"portfolio_name": "Tech Growth Fund", "user_name": "Alex Chen"}'::jsonb, NOW() - INTERVAL '6 days'),
    (q1_id, p2_id, demo_user_id, 78.3, 0.124, 0.215, -0.085, true, '{"portfolio_name": "Balanced Index", "user_name": "Jordan Smith"}'::jsonb, NOW() - INTERVAL '6 days'),
    (q1_id, p3_id, demo_user_id, 72.1, 0.098, 0.178, -0.045, true, '{"portfolio_name": "Value Dividend", "user_name": "Morgan Davis"}'::jsonb, NOW() - INTERVAL '6 days'),
    (q1_id, p4_id, demo_user_id, 81.2, 0.168, 0.310, -0.095, true, '{"portfolio_name": "Growth Momentum", "user_name": "Casey Park"}'::jsonb, NOW() - INTERVAL '5 days'),
    (q1_id, p5_id, demo_user_id, 68.7, 0.065, 0.120, -0.035, true, '{"portfolio_name": "Conservative Allocation", "user_name": "Taylor Anderson"}'::jsonb, NOW() - INTERVAL '5 days');

  -- Test results for Question 2: ETF Volatility
  INSERT INTO public.question_tests (
    question_id, portfolio_id, user_id, score, expected_return, upside, downside, is_public, comparison_data, created_at
  ) VALUES
    (q2_id, p1_id, demo_user_id, 82.5, 0.142, 0.265, -0.075, true, '{"portfolio_name": "Tech Growth Fund", "user_name": "Alex Chen"}'::jsonb, NOW() - INTERVAL '4 days'),
    (q2_id, p2_id, demo_user_id, 76.1, 0.108, 0.185, -0.055, true, '{"portfolio_name": "Balanced Index", "user_name": "Jordan Smith"}'::jsonb, NOW() - INTERVAL '4 days'),
    (q2_id, p3_id, demo_user_id, 79.8, 0.135, 0.248, -0.065, true, '{"portfolio_name": "Value Dividend", "user_name": "Morgan Davis"}'::jsonb, NOW() - INTERVAL '3 days'),
    (q2_id, p4_id, demo_user_id, 74.3, 0.098, 0.198, -0.088, true, '{"portfolio_name": "Growth Momentum", "user_name": "Casey Park"}'::jsonb, NOW() - INTERVAL '3 days'),
    (q2_id, p5_id, demo_user_id, 71.5, 0.045, 0.085, -0.025, true, '{"portfolio_name": "Conservative Allocation", "user_name": "Taylor Anderson"}'::jsonb, NOW() - INTERVAL '2 days');

  -- Test results for Question 3: Fixed Income Focus
  INSERT INTO public.question_tests (
    question_id, portfolio_id, user_id, score, expected_return, upside, downside, is_public, comparison_data, created_at
  ) VALUES
    (q3_id, p1_id, demo_user_id, 73.2, 0.112, 0.225, -0.055, true, '{"portfolio_name": "Tech Growth Fund", "user_name": "Alex Chen"}'::jsonb, NOW() - INTERVAL '2 days'),
    (q3_id, p2_id, demo_user_id, 84.6, 0.156, 0.288, -0.045, true, '{"portfolio_name": "Balanced Index", "user_name": "Jordan Smith"}'::jsonb, NOW() - INTERVAL '2 days'),
    (q3_id, p3_id, demo_user_id, 88.3, 0.168, 0.295, -0.035, true, '{"portfolio_name": "Value Dividend", "user_name": "Morgan Davis"}'::jsonb, NOW() - INTERVAL '1 day'),
    (q3_id, p4_id, demo_user_id, 75.1, 0.128, 0.235, -0.065, true, '{"portfolio_name": "Growth Momentum", "user_name": "Casey Park"}'::jsonb, NOW() - INTERVAL '1 day'),
    (q3_id, p5_id, demo_user_id, 79.7, 0.085, 0.155, -0.025, true, '{"portfolio_name": "Conservative Allocation", "user_name": "Taylor Anderson"}'::jsonb, NOW());

  RAISE NOTICE 'Successfully seeded mock community data!';
  RAISE NOTICE 'Created 3 sample questions with 15 portfolio test results.';

END $$;

-- =====================================================================================
-- Verify the data was inserted
-- =====================================================================================
SELECT 
  'Questions Created' as metric,
  COUNT(*) as count
FROM public.scenario_questions
WHERE title IN ('AI Supercycle', 'ETF Volatility', 'Fixed Income Focus')
UNION ALL
SELECT 
  'Test Results Created' as metric,
  COUNT(*) as count
FROM public.question_tests
WHERE question_id IN (
  SELECT id FROM public.scenario_questions 
  WHERE title IN ('AI Supercycle', 'ETF Volatility', 'Fixed Income Focus')
);
