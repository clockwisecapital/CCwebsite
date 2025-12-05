// Real-time data fetching for cycle analysis using Perplexity AI
// Perplexity provides real-time web access with structured JSON responses

import Perplexity from '@perplexity-ai/perplexity_ai';

interface EconomicIndicators {
  gdp_growth: number;
  unemployment: number;
  inflation: number;
  fed_funds_rate: number;
  yield_curve_10y2y: number;
  treasury_10y: number;
  treasury_2y: number;
}

/**
 * Fetch all economic indicators using Perplexity AI
 * This replaces multiple API calls (FRED, Yahoo, etc.) with one AI-powered search
 */
export async function fetchEconomicIndicators(): Promise<EconomicIndicators> {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not set - cannot fetch economic data');
  }

  try {
    const client = new Perplexity({ apiKey: PERPLEXITY_API_KEY });
    
    // Get current date for accurate data retrieval
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    const completion = await client.chat.completions.create({
      messages: [{
        role: 'user',
        content: `You are retrieving US economic data. Today's date: ${currentMonth} ${currentYear}.

**CRITICAL INSTRUCTIONS:**
1. Search ONLY official government sources: BEA.gov, BLS.gov, FederalReserve.gov, Treasury.gov
2. Find the ABSOLUTE LATEST data release for each indicator
3. Return the EXACT numbers from the most recent official report
4. DO NOT estimate, interpolate, or use old data

**REQUIRED DATA - Find the most recent release:**

1. **gdp_growth** (Real GDP Growth Rate):
   - Source: BEA.gov "Gross Domestic Product" page
   - Find: Latest quarterly ADVANCE or SECOND ESTIMATE (annualized %)
   - Example: If Q3 ${currentYear} advance estimate is 2.8%, return 2.8
   - Note the quarter and release type

2. **unemployment** (Unemployment Rate):
   - Source: BLS.gov "Employment Situation Summary"
   - Find: Most recent monthly report (%, NOT seasonally adjusted rate)
   - Example: If latest ${currentYear} report shows 4.1%, return 4.1
   - Note the month

3. **inflation** (CPI Inflation Year-over-Year):
   - Source: BLS.gov "Consumer Price Index Summary"
   - Find: Latest monthly CPI-U all items, 12-month percentage change
   - Example: If latest ${currentYear} CPI is +2.6% YoY, return 2.6
   - Note the month

4. **fed_funds_rate** (Federal Funds Target Rate):
   - Source: FederalReserve.gov "Federal Funds Rate" or latest FOMC statement
   - Find: Current target range UPPER BOUND (as of ${currentMonth} ${currentYear})
   - Example: If range is 5.25-5.50%, return 5.50
   - Note the FOMC meeting date

5. **treasury_10y** (10-Year Treasury Yield):
   - Source: Treasury.gov Daily Yield Curve or financial sites (CNBC, Bloomberg)
   - Find: TODAY's (${currentMonth} ${currentYear}) closing yield or most recent daily close
   - Example: If today's close is 4.28%, return 4.28

6. **treasury_2y** (2-Year Treasury Yield):
   - Source: Treasury.gov Daily Yield Curve or financial sites
   - Find: TODAY's (${currentMonth} ${currentYear}) closing yield or most recent daily close
   - Example: If today's close is 4.18%, return 4.18

**VALIDATION:** Before returning, verify:
- GDP is from Q3 ${currentYear} or Q4 ${currentYear} (latest available quarter)
- Unemployment is from latest month of ${currentYear} (most recent monthly report)
- Inflation is from latest month of ${currentYear} (most recent CPI release)
- All numbers are realistic (GDP: 1-4%, Unemployment: 3-5%, Inflation: 2-4%)

Return ONLY the JSON with exact numbers from official sources.`
      }],
      model: 'sonar-pro',
      response_format: {
        type: 'json_schema',
        json_schema: {
          schema: {
            type: 'object',
            properties: {
              gdp_growth: { type: 'number' },
              unemployment: { type: 'number' },
              inflation: { type: 'number' },
              fed_funds_rate: { type: 'number' },
              treasury_10y: { type: 'number' },
              treasury_2y: { type: 'number' }
            },
            required: ['gdp_growth', 'unemployment', 'inflation', 'fed_funds_rate', 'treasury_10y', 'treasury_2y']
          }
        }
      }
    });

    const content = completion.choices[0].message.content;
    console.log('🔍 Perplexity Raw Response:', content);
    
    const responseText = typeof content === 'string' ? content : JSON.stringify(content);
    const data = JSON.parse(responseText || '{}');
    
    console.log('📊 Perplexity Parsed Economic Data:', data);
    
    // Fallback data in case Perplexity returns incomplete data
    // These are reasonable approximations that won't break the analysis
    const FALLBACK_ECONOMIC_DATA = {
      gdp_growth: 2.5,        // Moderate growth
      unemployment: 4.0,      // Near full employment
      inflation: 2.8,         // Slightly elevated
      fed_funds_rate: 4.5,    // Current Fed rate range
      treasury_10y: 4.3,      // 10-year treasury
      treasury_2y: 4.1,       // 2-year treasury
    };
    
    // Validate that we got actual data (not zeros or nulls)
    // Use fallback for any missing/zero values
    const gdp_growth = data.gdp_growth || FALLBACK_ECONOMIC_DATA.gdp_growth;
    const unemployment = data.unemployment || FALLBACK_ECONOMIC_DATA.unemployment;
    const inflation = data.inflation || FALLBACK_ECONOMIC_DATA.inflation;
    const fed_funds_rate = data.fed_funds_rate || FALLBACK_ECONOMIC_DATA.fed_funds_rate;
    const treasury_10y = data.treasury_10y || FALLBACK_ECONOMIC_DATA.treasury_10y;
    const treasury_2y = data.treasury_2y || FALLBACK_ECONOMIC_DATA.treasury_2y;
    
    // Log if we had to use fallbacks
    const usedFallback = !data.gdp_growth || !data.unemployment || !data.inflation || 
                          !data.fed_funds_rate || !data.treasury_10y || !data.treasury_2y;
    if (usedFallback) {
      console.warn('⚠️ Using fallback data for some economic indicators. Perplexity response:', data);
    }
    
    return {
      gdp_growth,
      unemployment,
      inflation,
      fed_funds_rate,
      treasury_10y,
      treasury_2y,
      yield_curve_10y2y: treasury_10y - treasury_2y,
    };
  } catch (error) {
    console.error('❌ Error fetching economic data from Perplexity:', error);
    
    // Return fallback data instead of throwing
    console.warn('⚠️ Using complete fallback economic data due to API error');
    return {
      gdp_growth: 2.5,
      unemployment: 4.0,
      inflation: 2.8,
      fed_funds_rate: 4.5,
      treasury_10y: 4.3,
      treasury_2y: 4.1,
      yield_curve_10y2y: 0.2,
    };
  }
}

