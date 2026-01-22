# Chronos Authentication Flow Update

**Date:** January 2026  
**Status:** ✅ Complete  

---

## Overview

Updated the Chronos/Kronos user flow to improve the account creation experience by:
1. Hiding email/name fields for authenticated users in the intake form
2. Adding "Finish Account" prompts throughout the flow for unauthenticated users
3. Prompting users to finish their account after the personalized video completes
4. Redirecting unauthenticated users from scenario testing pages to Kronos

---

## Changes Made

### 1. **IntakeTab.tsx** - Hide Email/Name Fields for Authenticated Users
- **File:** `src/components/features/portfolio/dashboard/IntakeTab.tsx`
- **Changes:**
  - Modified steps array to conditionally exclude steps 7, 8, 9 (firstName, lastName, email) for authenticated users
  - Updated validation logic to skip these steps when user is authenticated
  - Auto-fill user data from authenticated user's metadata
  - Auto-acknowledge disclaimer for authenticated users
  - Adjusted final step number based on authentication status (step 7 for auth, step 10 for unauth)

### 2. **UnifiedVideoPlayer.tsx** - Video Completion Callback
- **File:** `src/components/features/portfolio/dashboard/UnifiedVideoPlayer.tsx`
- **Changes:**
  - Added `onVideoEnd` prop to component interface
  - Modified `handleVideoEnded` function to call `onVideoEnd` callback when video finishes
  - Allows parent component to be notified when personalized video completes

### 3. **FinishAccountButton.tsx** - New Reusable Component
- **File:** `src/components/features/auth/FinishAccountButton.tsx` (NEW)
- **Purpose:** Reusable button component for "Finish Account" calls-to-action
- **Variants:**
  - `primary` - Full gradient button with icon (default)
  - `secondary` - Gray button with border
  - `minimal` - Text link style

### 4. **PortfolioDashboard.tsx** - Main Dashboard Updates
- **File:** `src/components/features/portfolio/dashboard/PortfolioDashboard.tsx`
- **Changes:**
  - Added imports for `ScenarioAuthModal` and `FinishAccountButton`
  - Added state variables:
    - `showFinishAccountModal` - Controls unified auth modal
    - `showAnalysisPrompt` - Controls Analysis tab prompt after video
  - Added handlers:
    - `handleVideoEnd()` - Triggered when personalized video ends
    - `handleFinishAccountClick()` - Opens finish account modal
    - `handleFinishAccountSuccess()` - Saves portfolio after account creation
  - Added persistent "Finish Account" banner at top of dashboard (only for unauthenticated users with data)
  - Added "Finish Account" prompt in Analysis tab after video completion
  - Connected `onVideoEnd` callback to `UnifiedVideoPlayer`
  - Added `ScenarioAuthModal` with pre-filled intake form data

### 5. **ReviewTab.tsx** - Add Finish Account Button
- **File:** `src/components/features/portfolio/dashboard/ReviewTab.tsx`
- **Changes:**
  - Added `user` and `onFinishAccountClick` props
  - Imported `FinishAccountButton` component
  - Added minimal "Finish Account" button at top of tab (only for unauthenticated users)
  - Updated PortfolioDashboard to pass these props

### 6. **ScenarioTestingTab.tsx** - Add Finish Account Button
- **File:** `src/components/features/portfolio/dashboard/ScenarioTestingTab.tsx`
- **Changes:**
  - Imported `FinishAccountButton` component
  - Added minimal "Finish Account" button at top of tab (only for unauthenticated users)
  - Uses existing `ScenarioAuthModal` for authentication

### 7. **Scenario Testing Pages** - Auth Redirects
- **Files:**
  - `src/app/scenario-testing/questions/page.tsx`
  - `src/app/scenario-testing/[questionId]/results/page.tsx`
- **Changes:**
  - Added auth check using `useAuth` hook
  - Redirect unauthenticated users to `/kronos`
  - Show loading state while checking authentication
  - Return null if not authenticated (during redirect)

---

## User Flows

