# Portfolio Page Refactoring Plan

## Executive Summary
Transform the current conversational AI portfolio analysis page into a dashboard-driven interface with integrated HeyGen AI Avatar and tabbed data entry system. This refactoring reduces API calls, streamlines user input, and maintains analysis quality while improving UX.

---

## Current State Analysis

### Existing Architecture
- **Conversational FSM-based flow** (`/src/lib/fsm.ts`)
- **Multi-stage conversation** with AI-driven extraction
- **Data Collection Stages:**
  1. Qualify → Welcome/onboarding
  2. Goals → Goal type selection (growth/income/both)
  3. Amount & Timeline → Target amount and timeline years
  4. Portfolio → Holdings collection (dollar values)
  5. Email Capture → Mandatory email before analysis
  6. Analyze → AI portfolio analysis
  7. Explain → Results presentation
  8. CTA → Consultation booking

### Current Data Points Collected
```javascript
// Goals Stage
- goal_type: "growth" | "income" | "both"

// Amount & Timeline Stage
- goal_amount: number (dollar value)
- horizon_years: number

// Portfolio Stage
- portfolio_holdings: {
    stocks: number,
    bonds: number,
    cash: number,
    real_estate: number,
    commodities: number,
    alternatives: number
  }

// Email Capture Stage
- email: string
- firstName: string (optional)
- lastName: string (optional)
```

---

## New Architecture Overview

### Page Structure

```
┌─────────────────────────────────────────────┐
│  AI Avatar Section (HeyGen Placeholder)     │
│  - Video/Avatar window                      │
│  - Welcome message                          │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Dashboard Tabs                             │
│  ┌─────────┬─────────┐                     │
│  │ 1.Intake│ 2.Review│                     │
│  └─────────┴─────────┘                     │
│                                             │
│  [Tab Content Area]                         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. AI Avatar Section (Top)

**Component:** `AIAvatarSection.tsx`

**Purpose:** Placeholder for future HeyGen AI Avatar integration

**Features:**
- Video container with aspect ratio preservation
- Placeholder state (static image or animation)
- Welcome/instructional text overlay
- Responsive design (desktop/mobile)

**Implementation:**
```tsx
interface AIAvatarSectionProps {
  isPlaceholder?: boolean;
  welcomeMessage?: string;
}

// Placeholder content until HeyGen integration
// Future: HeyGen SDK integration point
```

---

### 2. Dashboard Component

**Component:** `PortfolioDashboard.tsx`

**Features:**
- Tabbed interface (Intake → Review)
- State management for all collected data
- Progress tracking
- Email modal trigger

**Tab Structure:**
1. **Intake Tab** - Data collection forms
2. **Review Tab** - Analysis results and stress testing

---

## Tab 1: Intake Tab Details

### Component: `IntakeTab.tsx`

### Form Sections

#### Section 1: Personal Information
```tsx
Fields:
- Age: number input (optional initially for UX)
- Experience Level: dropdown
  Options: ["Beginner", "Intermediate", "Advanced"]
```

#### Section 2: Investment Goals
```tsx
Fields:
- Income Goal (annual): currency input
  Label: "Income Goal (annual)"
  Placeholder: "$120,000"
  Helper: "Optional – target annual income from your portfolio"

- Accumulation Goal: currency input
  Label: "Accumulation Goal"
  Placeholder: "$2,000,000 by 2030"
  Helper: "Optional – total net worth / portfolio value target and timeline"
```

#### Section 3: Current Portfolio
```tsx
Fields:
- Stocks (%): number input (0-100)
- Bonds (%): number input (0-100)
- Cash (%): number input (0-100)
- Real Estate (%): number input (0-100)
- Commodities (%): number input (0-100)
- Alternatives (%): number input (0-100)

Features:
- Real-time sum calculation
- Visual indicator showing total (must = 100%)
- Auto-validation
- Optional: Free-text portfolio description field
```

#### Section 4: Actions
```tsx
Buttons:
- Reset: Clear all fields
- Begin Analyzing: Primary CTA
  - Validates all required fields
  - Triggers email capture modal
  - Initiates analysis
```

---

## Email Capture Modal

### Component: `EmailCaptureModal.tsx`

**Trigger:** When user clicks "Begin Analyzing" in Intake Tab

**Purpose:** Capture user contact information before analysis

**Fields:**
```tsx
- First Name: text input (required)
- Last Name: text input (required)
- Email: email input (required, validated)

Privacy Notice:
"We'll email your personalized cycle analysis and portfolio review. 
We never sell your data. Privacy Policy."

