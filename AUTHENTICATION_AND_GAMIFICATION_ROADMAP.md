# Authentication & Gamification Roadmap

## Overview
Building a web application layer for Kronos portfolio testing that enables users to create accounts, save portfolios, and compete in a gamified leaderboard system.

---

## Phase 1: Authentication Layer ✓ (Current)

### User Flow - Option A + Hybrid
**New Users:**
1. User starts intake form immediately (no auth barrier)
2. Completes portfolio information
3. Provides email/name during intake
4. Views analysis results
5. **Post-analysis prompt**: "Save your results & see how you rank - Create an account"
6. Password creation modal appears
7. Account created automatically, portfolio saved

**Returning Users:**
1. "Sign In" option visible in header
2. Signs in via modal
3. Redirects to dashboard showing:
   - Portfolio history
   - Last tested portfolio
   - Quick access to "Test New Portfolio"

### Technical Implementation
- **Auth Provider**: Supabase Auth (built-in password reset, email verification optional)
- **Database Tables**:
  - `users` - User profiles linked to auth.users
  - `portfolios` - Saved portfolio tests linked to users
  - Link existing `conversations` to user accounts
- **Components**:
  - SignInModal - For returning users
  - CreatePasswordModal - Post-analysis for new users
  - AuthProvider - React context for auth state
- **Security**: Row Level Security (RLS) policies on all user data

---

## Phase 2: User Dashboard (Future)

### Features
- **My Portfolios Page**: List of all tested portfolios with scores
- **Portfolio Details**: Deep dive into any saved analysis
- **Comparison Tool**: Compare current portfolio vs previous tests
- **Profile Management**: Update name, email, password

### Navigation
- Add authenticated routes (`/dashboard`, `/portfolios`)
- Protected routes with middleware
- Header navigation updates based on auth state

---

## Phase 3: Gamification & Social Features (Future)

### Leaderboard System
- **Global Rankings**: Top portfolios by score
- **Time Periods**: Weekly, monthly, all-time
- **Categories**: By risk tolerance level
- **Anonymous Option**: Users can choose to display anonymously

### Compete Against TIME Portfolio
- Show user's portfolio performance vs TIME benchmark
- Historical tracking of user vs TIME over simulated periods
- Achievement badges for beating TIME consistently

### Social Features
- **Public Portfolios**: Users can make portfolios public
- **Portfolio Sharing**: Shareable links with analysis
- **Comments/Reactions**: Community engagement (optional)
- **Challenges**: Weekly portfolio challenges with themes

### Scoring Algorithm
Composite score based on:
- Risk-adjusted returns
- Goal achievement probability
- Portfolio optimization score
- Cycle alignment score
- Diversification metrics

---

## Phase 4: Advanced Features (Wishlist)

- Email notifications for ranking changes
- Portfolio alerts for market cycle shifts
- Mobile app (React Native)
- API access for power users
- Integration with brokerage accounts
- Social login (Google, Apple)
- Portfolio import from brokerages

---

## Technical Architecture Notes

### Database Schema (High-Level)
```
auth.users (Supabase managed)
  └─> users (profile data)
      └─> portfolios (multiple per user)
          └─> conversations (analysis data)
          
portfolio_rankings (leaderboard)
portfolio_comparisons (user vs benchmarks)
achievements (gamification)
```

### Key APIs to Build
- `/api/auth/*` - Authentication endpoints
- `/api/portfolios/*` - Portfolio CRUD
- `/api/leaderboard/*` - Rankings and stats
- `/api/profile/*` - User profile management

### Security Considerations
- RLS policies for multi-tenant data
- Rate limiting on auth endpoints
- CSRF protection
- Email verification for sensitive operations
- Secure session management

---

## Success Metrics

### Phase 1 (Auth)
- User registration rate post-analysis
- Returning user sign-in rate
- Account creation completion rate

### Phase 2 (Dashboard)
- Repeat portfolio tests per user
- Dashboard engagement
- Portfolio comparison usage

### Phase 3 (Gamification)
- Leaderboard page views
- Public portfolio shares
- User retention (7-day, 30-day)
- TIME portfolio challenge participation

---

## Next Steps

1. **Client Feedback**: Present user flow options and get approval
2. **Design Review**: Mockups for auth modals and dashboard
3. **Analytics Setup**: Track user behavior from day one
4. **Beta Testing**: Soft launch with limited users
5. **Iterate**: Based on real usage data

---

*Last Updated: January 2026*
