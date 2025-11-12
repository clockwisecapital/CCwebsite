-- Migration: Create intake_forms table
-- Created: 2025-11-12
-- Purpose: Store all intake form submissions with structured fields

-- Create intake_forms table
CREATE TABLE IF NOT EXISTS intake_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  
  -- Personal Information
  age INTEGER,
  experience_level TEXT CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced')),
  risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  
  -- Financial Goals
  goal_amount DECIMAL(15, 2),
  goal_description TEXT,
  time_horizon INTEGER, -- in years
  monthly_contribution DECIMAL(15, 2),
  
  -- Portfolio Information
  portfolio_total_value DECIMAL(15, 2),
  portfolio_stocks DECIMAL(5, 2),
  portfolio_bonds DECIMAL(5, 2),
  portfolio_cash DECIMAL(5, 2),
  portfolio_real_estate DECIMAL(5, 2),
  portfolio_commodities DECIMAL(5, 2),
  portfolio_alternatives DECIMAL(5, 2),
  portfolio_description TEXT,
  
  -- Specific Holdings (stored as JSONB array)
  specific_holdings JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT intake_forms_conversation_id_fkey 
    FOREIGN KEY (conversation_id) 
    REFERENCES conversations(id) 
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_intake_forms_conversation_id ON intake_forms(conversation_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_session_id ON intake_forms(session_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_email ON intake_forms(email);
CREATE INDEX IF NOT EXISTS idx_intake_forms_created_at ON intake_forms(created_at DESC);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_intake_forms_updated_at ON intake_forms;
CREATE TRIGGER update_intake_forms_updated_at
  BEFORE UPDATE ON intake_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE intake_forms IS 'Stores all intake form submissions from the Portfolio Dashboard';
COMMENT ON COLUMN intake_forms.time_horizon IS 'Years to achieve the financial goal';
COMMENT ON COLUMN intake_forms.specific_holdings IS 'Array of holdings with name, ticker, and percentage';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on intake_forms table
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for backend API operations)
CREATE POLICY "Service role has full access to intake_forms"
  ON intake_forms
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own intake forms (based on email)
CREATE POLICY "Users can read their own intake forms"
  ON intake_forms
  FOR SELECT
  TO authenticated
  USING (
    email = auth.jwt() ->> 'email'
  );

-- Policy: Allow anon role to insert (for unauthenticated form submissions)
-- This allows the public API to save intake forms before user authentication
CREATE POLICY "Allow anonymous insert for intake forms"
  ON intake_forms
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Note: Only service role can update or delete intake forms
-- This ensures data integrity and prevents unauthorized modifications
