import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { CycleAnalysisResult, CycleData } from '@/types/cycleAnalysis';
import { fetchAllCycleData, type CycleDataSources } from '@/lib/data-sources';
import { 
  isCacheValid, 
  getCachedCycle, 
  setCachedCycle,
  getCacheStats 
} from '@/lib/cycle-cache';
import { createGoalProbabilityInput, calculateGoalProbability, LONG_TERM_AVERAGES } from '@/lib/services/goal-probability';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Helper function to clean and fix common JSON issues
function cleanJSON(jsonString: string): string {
  // Remove any markdown code blocks
  jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Extract only the first complete JSON object (handles extra text after closing brace)
  const firstBraceIndex = jsonString.indexOf('{');
  if (firstBraceIndex !== -1) {
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = firstBraceIndex; i < jsonString.length; i++) {
      const char = jsonString[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            // Found the end of the JSON object
            jsonString = jsonString.substring(firstBraceIndex, i + 1);
            break;
          }
        }
      }
    }
  }
  
  // Fix trailing commas before closing braces/brackets
  jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing commas between properties (common AI error)
  jsonString = jsonString.replace(/"\s*\n\s*"/g, '",\n"');
  
  // Fix unquoted keys (basic cases)
  jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  return jsonString.trim();
}

export async function POST(req: NextRequest) {
  try {
    // Validate API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
      return NextResponse.json(
        { 
          success: false,
          error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to .env.local'
        },
        { status: 500 }
      );
    }

    console.log('🔍 Starting cycle analysis...');
    const { intakeData } = await req.json();

    // ✅ Calculate portfolio value from holdings FIRST (same as analyze-dashboard)
    const hasSpecificHoldings = intakeData.specificHoldings && 
                               intakeData.specificHoldings.length > 0 &&
                               intakeData.specificHoldings.some((h: { ticker?: string }) => h.ticker && h.ticker.trim().length > 0);
    
    if (hasSpecificHoldings) {
      // Calculate total from dollar amounts if provided
      const totalFromDollars = intakeData.specificHoldings!.reduce((sum: number, h: { dollarAmount?: number }) => sum + (h.dollarAmount || 0), 0);
      if (totalFromDollars > 0) {
        // Update the intakeData with the calculated value
        intakeData.portfolio.totalValue = totalFromDollars;
        console.log(`💰 Calculated portfolio value from holdings: $${totalFromDollars.toLocaleString()}`);
      }
    }

    // Fetch real-time data from external sources
    console.log('📊 Fetching real-time economic data...');
    const realTimeData = await fetchAllCycleData();
    console.log('✅ Real-time data fetched:', {
      gdp: realTimeData.economic.gdp_growth,
      unemployment: realTimeData.economic.unemployment,
      inflation: realTimeData.economic.inflation,
    });

    // Create data hash for cache consistency
    const dataHash = JSON.stringify({
      economic: realTimeData.economic,
      social: realTimeData.social,
      timestamp: realTimeData.timestamp,
    });

    // Check cache and analyze cycles (with caching for consistency)
    console.log('🤖 Analyzing cycles (checking cache first for consistency)...');
    console.log('Cache stats:', getCacheStats());
    
    const cycleStartTime = Date.now();
    const [countryAnalysis, technologyAnalysis, economicAnalysis, businessAnalysis, marketAnalysis, companyAnalysis] = await Promise.all([
      analyzeCountryCycleWithCache(realTimeData, dataHash),
      analyzeTechnologyCycleWithCache(realTimeData, dataHash),
      analyzeEconomicCycleWithCache(realTimeData, dataHash),
      analyzeBusinessCycleWithCache(realTimeData, dataHash),
      analyzeMarketCycleWithCache(realTimeData, dataHash),
      analyzeCompanyCycleWithCache(realTimeData, dataHash),
    ]);
    console.log(`✅ All cycle analyses completed (${Date.now() - cycleStartTime}ms)`);

    // Run portfolio and goal analysis
    const portfolioStartTime = Date.now();
    const portfolioAnalysis = await analyzePortfolioImpact(intakeData, {
      country: countryAnalysis,
      technology: technologyAnalysis,
      economic: economicAnalysis,
      business: businessAnalysis,
      market: marketAnalysis,
      company: companyAnalysis,
    });
    console.log(`✅ Portfolio impact analysis completed (${Date.now() - portfolioStartTime}ms)`);

    const goalStartTime = Date.now();
    const goalAnalysis = await analyzeGoalProbability(intakeData, portfolioAnalysis);
    console.log(`✅ Goal probability analysis completed (${Date.now() - goalStartTime}ms)`);

    const cycleAnalysisResult: CycleAnalysisResult = {
      cycles: {
        country: countryAnalysis,
        technology: technologyAnalysis,
        economic: economicAnalysis,
        business: businessAnalysis,
        market: marketAnalysis,
        company: companyAnalysis,
      },
      portfolioAnalysis,
      goalAnalysis,
    };

    return NextResponse.json({
      success: true,
      cycleAnalysis: cycleAnalysisResult,
    });

  } catch (error) {
    console.error('❌ Cycle analysis error:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze cycles',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}

// ======================
// CACHE WRAPPER FUNCTIONS
// ======================

async function analyzeCountryCycleWithCache(realTimeData: CycleDataSources, dataHash: string): Promise<CycleData> {
  if (isCacheValid('country', dataHash)) {
    const cached = getCachedCycle('country');
    if (cached) {
      console.log('✅ Using cached Country Cycle (ensures consistency)');
      return cached;
    }
  }
  
  console.log('🆕 Generating new Country Cycle analysis');
  const result = await analyzeCountryCycle(realTimeData);
  setCachedCycle('country', result, dataHash);
  return result;
}

async function analyzeTechnologyCycleWithCache(realTimeData: CycleDataSources, dataHash: string): Promise<CycleData> {
  if (isCacheValid('technology', dataHash)) {
    const cached = getCachedCycle('technology');
    if (cached) {
      console.log('✅ Using cached Technology Cycle (ensures consistency)');
      return cached;
    }
  }
  
  console.log('🆕 Generating new Technology Cycle analysis');
  const result = await analyzeTechnologyCycle(realTimeData);
  setCachedCycle('technology', result, dataHash);
  return result;
}

async function analyzeEconomicCycleWithCache(realTimeData: CycleDataSources, dataHash: string): Promise<CycleData> {
  if (isCacheValid('economic', dataHash)) {
    const cached = getCachedCycle('economic');
    if (cached) {
      console.log('✅ Using cached Economic Cycle (ensures consistency)');
      return cached;
    }
  }
  
  console.log('🆕 Generating new Economic Cycle analysis');
  const result = await analyzeEconomicCycle(realTimeData);
  setCachedCycle('economic', result, dataHash);
  return result;
}

async function analyzeBusinessCycleWithCache(realTimeData: CycleDataSources, dataHash: string): Promise<CycleData> {
  if (isCacheValid('business', dataHash)) {
    const cached = getCachedCycle('business');
    if (cached) {
      console.log('✅ Using cached Business Cycle (ensures consistency)');
      return cached;
    }
  }
  
  console.log('🆕 Generating new Business Cycle analysis');
  const result = await analyzeBusinessCycle(realTimeData);
  setCachedCycle('business', result, dataHash);
  return result;
}

async function analyzeMarketCycleWithCache(realTimeData: CycleDataSources, dataHash: string): Promise<CycleData> {
  if (isCacheValid('market', dataHash)) {
    const cached = getCachedCycle('market');
    if (cached) {
      console.log('✅ Using cached Market Cycle (ensures consistency)');
      return cached;
    }
  }
  
  console.log('🆕 Generating new Market Cycle analysis');
  const result = await analyzeMarketCycle(realTimeData);
  setCachedCycle('market', result, dataHash);
  return result;
}

async function analyzeCompanyCycleWithCache(realTimeData: CycleDataSources, dataHash: string): Promise<CycleData> {
  if (isCacheValid('company', dataHash)) {
    const cached = getCachedCycle('company');
    if (cached) {
      console.log('✅ Using cached Company Cycle (ensures consistency)');
      return cached;
    }
  }
  
  console.log('🆕 Generating new Company Cycle analysis');
  const result = await analyzeCompanyCycle(realTimeData);
  setCachedCycle('company', result, dataHash);
  return result;
}

// ======================
// TECHNOLOGY CYCLE ANALYSIS
// ======================

async function analyzeTechnologyCycle(realTimeData: CycleDataSources): Promise<CycleData> {
  const { technology, market } = realTimeData;
  
  // Get current date for dynamic analysis
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
  
  const prompt = `You are an expert analyst of long-term technology cycles. Your task: Determine the average lifecycle of the Long-Term Technology Cycle and predict the current lifecycle phase for the United States.

## Analysis Date: ${currentMonth} ${currentYear}

## Input Question:
How long is the average Lifecycle of the Long-Term Technology Cycle and what is the current Lifecycle Phase of the US?

## Frameworks to Combine:
- Carlota Perez – Technological Revolutions and Financial Capital
- Kondratiev Waves – Long Economic/Technology Waves  
- Joseph Schumpeter – Creative Destruction & Innovation Cycles
- Geoffrey Moore – Technology Adoption Lifecycle (Crossing the Chasm)
- Ray Kurzweil – Law of Accelerating Returns
- Simon Wardley – Wardley Maps & Evolution Stages

## Current Tech Landscape (Real-Time Data as of ${realTimeData.timestamp}):

**Market Data:**
- AI investment: $${technology.ai_investment_billions}B+ (latest data)
- ChatGPT: ${technology.chatgpt_users_millions}M+ weekly active users
- NVIDIA market cap: $${market.nvidia_market_cap}B
- Cloud infrastructure spending: $${technology.cloud_spending_billions}B+ annually
- Major tech layoffs: ${technology.tech_layoffs.toLocaleString()}+ in recent years
- Enterprise AI adoption: ${technology.enterprise_ai_adoption}% of companies
- S&P 500 P/E ratio: ${market.sp500_pe_ratio}
- VIX (volatility): ${market.volatility_vix}

**Note:** Use your real-time knowledge to assess:
- Latest major AI/tech product launches and capabilities
- Autonomous AI agents and automation trends
- Regulatory landscape (AI Act, executive orders, antitrust)
- Enterprise adoption rates and use cases
- Major tech company strategies and pivots
- VC investment trends in AI/tech

**Historical Context:**
- 5th Kondratiev Wave (Digital/IT) began in early 1970s
- Internet commercialization in mid-1990s
- Dot-com bubble at turn of millennium
- Mobile revolution in late 2000s-early 2010s
- Cloud maturity in mid-2010s
- AI breakthrough in recent years (LLMs, generative AI)

## Frameworks to Apply:

### 1. Carlota Perez - Technological Revolutions Framework
**Phases of tech revolution (40-60 years total):**
- Installation (20-30 years): Infrastructure building, speculation
- Frenzy (2-3 years): Bubble, peak hype, crash
- Synergy (10-15 years): Real deployment, productivity gains
- Maturity (10-15 years): Diminishing returns, seek new paradigm

**Historical examples:**
- Railways: Installation 1830s-1850s → Frenzy 1840s → Synergy 1850s-1870s
- Internet: Installation 1990-1999 → Frenzy 1999-2000 → Synergy 2000s-2010s

### 2. Kondratiev Waves (50-60 year cycles)
**Long economic waves driven by tech:**
- 5th Wave (IT/Digital): Early 1970s-present (microprocessor, internet, mobile)
- 6th Wave (AI/Bio/Clean): Emerging now (AI, biotech, renewable energy)

### 3. Schumpeter - Creative Destruction
**Innovation cycles:**
- Old technologies being disrupted (traditional software, manual processes)
- New technologies emerging (AI, automation)
- Transition period creates volatility

### 4. Geoffrey Moore - Technology Adoption Lifecycle
**Adoption curve:**
- Innovators (2.5%)
- Early Adopters (13.5%)
- Early Majority (34%)
- Late Majority (34%)
- Laggards (16%)

### 5. Ray Kurzweil - Law of Accelerating Returns
**Key insight:** Technology advancement is exponential, not linear
- Each generation of technology builds on previous
- Doubling time decreases with each wave
- AI represents paradigm shift (6th paradigm after computing)

### 6. Simon Wardley - Evolution Stages
**Technology evolution:**
- Genesis: Novel, uncertain (decades of AI research)
- Custom-built: Bespoke solutions (early LLM era)
- Product: Productized offerings (current consumer AI products)
- Commodity: Widespread, standardized (AI APIs becoming commoditized)

## Your Task:

Based on these frameworks and current data, provide a comprehensive analysis:

1. **Current Phase**: Are we in Installation, Frenzy, Synergy, or Maturity?
2. **Phase Percentage**: Calculate precisely using this formula:
   - Determine cycle start year and typical total duration
   - Calculate: phasePercent = ((current year - cycle start year) / total duration) × 100
   - Round to nearest whole number (0-100)
   - Example: If cycle started 1971, duration is 60 years, current is 2025: ((2025-1971)/60) × 100 = 90%
3. **Cycle Timeline**: When did this cycle start, and what's the typical duration?
4. **Historical Analog**: What historical period is most similar? (e.g., 1995-2000 dot-com boom)

## Required Output Format (JSON):

{
  "name": "Technology Cycle",
  "phase": "[Phase name]",
  "phasePercent": [0-100],
  "averageLifecycle": "[Duration as string, e.g., '40-60 years']",
  "currentCycleStart": "[Year/description, e.g., '1971 (Microprocessor Era)']",
  "timeline": [
    {
      "phase": "[Phase name]",
      "description": "[Brief description]",
      "startPercent": [0-100],
      "endPercent": [0-100],
      "isCurrent": [true/false]
    }
  ],
  "sp500Backtest": {
    "expectedUpside": [decimal, e.g., 0.32 for 32%],
    "expectedDownside": [decimal, e.g., -0.08 for -8%],
    "expectedReturn": [decimal, e.g., 0.15 for 15%]
  },
  "historicalAnalog": {
    "period": "[Time period, e.g., '1995-2000']",
    "description": "[2-3 sentences describing similarities]",
    "similarity": "[e.g., 'Very High (92%)']",
    "keyEvents": ["[Event 1]", "[Event 2]", "[Event 3]"]
  },
  "frameworks": ["Carlota Perez", "Kondratiev Waves", "Joseph Schumpeter", "Geoffrey Moore", "Ray Kurzweil", "Simon Wardley"]
}

Provide only the JSON output, no additional text.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Technology Cycle: No JSON found in response');
      console.error('Response:', responseText.substring(0, 500));
      throw new Error('No JSON found in Technology Cycle response');
    }
    
    try {
      const cleanedJSON = cleanJSON(jsonMatch[0]);
      const cycleData: CycleData = JSON.parse(cleanedJSON);
      return cycleData;
    } catch (parseError) {
      console.error('❌ Technology Cycle: JSON parse error');
      console.error('JSON string:', jsonMatch[0].substring(0, 2500));
      throw parseError;
    }
  } catch (error) {
    console.error('❌ Technology cycle analysis failed:', error);
    console.error('❌ Technology Cycle Analysis Failed:', error);
    throw error;
  }
}

// ======================
// COUNTRY CYCLE ANALYSIS
// ======================

/**
 * Hybrid approach: Use Perplexity for current context, Claude for framework analysis
 */
async function analyzeCountryCycle(realTimeData: CycleDataSources): Promise<CycleData> {
  const { social } = realTimeData;
  
  // Get current date for dynamic analysis
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
  
  const prompt = `You are an expert analyst of long-term societal cycles.

## Analysis Date: ${currentMonth} ${currentYear}

Analyze the current Country Cycle for the United States.

## Current Data (Real-Time as of ${realTimeData.timestamp}):

**Social Indicators (Measured):**
- Institutional trust: ${social.institutional_trust}% (Pew Research)
- Political polarization: ${social.political_polarization}/10
- Congress approval: ${social.congress_approval}%
- Wealth inequality (Gini): ${social.wealth_inequality_gini}
- Peter Turchin's Political Stress Indicator: ${social.turchin_psi}

**Note:** Use your real-time knowledge to supplement with:
- Current political climate and recent events
- Economic inequality trends
- Social mobility patterns
- Generational dynamics
- Recent crises or major events
- Housing market conditions
- Education/student debt levels

## Frameworks to Apply:

### 1. Strauss & Howe - Fourth Turning (80-100 year cycles)
**Four turnings (~20-25 years each):**
- High: Strong institutions, conformity (post-WWII era)
- Awakening: Spiritual renewal, question authority (1960s-1980s)
- Unraveling: Weak institutions, individualism (1980s-2000s)
- Crisis: Institutional collapse → rebuild (2008-present)

**Indicators of Crisis (Fourth Turning):**
- Institutional breakdown
- Political realignment
- Economic system stress
- Generational conflict
- Major crisis events (2008 financial crisis, COVID, political instability)

### 2. Peter Turchin - Secular Cycles (200-300 years)
**Phases:**
- Expansion: Growth, low inequality
- Stagflation: Inequality rises, elite overproduction
- Crisis: Political instability peaks
- Depression: Collapse and reset

**Current measurements:**
- Elite overproduction: Yes (too many credentialed people competing for limited positions)
- Popular immiseration: Wage stagnation, declining living standards
- State fiscal stress: High debt, deficits
- Political Stress Index: At historic peaks (similar to 1860s, 1920s)

### 3. Other Frameworks:
- Toynbee: Challenge and response in civilizations
- Zakaria: "Post-American World" - declining hegemony
- Ibn Khaldun: Rise and fall based on social cohesion (Asabiyyah)

## Your Task:

Provide a unified assessment of where the United States is in its country cycle.

### Important:
- Use "80-100 years" as the averageLifecycle (no additional parenthetical information)

## Required Output Format (JSON):

{
  "name": "Country Cycle",
  "phase": "[Current phase name]",
  "phasePercent": [0-100],
  "averageLifecycle": "80-100 years",
  "currentCycleStart": "[Year/description]",
  "timeline": [
    {
      "phase": "[Phase name]",
      "description": "[Description]",
      "startPercent": [0-100],
      "endPercent": [0-100],
      "isCurrent": [true/false]
    }
  ],
  "sp500Backtest": {
    "expectedUpside": [decimal],
    "expectedDownside": [decimal],
    "expectedReturn": [decimal]
  },
  "historicalAnalog": {
    "period": "[Period]",
    "description": "[Description]",
    "similarity": "[Similarity level]",
    "keyEvents": ["[Event 1]", "[Event 2]", "[Event 3]"]
  },
  "frameworks": ["Strauss & Howe", "Peter Turchin", "Arnold Toynbee", "Fareed Zakaria", "Ibn Khaldun"]
}

Provide only the JSON output.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    temperature: 0.1,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('❌ Country Cycle: No JSON found in response');
    console.error('Response:', responseText.substring(0, 500));
    throw new Error('Failed to parse Country Cycle AI response');
  }
  
  try {
    const cleanedJSON = cleanJSON(jsonMatch[0]);
    return JSON.parse(cleanedJSON);
  } catch (parseError) {
    console.error('❌ Country Cycle: JSON parse error at position', parseError);
    console.error('JSON string (first 2500 chars):', jsonMatch[0].substring(0, 2500));
    console.error('JSON string (last 500 chars):', jsonMatch[0].substring(jsonMatch[0].length - 500));
    throw new Error(`Country Cycle JSON parse failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
}

// ======================
// ECONOMIC CYCLE ANALYSIS
// ======================

async function analyzeEconomicCycle(realTimeData: CycleDataSources): Promise<CycleData> {
  const { debt } = realTimeData;
  
  // Get current date for dynamic analysis
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
  
  const prompt = `You are an expert analyst of long-term economic cycles.

## Analysis Date: ${currentMonth} ${currentYear}

Your task: Determine the average lifecycle of the Long-Term Economic Cycle and predict the current lifecycle phase for the United States.

## Input Question:
How long is the average Lifecycle of the Long-Term Economic Cycle and what is the current Lifecycle Phase of the US?

## Frameworks to Combine:
- Ray Dalio – The Big Debt Cycle
- Nikolai Kondratiev – Long Economic Waves
- Hyman Minsky – Financial Instability Hypothesis
- George Modelski – Long Political Cycles / World Power Transitions
- Ben Hunt (Epsilon Theory) – Narrative & Reflexivity Cycles
- AI-Macro Lens (McKinsey, Ark Invest, WEF)
- IMF Structural Change Framework – Productivity & Demographics

## Current Economic Data (Real-Time as of ${realTimeData.timestamp}):

**Debt Metrics:**
- US Federal Debt: $${debt.federal_debt_trillions}T (${debt.federal_debt_to_gdp}% of GDP)
- Total Debt (public + private): (${debt.total_debt_to_gdp}% of GDP)
- Interest payments: $${debt.interest_payments_trillions}T annually
- Debt service ratio: Rising sharply with higher rates

**Note:** Use your real-time knowledge to assess:
- Financial system health (zombie companies, corporate leverage, commercial real estate)
- Banking sector stability (recent failures, stress indicators)
- Monetary system (dollar dominance, reserve currency trends, central bank balance sheets)
- Credit conditions (lending standards, corporate debt maturities, household debt)
- De-dollarization trends and alternative currency initiatives

## Frameworks to Apply:

### 1. Ray Dalio - Big Debt Cycle (50-75 years)
**Phases:**
- Early Cycle: Low debt, credit expanding, robust growth
- Mid Cycle: Moderate debt, strong growth, asset inflation
- Late Cycle (Autumn): High debt, financialization, bubble risk
- Crisis (Winter): Peak debt, deleveraging, defaults
- Depression: Restructuring, reset

**Key indicators to assess:**
- Debt/GDP ratio (compare to historical peaks)
- Credit growth trends
- Asset price levels
- Current phase determination based on indicators

### 2. Hyman Minsky - Financial Instability Hypothesis
**Borrower types:**
- Hedge finance: Can pay principal + interest (stable)
- Speculative finance: Can pay interest only (fragile)
- Ponzi finance: Can't pay either, rely on asset appreciation (unstable)

**Assessment needed:**
- Use real-time knowledge to determine current borrower composition
- Assess system fragility based on credit quality

### 3. Kondratiev Waves
- Long-term economic cycles (50-60 years)
- Current position in wave

### 4. George Modelski - World Power Cycles
- US hegemony began post-WWII (~1945)
- Typical cycle: 80-120 years
- Use real-time knowledge to calculate current position in cycle

### 5. Ben Hunt (Epsilon Theory) - Narrative & Reflexivity Cycles
**Key insight:** Market narratives create self-reinforcing cycles
- Common knowledge games drive behavior
- Widening gyre: Polarization increases, trust collapses
- Missionary vs. Mercenary investors

### 6. AI-Macro Lens (McKinsey, Ark Invest, WEF)
**Productivity shock analysis:**
- Major research estimates significant GDP impact from AI adoption
- Deflationary force vs. inflationary debt dynamics
- Productivity acceleration potential vs. displacement effects

### 7. IMF Structural Change Framework
**Demographics & productivity:**
- Use real-time knowledge: Current US median age, aging trends
- Productivity growth patterns (historical vs. potential AI impact)
- Structural labor market changes

## Your Task:

Provide unified assessment of the long-term economic/debt cycle.

## Required Output Format (JSON):

{
  "name": "Economic Cycle",
  "phase": "[Phase name]",
  "phasePercent": [0-100],
  "averageLifecycle": "[Duration]",
  "currentCycleStart": "[Year/description]",
  "timeline": [
    {
      "phase": "[Phase]",
      "description": "[Description]",
      "startPercent": [0-100],
      "endPercent": [0-100],
      "isCurrent": [true/false]
    }
  ],
  "sp500Backtest": {
    "expectedUpside": [decimal],
    "expectedDownside": [decimal],
    "expectedReturn": [decimal]
  },
  "historicalAnalog": {
    "period": "[Period]",
    "description": "[Description]",
    "similarity": "[Level]",
    "keyEvents": ["[Event]", "[Event]", "[Event]"]
  },
  "frameworks": ["Ray Dalio", "Nikolai Kondratiev", "Hyman Minsky", "George Modelski", "Ben Hunt", "AI-Macro Lens", "IMF Framework"]
}

Keep descriptions concise. Limit keyEvents to 3-4 brief items (max 50 characters each).

Provide only JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8000, // Increased from 4000 to prevent truncation
    temperature: 0.1,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('❌ Economic Cycle: No JSON found in response');
    console.error('Response:', responseText.substring(0, 500));
    throw new Error('Failed to parse Economic Cycle AI response');
  }
  
  try {
    // Clean the JSON before parsing
    const cleanedJSON = cleanJSON(jsonMatch[0]);
    return JSON.parse(cleanedJSON);
  } catch (parseError) {
    console.error('❌ Economic Cycle: JSON parse error');
    console.error('Original JSON (first 2500 chars):', jsonMatch[0].substring(0, 2500));
    console.error('Parse error:', parseError);
    // Try to find the error position
    if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
      const posMatch = parseError.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        console.error('JSON around error position:', jsonMatch[0].substring(Math.max(0, pos - 100), Math.min(jsonMatch[0].length, pos + 100)));
      }
    }
    
    // Fallback: Return a default Economic Cycle structure
    console.warn('⚠️ Using fallback Economic Cycle data due to parse error');
    return {
      name: "Long-Term Economic Cycle",
      phase: "Late Cycle",
      phasePercent: 75,
      averageLifecycle: "50-75 years",
      currentCycleStart: "1980 (Post-Volcker disinflation)",
      timeline: [
        { phase: "Early Cycle", description: "Low debt, credit expansion", startPercent: 0, endPercent: 25, isCurrent: false },
        { phase: "Mid Cycle", description: "Moderate debt, strong growth", startPercent: 25, endPercent: 55, isCurrent: false },
        { phase: "Late Cycle", description: "High debt, financialization", startPercent: 55, endPercent: 80, isCurrent: true },
        { phase: "Crisis", description: "Deleveraging begins", startPercent: 80, endPercent: 100, isCurrent: false }
      ],
      sp500Backtest: { expectedUpside: 0.12, expectedDownside: -0.38, expectedReturn: -0.08 },
      historicalAnalog: {
        period: "1925-1929",
        description: "High debt levels with asset inflation",
        similarity: "High (70%)",
        keyEvents: ["High debt/GDP ratios", "Asset price inflation", "Geopolitical tensions"]
      },
      frameworks: ["Ray Dalio", "Nikolai Kondratiev", "Hyman Minsky", "George Modelski", "Ben Hunt", "AI-Macro Lens", "IMF Framework"]
    };
  }
}

