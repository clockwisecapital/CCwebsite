# Kronos Video Scripts for Portfolio Dashboard

This document contains the professional scripts for each Kronos video guide section. Each script is designed to be 30-45 seconds in duration, warm and educational, and directly aligned with the content on screen.

---

## 1. Kronos Thinking (During Analysis)
**Duration:** 30 seconds  
**Video File:** `/kronos-thinking.mp4`  
**Triggered When:** Analysis is being processed

### Script:
```
 I'm analyzing your portfolio right now using advanced market cycle frameworks and Monte Carlo simulations.

I'm evaluating your holdings across six economic cycles, assessing your probability of success, and identifying potential risks and opportunities.

This will just take a moment. I'm excited to show you what I've discovered!
```

---

## 2. Probability of Reaching Your Goal
**Duration:** 40 seconds  
**Video File:** `/kronos-probability-goal.mp4`  
**Location:** Goal Tab → Slide 1  
**Triggered When:** User is viewing Goal Tab, Slide 1

### Script:
```
Welcome to your Goal Analysis! Based on Monte Carlo simulations across all economic cycles, I've calculated your probability of reaching your financial goal.

Here's what you're looking at: The median probability represents your expected scenario under typical market conditions. The best-case and worst-case scenarios show you the range of possible outcomes.

The goal achievement range tells you where you're likely to land. If your probability is below 70%, we should discuss optimization strategies. Above 85%? You're on solid ground.

Remember, these projections account for different market environments, giving you a realistic view of your path forward.
```

---

## 3. Projected Portfolio Values
**Duration:** 40 seconds  
**Video File:** `/kronos-projected-values.mp4`  
**Location:** Goal Tab → Slide 2  
**Triggered When:** User is viewing Goal Tab, Slide 2

### Script:
```
Now let's look at your projected portfolio values at your target timeframe.

The three scenarios you see here represent different market outcomes. The upside scenario shows what's possible in favorable markets. The expected scenario is your median projection - the most likely outcome. And the downside scenario helps you prepare for challenging markets.

Pay attention to the gap between your projected value and your goal. If you're above goal in the expected scenario, you're tracking well. If you're below, that's valuable information - we can adjust your strategy.

These projections are based on your current holdings, time horizon, and contributions, giving you a clear picture of where you're headed.
```

---

## 4. Portfolio Performance Analysis
**Duration:** 40 seconds  
**Video File:** `/kronos-portfolio-performance.mp4`  
**Location:** Portfolio Tab → Slide 1  
**Triggered When:** User is viewing Portfolio Tab, Slide 1

### Script:
```
Let's dive into how your portfolio is expected to perform over the next 12 months.

You're seeing three key metrics here: expected return, which is your median projection, upside potential in the 95th percentile, and downside risk in the 5th percentile.

These numbers are based on your actual holdings and current market conditions. The expected annual return gives you realistic expectations, while the upside and downside help you understand the range of possibilities.

Maximum drawdown shows you the potential peak-to-valley loss. This is crucial for risk management - make sure it aligns with your risk tolerance.

Your confidence level indicates how reliable these projections are based on data quality and market stability.
```

---

## 5. Cycle Analysis
**Duration:** 40 seconds  
**Video File:** `/kronos-cycle-analysis.mp4`  
**Location:** Market Tab → Slide 1  
**Triggered When:** User is viewing Market Tab, Slide 1

### Script:
```
Welcome to Cycle Analysis - this is where we get sophisticated.

The S&P 500 backtest shows you how the market typically performs in the current economic cycle. The dial indicates where we are in the cycle's progression - early stages tend to be more volatile, while late stages are often more predictable.

Each cycle has distinct phases with different return characteristics. 

The timeline below breaks down the cycle phases. Understanding where we are helps you position your portfolio appropriately. Some assets thrive early in cycles, others perform better late.

You can explore different cycles using the selector - each one tells a different story about market behavior.
```

---

## Notes for Video Production:

### Tone & Delivery:
- **Warm and professional** - Kronos should feel like a trusted advisor, not a salesperson
- **Educational but accessible** - Avoid jargon, explain concepts clearly
- **Confident but not overconfident** - Acknowledge uncertainty where appropriate
- **Encouraging** - Focus on empowerment and actionable insights

### Visual Suggestions:
- **Kronos avatar:** Professional AI assistant appearance (consider a holographic or modern tech aesthetic)
- **Background:** Subtle financial data visualizations, charts, or abstract market patterns
- **Animations:** Smooth transitions, highlight key terms when mentioned
- **Branding:** Clockwise Capital colors (teal/blue gradient)

### Technical Requirements:
- **Format:** MP4, H.264 codec
- **Resolution:** 1920x1080 (1080p) minimum
- **Aspect Ratio:** 16:9
- **Frame Rate:** 30fps or 60fps
- **Audio:** Clear, professional voiceover with subtle background music
- **Captions:** Include closed captions for accessibility

### Editing Notes:
- Keep each video under 45 seconds to maintain engagement
- Add subtle visual cues when transitioning between points
- Consider adding light background music (low volume, non-distracting)
- Ensure videos can loop smoothly if users stay on a slide longer
- Test videos on multiple devices (desktop, tablet, mobile)

---

## Video File Mapping:

| Video File | Section | Tab | Slide | Duration |
|-----------|---------|-----|-------|----------|
| `kronos-intro-no-watermark.mp4` | Intake Introduction | Intake | - | Existing |
| `kronos-thinking.mp4` | Analysis Processing | - | - | 30s |
| `kronos-probability-goal.mp4` | Probability of Goal | Goal | 1 | 40s |
| `kronos-projected-values.mp4` | Projected Values | Goal | 2 | 40s |
| `kronos-portfolio-performance.mp4` | Portfolio Performance | Portfolio | 1 | 40s |
| `kronos-cycle-analysis.mp4` | Cycle Analysis | Market | 1 | 40s |

---

## Implementation Checklist:

- [ ] Record Kronos Thinking video (30s)
- [ ] Record Probability of Goal video (40s)
- [ ] Record Projected Values video (40s)
- [ ] Record Portfolio Performance video (40s)
- [ ] Record Cycle Analysis video (40s)
- [ ] Add videos to `/public` folder
- [ ] Test video transitions between slides
- [ ] Verify video sync with carousel navigation
- [ ] Test on mobile devices
- [ ] Add closed captions to all videos
- [ ] Optimize video file sizes for web delivery
- [ ] Test autoplay functionality
- [ ] Verify smooth crossfade transitions

---

## Future Enhancements:

1. **Personalized Videos:** Use AI to generate personalized narration based on user data
2. **Interactive Hotspots:** Allow users to click areas in the video for more details
3. **Multi-language Support:** Create versions in Spanish, Mandarin, etc.
4. **Video Progress Tracking:** Analytics on which videos users watch completely
5. **Contextual Tips:** Short 10-second micro-videos for specific UI elements
