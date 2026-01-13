-- Fix LFP to LPF firm name
-- This migration corrects the typo in the firm name from "LFP Advisors" to "LPF Advisors"

-- Update the username from lfpadvisors to lpfadvisors
UPDATE admin_users 
SET 
  username = 'lpfadvisors',
  firm_name = 'LPF Advisors',
  display_name = 'LPF Advisors'
WHERE username = 'lfpadvisors';

-- Update any client assignments that reference the old firm name
UPDATE client_assignments 
SET assigned_to_firm = 'LPF Advisors'
WHERE assigned_to_firm = 'LFP Advisors';

-- Update assigned_by references
UPDATE client_assignments 
SET assigned_by = 'lpfadvisors'
WHERE assigned_by = 'lfpadvisors';

