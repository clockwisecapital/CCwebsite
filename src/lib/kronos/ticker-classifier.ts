/**
 * AI-Powered Ticker Classification System
 * 
 * Classifies any ticker (stock, ETF, fund) into Kronos asset classes
 * Uses 3-tier system: Static ETF Map → Database Cache → AI Classification
 */

import Anthropic from '@anthropic-ai/sdk';
import type { KronosAssetClass } from './types';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// ============================================================================
// TYPES
// ============================================================================

export interface TickerClassification {
  ticker: string;
  assetClass: KronosAssetClass;
  confidence: number;
  reasoning: string;
  source: 'static' | 'cache' | 'ai';
  updatedAt: Date;
}

interface AIClassificationResponse {
  assetClass: KronosAssetClass;
  confidence: number;
  reasoning: string;
}

// ============================================================================
// STATIC ETF MAPPINGS (Tier 1 - Fastest)
// ============================================================================

const STATIC_ETF_MAPPINGS: Record<string, KronosAssetClass> = {
  // US Equity - Broad
  'SPY': 'us-large-cap',
  'VOO': 'us-large-cap',
  'IVV': 'us-large-cap',
  'VTI': 'us-large-cap',
  'ITOT': 'us-large-cap',
  
  // US Equity - Growth
  'VUG': 'us-growth',
  'IVW': 'us-growth',
  'VONG': 'us-growth',
  
  // US Equity - Value
  'VTV': 'us-value',
  'IVE': 'us-value',
  'VONV': 'us-value',
  
  // US Equity - Small Cap
  'IWM': 'us-small-cap',
  'VB': 'us-small-cap',
  'VTWO': 'us-small-cap',
  'SCHA': 'us-small-cap',
  
  // International
  'VEA': 'international',
  'IEFA': 'international',
  'SCHF': 'international',
  'EFA': 'international',
  
  // Emerging Markets
  'VWO': 'emerging-markets',
  'IEMG': 'emerging-markets',
  'EEM': 'emerging-markets',
  'SCHE': 'emerging-markets',
  
  // Sector - Technology
  'QQQ': 'tech-sector',
  'VGT': 'tech-sector',
  'XLK': 'tech-sector',
  'SOXX': 'tech-sector',
  
  // Sector - Healthcare
  'VHT': 'healthcare',
  'XLV': 'healthcare',
  'IYH': 'healthcare',
  
  // Sector - Financials
  'VFH': 'financials',
  'XLF': 'financials',
  'IYF': 'financials',
  
  // Sector - Energy
  'VDE': 'energy',
  'XLE': 'energy',
  'IYE': 'energy',
  
  // Bonds - Long Treasury
  'TLT': 'long-treasuries',
  'VGLT': 'long-treasuries',
  'SPTL': 'long-treasuries',
  
  // Bonds - Intermediate Treasury
  'IEF': 'intermediate-treasuries',
  'VGIT': 'intermediate-treasuries',
  'SCHR': 'intermediate-treasuries',
  
  // Bonds - Short Treasury
  'SHY': 'short-treasuries',
  'VGSH': 'short-treasuries',
  'SCHO': 'short-treasuries',
  'BIL': 'short-treasuries',
  
  // Bonds - TIPS
  'TIP': 'tips',
  'VTIP': 'tips',
  'SCHP': 'tips',
  
  // Bonds - Aggregate
  'AGG': 'aggregate-bonds',
  'BND': 'aggregate-bonds',
  'SCHZ': 'aggregate-bonds',
  
  // Bonds - Corporate Investment Grade
  'LQD': 'corporate-ig',
  'VCIT': 'corporate-ig',
  'USIG': 'corporate-ig',
  
  // Bonds - High Yield
  'HYG': 'high-yield',
  'JNK': 'high-yield',
  'USHY': 'high-yield',
  
  // Commodities - Gold
  'GLD': 'gold',
  'IAU': 'gold',
  'GLDM': 'gold',
  
  // Commodities - Broad
  'DBC': 'commodities',
  'PDBC': 'commodities',
  'USCI': 'commodities',
  'GSG': 'commodities',
  
  // Cash
  'SGOV': 'cash',
  'TFLO': 'cash',
  'USFR': 'cash',
};

