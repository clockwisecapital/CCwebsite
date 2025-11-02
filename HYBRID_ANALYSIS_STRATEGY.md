# Hybrid Analysis Strategy: Perplexity + Claude

## Architecture Decision

**Use BOTH AIs in sequence for optimal cycle analysis:**

1. **Perplexity** → Real-time context gathering
2. **Claude** → Framework application & structured analysis

---

## Why Hybrid > Single AI?

### Option A: Claude Only ❌
**Pros:**
- Deep framework knowledge (Strauss & Howe, Turchin, etc.)
- Excellent reasoning and synthesis
- Great at structured JSON output

**Cons:**
- ❌ **Training cutoff** - No data after April 2024
- ❌ **No real-time events** - Can't know about 2024 election, recent crises
- ❌ **Outdated metrics** - Doesn't know current social indicators

### Option B: Perplexity Only ❌
**Pros:**
- Real-time web access
- Latest news and events
- Current data

**Cons:**
- ❌ **Shallow framework knowledge** - Less trained on academic theories
- ❌ **Weaker reasoning** - Not as good at complex synthesis
- ❌ **Inconsistent** - May not apply frameworks rigorously

### Option C: Hybrid Approach ✅ **WINNER**
**Perplexity provides:** Latest context, events, trends  
**Claude provides:** Framework expertise, deep analysis, structured output  
**Result:** Best of both worlds! 🎯

---

## Detailed Workflow for Country Cycle

### **Phase 1: Perplexity - Context Gathering (30 seconds)**

```typescript
const perplexityClient = new Perplexity({ apiKey: PERPLEXITY_API_KEY });

const contextResponse = await perplexityClient.chat.completions.create({
  messages: [{
    role: 'user',
    content: `Find the latest information about the United States in 2024-2025:

    1. **Recent Major Events:**
       - Political crises or transitions
       - Social movements or protests
       - Economic shocks or changes
       - Generational conflicts
       
    2. **Current Societal Indicators:**
       - Latest institutional trust surveys (Pew, Gallup)
       - Political polarization measurements
       - Economic inequality trends
       - Social cohesion metrics
       
    3. **Strauss & Howe Fourth Turning Context:**
       - Any mentions of "Crisis" phase
       - References to generational theory
       - Expert predictions on cycle position
       
    4. **Historical Comparisons:**
       - What period is US most similar to?
       - References to 1930s-40s, Civil War era, etc.

    Provide detailed, cited information from reliable sources.`
  }],
  model: 'sonar-pro',
  // No JSON schema - we want rich text context
});

const currentContext = contextResponse.choices[0].message.content;
```

### **Phase 2: Claude - Framework Analysis (45 seconds)**

```typescript
const claudePrompt = `You are a leading expert in civilizational cycles and societal analysis. Analyze the United States' current position in its Country Cycle.

## Real-Time Context (via Perplexity):
${currentContext}

## Quantitative Data:
- Institutional Trust: ${social.institutional_trust}%
- Political Polarization: ${social.political_polarization}/10
- Congress Approval: ${social.congress_approval}%
- Wealth Inequality (Gini): ${social.wealth_inequality_gini}
- Turchin PSI: ${social.turchin_psi}

## Frameworks to Apply:

### 1. **Strauss & Howe (The Fourth Turning)**
**Cycle:** 80-100 years, four 20-25 year "turnings"
- High (1946-1964): Post-crisis renewal
- Awakening (1964-1984): Values upheaval
- Unraveling (1984-2008): Institutional decay
- **Crisis (2008-present):** Institutional rebuilding

**Question:** Where in the Crisis turning are we? (0-100%)

### 2. **Peter Turchin (Secular Cycles)**
**Cycle:** ~200-300 years
- Expansion: Elite cooperation, low inequality
- Stagflation: Elite competition begins
- **Crisis: Peak inequality, political instability**
- Resolution: System reset

**Metrics:** PSI = ${social.turchin_psi} (near 1.0 = peak crisis)

### 3. **Glubb's Empire Lifecycle**
**Phases:** Pioneers → Conquest → Commerce → Affluence → Intellect → **Decadence**
**Duration:** ~250 years (US founded 1776 = 249 years)

### 4. **Toynbee's Challenge-Response**
**Theory:** Civilizations progress through responses to challenges
- Growth phase: Successful responses
- Breakdown: Failed responses
- Disintegration: Collapse or renewal

### 5. **Zakaria's Liberal World Order**
**Theory:** US-led order under strain
- Post-WWII dominance (1945-1990)
- Unipolar moment (1990-2008)
- **Multipolar transition (2008-present)**

## Your Task:

**Step 1: Synthesize all frameworks**
Determine the current phase considering ALL frameworks together.

