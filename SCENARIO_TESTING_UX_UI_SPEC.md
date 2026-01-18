# Scenario Testing - UX/UI Specification

**Status:** Frontend UI Complete - Ready for Backend Integration  
**Branch:** scenario-testing  
**Last Updated:** January 2026

---

## Overview

The scenario testing feature allows authenticated users to test their portfolios against historical market scenarios, view community leaderboards, and engage with other investors. The system includes a community feed, leaderboard rankings, and detailed portfolio comparisons.

---

## Key User Flows

### 1. **Entry Points**

Users can access scenario testing from:

- **Kronos Dashboard** → Tab #4 (Scenarios)
  - Shows top 3 trending questions
  - Quick "Test My Portfolio" button
  - Link to full community
  
- **Scenario Testing Lab** (`/scenario-testing-lab`)
  - Marketing landing page with statistics
  - Hero section and CTAs
  
- **Community Page** (`/scenario-testing/questions`)
  - Full feed of scenario questions
  - Filter tabs: Trending, Recent, Top, Discussed, Following
  - Social engagement metrics

---

## Authentication & Authorization

### **Protected Actions** (Require Authentication)
All interactive features require user authentication:
- ✅ Test My Portfolio (main button)
- ✅ View Community
- ✅ View Question Details
- ✅ Test Portfolio (on cards)
- ✅ View Top Portfolios (leaderboard)
- ✅ Create Questions (community)
- ✅ Like/Comment (community)

### **Authentication Flow**
1. Non-authenticated user clicks protected action
2. `ScenarioAuthModal` appears with:
   - **Choice Screen:** Sign In or Create Account options
   - **Sign Up Screen:** Email (auto-filled), First Name, Last Name, Password
   - **Sign In Screen:** Email and Password
3. On successful auth → Execute pending action

### **Autofill for New Users**
When coming from Kronos Intake Form:
- Email auto-filled (locked/read-only)
- First Name auto-filled
- Last Name auto-filled
- Modal skips "Choice" screen → Goes straight to sign-up
- User only needs to set password

---

## UI Components & Pages

### **1. Kronos Scenarios Tab** (`/kronos` → Tab 4)

**Header Section:**
- Title: "Scenario Testing Lab"
- Description: "Test your portfolio against real-world scenarios..."
- Two buttons:
  - Primary: "Test My Portfolio" (Teal) → Tests current portfolio
  - Secondary: "View Community" (Gray) → Goes to `/scenario-testing/questions`

**Portfolio Status** (if authenticated & has portfolio):
- Green checkmark + "Your portfolio is ready for testing!"

**Top 3 Questions Preview:**
- Question cards matching community feed style
- Shows title, description, historical period
- Engagement metrics: likes, comments, tests
- Action buttons: "View Details", "Test Portfolio", "Top Portfolios"
- All require authentication

**Information Section:**
- "How Scenario Testing Works" explanation
- Tags: "Historical Analysis", "Portfolio Comparison"

---

### **2. Community Feed** (`/scenario-testing/questions`)

**Header Area:**
- Filter tabs: [Trending] [Recent] [Top] [Discussed] [Following]
- Stats bar: Members, Questions count, Active today, Live indicator

**Community Stats:**
- Total members in community
- Number of questions
- Active users today
- Live status badge

**Question Cards:**
- Author info with avatar
- Question text in gradient banner
- Historical period analog (era name, years)
- Engagement metrics: likes, comments, tests
- Action buttons:
  - "View Details" - Opens question page
  - "Test Portfolio" - Requires auth
  - "Top Portfolios" - View leaderboard

**Load More Button:**
- Pagination placeholder for future implementation

---

### **3. Top Portfolios / Leaderboard** (`/scenario-testing/[questionId]/top-portfolios`)

**Header:**
- Back button to questions
- Question title in gradient box
- Historical period info

**Stats Cards:**
- Investors testing count
- Average return percentage
- Number of top portfolios

**Leaderboard Rankings:**
- Rank badges: 🥇 🥈 🥉 (top 3 colored)
- Portfolio name
- Username/creator
- Expected return percentage
- Score (color-coded by tier):
  - **90-100:** Excellent (Green)
  - **75-89:** Strong (Teal)
  - **60-74:** Moderate (Orange)
  - **0-59:** Weak (Red)

**Score Tier Legend:**
- Shows all tiers with color indicators

---

### **4. Portfolio Testing Modal** (After clicking "Test Portfolio")

**Modal Options:**
1. Select user's own portfolios
2. Select community portfolios

**After Selection:**
- Loading overlay shows: "Running Portfolio Test"
- "Analyzing your allocation..."
- "Finding best historical analog..."

---

### **5. Test Results Modal** (After test completes)

**Three Tabs:**

#### **Tab 1: Overview**
- Score display (large gradient number)
- Historical Analog Match:
  - Time period
  - Similarity percentage (progress bar)
  - Matching factors checklist
- Expected metrics:
  - Expected Return (color: red/green based on direction)
  - Best Case (green)
  - Worst Case (red)

#### **Tab 2: Performance Over Time**
- Line chart: Your Portfolio vs TIME Portfolio
- Performance stats below
- Key insights with checkmarks
- Return comparison

