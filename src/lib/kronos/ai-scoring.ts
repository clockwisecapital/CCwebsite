/**
 * Kronos AI-Enhanced Scoring
 * 
 * Uses Anthropic Claude for:
 * 1. Intelligent question classification
 * 2. Dynamic historical analog selection
 * 3. Real similarity scoring based on market conditions
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ScenarioId, HistoricalAnalog } from './types';
import { HISTORICAL_ANALOGS } from './constants';
import { fetchEconomicIndicators, fetchMarketIndicators } from '@/lib/data-sources';

// Initialize Anthropic client - will be created lazily when needed
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// =====================================================================================
// TYPES
// =====================================================================================

export interface AIScenarioClassification {
  scenarioId: ScenarioId;
  confidence: number;
  reasoning: string;
  alternativeScenarios?: Array<{
    scenarioId: ScenarioId;
    confidence: number;
  }>;
}

export interface AIHistoricalAnalogMatch {
  analog: HistoricalAnalog;
  similarity: number;
  matchingFactors: string[];
  keyEvents: string[];
  reasoning: string;
}

// =====================================================================================
// HELPER FUNCTIONS
// =====================================================================================

/**
 * Clean and parse JSON from AI response
 */
function cleanJSON(jsonString: string): string {
  // Remove markdown code blocks
  jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Extract only the first complete JSON object
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
            jsonString = jsonString.substring(firstBraceIndex, i + 1);
            break;
          }
        }
      }
    }
  }
  
  // Fix trailing commas
  jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
  
  return jsonString.trim();
}

// =====================================================================================
// AI-POWERED QUESTION CLASSIFICATION
// =====================================================================================

/**
 * Use AI to classify a scenario question with confidence scoring
 * More intelligent than simple keyword matching
 */
export async function classifyQuestionWithAI(
  question: string
): Promise<AIScenarioClassification> {
  console.log('🤖 Using AI to classify scenario question...');
  
  const prompt = `You are an expert in portfolio risk analysis and scenario testing.

## Task:
Analyze the following investor question and classify it into the most appropriate scenario category.

## Question:
"${question}"

## Scenario Categories:

1. **market-volatility**
   - Focus: Sudden market crashes, corrections, downturns
   - Keywords: volatility, crash, correction, panic, sell-off, market drop
   - Risk: Equity drawdown during crisis periods

2. **ai-supercycle**
   - Focus: Technology bubble risk, AI hype cycle, innovation speculation
   - Keywords: AI, artificial intelligence, tech bubble, supercycle, innovation boom
   - Risk: Sector concentration in technology

3. **cash-vs-bonds**
   - Focus: Interest rate changes, fixed income vs cash decisions
   - Keywords: cash, duration, bonds, treasuries, yield, rates, fixed income
   - Risk: Interest rate sensitivity

4. **tech-concentration**
   - Focus: Portfolio concentration in tech sector, Mag 7 exposure
   - Keywords: concentrated, tech heavy, big tech, FAANG, sector risk
   - Risk: Momentum reversal in concentrated positions

5. **inflation-hedge**
   - Focus: Inflation protection, purchasing power preservation
   - Keywords: inflation, purchasing power, deflation, price increases, CPI
   - Risk: Loss of purchasing power

6. **recession-risk**
   - Focus: Economic contraction, stagflation, slowdown
   - Keywords: recession, stagflation, economic downturn, slowdown, contraction
   - Risk: Economic contraction impact

## Your Task:

1. Identify the PRIMARY scenario that best matches this question
2. Provide a confidence score (0.0-1.0) for your classification
3. Briefly explain your reasoning
4. Optionally list alternative scenarios if the question is ambiguous

## Output Format (JSON):

{
  "scenarioId": "market-volatility",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this scenario was chosen",
  "alternativeScenarios": [
    { "scenarioId": "recession-risk", "confidence": 0.65 }
  ]
}

Provide only the JSON output, no additional text.`;

  try {
    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI classification response');
    }
    
    const cleanedJSON = cleanJSON(jsonMatch[0]);
    const classification: AIScenarioClassification = JSON.parse(cleanedJSON);
    
    console.log(`✓ AI classified as: ${classification.scenarioId} (${(classification.confidence * 100).toFixed(0)}% confidence)`);
    
    return classification;
    
  } catch (error) {
    console.error('❌ AI question classification failed:', error);
    throw error;
  }
}

