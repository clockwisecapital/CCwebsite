-- =====================================================================================
-- Fix User Deletion Cascade Issues
-- =====================================================================================
-- This migration ensures that deleting a user from auth.users properly cascades
-- through all related tables

-- First, let's verify all foreign key constraints are properly set up
-- Drop and recreate the public.users foreign key to ensure it has CASCADE

ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

ALTER TABLE public.users
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Verify portfolios table has CASCADE
ALTER TABLE public.portfolios
DROP CONSTRAINT IF EXISTS portfolios_user_id_fkey;

ALTER TABLE public.portfolios
ADD CONSTRAINT portfolios_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- =====================================================================================
-- Create an admin function to safely delete auth users
-- =====================================================================================
-- This function can be called with service role to delete users from Supabase Auth

CREATE OR REPLACE FUNCTION public.admin_delete_auth_user(user_id_to_delete UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_portfolios_count int;
  v_questions_count int;
  v_comments_count int;
BEGIN
  -- Check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_to_delete) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found in auth.users'
    );
  END IF;

  -- Count related records before deletion
  SELECT COUNT(*) INTO v_portfolios_count FROM public.portfolios WHERE user_id = user_id_to_delete;
  SELECT COUNT(*) INTO v_questions_count FROM public.scenario_questions WHERE user_id = user_id_to_delete;
  SELECT COUNT(*) INTO v_comments_count FROM public.question_comments WHERE user_id = user_id_to_delete;

  -- Delete from public tables first (should be handled by CASCADE but let's be explicit)
  DELETE FROM public.portfolios WHERE user_id = user_id_to_delete;
  DELETE FROM public.scenario_questions WHERE user_id = user_id_to_delete;
  DELETE FROM public.question_comments WHERE user_id = user_id_to_delete;
  DELETE FROM public.question_likes WHERE user_id = user_id_to_delete;
  DELETE FROM public.comment_likes WHERE user_id = user_id_to_delete;
  DELETE FROM public.question_tests WHERE user_id = user_id_to_delete;
  DELETE FROM public.user_follows WHERE follower_id = user_id_to_delete OR following_id = user_id_to_delete;
  DELETE FROM public.portfolio_rankings WHERE portfolio_id IN (SELECT id FROM public.portfolios WHERE user_id = user_id_to_delete);
  
  -- Delete from public.users (this will cascade to any remaining references)
  DELETE FROM public.users WHERE id = user_id_to_delete;
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = user_id_to_delete;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User deleted successfully',
    'deleted_records', jsonb_build_object(
      'portfolios', v_portfolios_count,
      'questions', v_questions_count,
      'comments', v_comments_count
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Error deleting user: ' || SQLERRM,
    'error_detail', SQLSTATE
  );
END;
$$;

-- Grant execute permission to service role only
REVOKE ALL ON FUNCTION public.admin_delete_auth_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_auth_user(UUID) TO service_role;

-- =====================================================================================
-- Create a safer function to get user deletion info before deleting
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.admin_get_user_deletion_info(user_id_to_check UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_user_email text;
  v_portfolios_count int;
  v_questions_count int;
  v_comments_count int;
  v_likes_count int;
BEGIN
  -- Get user info
  SELECT email INTO v_user_email FROM auth.users WHERE id = user_id_to_check;
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;

  -- Count related records
  SELECT COUNT(*) INTO v_portfolios_count FROM public.portfolios WHERE user_id = user_id_to_check;
  SELECT COUNT(*) INTO v_questions_count FROM public.scenario_questions WHERE user_id = user_id_to_check;
  SELECT COUNT(*) INTO v_comments_count FROM public.question_comments WHERE user_id = user_id_to_check;
  SELECT COUNT(*) INTO v_likes_count FROM public.question_likes WHERE user_id = user_id_to_check;

  RETURN jsonb_build_object(
    'success', true,
    'user_email', v_user_email,
    'related_records', jsonb_build_object(
      'portfolios', v_portfolios_count,
      'questions', v_questions_count,
      'comments', v_comments_count,
      'likes', v_likes_count
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Error getting user info: ' || SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_deletion_info(UUID) TO service_role;

COMMENT ON FUNCTION public.admin_delete_auth_user IS 'Safely delete a user from auth.users and all related records. Service role only.';
COMMENT ON FUNCTION public.admin_get_user_deletion_info IS 'Get information about records that will be deleted with a user. Service role only.';
