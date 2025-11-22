import { NextResponse } from 'next/server';
import { getHoldingWeights, batchUpdateHoldingPrices } from '@/lib/supabase/database';
import { fetchBatchCurrentPrices } from '@/lib/services/monte-carlo';
import type { PriceUpdateResult } from '@/types/portfolio';

/**
 * Update prices in holding_weights table using Yahoo Finance API
 * This endpoint can be called manually or via cron job
 */
export async function POST() {
  try {
    console.log('📈 Starting price update process...');

    // Get all holdings from database
    const holdings = await getHoldingWeights();
    
    if (holdings.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No holdings found in database',
      }, { status: 404 });
    }

    console.log(`Found ${holdings.length} holdings to update`);

    // Filter out non-stock tickers (like "Cash&Other")
    const stockHoldings = holdings.filter(h => 
      h.stockTicker && 
      !h.stockTicker.toLowerCase().includes('cash') &&
      !h.stockTicker.toLowerCase().includes('other')
    );

    // Fetch current prices from Yahoo Finance
    const tickers = stockHoldings.map(h => h.stockTicker);
    const currentPrices = await fetchBatchCurrentPrices(tickers);

    console.log(`Fetched prices for ${currentPrices.size} tickers`);

    // Prepare updates
    const updates: Array<{ ticker: string; price: number }> = [];
    const results: PriceUpdateResult[] = [];

    stockHoldings.forEach(holding => {
      const newPrice = currentPrices.get(holding.stockTicker);
      
      if (newPrice) {
        updates.push({ ticker: holding.stockTicker, price: newPrice });
        results.push({
          ticker: holding.stockTicker,
          oldPrice: holding.price,
          newPrice: newPrice,
          success: true
        });
      } else {
        results.push({
          ticker: holding.stockTicker,
          oldPrice: holding.price,
          newPrice: 0,
          success: false,
          error: 'Price not found'
        });
      }
    });

    // Update prices in database
    const { success, failed } = await batchUpdateHoldingPrices(updates);

    console.log(`✅ Price update complete: ${success} succeeded, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Updated ${success} prices successfully`,
      summary: {
        total: stockHoldings.length,
        updated: success,
        failed: failed,
      },
      results: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Price update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Price update failed' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check last update status
 */
export async function GET() {
  try {
    const holdings = await getHoldingWeights();
    
    return NextResponse.json({
      success: true,
      holdings: holdings.map(h => ({
        ticker: h.stockTicker,
        name: h.securityName,
        price: h.price,
        weight: h.weightings
      })),
      count: holdings.length,
    });
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch holdings' },
      { status: 500 }
    );
  }
}