Actions:
- Cancel: Close modal, return to Intake
- View Analysis: Submit email, trigger analysis, switch to Review tab
```

**Validation:**
- Email format validation
- Required field checking
- Duplicate email handling (allow multiple analyses per email)

---

## Tab 2: Review Tab Details

### Component: `ReviewTab.tsx`

### Layout Structure

```
┌─────────────────────────────────────────────┐
│  Analysis Summary                           │
│  - Generated date/time                      │
│  - User email display                       │
│  - Download PDF button                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Cycle Overview Section                     │
│  - Cycle selector dropdown                  │
│  - Visual cycle indicator (circular gauge)  │
│  - Phase description                        │
│  - Timeline visualization                   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Portfolio Cycle Sync (Stress Test)         │
│  - Current Portfolio display                │
│  - Cycle Score badge                        │
│  - Asset allocation breakdown               │
│  - Benchmark Portfolio comparison           │
│  - "Stress Test Scenarios" button           │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Next Step / CTA Section                    │
│  - Consultation booking CTA                 │
│  - Additional resources                     │
└─────────────────────────────────────────────┘
```

### Sub-Components

#### 1. Cycle Overview Component
**Component:** `CycleOverview.tsx`

**Features:**
- Dropdown to select cycle type:
  - Technology Cycle
  - Economic Cycle (future)
- Circular gauge showing cycle score (0-100)
- Phase indicator (e.g., "Frenzy → Synergy")
- Timeline showing:
  - Historical phases
  - Current position marker
  - Future projection
- Descriptive text explaining current phase

**Data Source:** AI analysis result + `market-context.json`

#### 2. Portfolio Cycle Sync Component
**Component:** `PortfolioCycleSync.tsx`

**Features:**

**Current Portfolio Card:**
- Cycle Score badge (e.g., "Cycle Score: 79")
- Asset allocation breakdown:
  - Stocks: XX%
  - Bonds: XX%
  - Real Estate: XX%
  - Commodities: XX%
- Auto-Cash calculation display
- "View" link to expand details

**Benchmark Portfolio Card:**
- Label: "Clockwise Portfolio" or custom name
- Cycle Score badge
- Asset allocation breakdown
- Benchmark explanation text
- Visual comparison indicator

**Stress Test Section:**
- Button: "Stress Test Scenarios"
- Opens modal/panel with scenario testing
- Future feature: Interactive scenario adjustment

#### 3. Analysis Display Component
**Component:** `AnalysisDisplay.tsx`

**Features:**
- AI-generated analysis text (formatted from API response)
- Key metrics dashboard
- Risk indicators
- Recommendations
- Market context integration

---

## Data Flow Architecture

### 1. Initial State (Intake Tab)
```typescript
interface DashboardState {
  activeTab: 'intake' | 'review';
  intakeData: IntakeFormData | null;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  showEmailModal: boolean;
}

interface IntakeFormData {
  // Personal
  age?: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  
  // Goals
  incomeGoal?: number;
  accumulationGoal?: string; // Free text with timeline
  
  // Portfolio
  portfolio: {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    alternatives: number;
  };
  portfolioDescription?: string;
}
```

### 2. User Flow
```
1. User fills Intake form
2. User clicks "Begin Analyzing"
3. Validation checks pass
4. Email modal appears
5. User enters email + name
6. Submit triggers:
   a. Save to Supabase (conversation + user data)
   b. Call analysis API
   c. Switch to Review tab
   d. Display loading state
7. Analysis completes
8. Review tab populates with results
```

### 3. API Integration

**Endpoint:** `/api/portfolio/analyze` (existing)

**Request Payload:**
```typescript
{
  userId: string; // or sessionId
  email: string;
  firstName: string;
  lastName: string;
  intakeData: IntakeFormData;
  conversationId?: string; // from Supabase
}
```

**Response:**
```typescript
{
  success: boolean;
  analysis: {
    cycleScore: number;
    cyclePhase: string;
    portfolioScore: number;
    recommendations: string[];
    marketContext: object;
    detailedAnalysis: string;
    benchmarkComparison: object;
  };
  conversationId: string;
}
```

---

## Technical Implementation Steps

### Phase 1: Component Structure Setup

**Files to Create:**
```
/src/components/features/portfolio/
├── dashboard/
│   ├── PortfolioDashboard.tsx          # Main dashboard container
│   ├── AIAvatarSection.tsx             # HeyGen placeholder
│   ├── IntakeTab.tsx                   # Data entry tab
│   ├── ReviewTab.tsx                   # Results tab
│   ├── EmailCaptureModal.tsx           # Email collection
│   └── components/
│       ├── CycleOverview.tsx           # Cycle visualization
│       ├── PortfolioCycleSync.tsx      # Stress testing section
│       ├── AnalysisDisplay.tsx         # AI analysis output
│       └── IntakeForm/
│           ├── PersonalInfoSection.tsx
│           ├── GoalsSection.tsx
│           └── PortfolioSection.tsx
```

### Phase 2: State Management

**Approach:** React Context or Zustand for dashboard state

```typescript
// /src/lib/stores/portfolioDashboardStore.ts
interface PortfolioDashboardStore {
  // State
  activeTab: 'intake' | 'review';
  intakeData: IntakeFormData | null;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  showEmailModal: boolean;
  
