/**
 * Market Data Utility
 * 
 * Fetches S&P 500 Total Return Index and T-Bill data from Yahoo Finance
 * for portfolio performance calculations.
 */

export interface MarketDataPoint {
  date: string; // YYYY-MM-DD
  spxClose: number;
  tbRate: number; // Annual rate as decimal (e.g., 0.05 for 5%)
}

export interface MarketDataResult {
  data: MarketDataPoint[];
  startDate: string;
  endDate: string;
  source: string;
}

// In-memory cache for market data
let marketDataCache: {
  data: MarketDataResult | null;
  fetchedAt: number;
  startDate: string;
  endDate: string;
} | null = null;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

// Rate limiting for Yahoo Finance API
let lastYahooFinanceCallTime = 0;
const MIN_DELAY_BETWEEN_CALLS_MS = 100; // 100ms between calls (max 10 requests/second)

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch historical data from Yahoo Finance with rate limiting and retry logic
 */
export async function fetchYahooFinanceData(
  symbol: string,
  startDate: Date,
  endDate: Date,
  maxRetries: number = 3
): Promise<Array<{ date: string; close: number }>> {
  // Rate limiting: ensure minimum delay between requests
  const now = Date.now();
  const timeSinceLastCall = now - lastYahooFinanceCallTime;
  if (timeSinceLastCall < MIN_DELAY_BETWEEN_CALLS_MS) {
    await sleep(MIN_DELAY_BETWEEN_CALLS_MS - timeSinceLastCall);
  }
  lastYahooFinanceCallTime = Date.now();
  
  // Yahoo Finance uses Unix timestamps
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d&includePrePost=false`;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://finance.yahoo.com/',
          'Origin': 'https://finance.yahoo.com'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        lastError = new Error(`Yahoo Finance API error: ${response.status} - ${errorText}`);
        
        // If rate limited (429) or server error (5xx), retry with exponential backoff
        if (response.status === 429 || response.status >= 500) {
          if (attempt < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.warn(`⚠️ Rate limited/server error for ${symbol}, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
            await sleep(backoffMs);
            continue;
          }
        }
        throw lastError;
      }
      
      const json = await response.json();
      const result = json.chart?.result?.[0];
      
      if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
        throw new Error(`No data returned for ${symbol}`);
      }
      
      const timestamps: number[] = result.timestamp;
      const closes: (number | null)[] = result.indicators.quote[0].close;
      
      const data: Array<{ date: string; close: number }> = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        const close = closes[i];
        if (close !== null && close !== undefined) {
          const date = new Date(timestamps[i] * 1000);
          data.push({
            date: date.toISOString().split('T')[0],
            close: close
          });
        }
      }
      
      // Success!
      return data;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const backoffMs = Math.min(500 * Math.pow(2, attempt - 1), 3000);
        console.warn(`⚠️ Error fetching ${symbol}, retrying in ${backoffMs}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(backoffMs);
      }
    }
  }
  
  console.error(`❌ Failed to fetch ${symbol} after ${maxRetries} attempts:`, lastError);
  throw lastError || new Error(`Failed to fetch ${symbol}`);
}

/**
 * Fetch S&P 500 Total Return Index (^SP500TR) data
 */
export async function fetchSP500TRData(
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; close: number }>> {
  return fetchYahooFinanceData('^SP500TR', startDate, endDate);
}

/**
 * Fetch 3-Month T-Bill Rate (^IRX) data
 * Note: ^IRX returns the rate as a percentage (e.g., 5.0 for 5%)
 */
export async function fetchTBillData(
  startDate: Date,
  endDate: Date
): Promise<Array<{ date: string; rate: number }>> {
  const data = await fetchYahooFinanceData('^IRX', startDate, endDate);
  return data.map(d => ({
    date: d.date,
    rate: d.close / 100 // Convert percentage to decimal
  }));
}

/**
 * Fetch all market data needed for portfolio analysis
 * Merges S&P 500 TR and T-Bill data by date
 */
export async function fetchMarketData(
  startDate: string,
  endDate: string
): Promise<MarketDataResult> {
  // Check cache
  if (
    marketDataCache &&
    marketDataCache.startDate <= startDate &&
    marketDataCache.endDate >= endDate &&
    Date.now() - marketDataCache.fetchedAt < CACHE_TTL_MS &&
    marketDataCache.data
  ) {
    console.log('Using cached market data');
    // Filter cached data to requested range
    const filteredData = marketDataCache.data.data.filter(
      d => d.date >= startDate && d.date <= endDate
    );
    return {
      ...marketDataCache.data,
      data: filteredData,
      startDate,
      endDate
    };
  }
  
  console.log(`Fetching market data from ${startDate} to ${endDate}`);
  
  // Extend date range slightly for boundary data
  const start = new Date(startDate);
  start.setDate(start.getDate() - 7);
  const end = new Date(endDate);
  end.setDate(end.getDate() + 7);
  
  // Fetch both data sources in parallel
  const [sp500Data, tbillData] = await Promise.all([
    fetchSP500TRData(start, end),
    fetchTBillData(start, end)
  ]);
  
  // Create a map of T-Bill rates by date
  const tbillMap = new Map<string, number>();
  tbillData.forEach(d => tbillMap.set(d.date, d.rate));
  
  // Merge data - use S&P 500 dates as primary
  const mergedData: MarketDataPoint[] = [];
  let lastTbRate = 0.05; // Default 5% if no T-Bill data
  
  // Find initial T-Bill rate
  if (tbillData.length > 0) {
    lastTbRate = tbillData[0].rate;
  }
  
  for (const sp of sp500Data) {
    // Get T-Bill rate for this date, or use last known rate
    const tbRate = tbillMap.get(sp.date);
    if (tbRate !== undefined) {
      lastTbRate = tbRate;
    }
    
    mergedData.push({
      date: sp.date,
      spxClose: sp.close,
      tbRate: lastTbRate
    });
  }
  
  // Sort by date
  mergedData.sort((a, b) => a.date.localeCompare(b.date));
  
  const result: MarketDataResult = {
    data: mergedData,
    startDate: mergedData.length > 0 ? mergedData[0].date : startDate,
    endDate: mergedData.length > 0 ? mergedData[mergedData.length - 1].date : endDate,
    source: 'Yahoo Finance (^SP500TR, ^IRX)'
  };
  
  // Update cache
  marketDataCache = {
    data: result,
    fetchedAt: Date.now(),
    startDate: result.startDate,
    endDate: result.endDate
  };
  
  return {
    ...result,
    data: result.data.filter(d => d.date >= startDate && d.date <= endDate)
  };
}

/**
 * Clear the market data cache
 */
export function clearMarketDataCache(): void {
  marketDataCache = null;
}

/**
 * Get market data for a specific date range with fallback
 * If Yahoo Finance fails, returns empty data with a warning
 */
export async function getMarketDataSafe(
  startDate: string,
  endDate: string
): Promise<MarketDataResult & { warning?: string }> {
  try {
    return await fetchMarketData(startDate, endDate);
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return {
      data: [],
      startDate,
      endDate,
      source: 'Failed to fetch',
      warning: `Could not fetch market data: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
