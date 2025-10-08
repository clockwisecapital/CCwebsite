# Scenario Testing Lab Page

## Overview
The Scenario Testing Lab is a landing page designed for clients directed from the AI chatbot to perform portfolio scenario testing. The page showcases AI-powered cycle intelligence and portfolio analysis capabilities.

## Page Sections

### 1. Hero Section - "What Time Is It?"
- AI-Powered Cycle Intelligence badge
- Main heading and descriptive copy
- Two CTA buttons:
  - **Primary**: "Scenario Test My Portfolio" (uses secondary-teal)
  - **Secondary**: "Watch Demo" (white background)

### 2. Statistics Cards
Three metric cards displaying:
- **47+** Market Cycles Tracked
- **1000+** Portfolio Scenarios
- **+23%** Avg. Sync-Solar Improvement

### 3. Portfolio Score Cards - "Rate My Portfolio"
Shows two comparison cards:
- **Your Portfolio**: Score of 72 (Cycle Sync Score)
- **TIME ETF Benchmark**: Score of 78 (Optimal Alignment)
- Includes CTA: "Get Detailed Analysis"

### 4. Macro Cycle Intelligence
Detailed breakdown of:
- Macro Cycle Clock Sync Score (72/100)
- Long-Term Economic Cycle status (80% Complete)
- Phase information: Late Debt Supercycle
- Signal and Example data cards
- Short-Term Economic Cycle (65% Complete)

### 5. Scenario Comparison
- Interactive scenario: "Extended Government Shutdown"
- Chart placeholder for portfolio comparison visualization
- Four metric cards showing:
  - User Upside: +15%
  - User Downside: -10%
  - TIME Upside: +18%
  - TIME Downside: -8%

### 6. Final CTA Section
- "Scenario Testing Lab" heading
- Call-to-action: "Start Testing Your Portfolio"

## Color Scheme
Uses Clockwise Capital brand colors from `tailwind.config.js`:

- **Primary Blue** (`#1A3A5F`): Background gradients, dark sections
- **Secondary Teal** (`#1FAAA3`): Primary CTAs, highlights, positive metrics
- **Accent Gold** (`#E3B23C`): Secondary highlights, special emphasis
- **Background Light** (`#F5F7FA`): Light backgrounds (if needed)
- **Neutral Gray** (`#4B5563`): Text and subtle elements

## Features
- Fully responsive design (mobile, tablet, desktop)
- Gradient backgrounds for depth
- Glassmorphism effects with backdrop blur
- Consistent border and shadow styling
- Accessible color contrasts
- Smooth hover transitions

## Integration

### Accessing the Page
The page is accessible at: `/scenario-testing-lab`

### Linking from AI Chatbot
To direct users to this page from the chatbot, use:
```javascript
// In your chatbot response handler
const scenarioTestingUrl = '/scenario-testing-lab';
// Include this URL in the chatbot message or CTA
```

### Adding to Navigation (Optional)
If you want to add this to the main navigation, update the Header component:

```tsx
// In src/components/layout/Header.tsx
{
  name: 'Scenario Testing',
  href: '/scenario-testing-lab',
  external: false,
}
```

## Future Enhancements
- [ ] Add interactive charts using Chart.js or Recharts
- [ ] Connect to real portfolio data API
- [ ] Implement actual scenario calculations
- [ ] Add animation effects on scroll
- [ ] Create shareable scenario results
- [ ] Add comparison to multiple ETFs

## Technical Details
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom color scheme
- **Icons**: Lucide React
- **Type**: Server Component (default)

## Testing Checklist
- [ ] Verify page loads at `/scenario-testing-lab`
- [ ] Test responsive design on mobile, tablet, desktop
- [ ] Verify all CTAs are clickable
- [ ] Check color contrast for accessibility
- [ ] Test button hover states
- [ ] Validate metadata and SEO tags