// ======================
// BUSINESS CYCLE ANALYSIS
// ======================

async function analyzeBusinessCycle(realTimeData: CycleDataSources): Promise<CycleData> {
  const { economic } = realTimeData;
  
  // Get current date for dynamic analysis
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
  
  const prompt = `You are an expert analyst of short-term business cycles.

## Analysis Date: ${currentMonth} ${currentYear}

Your task: Determine the average lifecycle of the Short-Term Business Cycle and predict the current lifecycle phase for the United States.

## Input Question:
How long is the average Lifecycle of the Short-Term Business Cycle and what is the current Lifecycle Phase of the US?

## Frameworks to Combine:
- Ray Dalio – Short-Term Debt Cycle
- Arthur Burns & Wesley Mitchell – NBER Business Cycle Framework
- Joseph Schumpeter – Innovation-Driven Business Cycles
- Hyman Minsky – Financial Instability Hypothesis
- George Soros – Reflexivity Framework
- Charles Kindleberger – Manias, Panics, and Crashes
- Federal Reserve / BIS Output Gap Models
- OECD Composite Leading Indicators Framework
- AI-Macro Lens – Productivity Shock Interpretation (McKinsey, Ark Invest)

## Current Economic Indicators (Real-Time as of ${realTimeData.timestamp}):

**Growth & Employment (Measured):**
- Real GDP growth: ${economic.gdp_growth}% (latest quarter, annualized)
- Unemployment: ${economic.unemployment}%

**Note:** Supplement with real-time knowledge on:
- Recent payroll growth trends
- Labor force participation rate
- Job openings (JOLTS data)
- Wage growth trends
- Quit rates and labor market tightness

**Inflation & Rates:**
- CPI inflation: ${economic.inflation}% year-over-year
- Federal Funds Rate: ${economic.fed_funds_rate}%
- 10-Year Treasury: ${economic.treasury_10y}%
- 2-Year Treasury: ${economic.treasury_2y}%
- **Yield Curve (10Y-2Y): ${economic.yield_curve_10y2y.toFixed(2)}% ${economic.yield_curve_10y2y < 0 ? '(INVERTED)' : ''}**

**Note:** Use your real-time knowledge to assess current:
- Business sentiment indicators (ISM Manufacturing/Services, PMI readings)
- Consumer and CEO confidence levels
- Capacity utilization rates
- Bank lending standards and credit availability
- Consumer credit trends
- Labor market tightness
- Profit margin trends

## Frameworks to Apply:

### 1. NBER Business Cycle Dating
**Phases:**
- Expansion: GDP growing, unemployment falling
- Peak: Maximum output, tight labor market
- Contraction: GDP falling, unemployment rising
- Trough: Bottom, recovery begins

**Use real-time knowledge to assess:**
- When current expansion began (NBER recession dating)
- Duration of current expansion vs. historical average
- Signs of late cycle vs. mid cycle indicators

### 2. Ray Dalio - Short-Term Debt Cycle (7-10 years)
**Typical pattern:**
- Early: Credit easy, growth accelerating
- Mid: Strong growth above trend
- Late: Inflation pressure, Fed tightening, margins peak
- Downturn: Credit tightens, recession

### 3. Federal Reserve / Taylor Rule
**Policy stance:**
- Use real-time knowledge to assess:
  - Current Federal Funds Rate vs. estimated neutral rate
  - Whether policy is restrictive, neutral, or accommodative
  - Taylor Rule implications

### 4. Joseph Schumpeter - Innovation-Driven Cycles
**Waves of creative destruction:**
- Innovation creates boom-bust patterns
- Use real-time knowledge: Current innovation wave and its impacts

### 5. Hyman Minsky - Financial Instability  
**Credit cycle fragility:**
- Boom creates overconfidence
- Speculative borrowing increases
- Crisis when cash flows can't service debt

### 6. George Soros - Reflexivity
**Self-reinforcing feedback loops:**
- Market participants' biases affect fundamentals
- Boom-bust sequences driven by perception

### 7. Charles Kindleberger - Manias, Panics, and Crashes
**Stages:** Displacement → Boom → Euphoria → Distress → Panic

### 8. Federal Reserve / BIS Output Gap Models
**Economic slack measurement:**
- Positive gap: Economy above potential (inflationary)
- Negative gap: Economy below potential (slack)
- Current assessment needed

### 9. OECD Composite Leading Indicators
**Forward-looking signals:**
- Building permits, stock prices, credit conditions
- Typically lead cycle turns by 6-9 months

### 10. AI-Macro Lens (McKinsey, Ark Invest)
**Productivity interpretation:**
- AI potentially offsets business cycle recession
- New paradigm vs. traditional cycle dynamics

## Your Task:

Assess current position in short-term business cycle using ALL frameworks.

### Important:
- Use "7-10 years" as the averageLifecycle (no additional parenthetical information)

## Required Output Format (JSON):

{
  "name": "Business Cycle",
  "phase": "[Phase]",
  "phasePercent": [0-100],
  "averageLifecycle": "7-10 years",
  "currentCycleStart": "[Year/description]",
  "timeline": [
    {
      "phase": "[Phase]",
      "description": "[Description]",
      "startPercent": [0-100],
      "endPercent": [0-100],
      "isCurrent": [true/false]
    }
  ],
  "sp500Backtest": {
    "expectedUpside": [decimal],
    "expectedDownside": [decimal],
    "expectedReturn": [decimal]
  },
  "historicalAnalog": {
    "period": "[Period]",
    "description": "[Description]",
    "similarity": "[Level]",
    "keyEvents": ["[Event]", "[Event]", "[Event]"]
  },
  "frameworks": ["Ray Dalio", "NBER", "Joseph Schumpeter", "Hyman Minsky", "George Soros", "Charles Kindleberger", "Federal Reserve/BIS", "OECD", "AI-Macro Lens"]
}

Provide only JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    temperature: 0.1,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('❌ Business Cycle: No JSON found in response');
    console.error('Response:', responseText.substring(0, 500));
    throw new Error('Failed to parse Business Cycle AI response');
  }
  
  try {
    const cleanedJSON = cleanJSON(jsonMatch[0]);
    return JSON.parse(cleanedJSON);
  } catch (parseError) {
    console.error('❌ Business Cycle: JSON parse error');
    console.error('JSON string (first 2500 chars):', jsonMatch[0].substring(0, 2500));
    throw parseError;
  }
}

// ======================
// MARKET (S&P 500) CYCLE ANALYSIS
// ======================

async function analyzeMarketCycle(realTimeData: CycleDataSources): Promise<CycleData> {
  const { market } = realTimeData;
  
  // Get current date for dynamic analysis
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
  
  const prompt = `You are an expert analyst of S&P 500 market cycles.

## Analysis Date: ${currentMonth} ${currentYear}

Analyze the current S&P 500 Market Cycle.

### Your Task:
1. **IMPORTANT**: Use "Rolling 12 months" as the averageLifecycle (this is our framework for real-time analysis)
2. Identify the current lifecycle phase of the S&P 500
3. Provide actionable portfolio insights

### Analysis Frameworks (Synthesize ALL of these):
- **Mike Wilson** (Morgan Stanley): Focus on earnings cycles and liquidity conditions
- **David Kostin** (Goldman Sachs): Valuation-based cycle analysis and sector rotation
- **Savita Subramanian** (BofA): Sentiment and technical indicators for market phases
- **Tom Lee** (Fundstrat): Macro cycle integration with equity markets
- **John Stoltzfus** (Oppenheimer): Market breadth and participation analysis
- **Ed Yardeni** (Yardeni Research): Economic indicators and profit cycle analysis

### Current Market Data (${currentMonth} ${currentYear}):
- S&P 500 Price: ${market.sp500_price}
- S&P 500 P/E Ratio: ${market.sp500_pe_ratio}
- S&P 500 from High: ${market.sp500_from_high}%
- VIX (Volatility): ${market.volatility_vix}

### Output Requirements:
Respond with ONLY a valid JSON object (no markdown, no code blocks):

{
  "name": "Market (S&P 500) Cycle",
  "phase": "<current phase name>",
  "phasePercent": <0-100 number representing progress through full cycle>,
  "averageLifecycle": "Rolling 12 months",
  "currentCycleStart": "<year and description of cycle start>",
  "timeline": [
    {
      "phase": "<phase name>",
      "description": "<brief description>",
      "startPercent": <0-100>,
      "endPercent": <0-100>,
      "isCurrent": <true/false>
    }
  ],
  "sp500Backtest": {
    "expectedUpside": <decimal like 0.15 for 15%>,
    "expectedDownside": <negative decimal like -0.10 for -10%>,
    "expectedReturn": <decimal like 0.08 for 8%>
  },
  "historicalAnalog": {
    "period": "<YYYY-YYYY>",
    "description": "<synthesis of all frameworks>",
    "similarity": "<High/Medium/Low with percentage>",
    "keyEvents": ["<event 1>", "<event 2>", "<event 3>"]
  },
  "frameworks": ["Mike Wilson", "David Kostin", "Savita Subramanian", "Tom Lee", "John Stoltzfus", "Ed Yardeni"]
}

CRITICAL: Return ONLY the JSON object. No explanations, no markdown.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8000,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  console.log('📊 Market Cycle raw response (first 500 chars):', responseText.substring(0, 500));

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('❌ Market Cycle: No JSON found in response');
    console.error('Full response:', responseText);
    throw new Error('Market Cycle analysis did not return valid JSON');
  }

  try {
    const cleanedJSON = cleanJSON(jsonMatch[0]);
    return JSON.parse(cleanedJSON);
  } catch (parseError) {
    console.error('❌ Market Cycle: JSON parse error');
    console.error('JSON string (first 2500 chars):', jsonMatch[0].substring(0, 2500));
    throw parseError;
  }
}