  // Actions
  setActiveTab: (tab: 'intake' | 'review') => void;
  updateIntakeData: (data: Partial<IntakeFormData>) => void;
  submitForAnalysis: (email: EmailData) => Promise<void>;
  resetDashboard: () => void;
}
```

### Phase 3: Integration Points

#### A. Remove/Refactor Existing Components
```
Files to deprecate/remove:
- /src/components/features/portfolio/ConversationalChat.tsx (archive)
- /src/components/features/portfolio/PortfolioChat.tsx (archive)

Files to refactor:
- /src/lib/fsm.ts → Extract analysis logic only
- Keep: Analysis transformation functions
- Remove: Conversation flow logic
```

#### B. API Route Updates
```typescript
// /src/app/api/portfolio/analyze/route.ts
// Update to accept dashboard data format instead of conversation format

POST /api/portfolio/analyze
{
  // New streamlined format
  userData: { email, firstName, lastName },
  intakeData: { goals, portfolio, experience }
}

// Still returns same analysis structure
// Leverage existing analysis engine
```

#### C. Supabase Integration
```typescript
// Update conversation storage for dashboard flow
// /src/lib/supabase/db-utils.ts

async function createDashboardConversation(data: {
  email: string;
  firstName: string;
  lastName: string;
  intakeData: IntakeFormData;
  analysisResult: AnalysisResult;
}) {
  // Store complete dashboard submission as single conversation
  // No multi-message conversation needed
}
```

---

## UI/UX Specifications

### Design System Alignment

**Colors:** Match existing Clockwise Capital brand
- Primary: Teal/Cyan (#0D9488)
- Secondary: Deep Blue (#1E3A8A)
- Accent: Green (#10B981)
- Backgrounds: Light Gray (#F9FAFB)

**Typography:**
- Headings: 'Poppins' (existing site standard)
- Body: 'Inter' (existing site standard)

**Component Styling:**
- Use Tailwind CSS utilities
- Match existing button styles from site
- Consistent form field styling
- Responsive breakpoints align with current site

### Responsive Behavior

**Desktop (≥1024px):**
- Side-by-side layout for comparison views
- Full dashboard width
- Avatar section: 16:9 aspect ratio

**Tablet (768px - 1023px):**
- Stacked layout
- Full-width tabs
- Avatar section: 16:9 aspect ratio

**Mobile (<768px):**
- Single column
- Collapsible sections
- Avatar section: 4:3 aspect ratio
- Simplified stress test view

---

## Migration Strategy

### Step 1: Build New Components (Parallel)
- Create new dashboard structure
- Keep existing conversation flow functional
- Build behind feature flag if needed

### Step 2: Data Mapping Layer
```typescript
// /src/lib/adapters/dashboardToConversation.ts
// Map dashboard data to existing analysis format
function mapDashboardToAnalysisInput(intakeData: IntakeFormData) {
  return {
    goals: {
      goal_type: deriveGoalType(intakeData),
      goal_amount: intakeData.incomeGoal || intakeData.accumulationGoal,
      horizon_years: extractTimelineYears(intakeData.accumulationGoal),
    },
    portfolio: intakeData.portfolio,
    // ... etc
  };
}
```

### Step 3: Replace Portfolio Page Route
```typescript
// /src/app/portfolio/page.tsx
// Old: <ConversationalChat />
// New: <PortfolioDashboard />
```

### Step 4: Archive Old Components
- Move conversational components to `/archive` folder
- Keep FSM analysis logic
- Document migration in CHANGELOG

---

## API Call Optimization

### Current Flow (Conversational)
```
API calls per user journey:
1. /api/chat/stream × ~15-20 calls (conversation turns)
2. /api/portfolio/analyze × 1 call
3. /api/validateData × 3-5 calls (per stage)