### Flow 1: Unauthenticated User
1. User visits Kronos (`/kronos`)
2. Completes intake form (includes email, firstName, lastName fields)
3. Gets portfolio analysis
4. Watches personalized video
5. **After video ends:** Prompted to "Finish Account" in Analysis tab
6. **Throughout flow:** Can click "Finish Account" buttons on any tab
7. Creates password → Account saved
8. Portfolio automatically saved to their account
9. Can access scenario testing

### Flow 2: Authenticated User
1. User visits Kronos (`/kronos`)
2. Completes intake form (**NO email/name fields** - auto-filled from account)
3. Gets portfolio analysis
4. Watches personalized video
5. **NO "Finish Account" prompts** (already authenticated)
6. Portfolio automatically saved to their account
7. Can freely access scenario testing

### Flow 3: Unauthenticated User Tries Scenario Testing
1. User tries to access `/scenario-testing/questions` or `/scenario-testing/[id]/results`
2. **Automatically redirected to `/kronos`**
3. Must complete Kronos flow and create account first
4. Then can access scenario testing

---

## Technical Details

### Authentication State Management
- Uses `useAuth()` hook from `@/lib/auth/AuthContext`
- Checks `user` object to determine authentication status
- Uses `authLoading` to show loading states during auth checks

### Data Persistence
- Unauthenticated users: Data stored in localStorage and Supabase conversations table
- After account creation: Data linked to user account via `link_conversation_to_user` RPC
- Portfolio saved to `portfolios` table with user_id

### Modal Strategy
- Replaced individual `CreatePasswordModal` with unified `ScenarioAuthModal`
- Pre-fills email, firstName, lastName from intake form data
- Skips "choice" screen when coming from Kronos (goes straight to signup)

---

## Files Modified

### New Files
- `src/components/features/auth/FinishAccountButton.tsx`

### Modified Files
1. `src/components/features/portfolio/dashboard/IntakeTab.tsx`
2. `src/components/features/portfolio/dashboard/UnifiedVideoPlayer.tsx`
3. `src/components/features/portfolio/dashboard/PortfolioDashboard.tsx`
4. `src/components/features/portfolio/dashboard/ReviewTab.tsx`
5. `src/components/features/portfolio/dashboard/ScenarioTestingTab.tsx`
6. `src/app/scenario-testing/questions/page.tsx`
7. `src/app/scenario-testing/[questionId]/results/page.tsx`

---

## Testing Checklist

### Unauthenticated User Testing
- [ ] Intake form shows email/name fields
- [ ] "Finish Account" banner appears at top of dashboard after submitting intake
- [ ] "Finish Account" buttons appear on Review and Scenarios tabs
- [ ] After personalized video ends, prompt appears in Analysis tab
- [ ] Clicking "Finish Account" opens modal with pre-filled data
- [ ] Creating account saves portfolio automatically
- [ ] Accessing scenario testing redirects to Kronos

### Authenticated User Testing
- [ ] Intake form DOES NOT show email/name fields
- [ ] User data auto-filled from account metadata
- [ ] NO "Finish Account" banners or buttons appear
- [ ] NO prompt after video completion
- [ ] Portfolio auto-saves after analysis
- [ ] Can access scenario testing directly (no redirect)

### Edge Cases
- [ ] User closes browser mid-flow and returns (localStorage persistence)
- [ ] User dismisses "Finish Account" prompt (can still access via buttons)
- [ ] Video fails to load (prompt still appears after timeout)
- [ ] User already has account but not logged in (can sign in via modal)

---

## Future Enhancements

1. **Session Persistence Improvements**
   - Track if user has dismissed "Finish Account" prompt in session
   - Don't show prompt again until next session

2. **Progress Indicators**
   - Show "X% complete" for account setup
   - Highlight benefits of completing account

3. **Email Verification**
   - Add email verification step after account creation
   - Send welcome email with portfolio summary

4. **Social Sign-In**
   - Add Google/LinkedIn OAuth options
   - Faster account creation flow

---

## Notes

- The `CreatePasswordModal` is kept for backward compatibility but is being phased out in favor of `ScenarioAuthModal`
- Scenario testing lab (`/scenario-testing-lab`) remains publicly accessible as a marketing page
- Auth checks use `loading` state to prevent flash of unauthenticated content
