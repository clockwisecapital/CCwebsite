-- Make description field optional in scenario_questions table
ALTER TABLE public.scenario_questions 
  ALTER COLUMN description DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.scenario_questions.description IS 'Optional description - can be auto-generated from historical period';