// ============================================================================
// AI CLASSIFICATION (Tier 3)
// ============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export function isAIClassificationAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Classify ticker using AI (Anthropic Claude)
 */
async function classifyTickerWithAI(ticker: string): Promise<AIClassificationResponse> {
  const client = getAnthropicClient();
  
  const prompt = `You are a financial asset classifier. Classify the ticker "${ticker}" into ONE of these asset classes:

ASSET CLASSES:
- us-large-cap: US large-cap stocks (S&P 500 type)
- us-growth: US growth stocks
- us-value: US value stocks
- us-small-cap: US small-cap stocks
- international: Developed international stocks (Europe, Japan, etc.)
- emerging-markets: Emerging market stocks
- tech-sector: Technology sector stocks
- healthcare: Healthcare sector stocks
- financials: Financial sector stocks
- energy: Energy sector stocks
- long-treasuries: Long-term US Treasury bonds (20+ years)
- intermediate-treasuries: Intermediate US Treasury bonds (7-10 years)
- short-treasuries: Short-term US Treasury bonds (1-3 years)
- tips: Treasury Inflation-Protected Securities
- aggregate-bonds: Broad bond market
- corporate-ig: Investment-grade corporate bonds
- high-yield: High-yield (junk) bonds
- gold: Gold and gold miners
- commodities: Broad commodities (oil, agriculture, metals)
- cash: Cash equivalents and money market

INSTRUCTIONS:
1. Consider the ticker's sector, market cap, geography, and asset type
2. Choose the MOST SPECIFIC applicable class (e.g., "tech-sector" over "us-large-cap" for AAPL)
3. For stocks, prioritize sector classification over general equity
4. For international stocks, use "international" or "emerging-markets"
5. For gold miners (like NEM), classify as "gold"
6. For leveraged/inverse ETFs (QID, SQQQ), classify based on underlying exposure with lower confidence

Return ONLY valid JSON with this exact structure:
{
  "assetClass": "tech-sector",
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}`;

  try {
    console.log(`🤖 Classifying ${ticker} with AI...`);
    
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    // Extract JSON from response (may have markdown code blocks)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const result = JSON.parse(jsonMatch[0]) as AIClassificationResponse;
    
    // Validate result
    if (!result.assetClass || typeof result.confidence !== 'number') {
      throw new Error('Invalid AI classification response structure');
    }

    console.log(`✓ AI classified ${ticker} as ${result.assetClass} (${(result.confidence * 100).toFixed(0)}% confidence)`);
    
    return result;
  } catch (error) {
    console.error(`❌ AI classification failed for ${ticker}:`, error);
    
    // Fallback to us-large-cap with low confidence
    return {
      assetClass: 'us-large-cap',
      confidence: 0.3,
      reasoning: `AI classification failed: ${error instanceof Error ? error.message : 'Unknown error'}. Defaulting to us-large-cap.`
    };
  }
}

// ============================================================================
// DATABASE CACHING (Tier 2)
// ============================================================================

const CACHE_TTL_DAYS = 30; // Cache classifications for 30 days

/**
 * Get cached classification from database
 */
async function getCachedClassification(ticker: string): Promise<TickerClassification | null> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('ticker_classifications')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Check if cache is still valid
    const updatedAt = new Date(data.updated_at);
    const ageMs = Date.now() - updatedAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    
    if (ageDays > CACHE_TTL_DAYS) {
      console.log(`📦 Cache expired for ${ticker} (${ageDays.toFixed(1)} days old)`);
      return null;
    }
    
    console.log(`📦 Using cached classification for ${ticker} (${ageDays.toFixed(1)} days old)`);
    
    return {
      ticker: data.ticker,
      assetClass: data.asset_class as KronosAssetClass,
      confidence: data.confidence,
      reasoning: data.reasoning || '',
      source: 'cache',
      updatedAt
    };
  } catch (error) {
    console.error(`Error fetching cached classification for ${ticker}:`, error);
    return null;
  }
}