#### **Tab 3: Detailed Comparison** (if data available)
- Side-by-side portfolio cards
- Your Portfolio vs TIME Portfolio
- Top 5 positions for each
- Return/Upside/Downside metrics
- Performance summary with differences

---

### **6. Results Page** (`/scenario-testing/[questionId]/results`)

**Full-Page Portfolio Comparison:**
- Uses `PortfolioTab` component
- Side-by-side detailed breakdown
- Action buttons:
  - "Try Another Scenario"
  - "View My Portfolios"

---

## Data Structures

### **ScenarioQuestion**
```typescript
{
  id: string;
  title: string;
  question_text: string;
  historical_period: Array<{
    start: string;
    end: string;
    label: string;
  }>;
  tags: string[];
  likes_count: number;
  comments_count: number;
  tests_count: number;
  author: { first_name, last_name, email };
  is_liked_by_user: boolean;
}
```

### **TestResultData**
```typescript
{
  score: number;
  expectedReturn: number;
  expectedUpside: number;
  expectedDownside: number;
  confidence?: number; // 0-100
  historicalAnalog?: {
    period: string;
    similarity: number;
    matchingFactors: string[];
  };
  portfolioName?: string;
  questionTitle?: string;
}
```

### **PortfolioComparison**
```typescript
{
  userPortfolio: {
    totalValue: number;
    expectedReturn: number;
    upside: number;
    downside: number;
    topPositions: Array<{
      ticker: string;
      name: string;
      weight: number;
      expectedReturn: number;
      monteCarlo: { median, upside, downside, volatility };
    }>;
  };
  timePortfolio: { same structure };
  timeHorizon: number;
}
```

---

## API Endpoints Expected

### **Scenario Questions**
- `GET /api/community/questions?sort=trending&limit=3` - Get top questions
- `GET /api/community/questions?filter=recent&limit=20` - Get filtered questions
- `GET /api/community/questions/[id]` - Get single question details
- `POST /api/community/questions` - Create new question (authenticated)

### **Scenario Tests**
- `POST /api/community/questions/[id]/tests` - Run portfolio test against scenario
- `GET /api/community/questions/[id]/tests?limit=10` - Get leaderboard
- `GET /api/community/questions/[id]/tests/results/[testId]` - Get test results

### **Community Engagement**
- `POST /api/community/questions/[id]/like` - Like question
- `DELETE /api/community/questions/[id]/like` - Unlike question
- `POST /api/community/questions/[id]/comments` - Add comment
- `GET /api/community/questions/[id]/comments` - Get comments

### **Portfolio Tests**
- `POST /api/portfolio-tests/run` - Run scenario test with portfolio data
- `GET /api/portfolio-tests/[testId]` - Get test results details

---

## Current State

### **✅ Implemented (Frontend Only)**
- Complete UI for all pages and modals
- Authentication gates on all protected actions
- Community feed with filtering
- Leaderboard display with score tiers
- Test results modal with 3 tabs
- Portfolio comparison layout
- Autofill for intake form data
- Session storage for portfolio data
- Mock data displays

### **🔄 Needs Backend Integration**
- Actual scenario testing calculations
- Portfolio analysis against scenarios
- Historical analog matching algorithm
- Monte Carlo simulations
- Leaderboard ranking logic
- Test result storage and retrieval
- Community engagement tracking (likes, comments)
- User test history

---

## Key Technical Notes

### **Component Structure**
- `ScenarioAuthModal` - Authentication modal with auto-fill
- `ScenarioTestingTab` - Kronos dashboard scenarios tab
- `PostCard` - Community question card component
- `TestResultsModal` - Results display modal
- `PortfolioTab` - Portfolio comparison component

### **State Management**
- Intake data passed through props from PortfolioDashboard
- SessionStorage for portfolio ID during testing
- AuthContext for user authentication state
- Local state for modal visibility and form data

### **Database Integration Points**
- Supabase Auth for user authentication
- `public.users` table for user profiles
- Need: `scenarios` table for questions
- Need: `portfolio_tests` table for test results
- Need: `leaderboard_scores` table for rankings

---

## Design System

### **Colors**
- Primary Blue: `#1A3A5F`
- Secondary Teal: `#1FAAA3` (CTAs, highlights)
- Accent Gold: `#E3B23C`
- Success: `#10B981` (Green)
- Warning: `#EF4444` (Red)
- Backgrounds: Dark gradients `#0a0e1a` to `#0f1420`

### **Typography & Spacing**
- Font: Tailwind defaults
- Responsive: Mobile-first approach
- Breakpoints: SM (640px), MD (1024px), LG (1280px)

---

## Next Steps for Backend

1. **Scenario Testing Engine**
   - Implement portfolio scoring algorithm
   - Create Monte Carlo simulation logic
   - Develop historical analog matching

2. **Database Schema**
   - Create scenarios table
   - Create portfolio_tests table
   - Create leaderboard_scores table
   - Create test_results table with detailed metrics

3. **API Endpoints**
   - Build all listed endpoints above
   - Implement test result calculations
   - Create leaderboard ranking system

4. **Integration**
   - Connect UI modals to real API calls
   - Replace mock data with database queries
   - Implement real-time leaderboard updates

---

*This document reflects the current frontend implementation. Backend integration will enable all interactive features.*
