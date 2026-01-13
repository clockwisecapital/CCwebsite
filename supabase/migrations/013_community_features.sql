-- =====================================================================================
-- Community Features for Scenario Testing Platform
-- =====================================================================================
-- This migration adds tables for user-generated questions, engagement, and comments
-- Enables a community-driven portfolio testing experience

-- =====================================================================================
-- 1. QUESTIONS TABLE
-- =====================================================================================
-- User-generated scenario questions that portfolios can be tested against
CREATE TABLE IF NOT EXISTS public.scenario_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Question Content
  title TEXT NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 2000),
  question_text TEXT NOT NULL CHECK (char_length(question_text) >= 10 AND char_length(question_text) <= 500),
  
  -- Historical Context
  historical_period JSONB DEFAULT '[]'::jsonb, -- [{start: "2006", end: "2008", label: "Pre-GFC"}]
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- ["recession", "defense", "bonds"]
  
  -- Engagement Metrics
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  tests_count INTEGER DEFAULT 0 CHECK (tests_count >= 0),
  views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for questions
CREATE INDEX idx_scenario_questions_user_id ON public.scenario_questions(user_id);
CREATE INDEX idx_scenario_questions_created_at ON public.scenario_questions(created_at DESC);
CREATE INDEX idx_scenario_questions_last_activity ON public.scenario_questions(last_activity_at DESC);
CREATE INDEX idx_scenario_questions_likes_count ON public.scenario_questions(likes_count DESC);
CREATE INDEX idx_scenario_questions_tests_count ON public.scenario_questions(tests_count DESC);
CREATE INDEX idx_scenario_questions_is_active ON public.scenario_questions(is_active) WHERE is_active = true;
CREATE INDEX idx_scenario_questions_is_featured ON public.scenario_questions(is_featured) WHERE is_featured = true;
CREATE INDEX idx_scenario_questions_tags ON public.scenario_questions USING gin(tags);

-- =====================================================================================
-- 2. QUESTION LIKES TABLE
-- =====================================================================================
-- Track which users have liked which questions
CREATE TABLE IF NOT EXISTS public.question_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.scenario_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one like per user per question
  UNIQUE(question_id, user_id)
);

-- Indexes for likes
CREATE INDEX idx_question_likes_question_id ON public.question_likes(question_id);
CREATE INDEX idx_question_likes_user_id ON public.question_likes(user_id);
CREATE INDEX idx_question_likes_created_at ON public.question_likes(created_at DESC);

-- =====================================================================================
-- 3. QUESTION COMMENTS TABLE
-- =====================================================================================
-- Discussion threads on scenario questions
CREATE TABLE IF NOT EXISTS public.question_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.scenario_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.question_comments(id) ON DELETE CASCADE,
  
  -- Comment Content
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
  
  -- Engagement
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  
  -- Status
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for comments
CREATE INDEX idx_question_comments_question_id ON public.question_comments(question_id);
CREATE INDEX idx_question_comments_user_id ON public.question_comments(user_id);
CREATE INDEX idx_question_comments_parent ON public.question_comments(parent_comment_id);
CREATE INDEX idx_question_comments_created_at ON public.question_comments(created_at DESC);

-- =====================================================================================
-- 4. COMMENT LIKES TABLE
-- =====================================================================================
-- Track which users have liked which comments
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.question_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one like per user per comment
  UNIQUE(comment_id, user_id)
);

-- Indexes for comment likes
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);

