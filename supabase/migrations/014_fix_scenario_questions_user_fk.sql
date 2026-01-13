-- =====================================================================================
-- Fix scenario_questions foreign key to reference public.users instead of auth.users
-- =====================================================================================

-- Drop the existing foreign key constraint
ALTER TABLE public.scenario_questions 
DROP CONSTRAINT IF EXISTS scenario_questions_user_id_fkey;

-- Add the correct foreign key constraint to public.users
ALTER TABLE public.scenario_questions
ADD CONSTRAINT scenario_questions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Same fix for question_comments
ALTER TABLE public.question_comments
DROP CONSTRAINT IF EXISTS question_comments_user_id_fkey;

ALTER TABLE public.question_comments
ADD CONSTRAINT question_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Same fix for question_likes
ALTER TABLE public.question_likes
DROP CONSTRAINT IF EXISTS question_likes_user_id_fkey;

ALTER TABLE public.question_likes
ADD CONSTRAINT question_likes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Same fix for comment_likes
ALTER TABLE public.comment_likes
DROP CONSTRAINT IF EXISTS comment_likes_user_id_fkey;

ALTER TABLE public.comment_likes
ADD CONSTRAINT comment_likes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Same fix for question_tests
ALTER TABLE public.question_tests
DROP CONSTRAINT IF EXISTS question_tests_user_id_fkey;

ALTER TABLE public.question_tests
ADD CONSTRAINT question_tests_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Same fix for user_follows
ALTER TABLE public.user_follows
DROP CONSTRAINT IF EXISTS user_follows_follower_id_fkey;

ALTER TABLE public.user_follows
ADD CONSTRAINT user_follows_follower_id_fkey 
FOREIGN KEY (follower_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.user_follows
DROP CONSTRAINT IF EXISTS user_follows_following_id_fkey;

ALTER TABLE public.user_follows
ADD CONSTRAINT user_follows_following_id_fkey 
FOREIGN KEY (following_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

COMMENT ON CONSTRAINT scenario_questions_user_id_fkey ON public.scenario_questions IS 'References public.users which links to auth.users';