Total: ~20-25 API calls
```

### New Flow (Dashboard)
```
API calls per user journey:
1. /api/portfolio/analyze × 1 call (after email capture)
2. Optional: /api/validateData × 1 call (on submit)

Total: 1-2 API calls

Reduction: ~90% fewer API calls
```

### Cost Impact
- Dramatically reduced OpenAI API usage
- Faster user experience (no waiting for AI responses)
- Lower server load
- Better error handling (single submission point)

---

## Future Enhancements (Post-Launch)

### 1. HeyGen Avatar Integration
```typescript
// /src/lib/heygen/avatarClient.ts
// Replace placeholder with:
- Real-time avatar video
- Interactive voice responses
- Personalized welcome based on user data
```

### 2. Advanced Stress Testing
- Interactive scenario sliders
- Multiple scenario comparison
- Historical backtesting
- Monte Carlo simulations

### 3. Auto-Email PDF Reports
```typescript
// /src/lib/email/reportService.ts
- Generate PDF from analysis
- Auto-send to user email after analysis
- Include personalized recommendations
- Schedule follow-up emails
```

### 4. Portfolio Tracking
- Save multiple portfolio versions
- Track changes over time
- Notification when market conditions change
- Periodic re-analysis recommendations

---

## Testing Requirements

### Unit Tests
- Form validation logic
- Data transformation functions
- Portfolio sum calculations
- Email validation

### Integration Tests
- Complete intake form submission
- Email modal flow
- Analysis API integration
- Tab switching behavior

### E2E Tests (Cypress/Playwright)
```typescript
describe('Portfolio Dashboard Flow', () => {
  it('completes full intake → analysis → review flow', () => {
    // Fill intake form
    // Submit for analysis
    // Verify email modal
    // Submit email
    // Verify analysis results in review tab
    // Verify PDF download
  });
});
```

### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- ARIA labels
- Color contrast ratios

---

## Success Metrics

### Performance
- ✅ **90% reduction in API calls**
- ✅ **<2 second page load time**
- ✅ **<5 second analysis completion**

### User Experience
- ✅ **Time to complete intake: <3 minutes** (vs ~5-10 min conversation)
- ✅ **Form completion rate: >85%**
- ✅ **Email capture rate: >90%** (maintained from current flow)

### Technical
- ✅ **Zero breaking changes to analysis engine**
- ✅ **Backward compatible data storage**
- ✅ **WCAG 2.1 AA compliance**

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Create component structure
- [ ] Build AI Avatar placeholder section
- [ ] Design dashboard layout
- [ ] Setup state management

### Week 2: Intake Tab
- [ ] Build intake form sections
- [ ] Implement validation logic
- [ ] Create email capture modal
- [ ] Wire up form submission

### Week 3: Review Tab
- [ ] Build cycle overview component
- [ ] Create portfolio sync display
- [ ] Implement analysis display
- [ ] Add PDF download functionality

### Week 4: Integration & Testing
- [ ] Connect to existing analysis API
- [ ] Supabase integration
- [ ] E2E testing
- [ ] Bug fixes and polish

### Week 5: Launch
- [ ] Deploy to production
- [ ] Monitor analytics
- [ ] Gather user feedback
- [ ] Plan HeyGen avatar integration

---

## Risk Mitigation

### Risk 1: Analysis Quality Degradation
**Mitigation:** Reuse exact same analysis engine, just change input method

### Risk 2: User Confusion from Sudden Change
**Mitigation:** 
- Clear onboarding instructions
- Help tooltips on form fields
- Optional tutorial overlay

### Risk 3: Email Capture Drop-off
**Mitigation:**
- Value proposition before modal
- Privacy assurance messaging
- Quick form (first/last/email only)

### Risk 4: Mobile UX Complexity
**Mitigation:**
- Mobile-first design approach
- Progressive disclosure
- Simplified mobile layouts

---

## Conclusion

This refactoring transforms the portfolio analysis experience from a lengthy conversational flow to an efficient dashboard-driven interface. Key benefits:

✅ **90% reduction in API calls** = lower costs, faster performance
✅ **Streamlined UX** = 3-minute intake vs 5-10 minute conversation  
✅ **Better data quality** = structured forms vs free-text extraction
✅ **Future-ready** = HeyGen avatar placeholder for next-phase enhancement
✅ **Maintains analysis quality** = same engine, new input method

The dashboard approach provides a modern, professional interface aligned with financial industry standards while preserving the intelligent analysis that differentiates Clockwise Capital.
