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

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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
    
    const [countryAnalysis, technologyAnalysis, economicAnalysis, businessAnalysis] = await Promise.all([
      analyzeCountryCycleWithCache(realTimeData, dataHash),
      analyzeTechnologyCycleWithCache(realTimeData, dataHash),
      analyzeEconomicCycleWithCache(realTimeData, dataHash),
      analyzeBusinessCycleWithCache(realTimeData, dataHash),
    ]);
    console.log('✅ All cycle analyses completed');

    // Run portfolio and goal analysis
    const portfolioAnalysis = await analyzePortfolioImpact(intakeData, {
      country: countryAnalysis,
      technology: technologyAnalysis,
      economic: economicAnalysis,
      business: businessAnalysis,
    });

    const goalAnalysis = await analyzeGoalProbability(intakeData, portfolioAnalysis);

    const cycleAnalysisResult: CycleAnalysisResult = {
      cycles: {
        country: countryAnalysis,
        technology: technologyAnalysis,
        economic: economicAnalysis,
        business: businessAnalysis,
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
      const cycleData: CycleData = JSON.parse(jsonMatch[0]);
      return cycleData;
    } catch (parseError) {
      console.error('❌ Technology Cycle: JSON parse error');
      console.error('JSON string:', jsonMatch[0].substring(0, 1000));
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

## Required Output Format (JSON):

{
  "name": "Country Cycle",
  "phase": "[Current phase name]",
  "phasePercent": [0-100],
  "averageLifecycle": "[Duration]",
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
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('❌ Country Cycle: JSON parse error at position', parseError);
    console.error('JSON string (first 2000 chars):', jsonMatch[0].substring(0, 2000));
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
    console.error('❌ Economic Cycle: No JSON found in response');
    console.error('Response:', responseText.substring(0, 500));
    throw new Error('Failed to parse Economic Cycle AI response');
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('❌ Economic Cycle: JSON parse error');
    console.error('JSON string (first 1000 chars):', jsonMatch[0].substring(0, 1000));
    throw parseError;
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

## Required Output Format (JSON):

{
  "name": "Business Cycle",
  "phase": "[Phase]",
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
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('❌ Business Cycle: JSON parse error');
    console.error('JSON string (first 1000 chars):', jsonMatch[0].substring(0, 1000));
    throw parseError;
  }
}

// ======================
// PORTFOLIO ANALYSIS
// ======================

async function analyzePortfolioImpact(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intakeData: any,
  cycles: Record<string, CycleData>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // Use portfolio.totalValue from intake form (not totalInvestment!)
  const totalValue = intakeData.portfolio?.totalValue || 500000;
  const portfolio = intakeData.portfolio || {
    stocks: 60,
    bonds: 30,
    cash: 5,
    realEstate: 5,
    commodities: 0,
    alternatives: 0
  };

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
- Country Cycle: ${cycles.country.phase} (${cycles.country.phasePercent}% through)
- Technology Cycle: ${cycles.technology.phase} (${cycles.technology.phasePercent}% through)
- Economic Cycle: ${cycles.economic.phase} (${cycles.economic.phasePercent}% through)
- Business Cycle: ${cycles.business.phase} (${cycles.business.phasePercent}% through)

## Task:
For each of the 4 cycles (Country, Technology, Economic, Business), provide:
1. How this specific portfolio performs in that cycle
2. Expected upside (as decimal, e.g., 0.25 = 25%)
3. Expected downside (as decimal, negative, e.g., -0.15 = -15%)
4. Expected return (median, as decimal)
5. Max drawdown (worst case, as decimal, negative)
6. Confidence level (High/Medium/Low)

Consider:
- High stock allocation is riskier in late cycles
- Bonds perform better in downturns
- Cash is defensive
- Real estate depends on business cycle
- Technology stocks are affected by tech cycle phase
- Country/political stability affects all assets

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
      }
    },
    "overall": {
      "expectedUpside": [weighted average of all 4 cycles],
      "expectedDownside": [weighted average of all 4 cycles],
      "expectedReturn": [weighted average of all 4 cycles],
      "maxDrawdown": [worst case across all cycles],
      "confidence": "[overall confidence based on all 4 cycles]"
    }
  }
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
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
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('✅ Portfolio analysis completed with user data');
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

  console.log('🎯 Analyzing goal probability with user data:', {
    goalAmount,
    currentAmount,
    timeHorizon,
    monthlyContribution
  });

  // Calculate projected values including monthly contributions
  const avgReturn = portfolioAnalysis.current.overall.expectedReturn;
  const upsideReturn = portfolioAnalysis.current.overall.expectedUpside;
  const downsideReturn = portfolioAnalysis.current.overall.expectedDownside;

  // Future value with monthly contributions formula: FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
  const calculateFutureValue = (principal: number, monthlyPmt: number, annualReturn: number, years: number) => {
    const monthlyReturn = annualReturn / 12;
    const months = years * 12;
    
    // Future value of principal
    const fvPrincipal = principal * Math.pow(1 + annualReturn, years);
    
    // Future value of monthly contributions (if any)
    const fvContributions = monthlyPmt > 0 && monthlyReturn !== 0
      ? monthlyPmt * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn)
      : monthlyPmt * months;
    
    return fvPrincipal + fvContributions;
  };

  const projectedMedian = calculateFutureValue(currentAmount, monthlyContribution, avgReturn, timeHorizon);
  const projectedUpside = calculateFutureValue(currentAmount, monthlyContribution, upsideReturn, timeHorizon);
  const projectedDownside = calculateFutureValue(currentAmount, monthlyContribution, downsideReturn, timeHorizon);

  const successProbability = Math.min(1, Math.max(0, projectedMedian / goalAmount));

  // Generate personalized recommendation
  let recommendation = '';
  if (successProbability >= 0.9) {
    recommendation = `Excellent! You have a ${Math.round(successProbability * 100)}% probability of reaching your $${goalAmount.toLocaleString()} goal in ${timeHorizon} years. Your current strategy is well-positioned given the economic cycles. Consider maintaining your current allocation and continuing your ${monthlyContribution > 0 ? `$${monthlyContribution.toLocaleString()} monthly contributions` : 'investment discipline'}.`;
  } else if (successProbability >= 0.7) {
    recommendation = `Good progress! You have a ${Math.round(successProbability * 100)}% probability of reaching your goal. To improve your odds, consider ${monthlyContribution > 0 ? 'increasing your monthly contributions' : 'making monthly contributions'} or adjusting your allocation based on current cycle positioning.`;
  } else if (successProbability >= 0.5) {
    recommendation = `Moderate success probability of ${Math.round(successProbability * 100)}%. Given current economic cycles (${portfolioAnalysis.current.overall.confidence} confidence), consider: 1) Increasing contributions by $${Math.round((goalAmount - projectedMedian) / (timeHorizon * 12)).toLocaleString()}/month, 2) Extending your time horizon, or 3) Adjusting allocation for better cycle alignment.`;
  } else {
    const requiredMonthly = Math.round((goalAmount - currentAmount * Math.pow(1 + avgReturn, timeHorizon)) / ((Math.pow(1 + avgReturn/12, timeHorizon * 12) - 1) / (avgReturn/12)));
    recommendation = `Your current path has a ${Math.round(successProbability * 100)}% success probability. To reach your goal, you would need to contribute approximately $${requiredMonthly.toLocaleString()}/month, extend your timeline to ${Math.round(Math.log(goalAmount / currentAmount) / Math.log(1 + avgReturn))} years, or adjust your target goal to $${Math.round(projectedMedian).toLocaleString()}.`;
  }

  return {
    goalAmount,
    goalDescription: intakeData.goalDescription || 'Financial Goal',
    currentAmount,
    timeHorizon,
    monthlyContribution,
    probabilityOfSuccess: {
      median: successProbability,
      downside: Math.min(1, Math.max(0, projectedDownside / goalAmount)),
      upside: Math.min(1, Math.max(0, projectedUpside / goalAmount)),
    },
    projectedValues: {
      median: projectedMedian,
      downside: projectedDownside,
      upside: projectedUpside,
    },
    shortfall: {
      median: projectedMedian - goalAmount,
      downside: projectedDownside - goalAmount,
      upside: projectedUpside - goalAmount,
    },
    recommendation,
  };
}
