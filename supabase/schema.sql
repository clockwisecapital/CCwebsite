-- Clockwise Capital Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE message_role AS ENUM ('user', 'assistant');

-- Conversations table
-- Stores conversation metadata and user email
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Indexes for performance
  CONSTRAINT conversations_session_id_key UNIQUE (session_id)
);

-- Messages table
-- Stores individual messages and AI responses
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  role message_role NOT NULL,
  content TEXT,
  display_spec JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add foreign key constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_conversation_id_fkey'
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages 
    ADD CONSTRAINT messages_conversation_id_fkey 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- User data table
-- Stores goals, portfolio data, and analysis results
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  goals JSONB,
  portfolio_data JSONB,
  analysis_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_data_conversation_id_fkey'
    AND table_name = 'user_data'
  ) THEN
    ALTER TABLE user_data 
    ADD CONSTRAINT user_data_conversation_id_fkey 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_email ON conversations(user_email);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

CREATE INDEX IF NOT EXISTS idx_user_data_conversation_id ON user_data(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_data_created_at ON user_data(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;
CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll refine this later)
-- In production, you'd want more restrictive policies
CREATE POLICY "Allow all operations on conversations" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on user_data" ON user_data
  FOR ALL USING (true) WITH CHECK (true);

-- Create a view for conversation summaries (optional but useful)
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT 
  c.id,
  c.user_email,
  c.session_id,
  c.created_at,
  c.updated_at,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_message_at,
  ud.goals,
  ud.portfolio_data,
  ud.analysis_results
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
LEFT JOIN user_data ud ON c.id = ud.conversation_id
GROUP BY c.id, c.user_email, c.session_id, c.created_at, c.updated_at, ud.goals, ud.portfolio_data, ud.analysis_results;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE conversations IS 'Stores conversation metadata and user email for portfolio analysis sessions';
COMMENT ON TABLE messages IS 'Stores individual messages between user and AI assistant';
COMMENT ON TABLE user_data IS 'Stores structured data collected during conversations (goals, portfolio, analysis)';

COMMENT ON COLUMN conversations.session_id IS 'Unique session identifier from frontend';
COMMENT ON COLUMN conversations.user_email IS 'User email collected during conversation';
COMMENT ON COLUMN messages.role IS 'Either user or assistant message';
COMMENT ON COLUMN messages.display_spec IS 'Structured display data for frontend rendering';
COMMENT ON COLUMN user_data.goals IS 'User investment goals (goal_type, target_amount, timeline_years)';
COMMENT ON COLUMN user_data.portfolio_data IS 'User portfolio holdings and value';
COMMENT ON COLUMN user_data.analysis_results IS 'AI analysis results and recommendations';