-- =====================================================================================
-- 5. QUESTION TESTS TABLE
-- =====================================================================================
-- Track portfolio test results against scenario questions
CREATE TABLE IF NOT EXISTS public.question_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.scenario_questions(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Test Results
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  expected_return DECIMAL(10,4),
  upside DECIMAL(10,4),
  downside DECIMAL(10,4),
  
  -- Result Data
  comparison_data JSONB DEFAULT '{}'::jsonb, -- Full PortfolioComparison object
  
  -- Status
  is_public BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for tests
CREATE INDEX idx_question_tests_question_id ON public.question_tests(question_id);
CREATE INDEX idx_question_tests_portfolio_id ON public.question_tests(portfolio_id);
CREATE INDEX idx_question_tests_user_id ON public.question_tests(user_id);
CREATE INDEX idx_question_tests_score ON public.question_tests(score DESC);
CREATE INDEX idx_question_tests_created_at ON public.question_tests(created_at DESC);
CREATE INDEX idx_question_tests_public ON public.question_tests(is_public) WHERE is_public = true;

-- =====================================================================================
-- 6. USER FOLLOWS TABLE
-- =====================================================================================
-- Enable users to follow other users for their questions
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

-- Indexes for follows
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

-- =====================================================================================
-- 7. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================================================

-- Update updated_at timestamp on scenario_questions
CREATE OR REPLACE FUNCTION update_scenario_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scenario_questions_updated_at
  BEFORE UPDATE ON public.scenario_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_scenario_questions_updated_at();

-- Update updated_at timestamp on question_comments
CREATE OR REPLACE FUNCTION update_question_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_question_comments_updated_at
  BEFORE UPDATE ON public.question_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_question_comments_updated_at();

-- =====================================================================================
-- 8. TRIGGERS FOR ENGAGEMENT COUNTER UPDATES
-- =====================================================================================

-- Update likes_count on scenario_questions when question_likes changes
CREATE OR REPLACE FUNCTION update_question_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.scenario_questions
    SET likes_count = likes_count + 1,
        last_activity_at = now()
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.scenario_questions
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_question_likes_count
  AFTER INSERT OR DELETE ON public.question_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_question_likes_count();

-- Update comments_count on scenario_questions when question_comments changes
CREATE OR REPLACE FUNCTION update_question_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.scenario_questions
    SET comments_count = comments_count + 1,
        last_activity_at = now()
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.scenario_questions
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_question_comments_count
  AFTER INSERT OR DELETE ON public.question_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_question_comments_count();

-- Update tests_count on scenario_questions when question_tests changes
CREATE OR REPLACE FUNCTION update_question_tests_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.scenario_questions
    SET tests_count = tests_count + 1,
        last_activity_at = now()
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.scenario_questions
    SET tests_count = GREATEST(0, tests_count - 1)
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_question_tests_count
  AFTER INSERT OR DELETE ON public.question_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_question_tests_count();

-- Update likes_count on question_comments when comment_likes changes
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.question_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.question_comments
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_likes_count
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_likes_count();

-- =====================================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE public.scenario_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- SCENARIO QUESTIONS POLICIES
-- =====================================================================================

-- Anyone can view active questions
CREATE POLICY "Anyone can view active questions"
  ON public.scenario_questions
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can create questions
CREATE POLICY "Authenticated users can create questions"
  ON public.scenario_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own questions
CREATE POLICY "Users can update own questions"
  ON public.scenario_questions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own questions
CREATE POLICY "Users can delete own questions"
  ON public.scenario_questions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================================================
-- QUESTION LIKES POLICIES
-- =====================================================================================

-- Anyone can view likes
CREATE POLICY "Anyone can view question likes"
  ON public.question_likes
  FOR SELECT
  USING (true);

-- Authenticated users can like questions
CREATE POLICY "Authenticated users can like questions"
  ON public.question_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike questions
CREATE POLICY "Users can unlike questions"
  ON public.question_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================================================
-- QUESTION COMMENTS POLICIES
-- =====================================================================================

-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
  ON public.question_comments
  FOR SELECT
  USING (is_deleted = false);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON public.question_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.question_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.question_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================================================
-- COMMENT LIKES POLICIES
-- =====================================================================================

-- Anyone can view comment likes
CREATE POLICY "Anyone can view comment likes"
  ON public.comment_likes
  FOR SELECT
  USING (true);

-- Authenticated users can like comments
CREATE POLICY "Authenticated users can like comments"
  ON public.comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike comments
CREATE POLICY "Users can unlike comments"
  ON public.comment_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================================================
-- QUESTION TESTS POLICIES
-- =====================================================================================

-- Anyone can view public test results
CREATE POLICY "Anyone can view public test results"
  ON public.question_tests
  FOR SELECT
  USING (is_public = true);

-- Users can view their own private tests
CREATE POLICY "Users can view own test results"
  ON public.question_tests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can submit test results
CREATE POLICY "Authenticated users can submit tests"
  ON public.question_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own test results
CREATE POLICY "Users can update own tests"
  ON public.question_tests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================================================
-- USER FOLLOWS POLICIES
-- =====================================================================================

-- Anyone can view follows
CREATE POLICY "Anyone can view follows"
  ON public.user_follows
  FOR SELECT
  USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON public.user_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON public.user_follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- =====================================================================================
-- 10. HELPER FUNCTIONS
-- =====================================================================================

-- Function to get trending questions (weighted by recency and engagement)
CREATE OR REPLACE FUNCTION get_trending_questions(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  question_text TEXT,
  user_id UUID,
  likes_count INTEGER,
  comments_count INTEGER,
  tests_count INTEGER,
  created_at TIMESTAMPTZ,
  trending_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.title,
    q.description,
    q.question_text,
    q.user_id,
    q.likes_count,
    q.comments_count,
    q.tests_count,
    q.created_at,
    -- Trending score: weighted by engagement and recency
    (
      (q.likes_count * 1.0) +
      (q.comments_count * 2.0) +
      (q.tests_count * 3.0) +
      -- Recency bonus (more recent = higher score)
      (EXTRACT(EPOCH FROM (now() - q.created_at)) / 3600.0 * -0.1)
    )::DECIMAL as trending_score
  FROM public.scenario_questions q
  WHERE q.is_active = true
  ORDER BY trending_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================================
-- COMPLETED
-- =====================================================================================

COMMENT ON TABLE public.scenario_questions IS 'User-generated scenario questions for portfolio testing';
COMMENT ON TABLE public.question_likes IS 'Likes/upvotes on scenario questions';
COMMENT ON TABLE public.question_comments IS 'Comments and discussions on questions';
COMMENT ON TABLE public.comment_likes IS 'Likes on individual comments';
COMMENT ON TABLE public.question_tests IS 'Portfolio test results for each scenario question';
COMMENT ON TABLE public.user_follows IS 'User follow relationships';