// ======================
// COMPANY CYCLE ANALYSIS
// ======================

async function analyzeCompanyCycle(realTimeData: CycleDataSources): Promise<CycleData> {
  const { market, economic } = realTimeData;
  
  // Get current date for dynamic analysis
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
  
  const prompt = `You are an expert analyst of corporate lifecycle cycles.

## Analysis Date: ${currentMonth} ${currentYear}

Analyze the current Company Lifecycle Cycle for the average US public company.

### Your Task:
1. **IMPORTANT**: Use "Rolling 12 months" as the averageLifecycle (this is our framework for real-time analysis)
2. Identify the current lifecycle phase of the average company
3. Provide actionable portfolio insights

### Analysis Frameworks (Synthesize ALL of these):
- **Patricia Dechow**: Earnings quality and lifecycle stages
- **Richard Foster**: Creative destruction and corporate longevity
- **Harry Markowitz**: Portfolio theory applied to company lifecycle
- **Bill Sharpe**: Risk-adjusted return across lifecycle stages

### Current Economic Context (${currentMonth} ${currentYear}):
- GDP Growth: ${economic.gdp_growth}%
- Unemployment: ${economic.unemployment}%
- S&P 500 Price: ${market.sp500_price}
- VIX (Volatility): ${market.volatility_vix}

### Output Requirements:
Respond with ONLY a valid JSON object (no markdown, no code blocks):

{
  "name": "Company Cycle",
  "phase": "<current phase name>",
  "phasePercent": <0-100 number representing progress through full cycle>,
  "averageLifecycle": "Rolling 12 months",
  "currentCycleStart": "<description of when current phase began>",
  "timeline": [
    {
      "phase": "<phase name like Startup/Growth/Maturity/Decline>",
      "description": "<brief description>",
      "startPercent": <0-100>,
      "endPercent": <0-100>,
      "isCurrent": <true/false>
    }
  ],
  "sp500Backtest": {
    "expectedUpside": <decimal like 0.15 for 15%>,
    "expectedDownside": <negative decimal like -0.10 for -10%>,
    "expectedReturn": <decimal like 0.08 for 8%>
  },
  "historicalAnalog": {
    "period": "<YYYY-YYYY>",
    "description": "<synthesis of all frameworks>",
    "similarity": "<High/Medium/Low with percentage>",
    "keyEvents": ["<event 1>", "<event 2>", "<event 3>"]
  },
  "frameworks": ["Patricia Dechow", "Richard Foster", "Harry Markowitz", "Bill Sharpe"]
}

CRITICAL: Return ONLY the JSON object. No explanations, no markdown.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8000,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  console.log('🏢 Company Cycle raw response (first 500 chars):', responseText.substring(0, 500));

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('❌ Company Cycle: No JSON found in response');
    console.error('Full response:', responseText);
    throw new Error('Company Cycle analysis did not return valid JSON');
  }

  let cleanedJSON = '';
  try {
    cleanedJSON = cleanJSON(jsonMatch[0]);
    return JSON.parse(cleanedJSON);
  } catch (parseError) {
    console.error('❌ Company Cycle: JSON parse error');
    console.error('Original JSON (first 2500 chars):', jsonMatch[0].substring(0, 2500));
    console.error('Cleaned JSON (first 2500 chars):', cleanedJSON.substring(0, 2500));
    
    // Try to find the error position
    if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
      const posMatch = parseError.message.match(/position (\d+)/);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        console.error('JSON around error position:', cleanedJSON.substring(Math.max(0, pos - 150), Math.min(cleanedJSON.length, pos + 150)));
        console.error('Exact error character:', cleanedJSON[pos], 'at position', pos);
      }
    }
    
    throw parseError;
  }
}

// ======================
// PORTFOLIO ANALYSIS (with caching)
// ======================

// Simple in-memory cache for portfolio impact analysis
const portfolioImpactCache = new Map<string, { result: unknown; timestamp: number }>();
const PORTFOLIO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getPortfolioCacheKey(portfolio: { stocks: number; bonds: number; cash: number; realEstate: number; commodities: number; alternatives: number }, cycles: Record<string, CycleData>): string {
  // Create cache key from portfolio allocation and cycle phases
  const portfolioKey = `${portfolio.stocks}-${portfolio.bonds}-${portfolio.cash}-${portfolio.realEstate}-${portfolio.commodities}-${portfolio.alternatives}`;
  const cycleKey = Object.values(cycles).map(c => `${c.phase}-${c.phasePercent}`).join('|');
  return `${portfolioKey}:${cycleKey}`;
}

async function analyzePortfolioImpact(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intakeData: any,
  cycles: Record<string, CycleData>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const startTime = Date.now();
  
  // Use portfolio.totalValue from intake form (should already be calculated from holdings)
  const totalValue = intakeData.portfolio?.totalValue;
  
  if (!totalValue || totalValue === 0) {
    console.warn('⚠️ No portfolio value provided to analyzePortfolioImpact');
    return {
      analysis: 'Unable to analyze portfolio: no portfolio value provided',
      totalValue: 0
    };
  }
  
  const portfolio = intakeData.portfolio || {
    stocks: 60,
    bonds: 30,
    cash: 5,
    realEstate: 5,
    commodities: 0,
    alternatives: 0
  };

  // Check cache first (based on allocation + cycle phases, not dollar value)
  const cacheKey = getPortfolioCacheKey(portfolio, cycles);
  const cached = portfolioImpactCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < PORTFOLIO_CACHE_TTL) {
    console.log(`✅ Portfolio impact analysis from cache (${Date.now() - startTime}ms)`);
    // Update totalValue in cached result since it may differ
    const result = { ...cached.result as Record<string, unknown> };
    if (result.current && typeof result.current === 'object') {
      (result.current as Record<string, unknown>).totalValue = totalValue;
    }
    return result;
  }

  console.log('📊 Analyzing portfolio with user data:', {
    totalValue,
    allocation: portfolio
  });

  // Use AI to analyze how THIS portfolio performs under current cycles
  const prompt = `You are a portfolio analyst. Analyze how the following portfolio will perform given current economic cycles.

## User's Portfolio:
- Total Value: $${totalValue.toLocaleString()}
- Allocation:
  - Stocks: ${portfolio.stocks}%
  - Bonds: ${portfolio.bonds}%
  - Cash: ${portfolio.cash}%
  - Real Estate: ${portfolio.realEstate}%
  - Commodities: ${portfolio.commodities}%
  - Alternatives: ${portfolio.alternatives}%

## Current Cycle Phases:
- Market (S&P 500) Cycle: ${cycles.market.phase} (${cycles.market.phasePercent}% through)
- Country Cycle: ${cycles.country.phase} (${cycles.country.phasePercent}% through)
- Technology Cycle: ${cycles.technology.phase} (${cycles.technology.phasePercent}% through)
- Economic Cycle: ${cycles.economic.phase} (${cycles.economic.phasePercent}% through)
- Business Cycle: ${cycles.business.phase} (${cycles.business.phasePercent}% through)
- Company Cycle: ${cycles.company.phase} (${cycles.company.phasePercent}% through)

## Task:
For each of the 6 cycles (Market, Country, Technology, Economic, Business, Company), provide:
1. How this specific portfolio performs in that cycle
2. Expected upside (as decimal, e.g., 0.25 = 25%)
3. Expected downside (as decimal, negative, e.g., -0.15 = -15%)
4. Expected return (median, as decimal)
5. Max drawdown (worst case, as decimal, negative)
6. Confidence level (High/Medium/Low)

Consider:
- Market cycle directly affects stock performance and volatility
- High stock allocation is riskier in late market/economic cycles
- Bonds perform better in downturns
- Cash is defensive
- Real estate depends on business cycle
- Technology stocks are affected by tech cycle phase
- Country/political stability affects all assets
- Company lifecycle affects individual stock selection

Return ONLY this JSON structure:
{
  "current": {
    "totalValue": ${totalValue},
    "cycleResults": {
      "country": {
        "expectedUpside": [decimal],
        "expectedDownside": [decimal, negative],
        "expectedReturn": [decimal],
        "maxDrawdown": [decimal, negative],
        "confidence": "[High/Medium/Low]"
      },
      "technology": {
        "expectedUpside": [decimal],
        "expectedDownside": [decimal, negative],
        "expectedReturn": [decimal],
        "maxDrawdown": [decimal, negative],
        "confidence": "[High/Medium/Low]"
      },
      "economic": {
        "expectedUpside": [decimal],
        "expectedDownside": [decimal, negative],
        "expectedReturn": [decimal],
        "maxDrawdown": [decimal, negative],
        "confidence": "[High/Medium/Low]"
      },
      "business": {
        "expectedUpside": [decimal],
        "expectedDownside": [decimal, negative],
        "expectedReturn": [decimal],
        "maxDrawdown": [decimal, negative],
        "confidence": "[High/Medium/Low]"
      },
      "market": {
        "expectedUpside": [decimal],
        "expectedDownside": [decimal, negative],
        "expectedReturn": [decimal],
        "maxDrawdown": [decimal, negative],
        "confidence": "[High/Medium/Low]"
      },
      "company": {
        "expectedUpside": [decimal],
        "expectedDownside": [decimal, negative],
        "expectedReturn": [decimal],
        "maxDrawdown": [decimal, negative],
        "confidence": "[High/Medium/Low]"
      }
    },
    "overall": {
      "expectedUpside": [weighted average of all 6 cycles],
      "expectedDownside": [weighted average of all 6 cycles],
      "expectedReturn": [weighted average of all 6 cycles],
      "maxDrawdown": [worst case across all cycles],
      "confidence": "[overall confidence based on all 6 cycles]"
    }
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('❌ Portfolio Analysis: No JSON found in response');
      console.error('Response:', responseText.substring(0, 500));
      throw new Error('Portfolio analysis AI failed to return valid JSON');
    }

    try {
      const cleanedJSON = cleanJSON(jsonMatch[0]);
      const analysis = JSON.parse(cleanedJSON);
      
      // Cache the result (without specific dollar value)
      portfolioImpactCache.set(cacheKey, { result: analysis, timestamp: Date.now() });
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ Portfolio analysis completed with user data (${elapsed}ms) - cached for future use`);
      return analysis;
    } catch (parseError) {
      console.error('❌ Portfolio Analysis: JSON parse error');
      console.error('JSON string (first 1000 chars):', jsonMatch[0].substring(0, 1000));
      throw new Error(`Portfolio analysis JSON parse failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('❌ Portfolio analysis failed:', error);
    throw new Error(`Portfolio analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ======================
// GOAL ANALYSIS
// ======================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function analyzeGoalProbability(intakeData: any, portfolioAnalysis: any): Promise<any> {
  // Use correct field names from IntakeFormData
  const goalAmount = intakeData.goalAmount || 1000000;
  const currentAmount = portfolioAnalysis.current.totalValue;
  const timeHorizon = intakeData.timeHorizon || 10;
  const monthlyContribution = intakeData.monthlyContribution || 0;

  console.log('🎯 Analyzing goal probability with LONG-TERM AVERAGES:', {
    goalAmount,
    currentAmount,
    timeHorizon,
    monthlyContribution,
    longTermAverages: LONG_TERM_AVERAGES
  });

  // Create input for goal probability calculation
  const probabilityInput = createGoalProbabilityInput(intakeData);
  
  if (!probabilityInput) {
    console.warn('Could not create goal probability input, using fallback calculation');
    // Fallback to simple calculation
    const avgReturn = portfolioAnalysis.current.overall.expectedReturn;
    const projectedValue = currentAmount * Math.pow(1 + avgReturn, timeHorizon);
    const successProbability = Math.min(1, Math.max(0, projectedValue / goalAmount));
    
    return {
      goalAmount,
      goalDescription: intakeData.goalDescription || 'Financial Goal',
      currentAmount,
      timeHorizon,
      monthlyContribution,
      probabilityOfSuccess: {
        median: successProbability,
        downside: successProbability * 0.6,
        upside: Math.min(1, successProbability * 1.4),
      },
      projectedValues: {
        median: projectedValue,
        downside: projectedValue * 0.6,
        upside: projectedValue * 1.4,
      },
      shortfall: {
        median: projectedValue - goalAmount,
        downside: (projectedValue * 0.6) - goalAmount,
        upside: (projectedValue * 1.4) - goalAmount,
      },
      recommendation: 'Unable to calculate detailed probability. Please ensure all required fields are provided.',
    };
  }

  // Override currentAmount with portfolio analysis value
  probabilityInput.currentAmount = currentAmount;

  // Calculate goal probability using long-term averages + Monte Carlo
  const result = calculateGoalProbability(probabilityInput);

  console.log('✅ Goal probability calculated:', {
    expectedReturn: result.expectedReturn,
    medianProbability: result.probabilityOfSuccess.median,
    medianProjectedValue: result.projectedValues.median
  });

  // Generate personalized recommendation
  const successProbability = result.probabilityOfSuccess.median;
  let recommendation = '';
  
  if (successProbability >= 0.9) {
    recommendation = `Excellent! You have a ${Math.round(successProbability * 100)}% probability of reaching your $${goalAmount.toLocaleString()} goal in ${timeHorizon} years. Based on inflation-adjusted historical averages (Stocks: ${LONG_TERM_AVERAGES.stocks * 100}%, Bonds: ${LONG_TERM_AVERAGES.bonds * 100}%, etc.), your current strategy is well-positioned. Consider maintaining your current allocation and continuing your ${monthlyContribution > 0 ? `$${monthlyContribution.toLocaleString()} monthly contributions` : 'investment discipline'}.`;
  } else if (successProbability >= 0.7) {
    recommendation = `Good progress! You have a ${Math.round(successProbability * 100)}% probability of reaching your goal. Based on inflation-adjusted historical returns and current cycle positioning, consider ${monthlyContribution > 0 ? 'increasing your monthly contributions' : 'making monthly contributions'} or adjusting your allocation to higher-return asset classes.`;
  } else if (successProbability >= 0.5) {
    const shortfall = goalAmount - result.projectedValues.median;
    const additionalMonthly = Math.round(shortfall / (timeHorizon * 12));
    recommendation = `Moderate success probability of ${Math.round(successProbability * 100)}%. Using inflation-adjusted long-term averages, consider: 1) Increasing contributions by $${additionalMonthly.toLocaleString()}/month, 2) Extending your time horizon, or 3) Increasing allocation to higher-return assets like stocks (${LONG_TERM_AVERAGES.stocks * 100}% real return).`;
  } else {
    const avgReturn = result.expectedReturn;
    const requiredMonthly = avgReturn > 0 
      ? Math.round((goalAmount - currentAmount * Math.pow(1 + avgReturn, timeHorizon)) / ((Math.pow(1 + avgReturn/12, timeHorizon * 12) - 1) / (avgReturn/12)))
      : Math.round((goalAmount - currentAmount) / (timeHorizon * 12));
    recommendation = `Your current path has a ${Math.round(successProbability * 100)}% success probability. Based on inflation-adjusted historical averages, to reach your goal you would need to contribute approximately $${requiredMonthly.toLocaleString()}/month, extend your timeline, or adjust your target goal to $${Math.round(result.projectedValues.median).toLocaleString()}.`;
  }

  return {
    goalAmount,
    goalDescription: intakeData.goalDescription || 'Financial Goal',
    currentAmount,
    timeHorizon,
    monthlyContribution,
    probabilityOfSuccess: result.probabilityOfSuccess,
    projectedValues: result.projectedValues,
    shortfall: result.shortfall,
    expectedReturn: result.expectedReturn,
    recommendation,
  };
}
