-- Migration: Add user_rating column for experience feedback
-- Created: 2025-11-19
-- Purpose: Track user satisfaction ratings (1-10) for A/B test analysis

-- Add user_rating column to intake_forms table
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS user_rating INTEGER 
CHECK (user_rating >= 1 AND user_rating <= 10);

-- Add rating_submitted_at timestamp
ALTER TABLE intake_forms
ADD COLUMN IF NOT EXISTS rating_submitted_at TIMESTAMP WITH TIME ZONE;

-- Create index for analytics queries on rating
CREATE INDEX IF NOT EXISTS idx_intake_forms_user_rating 
ON intake_forms(user_rating);

-- Create composite index for variant comparison analytics
CREATE INDEX IF NOT EXISTS idx_intake_forms_variant_rating 
ON intake_forms(avatar_variant, user_rating) 
WHERE user_rating IS NOT NULL;

-- Add comments
COMMENT ON COLUMN intake_forms.user_rating IS 'User satisfaction rating 1-10 for experience evaluation';
COMMENT ON COLUMN intake_forms.rating_submitted_at IS 'Timestamp when user submitted their rating';