**Step 2: Calculate Phase %**
Where are we in the cycle? (0-100%)
- Consider: Time elapsed, crisis indicators, institutional state
- Example: If Crisis phase is 2008-2033 (25 years), and we're in 2024 (16 years in), that's ~64%

**Step 3: Define Timeline**
Break the full cycle into 4 phases with:
- Phase name
- Description
- Start/End % (e.g., 0-25%, 25-50%)
- Is this the current phase?

**Step 4: Historical Analog**
What past period is most similar? Consider:
- 1930s-1945 (Great Depression + WWII)
- 1850s-1865 (Pre-Civil War + Civil War)
- 1760s-1783 (Revolutionary Era)
- Other

**Step 5: S&P 500 Backtest**
Based on similar historical periods:
- Expected Upside (95th percentile, next 12 months)
- Expected Downside (5th percentile, next 12 months)
- Expected Return (median, next 12 months)

Use historical equity returns during crisis phases.

## Output Format:

Return ONLY this JSON:

{
  "name": "Country Cycle",
  "phase": "[Current phase name]",
  "phasePercent": [0-100],
  "averageLifecycle": "[Duration, e.g., '80-100 years']",
  "currentCycleStart": "[Year cycle began]",
  "timeline": [
    {
      "phase": "[Phase name]",
      "description": "[Brief description]",
      "startPercent": [0-100],
      "endPercent": [0-100],
      "isCurrent": [true/false]
    },
    // ... 3 more phases
  ],
  "sp500Backtest": {
    "expectedUpside": [decimal, e.g., 0.24 for 24%],
    "expectedDownside": [decimal, negative, e.g., -0.18],
    "expectedReturn": [decimal, e.g., 0.08]
  },
  "historicalAnalog": {
    "period": "[e.g., '1930-1945']",
    "description": "[Why similar - 2-3 sentences]",
    "similarity": "[e.g., 'Very High (88%)']",
    "keyEvents": ["[Event 1]", "[Event 2]", "[Event 3]"]
  },
  "frameworks": ["Strauss & Howe", "Turchin", "Glubb", "Toynbee", "Zakaria"]
}`;

const claudeResponse = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 2500,
  messages: [{ role: 'user', content: claudePrompt }],
});

// Parse JSON from Claude
const cycleData = parseClaudeResponse(claudeResponse);
```

---

## Benefits of This Approach

### 🎯 **Accuracy**
- Perplexity: Latest 2024 events (election, policies, crises)
- Claude: Deep framework knowledge + reasoning

### 📊 **Depth**
- Perplexity: Surface-level current events
- Claude: Multi-framework synthesis and analysis

### ⚡ **Speed**
- Parallel execution possible
- Total time: ~75 seconds (both calls)

### 💰 **Cost**
- Perplexity call: ~$0.005
- Claude call: ~$0.015
- **Total per analysis: ~$0.02** (acceptable)

---

## Implementation Checklist

- [ ] Add Perplexity context gathering to each cycle function
- [ ] Enhance Claude prompts with Perplexity context
- [ ] Add error handling for Perplexity failures
- [ ] Log both AI responses for debugging
- [ ] Test with real data

---

## Alternative: Single-Call Optimization

**For cost/speed optimization**, you could:

1. Use **Claude only** with very detailed static framework prompts
2. Feed Claude the Perplexity real-time data we already fetch
3. Skip the extra Perplexity call per cycle

**Trade-off:**
- ✅ Faster (1 call instead of 2)
- ✅ Cheaper ($0.015 vs $0.02)
- ❌ Less current context (only what's in our data fetch)

**Recommendation for MVP:** 
Start with **Claude only** (simpler), then add Perplexity context later if needed.

---

## Final Recommendation

### **For Country Cycle Specifically:**

**Use Claude with enhanced prompts:**
```typescript
// We already have real-time data from Perplexity (economic, market, debt)
// We have static social data (updated quarterly)

// Feed ALL of this into one comprehensive Claude prompt
// Claude's framework knowledge is sufficient
// Additional Perplexity call adds cost without huge benefit

const analysisResult = await claude.analyzeWithFrameworks({
  economicData: realTimeData.economic,
  socialData: realTimeData.social,
  debtData: realTimeData.debt,
  frameworks: ['Strauss & Howe', 'Turchin', 'Glubb', 'Toynbee', 'Zakaria']
});
```

✅ **This is already implemented in your code!**

The real-time Perplexity data (economic indicators, market data) combined with Claude's framework expertise is the optimal approach.

**Don't add another Perplexity call unless** you need very specific current event context that changes daily.

---

## Summary

**Current Architecture: ✅ OPTIMAL**

```
Perplexity (data-sources.ts)
  ↓ Fetches real-time economic/market/tech data
  ↓
Claude (analyze-cycles/route.ts)
  ↓ Applies frameworks with that data
  ↓
Structured JSON output → Frontend
```

**No changes needed!** Your current setup is already the hybrid approach! 🎯
