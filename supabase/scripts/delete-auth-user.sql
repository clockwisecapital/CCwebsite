-- =====================================================================================
-- Script to Safely Delete a Supabase Auth User
-- =====================================================================================
-- Run this in the Supabase SQL Editor to delete a user and all related data
--
-- INSTRUCTIONS:
-- 1. Replace 'USER_EMAIL_HERE' with the actual email of the user you want to delete
-- 2. Run this script in the Supabase SQL Editor
-- 3. The script will show you what will be deleted before actually deleting
--
-- =====================================================================================

-- STEP 1: Find the user ID (replace the email)
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'elimikel84@gmail.com'; -- CHANGE THIS TO THE ACTUAL EMAIL
  v_portfolios_count INT;
  v_questions_count INT;
  v_comments_count INT;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found', v_user_email;
    RETURN;
  END IF;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'User found: %', v_user_email;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '================================================';
  
  -- Count related records
  SELECT COUNT(*) INTO v_portfolios_count FROM public.portfolios WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_questions_count FROM public.scenario_questions WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_comments_count FROM public.question_comments WHERE user_id = v_user_id;
  
  RAISE NOTICE 'Records that will be deleted:';
  RAISE NOTICE '  - Portfolios: %', v_portfolios_count;
  RAISE NOTICE '  - Questions: %', v_questions_count;
  RAISE NOTICE '  - Comments: %', v_comments_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'To DELETE this user, uncomment the DELETE section below';
  RAISE NOTICE '================================================';
END $$;

-- =====================================================================================
-- STEP 2: Uncomment the section below to ACTUALLY DELETE the user
-- =====================================================================================
/*
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'elimikel84@gmail.com'; -- CHANGE THIS TO THE ACTUAL EMAIL
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', v_user_email;
  END IF;
  
  RAISE NOTICE 'Deleting user: %', v_user_email;
  
  -- Delete from public tables first
  DELETE FROM public.portfolio_rankings WHERE portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = v_user_id);
  DELETE FROM public.user_follows WHERE follower_id = v_user_id OR following_id = v_user_id;
  DELETE FROM public.comment_likes WHERE user_id = v_user_id;
  DELETE FROM public.question_likes WHERE user_id = v_user_id;
  DELETE FROM public.question_tests WHERE user_id = v_user_id;
  DELETE FROM public.question_comments WHERE user_id = v_user_id;
  DELETE FROM public.scenario_questions WHERE user_id = v_user_id;
  DELETE FROM public.portfolios WHERE user_id = v_user_id;
  DELETE FROM public.users WHERE id = v_user_id;
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RAISE NOTICE 'User % deleted successfully', v_user_email;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error deleting user: %', SQLERRM;
END $$;
*/
