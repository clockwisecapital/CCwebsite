-- Migration: Add metadata column to scenario_questions
-- Created: 2026-01-20
-- Purpose: Store additional question data like S&P 500 returns

-- Add metadata column if it doesn't exist
ALTER TABLE scenario_questions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_scenario_questions_metadata 
ON scenario_questions USING gin(metadata);

-- Add comment explaining the metadata structure
COMMENT ON COLUMN scenario_questions.metadata IS 'JSONB field for storing additional question data. Expected structure: { "sp500_return": number, "custom_fields": {} }';