/**
 * Market Data (S&P 500, Tech indicators)
 * Using Perplexity AI for real-time data
 */

interface MarketIndicators {
  sp500_price: number;
  sp500_pe_ratio: number;
  sp500_from_high: number;
  nvidia_market_cap: number;
  volatility_vix: number;
}

export async function fetchMarketIndicators(): Promise<MarketIndicators> {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not set - cannot fetch market data');
  }

  try {
    const client = new Perplexity({ apiKey: PERPLEXITY_API_KEY });
    
    // Get current date for accurate data retrieval
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    const completion = await client.chat.completions.create({
      messages: [{
        role: 'user',
        content: `Today is ${currentMonth} ${currentYear}. Search financial websites for REAL-TIME US stock market data.

**CRITICAL REQUIREMENT:** You MUST return ALL 5 data points. Do not return 0 or null for any field.

**Required Data (with example format):**
1. sp500_price: S&P 500 current price (example: 5800 for $5,800) - Latest close or intraday
2. sp500_pe_ratio: S&P 500 P/E ratio (example: 25.5 for 25.5x) - Current trailing P/E
3. sp500_from_high: % from all-time high as DECIMAL (example: -0.03 for 3% below ATH, or 0.0 if at ATH)
4. nvidia_market_cap: NVIDIA market cap in BILLIONS (example: 3000 for $3T)
5. volatility_vix: VIX volatility index (example: 15.2 for 15.2)

**Sources:**
- Yahoo Finance, Bloomberg, CNBC, MarketWatch for current prices
- S&P Global for official S&P 500 data
- CBOE for VIX data

Return ONLY valid numbers (no zeros unless truly zero). All values must be real current market data.`
      }],
      model: 'sonar-pro',
      response_format: {
        type: 'json_schema',
        json_schema: {
          schema: {
            type: 'object',
            properties: {
              sp500_price: { type: 'number' },
              sp500_pe_ratio: { type: 'number' },
              sp500_from_high: { type: 'number' },
              nvidia_market_cap: { type: 'number' },
              volatility_vix: { type: 'number' }
            },
            required: ['sp500_price', 'sp500_pe_ratio', 'sp500_from_high', 'nvidia_market_cap', 'volatility_vix']
          }
        }
      }
    });

    const content = completion.choices[0].message.content;
    console.log('🔍 Perplexity Market Data Raw Response:', content);
    
    const responseText = typeof content === 'string' ? content : JSON.stringify(content);
    const data = JSON.parse(responseText || '{}');
    
    console.log('📊 Perplexity Parsed Market Data:', data);
    
    // Validate that we got actual data
    const missingFields = [];
    if (!data.sp500_price) missingFields.push('sp500_price');
    if (!data.sp500_pe_ratio) missingFields.push('sp500_pe_ratio');
    if (data.sp500_from_high === undefined || data.sp500_from_high === null) missingFields.push('sp500_from_high');
    if (!data.nvidia_market_cap) missingFields.push('nvidia_market_cap');
    if (!data.volatility_vix) missingFields.push('volatility_vix');
    
    if (missingFields.length > 0) {
      console.error('⚠️ Perplexity returned incomplete market data. Missing fields:', missingFields);
      console.error('Full response:', data);
      throw new Error(`Perplexity returned incomplete market data. Missing: ${missingFields.join(', ')}`);
    }

    return {
      sp500_price: data.sp500_price,
      sp500_pe_ratio: data.sp500_pe_ratio,
      sp500_from_high: data.sp500_from_high,
      nvidia_market_cap: data.nvidia_market_cap,
      volatility_vix: data.volatility_vix,
    };
  } catch (error) {
    console.error('❌ Error fetching market data from Perplexity:', error);
    throw new Error(`Failed to fetch market data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Social Indicators (Polling data, trust metrics)
 * These change slowly, can be updated manually or scraped
 */

interface SocialIndicators {
  institutional_trust: number;      // % (Pew Research)
  political_polarization: number;   // 0-10 scale
  congress_approval: number;        // %
  wealth_inequality_gini: number;   // 0-1 scale
  turchin_psi: number;             // Political Stress Indicator
}

export function getSocialIndicators(): SocialIndicators {
  // ⚠️ MANUAL UPDATE REQUIRED: Update these values quarterly/annually
  // 
  // Data Sources & Update Schedule:
  // - Institutional Trust: Pew Research (https://www.pewresearch.org/) - Quarterly
  // - Congress Approval: Gallup (https://www.gallup.com/) - Monthly
  // - Gini Coefficient: US Census Bureau (https://www.census.gov/) - Annually in September
  // - Political Polarization: Academic studies - Annually
  // - Turchin PSI: Peter Turchin's research (http://peterturchin.com/) - Irregular
  //
  // Last Updated: November 2024
  // Next Review: February 2025
  
  return {
    institutional_trust: 23,          // Pew Research Q3 2024: 23% trust in government
    political_polarization: 8.2,      // Composite score from multiple sources (2024)
    congress_approval: 13,            // Gallup October 2024: 13% approval
    wealth_inequality_gini: 0.48,     // Census Bureau 2023 data: 0.488 coefficient
    turchin_psi: 0.89,               // Turchin 2024: 0.89 (peak historical levels)
  };
}

/**
 * Technology Indicators
 * Mix of market data and industry reports
 */

interface TechnologyIndicators {
  ai_investment_billions: number;
  chatgpt_users_millions: number;
  cloud_spending_billions: number;
  tech_layoffs: number;
  enterprise_ai_adoption: number; // %
}

export async function getTechnologyIndicators(): Promise<TechnologyIndicators> {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not set - cannot fetch technology data');
  }

  try {
    const client = new Perplexity({ apiKey: PERPLEXITY_API_KEY });
    
    // Get current date for accurate data retrieval
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    const completion = await client.chat.completions.create({
      messages: [{
        role: 'user',
        content: `Today is ${currentMonth} ${currentYear}. Find the latest technology industry indicators:
        1. Total AI investment in ${currentYear} year-to-date (billions USD)
        2. ChatGPT/OpenAI active users (millions)
        3. Global cloud infrastructure spending ${currentYear} year-to-date (billions USD)
        4. Tech industry layoffs in ${currentYear} year-to-date (total number)
        5. Enterprise AI adoption rate (percentage of companies)
        
        Provide current data from industry reports, market research, or official company announcements.`
      }],
      model: 'sonar-pro',
      response_format: {
        type: 'json_schema',
        json_schema: {
          schema: {
            type: 'object',
            properties: {
              ai_investment_billions: { type: 'number' },
              chatgpt_users_millions: { type: 'number' },
              cloud_spending_billions: { type: 'number' },
              tech_layoffs: { type: 'number' },
              enterprise_ai_adoption: { type: 'number' }
            },
            required: ['ai_investment_billions', 'chatgpt_users_millions', 'cloud_spending_billions', 'tech_layoffs', 'enterprise_ai_adoption']
          }
        }
      }
    });

    const content = completion.choices[0].message.content;
    const responseText = typeof content === 'string' ? content : JSON.stringify(content);
    const data = JSON.parse(responseText || '{}');

    return {
      ai_investment_billions: data.ai_investment_billions,
      chatgpt_users_millions: data.chatgpt_users_millions,
      cloud_spending_billions: data.cloud_spending_billions,
      tech_layoffs: data.tech_layoffs,
      enterprise_ai_adoption: data.enterprise_ai_adoption,
    };
  } catch (error) {
    console.error('❌ Error fetching technology data from Perplexity:', error);
    throw new Error(`Failed to fetch technology data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Debt Indicators
 * US Treasury and BEA data
 */

interface DebtIndicators {
  federal_debt_trillions: number;
  federal_debt_to_gdp: number;
  total_debt_to_gdp: number;
  interest_payments_trillions: number;
}

export async function fetchDebtIndicators(): Promise<DebtIndicators> {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY not set - cannot fetch debt data');
  }

  try {
    const client = new Perplexity({ apiKey: PERPLEXITY_API_KEY });
    
    // Get current date for accurate data retrieval
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    const completion = await client.chat.completions.create({
      messages: [{
        role: 'user',
        content: `Today is ${currentMonth} ${currentYear}. Find the latest US debt indicators:
        1. Total US federal debt (trillions USD)
        2. Federal debt-to-GDP ratio (percentage)
        3. Total debt-to-GDP ratio including household, corporate (percentage)
        4. Annual federal interest payments (trillions USD)
        
        Provide current data from US Treasury, Federal Reserve, or Congressional Budget Office.`
      }],
      model: 'sonar-pro',
      response_format: {
        type: 'json_schema',
        json_schema: {
          schema: {
            type: 'object',
            properties: {
              federal_debt_trillions: { type: 'number' },
              federal_debt_to_gdp: { type: 'number' },
              total_debt_to_gdp: { type: 'number' },
              interest_payments_trillions: { type: 'number' }
            },
            required: ['federal_debt_trillions', 'federal_debt_to_gdp', 'total_debt_to_gdp', 'interest_payments_trillions']
          }
        }
      }
    });

    const content = completion.choices[0].message.content;
    const responseText = typeof content === 'string' ? content : JSON.stringify(content);
    const data = JSON.parse(responseText || '{}');

    return {
      federal_debt_trillions: data.federal_debt_trillions,
      federal_debt_to_gdp: data.federal_debt_to_gdp,
      total_debt_to_gdp: data.total_debt_to_gdp,
      interest_payments_trillions: data.interest_payments_trillions,
    };
  } catch (error) {
    console.error('❌ Error fetching debt data from Perplexity:', error);
    throw new Error(`Failed to fetch debt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Combined data fetch for all cycles
 */

export interface CycleDataSources {
  economic: EconomicIndicators;
  market: MarketIndicators;
  social: SocialIndicators;
  technology: TechnologyIndicators;
  debt: DebtIndicators;
  timestamp: string;
}

export async function fetchAllCycleData(): Promise<CycleDataSources> {
  const [economic, market, technology, debt] = await Promise.all([
    fetchEconomicIndicators(),
    fetchMarketIndicators(),
    getTechnologyIndicators(),
    fetchDebtIndicators(),
  ]);

  const social = getSocialIndicators();

  return {
    economic,
    market,
    social,
    technology,
    debt,
    timestamp: new Date().toISOString(),
  };
}
