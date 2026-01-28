# Portfolio Allocation Bug Fix - Dollar Amount Support

## Problem Summary

Users were unable to create portfolios using dollar amounts (numeric values) for holdings allocation. While percentage-based allocations worked correctly, dollar amount allocations resulted in portfolios that didn't save properly or display ticker allocation correctly relative to total portfolio value.

This affected both:
1. **Kronos flow** - Portfolio creation through the community/Kronos interface
2. **Scenario testing flow** - Portfolio creation for testing market scenarios

## Root Cause

The bug was caused by a mismatch between the property names used by the frontend forms and the backend extraction logic:

### Frontend Forms (KronosStylePortfolioForm.tsx, SimplePortfolioForm.tsx)
- Used `dollarAmount` property to store holding values
- Example: `{ ticker: "AAPL", dollarAmount: 50000, percentage: 0 }`

### Backend Extractor (portfolio-extractor.ts)
- Looked for `currentValue` property to calculate weights
- When `dollarAmount` wasn't found as `currentValue`, it fell back to:
  - Placeholder weights (0.1)
  - Equal distribution across all holdings
- Result: Holdings were not allocated correctly relative to total portfolio value

## Files Modified

### 1. `src/lib/kronos/portfolio-extractor.ts`
**Changes:**
- Added `dollarAmount` property to TypeScript interfaces
- Updated `extractFromSpecificHoldings()` to check for `dollarAmount` in addition to `currentValue`
- Added automatic calculation of `totalValue` from sum of dollar amounts when not provided
- Added fallback to check `portfolio_data.holdings` in addition to `intake_data.specificHoldings`
- Improved weight calculation logic with proper priority:
  1. Check `percentage` first (if > 0)
  2. Check `dollarAmount` (if > 0 and totalValue available)
  3. Check `currentValue` (legacy support)
  4. Fall back to placeholder for shares

**Key Code Changes:**
```typescript
// Calculate totalValue from dollar amounts if not provided
let calculatedTotalValue = totalValue;
if (!calculatedTotalValue) {
  const sumOfDollarAmounts = specificHoldings.reduce((sum, h) => {
    return sum + (h.dollarAmount || h.currentValue || 0);
  }, 0);
  if (sumOfDollarAmounts > 0) {
    calculatedTotalValue = sumOfDollarAmounts;
  }
}

// Check for dollarAmount when calculating weights
else if (holding.dollarAmount && holding.dollarAmount > 0 && calculatedTotalValue && calculatedTotalValue > 0) {
  weight = holding.dollarAmount / calculatedTotalValue;
}
```

### 2. `src/components/features/community/PortfolioSelectionModal.tsx`
**Changes:**
- Added calculation of `totalValue` from sum of dollar amounts when not explicitly provided
- Ensures `portfolioTotalValue` is stored in `intake_data` for proper extraction
- Added logging for debugging calculated total values

**Key Code Changes:**
```typescript
// Calculate total value from dollar amounts if not provided
let finalTotalValue = formData.totalValue;
if (!finalTotalValue && formData.specificHoldings && formData.specificHoldings.length > 0) {
  const sumOfDollarAmounts = formData.specificHoldings.reduce((sum, h) => {
    return sum + (h.dollarAmount || 0);
  }, 0);
  if (sumOfDollarAmounts > 0) {
    finalTotalValue = sumOfDollarAmounts;
  }
}

// Save to both portfolio_data and intake_data
portfolio_data: {
  totalValue: finalTotalValue,
  // ...
},
intake_data: {
  ...formData,
  portfolioTotalValue: finalTotalValue,
}
```

## How It Works Now

### When User Enters Dollar Amounts:

1. **Form Submission:**
   - User enters holdings with dollar amounts (e.g., AAPL: $50,000, GOOGL: $30,000, AGG: $20,000)
   - Form stores holdings with `dollarAmount` property