/**
 * Cache classification in database
 */
async function cacheClassification(classification: {
  ticker: string;
  assetClass: KronosAssetClass;
  confidence: number;
  reasoning: string;
}): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();
    
    const { error } = await supabase
      .from('ticker_classifications')
      .upsert({
        ticker: classification.ticker.toUpperCase(),
        asset_class: classification.assetClass,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'ticker'
      });
    
    if (error) {
      console.error(`Error caching classification for ${classification.ticker}:`, error);
    } else {
      console.log(`📦 Cached classification for ${classification.ticker}`);
    }
  } catch (error) {
    console.error(`Error caching classification for ${classification.ticker}:`, error);
  }
}

// ============================================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================================

/**
 * Classify a ticker into a Kronos asset class
 * 
 * Uses 3-tier system:
 * 1. Static ETF mappings (instant)
 * 2. Database cache (fast)
 * 3. AI classification (slower, cached after first use)
 */
export async function classifyTicker(ticker: string): Promise<TickerClassification> {
  const normalizedTicker = ticker.toUpperCase().trim();
  
  // Tier 1: Static ETF mappings
  const staticMapping = STATIC_ETF_MAPPINGS[normalizedTicker];
  if (staticMapping) {
    return {
      ticker: normalizedTicker,
      assetClass: staticMapping,
      confidence: 1.0,
      reasoning: 'Known ETF mapping',
      source: 'static',
      updatedAt: new Date()
    };
  }
  
  // Tier 2: Database cache
  const cached = await getCachedClassification(normalizedTicker);
  if (cached) {
    return cached;
  }
  
  // Tier 3: AI classification
  if (!isAIClassificationAvailable()) {
    console.warn(`⚠️ AI not available for ${normalizedTicker}, defaulting to us-large-cap`);
    return {
      ticker: normalizedTicker,
      assetClass: 'us-large-cap',
      confidence: 0.3,
      reasoning: 'AI classification not available, using default',
      source: 'ai',
      updatedAt: new Date()
    };
  }
  
  const aiResult = await classifyTickerWithAI(normalizedTicker);
  
  // Cache the result
  await cacheClassification({
    ticker: normalizedTicker,
    assetClass: aiResult.assetClass,
    confidence: aiResult.confidence,
    reasoning: aiResult.reasoning
  });
  
  return {
    ticker: normalizedTicker,
    assetClass: aiResult.assetClass,
    confidence: aiResult.confidence,
    reasoning: aiResult.reasoning,
    source: 'ai',
    updatedAt: new Date()
  };
}

/**
 * Batch classify multiple tickers (processes in parallel with rate limiting)
 */
export async function batchClassifyTickers(tickers: string[]): Promise<Map<string, TickerClassification>> {
  const results = new Map<string, TickerClassification>();
  
  // Process in batches of 5 to avoid rate limits
  const BATCH_SIZE = 5;
  const uniqueTickers = [...new Set(tickers.map(t => t.toUpperCase()))];
  
  for (let i = 0; i < uniqueTickers.length; i += BATCH_SIZE) {
    const batch = uniqueTickers.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(ticker => classifyTicker(ticker))
    );
    
    batchResults.forEach(result => {
      results.set(result.ticker, result);
    });
    
    // Small delay between batches
    if (i + BATCH_SIZE < uniqueTickers.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * Clear cached classification for a ticker
 */
export async function clearTickerCache(ticker: string): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();
    await supabase
      .from('ticker_classifications')
      .delete()
      .eq('ticker', ticker.toUpperCase());
    
    console.log(`🗑️ Cleared cache for ${ticker}`);
  } catch (error) {
    console.error(`Error clearing cache for ${ticker}:`, error);
  }
}
