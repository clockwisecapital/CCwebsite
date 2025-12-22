-- Admin Roles and Client Assignments Migration
-- Creates tables for multi-tenant admin access with advisory firm support

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ADMIN USERS TABLE
-- Stores admin credentials with roles (master/advisor) and firm affiliation
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master', 'advisor')),
  firm_name TEXT, -- NULL for master role, firm name for advisors
  display_name TEXT, -- Friendly display name
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_firm ON admin_users(firm_name);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- ============================================================================
-- CLIENT ASSIGNMENTS TABLE
-- Tracks which conversations/clients are assigned to which advisory firm
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  assigned_to_firm TEXT NOT NULL,
  assigned_by TEXT NOT NULL, -- username of admin who made assignment
  notes TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one assignment per conversation
  CONSTRAINT unique_conversation_assignment UNIQUE (conversation_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_client_assignments_conversation ON client_assignments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_client_assignments_firm ON client_assignments(assigned_to_firm);
CREATE INDEX IF NOT EXISTS idx_client_assignments_assigned_by ON client_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_client_assignments_date ON client_assignments(assigned_at DESC);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

-- Add updated_at trigger for admin_users
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for client_assignments
DROP TRIGGER IF EXISTS update_client_assignments_updated_at ON client_assignments;
CREATE TRIGGER update_client_assignments_updated_at
  BEFORE UPDATE ON client_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service role (admin client)
CREATE POLICY "Allow all operations on admin_users" ON admin_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on client_assignments" ON client_assignments
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED DATA - Initial Admin Users
-- Passwords are hashed using bcrypt (cost factor 10)
-- Default passwords (CHANGE IN PRODUCTION):
--   clockwise: Clockwise2025!
--   lfpadvisors: LPFAdvisors2025!
--   legado: Legado2025!
--   financialgym: FinancialGym2025!
-- ============================================================================

-- Insert initial users (passwords will be set via the application)
-- Using placeholder hashes that will be updated on first login or via admin
INSERT INTO admin_users (username, password_hash, role, firm_name, display_name, email, is_active)
VALUES 
  ('clockwise', 
   '$2a$10$placeholder.hash.for.clockwise.master.account', 
   'master', 
   NULL, 
   'Clockwise Capital', 
   'admin@clockwisecapital.com',
   true),
  ('lfpadvisors', 
   '$2a$10$placeholder.hash.for.lfp.advisors.account', 
   'advisor', 
   'LPF Advisors', 
   'LPF Advisors', 
   NULL,
   true),
  ('legado', 
   '$2a$10$placeholder.hash.for.legado.wealth.account', 
   'advisor', 
   'Legado Wealth Management', 
   'Legado Wealth Management', 
   NULL,
   true),
  ('financialgym', 
   '$2a$10$placeholder.hash.for.financial.gym.account', 
   'advisor', 
   'The Financial Gym', 
   'The Financial Gym', 
   NULL,
   true)
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE admin_users IS 'Admin user accounts with role-based access (master for Clockwise, advisor for partner firms)';
COMMENT ON TABLE client_assignments IS 'Tracks which clients/conversations are assigned to which advisory firm';

COMMENT ON COLUMN admin_users.role IS 'User role: master (full access, can assign) or advisor (limited to assigned clients)';
COMMENT ON COLUMN admin_users.firm_name IS 'Advisory firm name for advisor role users, NULL for master role';
COMMENT ON COLUMN admin_users.is_active IS 'Whether the account is active and can log in';

COMMENT ON COLUMN client_assignments.assigned_to_firm IS 'Name of the advisory firm this client is assigned to';
COMMENT ON COLUMN client_assignments.assigned_by IS 'Username of the admin who made the assignment';
COMMENT ON COLUMN client_assignments.notes IS 'Optional notes about the assignment';