2. **Portfolio Creation:**
   - PortfolioSelectionModal calculates total portfolio value: $100,000
   - Saves both `portfolio_data.totalValue` and `intake_data.portfolioTotalValue`
   - Saves holdings in `intake_data.specificHoldings` with `dollarAmount` values

3. **Portfolio Extraction (for scenario testing/analysis):**
   - `extractHoldingsFromPortfolio()` retrieves holdings from `intake_data.specificHoldings`
   - `extractFromSpecificHoldings()` calculates weights from dollar amounts:
     - AAPL: 50,000 / 100,000 = 0.5 (50%)
     - GOOGL: 30,000 / 100,000 = 0.3 (30%)
     - AGG: 20,000 / 100,000 = 0.2 (20%)
   - Returns properly weighted holdings for analysis

### When User Enters Percentages:

The system continues to work as before:
- Percentages are stored and used directly
- Converted to decimal weights (percentage / 100)
- No breaking changes to existing functionality

## Testing Recommendations

### Manual Testing:
1. **Kronos Flow with Dollar Amounts:**
   - Create portfolio with custom total value (e.g., $500,000)
   - Add holdings with dollar amounts (e.g., AAPL: $200,000, VTI: $200,000, AGG: $100,000)
   - Verify portfolio saves successfully
   - Verify holdings display with correct allocations (40%, 40%, 20%)
   - Test scenario testing with this portfolio

2. **Kronos Flow with Percentages:**
   - Create portfolio with custom total value
   - Add holdings with percentages (e.g., AAPL: 40%, VTI: 40%, AGG: 20%)
   - Verify portfolio saves successfully
   - Verify holdings display correctly
   - Test scenario testing with this portfolio

3. **Mixed Portfolio (Edge Case):**
   - Create portfolio without specifying total value
   - Add holdings with only dollar amounts
   - Verify system calculates total value automatically
   - Verify correct weight distribution

4. **Scenario Testing Flow:**
   - Navigate to scenario testing questions
   - Click "Test My Portfolio"
   - Create new portfolio with dollar amounts
   - Verify portfolio creation and immediate testing works

### Automated Testing:
Consider adding unit tests for:
- `extractFromSpecificHoldings()` with dollarAmount inputs
- Weight calculation from dollar amounts
- Automatic totalValue calculation
- Fallback logic for different holding formats

## Backward Compatibility

The fix maintains full backward compatibility:
- Existing portfolios with `percentage` values continue to work
- Existing portfolios with `currentValue` (if any) continue to work
- New portfolios can use `dollarAmount`
- All three formats can coexist in the system

## Additional Notes

### Data Storage:
Holdings can be stored in two locations:
- `intake_data.specificHoldings` (preferred, checked first)
- `portfolio_data.holdings` (fallback, checked second)

Both locations are now supported by the extractor.

### Total Value Priority:
When extracting holdings, total value is resolved in this order:
1. `intake_data.portfolioTotalValue`
2. `portfolio_data.totalValue`
3. Calculated from sum of `dollarAmount` values
4. Calculated from sum of `currentValue` values

### Logging:
Added console logging for debugging:
- When total value is calculated from dollar amounts
- When weights are normalized
- When no weight data is available (equal distribution fallback)

## Related Files

**Forms:**
- `src/components/features/community/KronosStylePortfolioForm.tsx`
- `src/components/features/community/SimplePortfolioForm.tsx` (not currently used)

**API:**
- `src/app/api/portfolios/create/route.ts`
- `src/app/api/portfolios/list/route.ts`

**Data Processing:**
- `src/lib/kronos/portfolio-extractor.ts` (main fix)
- `src/lib/kronos/types.ts` (Holding type definition)
- `src/lib/utils/csvParser.ts` (CSV upload support)

**UI:**
- `src/components/features/community/PortfolioSelectionModal.tsx` (main fix)
- `src/components/features/community/PostCard.tsx` (triggers portfolio selection)

## Date
January 28, 2026
