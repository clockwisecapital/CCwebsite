-- Migration: Add avatar_variant column for A/B testing
-- Created: 2025-11-19
-- Updated: 2025-11-21 - Changed to use variant-b as default (A/B test concluded)
-- Purpose: Track which HeyGen avatar variant was shown to each user

-- Add avatar_variant column to intake_forms table
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS avatar_variant TEXT 
CHECK (avatar_variant IN ('control', 'variant-b'))
DEFAULT 'variant-b';

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_intake_forms_avatar_variant 
ON intake_forms(avatar_variant);

-- Add comment
COMMENT ON COLUMN intake_forms.avatar_variant IS 'Avatar variant used - now defaults to variant-b (A/B test concluded, variant-b selected as standard)';
