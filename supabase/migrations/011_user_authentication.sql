-- User Authentication & Portfolio Management Schema
-- Part of Phase 1: Authentication Layer
-- Created: January 2026

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Extended profile for authenticated users
-- Links to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- User preferences
  preferences JSONB DEFAULT '{
    "email_notifications": true,
    "public_profile": false,
    "show_in_leaderboard": true
  }'::jsonb,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- PORTFOLIOS TABLE
-- ============================================================================
-- Saved portfolio tests linked to users
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  -- Portfolio details
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  description TEXT,
  
  -- Portfolio data
  portfolio_data JSONB NOT NULL,
  intake_data JSONB NOT NULL,
  analysis_results JSONB,
  
  -- Scoring
  portfolio_score NUMERIC,
  goal_probability NUMERIC,
  risk_score NUMERIC,
  cycle_score NUMERIC,
  
  -- Visibility
  is_public BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- PORTFOLIO RANKINGS (Future: Phase 3)
-- ============================================================================
-- Leaderboard system for gamification
CREATE TABLE IF NOT EXISTS public.portfolio_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  
  -- Ranking details
  rank INTEGER,
  score NUMERIC NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all-time')),
  category TEXT, -- 'high-risk', 'medium-risk', 'low-risk', 'overall'
  
  -- Timestamps
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one ranking per portfolio per period per category
  CONSTRAINT unique_portfolio_ranking UNIQUE (portfolio_id, period, category)
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Portfolios
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_conversation_id ON public.portfolios(conversation_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON public.portfolios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_score ON public.portfolios(portfolio_score DESC);
CREATE INDEX IF NOT EXISTS idx_portfolios_public ON public.portfolios(is_public) WHERE is_public = true;

-- Rankings
CREATE INDEX IF NOT EXISTS idx_rankings_portfolio_id ON public.portfolio_rankings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_rankings_period_rank ON public.portfolio_rankings(period, rank);
CREATE INDEX IF NOT EXISTS idx_rankings_score ON public.portfolio_rankings(score DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Update updated_at timestamp on users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp on portfolios
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_rankings ENABLE ROW LEVEL SECURITY;

-- Users: Can only see and modify their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Portfolios: Users can manage their own portfolios
CREATE POLICY "Users can view own portfolios"
  ON public.portfolios FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own portfolios"
  ON public.portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
  ON public.portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios"
  ON public.portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- Rankings: Public read access, system write only
CREATE POLICY "Anyone can view rankings"
  ON public.portfolio_rankings FOR SELECT
  USING (true);

-- Note: Rankings INSERT/UPDATE/DELETE should only be done via service role
-- No policies for write operations to prevent user manipulation

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to link anonymous conversations to user after signup
CREATE OR REPLACE FUNCTION public.link_conversation_to_user(
  p_conversation_id UUID,
  p_user_id UUID,
  p_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update conversation with user email if it matches
  UPDATE public.conversations
  SET 
    user_email = p_email,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{user_id}',
      to_jsonb(p_user_id)
    ),
    updated_at = NOW()
  WHERE id = p_conversation_id
    AND (user_email = p_email OR user_email LIKE 'temp@%');
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.portfolios TO authenticated;
GRANT SELECT ON public.portfolio_rankings TO authenticated;

-- Grant access to service role (for system operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'User profiles linked to Supabase auth';
COMMENT ON TABLE public.portfolios IS 'Saved portfolio tests and analysis results';
COMMENT ON TABLE public.portfolio_rankings IS 'Leaderboard rankings for gamification';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile on signup';
COMMENT ON FUNCTION public.link_conversation_to_user(UUID, UUID, TEXT) IS 'Links anonymous conversations to authenticated users';
