# Clockwise Admin Dashboard Documentation

## Overview
Multi-tenant admin dashboard for tracking conversations, analyzing user data, and managing potential clients from the Clockwise Capital portfolio analysis system. Supports role-based access control for Clockwise (master) and partner advisory firms.

## Access Information

### User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Master** | Clockwise Capital admin | Full access to all clients, can assign clients to firms, manage users |
| **Advisor** | Partner advisory firm | View assigned clients + unassigned clients, full client management within scope |

### Initial Login Credentials

| Username | Default Password | Role | Firm |
|----------|-----------------|------|------|
| clockwise | Clockwise2025! | Master | - |
| lfpadvisors | LFPAdvisors2025! | Advisor | LFP Advisors |
| legado | Legado2025! | Advisor | Legado Wealth Management |
| financialgym | FinancialGym2025! | Advisor | The Financial Gym |

> **Note**: Default passwords should be changed after first login. Passwords are updated automatically on first successful login.

### URLs
- **Login**: `/admin/login`
- **Dashboard**: `/admin/dashboard`
- **User Management**: `/admin/users` (master only)

### Security Features
- JWT-based authentication with secure HTTP-only cookies
- Role-based access control (RBAC)
- Route protection middleware for all `/admin/*` paths
- bcrypt password hashing
- Automatic session expiration (8 hours)
- Admin token verification on all API calls

## Dashboard Features

### Master Role Features

#### Client Assignment
- Assign individual clients to advisory firms via dropdown
- Bulk selection and assignment of multiple clients
- Filter clients by assignment status (assigned/unassigned)
- Filter clients by specific firm
- View assignment statistics by firm

#### User Management (`/admin/users`)
- View all admin users
- Create new advisor accounts
- Edit user details (display name, email)
- Reset user passwords
- Activate/deactivate accounts
- Delete advisor accounts

### All Roles Features

#### Analytics Overview
- **Total Conversations**: Conversation count (all time for master, visible for advisors)
- **Unique Emails**: Number of distinct email addresses captured
- **Completed Analysis**: Conversations that reached analysis stage
- **Average Lead Score**: Overall lead quality metric

#### Business Intelligence
- **Goal Type Distribution**: Growth vs Income vs Both preferences
- **Portfolio Size Distribution**: Investment amount categories
- **New Investor Count**: Users without existing portfolios
- **High-Value Leads**: Conversations with lead score ≥80

#### Lead Scoring System

**Scoring Breakdown (Max 100 points):**
- Email Provided: +20 points
- Goals Completed: +25 points
- Portfolio Data: +25 points
- Analysis Completed: +30 points
- High Portfolio Value (>$100k): +20 points
- Recent Activity (<24h): +10 points

**Lead Quality Indicators:**
- 🟢 **80-100**: High-value leads (ready for outreach)
- 🟡 **60-79**: Medium-quality leads (nurture candidates)
- 🔴 **0-59**: Low-engagement leads (re-engagement needed)

#### Conversation Tracking

**Status Categories:**
- **Completed**: Full analysis delivered
- **Portfolio Collected**: Has portfolio data, pending analysis
- **Goals Collected**: Has investment goals, needs portfolio
- **Email Captured**: Has email, needs goals/portfolio
- **In Progress**: Active conversation, no email yet

**Sortable Columns:**
- Lead Score (highest to lowest)
- Creation Date (newest to oldest)
- Portfolio Value (highest to lowest)

## API Endpoints

### Authentication
- `POST /api/admin/auth` - Login with credentials
- `GET /api/admin/auth` - Get current user info
- `DELETE /api/admin/auth` - Logout and clear session

### Dashboard Data
- `GET /api/admin/dashboard?timeframe=week&limit=100` - Main dashboard data
  - Additional params for master: `&firm=LFP%20Advisors&assignment=unassigned`
- `GET /api/admin/conversation/[id]` - Individual conversation details

### Client Assignments (Master Only)
- `GET /api/admin/assignments` - Get all assignments
- `POST /api/admin/assignments` - Assign client(s) to firm
- `DELETE /api/admin/assignments` - Unassign client(s)
- `PATCH /api/admin/assignments` - Bulk assignment with filters

### User Management (Master Only)
- `GET /api/admin/users` - List all admin users
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users/[id]` - Get user details
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `POST /api/admin/users/[id]/password` - Reset password

### Data Export
- `GET /api/admin/export?format=csv&timeframe=month` - Export lead data

## Database Schema

### admin_users Table
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master', 'advisor')),
  firm_name TEXT,
  display_name TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### client_assignments Table
```sql
CREATE TABLE client_assignments (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  assigned_to_firm TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  notes TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_conversation_assignment UNIQUE (conversation_id)
);
```

## Visibility Rules

### Master Role (Clockwise)
- Can see ALL conversations regardless of assignment
- Can see assignment statistics
- Can filter by firm or assignment status
- Can assign/unassign clients
- Can manage user accounts

### Advisor Role (Partner Firms)
- Can see conversations assigned to their firm
- Can see unassigned conversations
- **Cannot** see conversations assigned to other firms
- **Cannot** assign/unassign clients
- **Cannot** access user management

## Setup Instructions

1. **Run Database Migration**
   ```bash
   # Run the migration in Supabase SQL Editor
   # File: supabase/migrations/005_admin_roles.sql
   ```

2. **Install Dependencies**
   ```bash
   npm install bcryptjs @types/bcryptjs
   ```

3. **Environment Variables**
   Ensure `JWT_SECRET` is set in your environment variables for production.

4. **First Login**
   - Login with default credentials
   - Password will be automatically updated on first successful login
   - Master account should then update all advisor passwords via User Management

## Security Recommendations

1. **Change Default Passwords**: Update all default passwords immediately after setup
2. **Use Strong Passwords**: Minimum 8 characters, mix of letters, numbers, symbols
3. **Regular Password Rotation**: Encourage periodic password changes
4. **Monitor Access**: Review last login timestamps regularly
5. **Deactivate Unused Accounts**: Disable accounts when not needed

## Advisory Firms

| Firm Name | Username |
|-----------|----------|
| LFP Advisors | lfpadvisors |
| Legado Wealth Management | legado |
| The Financial Gym | financialgym |

Each firm can only see and manage clients that have been assigned to them by Clockwise (master role), plus any unassigned clients.
