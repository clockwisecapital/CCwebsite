/**
 * Generate TIME Portfolio Analog Cache
 * 
 * Pre-computes TIME portfolio scores against all 4 historical analogs.
 * Run this script:
 * 1. After TIME portfolio rebalancing (monthly)
 * 2. When scoring algorithm changes
 * 3. When historical data is updated
 * 
 * Usage:
 *   npm run generate-time-cache
 *   npm run generate-time-cache -- --version=2
 *   npm run generate-time-cache -- --analog=COVID_CRASH
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import { scorePortfolio, mapTickerToKronosAssetClassAsync } from '@/lib/kronos/scoring';
import { getHoldingWeights } from '@/lib/supabase/database';
import { HISTORICAL_ANALOGS } from '@/lib/kronos/constants';
import { setCachedTimeAnalogScore } from '@/lib/services/time-portfolio-cache';
import type { Holding } from '@/lib/kronos/types';
import type { CachedTimeAnalogScore } from '@/lib/services/time-portfolio-cache';

const CURRENT_VERSION = 1;

// =====================================================================================
// FETCH TIME PORTFOLIO HOLDINGS
// =====================================================================================

async function getTimePortfolioHoldings(): Promise<Holding[]> {
  try {
    console.log('📊 Fetching TIME portfolio from database...');
    const holdingWeights = await getHoldingWeights();
    
    if (!holdingWeights || holdingWeights.length === 0) {
      throw new Error('No TIME portfolio holdings found in database');
    }
    
    console.log(`🤖 Classifying ${holdingWeights.length} tickers...`);
    
    // Convert database format to Kronos format with AI classification
    const holdings: Holding[] = await Promise.all(
      holdingWeights.map(async (hw) => ({
        ticker: hw.stockTicker,
        weight: hw.weightings,
        assetClass: await mapTickerToKronosAssetClassAsync(hw.stockTicker)
      }))
    );
    
    // Validate weights sum to approximately 1.0
    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.05) {
      console.warn(`⚠️ TIME portfolio weights sum to ${totalWeight.toFixed(3)}, normalizing...`);
      holdings.forEach(h => h.weight = h.weight / totalWeight);
    }
    
    console.log(`✅ Loaded TIME portfolio: ${holdings.length} positions`);
    return holdings;
  } catch (error) {
    console.error('❌ Error fetching TIME portfolio:', error);
    throw error;
  }
}

// =====================================================================================
// COMPUTE SCORES FOR ANALOG
// =====================================================================================

async function computeTimeScoreForAnalog(
  analogId: string,
  timeHoldings: Holding[],
  version: number
): Promise<CachedTimeAnalogScore> {
  const analog = HISTORICAL_ANALOGS[analogId];
  
  if (!analog) {
    throw new Error(`Unknown analog: ${analogId}`);
  }

  console.log(`\n📊 Processing analog: ${analog.name} (${analog.dateRange.start} to ${analog.dateRange.end})`);

  // Score TIME portfolio against this analog
  const scoreResult = await scorePortfolio(analogId, timeHoldings);

  const cacheEntry: Omit<CachedTimeAnalogScore, 'id' | 'created_at' | 'updated_at'> = {
    analog_id: analogId,
    analog_name: analog.name,
    analog_period: `${analog.dateRange.start} to ${analog.dateRange.end}`,
    holdings: timeHoldings.map(h => ({
      ticker: h.ticker,
      weight: h.weight,
      assetClass: h.assetClass
    })),
    holdings_date: new Date().toISOString(),
    score: scoreResult.score,
    label: scoreResult.label,
    color: scoreResult.color,
    portfolio_return: scoreResult.portfolioReturn,
    benchmark_return: scoreResult.benchmarkReturn,
    outperformance: scoreResult.outperformance,
    portfolio_drawdown: scoreResult.portfolioDrawdown,
    benchmark_drawdown: scoreResult.benchmarkDrawdown,
    return_score: scoreResult.returnScore,
    drawdown_score: scoreResult.drawdownScore,
    scenario_id: scoreResult.scenarioId,
    scenario_name: scoreResult.scenarioName,
    version
  };

  console.log(`   ✓ TIME × ${analog.name}: ${scoreResult.score}/100 (${scoreResult.label})`);
  console.log(`     Return: ${(scoreResult.portfolioReturn * 100).toFixed(2)}%, Drawdown: ${(scoreResult.portfolioDrawdown * 100).toFixed(2)}%`);

  return cacheEntry;
}

// =====================================================================================
// MAIN GENERATION FUNCTION
// =====================================================================================

interface GenerateOptions {
  version?: number;
  analogId?: string;
  force?: boolean;
}

async function generateTimeCache(options: GenerateOptions = {}): Promise<void> {
  const version = options.version || CURRENT_VERSION;

  console.log('\n🚀 TIME Portfolio Analog Cache Generation');
  console.log('=' .repeat(60));
  console.log(`Version: ${version}`);
  console.log(`Analogs: ${Object.keys(HISTORICAL_ANALOGS).length}`);
  console.log('=' .repeat(60));

  const startTime = Date.now();

  // Step 1: Fetch current TIME portfolio holdings
  let timeHoldings: Holding[];
  try {
    timeHoldings = await getTimePortfolioHoldings();
  } catch (error) {
    console.error('\n❌ Failed to fetch TIME portfolio holdings');
    throw error;
  }

  // Step 2: Determine which analogs to process
  const analogsToProcess = options.analogId 
    ? Object.values(HISTORICAL_ANALOGS).filter(a => a.id === options.analogId)
    : Object.values(HISTORICAL_ANALOGS);

  if (analogsToProcess.length === 0) {
    console.error(`\n❌ Analog not found: ${options.analogId}`);
    return;
  }

  console.log(`\n📊 Processing ${analogsToProcess.length} analog(s)...`);

  // Step 3: Process each analog sequentially
  const results: Array<Omit<CachedTimeAnalogScore, 'id' | 'created_at' | 'updated_at'>> = [];
  const errors: string[] = [];

  for (const analog of analogsToProcess) {
    try {
      const result = await computeTimeScoreForAnalog(analog.id, timeHoldings, version);
      results.push(result);
      
      // Small delay between analogs to be nice to data sources
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`\n❌ Failed to process ${analog.name}:`, error);
      errors.push(analog.id);
    }
  }

  // Step 4: Store results in database
  if (results.length === 0) {
    console.error('\n❌ No results to store!');
    return;
  }

  console.log('\n💾 Storing results in database...');
  
  let successCount = 0;
  for (const result of results) {
    const success = await setCachedTimeAnalogScore(result);
    if (success) {
      successCount++;
    } else {
      errors.push(result.analog_id);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  // Step 5: Report results
  console.log('\n' + '=' .repeat(60));
  console.log('✅ TIME Cache Generation Complete!');
  console.log('=' .repeat(60));
  console.log(`Total computed: ${results.length}`);
  console.log(`Successfully stored: ${successCount}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Version: ${version}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️ Failed analogs: ${errors.join(', ')}`);
  }
  
  console.log('=' .repeat(60));

  if (successCount === results.length && results.length > 0) {
    console.log('\n🎉 TIME cache is ready for use!');
    console.log('\n   Test it with:');
    console.log('   npm run test-time-cache -- --analog=COVID_CRASH');
  } else {
    console.error('\n❌ Cache generation had errors. Check logs above.');
    process.exit(1);
  }
}

// =====================================================================================
// CLI INTERFACE
// =====================================================================================

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: GenerateOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--version' && args[i + 1]) {
      options.version = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--analog' && args[i + 1]) {
      options.analogId = args[i + 1];
      i++;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--help') {
      console.log(`
Usage: npm run generate-time-cache [options]

Options:
  --version <number>    Cache version to generate (default: ${CURRENT_VERSION})
  --analog <id>         Generate cache for specific analog only
  --force               Regenerate even if cache exists
  --help               Show this help message

Examples:
  npm run generate-time-cache
  npm run generate-time-cache -- --version=2
  npm run generate-time-cache -- --analog=COVID_CRASH
  npm run generate-time-cache -- --force
      `);
      process.exit(0);
    }
  }

  try {
    await generateTimeCache(options);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { generateTimeCache };