// =====================================================================================
// AI-POWERED HISTORICAL ANALOG SELECTION
// =====================================================================================

/**
 * Use AI to select the best historical analog based on current market conditions
 * and the specific question context
 */
export async function findHistoricalAnalogWithAI(
  question: string,
  scenarioId: ScenarioId
): Promise<AIHistoricalAnalogMatch> {
  console.log('🤖 Using AI to find best historical analog...');
  
  // Fetch current market data
  let marketData: any = {};
  let economicData: any = {};
  
  try {
    [marketData, economicData] = await Promise.all([
      fetchMarketIndicators(),
      fetchEconomicIndicators()
    ]);
  } catch (error) {
    console.warn('⚠️ Could not fetch real-time data, proceeding without it');
  }
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
  
  const prompt = `You are an expert in financial history and market cycle analysis.

## Analysis Date: ${currentMonth} ${currentYear}

## Task:
Find the best historical analog period for testing a portfolio against this scenario question.

## Question:
"${question}"

## Scenario Type: ${scenarioId}

## Current Market Conditions (as of ${currentDate.toISOString().split('T')[0]}):

**Economic Indicators:**
- GDP Growth: ${economicData.gdp_growth || 'N/A'}%
- Unemployment: ${economicData.unemployment || 'N/A'}%
- Inflation (CPI): ${economicData.inflation_cpi || 'N/A'}%
- Fed Funds Rate: ${economicData.fed_funds_rate || 'N/A'}%
- 10Y Treasury: ${economicData.treasury_10y || 'N/A'}%

**Market Indicators:**
- S&P 500: ${marketData.sp500_price || 'N/A'}
- P/E Ratio: ${marketData.sp500_pe_ratio || 'N/A'}
- VIX: ${marketData.volatility_vix || 'N/A'}
- NVIDIA Market Cap: $${marketData.nvidia_market_cap || 'N/A'}B

## Available Historical Analogs:

### 1. COVID Crash (Feb-Mar 2020)
- **Period:** 2020-02-01 to 2020-03-31
- **Characteristics:** 
  - Rapid 34% market decline in ~1 month
  - Global pandemic shock
  - Unprecedented monetary/fiscal response
  - V-shaped recovery
  - Flight to safety (bonds rallied, gold up)
- **S&P 500 Return:** -33.9%
- **Best For:** Testing extreme volatility, sudden crash scenarios, flight-to-quality dynamics

### 2. Dot-Com Bust (Mar 2000 - Oct 2002)
- **Period:** 2000-03-01 to 2002-10-01
- **Characteristics:**
  - Technology bubble burst
  - 49% decline over 2.5 years
  - Massive tech sector concentration unwinding
  - Growth → value rotation
  - Corporate scandals (Enron, WorldCom)
- **S&P 500 Return:** -49.1%
- **Best For:** Tech bubble, sector concentration risk, AI supercycle concerns

### 3. Rate Shock (2022)
- **Period:** 2022-01-01 to 2022-12-31
- **Characteristics:**
  - Rapid Fed rate hikes (0% → 4.5%)
  - Duration hit bonds hard (TLT -30%)
  - Growth stocks underperformed
  - Inflation spike (9% peak)
  - Bond/stock correlation broke down
- **S&P 500 Return:** -18.1%
- **Best For:** Interest rate risk, cash vs bonds decisions, inflation concerns

### 4. Stagflation Era (1973-1974)
- **Period:** 1973-01-01 to 1974-12-31
- **Characteristics:**
  - Oil crisis, supply shocks
  - High inflation + recession
  - 48% market decline
  - Bonds and stocks both declined
  - Gold and commodities performed well
- **S&P 500 Return:** -48.2%
- **Best For:** Recession risk, stagflation, inflation hedge testing

## Your Task:

1. Select the SINGLE best historical analog for testing this portfolio question
2. Calculate a similarity score (0-100%) comparing current conditions to that period
3. List 3-5 specific matching factors (economic, market, or thematic similarities)
4. List 3-5 key events from that period
5. Explain your reasoning

## Important:
- Consider BOTH the question intent and current market conditions
- Similarity score should be realistic (most periods are 40-70% similar)
- Focus on the most relevant analog for the specific risk being tested

## Output Format (JSON):

{
  "analogId": "COVID_CRASH",
  "analogName": "COVID Crash",
  "period": "Feb-Mar 2020",
  "similarity": 65,
  "matchingFactors": [
    "High market valuation (P/E ratio elevated in both periods)",
    "Low unemployment preceding shock",
    "Strong tech sector leadership"
  ],
  "keyEvents": [
    "WHO declares pandemic (March 11, 2020)",
    "Fed cuts rates to zero (March 15, 2020)",
    "VIX hits 82.69 (March 16, 2020)"
  ],
  "reasoning": "Brief explanation of why this analog was selected"
}

Provide only the JSON output, no additional text.`;

  try {
    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI analog selection response');
    }
    
    const cleanedJSON = cleanJSON(jsonMatch[0]);
    const result = JSON.parse(cleanedJSON);
    
    // Normalize the analog ID (AI may return variations)
    let analogId = result.analogId;
    
    // Handle common AI variations
    const analogIdMap: Record<string, string> = {
      'DOTCOM': 'DOT_COM_BUST',
      'DOTCOM_BUST': 'DOT_COM_BUST',
      'DOT_COM': 'DOT_COM_BUST',
      'COVID': 'COVID_CRASH',
      'COVID_19': 'COVID_CRASH',
      'RATE_SHOCK_2022': 'RATE_SHOCK',
      'RATES_SHOCK': 'RATE_SHOCK',
      'STAGFLATION_70S': 'STAGFLATION'
    };
    
    // Try direct lookup first
    let analog = HISTORICAL_ANALOGS[analogId];
    
    // If not found, try mapped variations
    if (!analog && analogIdMap[analogId]) {
      analogId = analogIdMap[analogId];
      analog = HISTORICAL_ANALOGS[analogId];
    }
    
    // If still not found, try stripping year suffix (e.g., "RATE_SHOCK_2022" → "RATE_SHOCK")
    if (!analog && analogId.includes('_') && /\d{4}$/.test(analogId)) {
      const parts = analogId.split('_');
      if (/^\d{4}$/.test(parts[parts.length - 1])) {
        analogId = parts.slice(0, -1).join('_');
        analog = HISTORICAL_ANALOGS[analogId];
      }
    }
    
    if (!analog) {
      throw new Error(`Invalid analog ID returned by AI: ${result.analogId} (tried: ${analogId})`);
    }
    
    const match: AIHistoricalAnalogMatch = {
      analog,
      similarity: result.similarity,
      matchingFactors: result.matchingFactors,
      keyEvents: result.keyEvents,
      reasoning: result.reasoning
    };
    
    console.log(`✓ AI selected: ${match.analog.name} (${match.similarity}% similarity)`);
    console.log(`  Matching factors: ${match.matchingFactors.length}`);
    
    return match;
    
  } catch (error) {
    console.error('❌ AI analog selection failed:', error);
    throw error;
  }
}

// =====================================================================================
// VALIDATION
// =====================================================================================

/**
 * Check if AI scoring is available (API key configured)
 */
export function isAIScoringAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
