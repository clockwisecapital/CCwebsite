/**
 * Generate Clockwise Portfolio Cache
 * 
 * Pre-computes scores for all Clockwise portfolios against all historical analogs.
 * Run this script:
 * 1. Initially to populate cache
 * 2. When scoring algorithm changes (with new version)
 * 3. When historical data is updated
 * 
 * Usage:
 *   npm run generate-cache
 *   npm run generate-cache -- --version=2
 *   npm run generate-cache -- --analog=COVID_CRASH
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import { scoreAssetAllocationPortfolio } from '@/lib/kronos/asset-allocation-scoring';
import { assetAllocationToHoldings } from '@/lib/kronos/asset-allocation-scoring';
import { ASSET_ALLOCATION_PORTFOLIOS } from '@/lib/clockwise-portfolios';
import { HISTORICAL_ANALOGS } from '@/lib/kronos/constants';
import { CURRENT_CACHE_VERSION } from '@/lib/kronos/cache-utils';
import type { CacheInsertData } from '@/lib/kronos/cache-types';
import { createClient } from '@supabase/supabase-js';

// Use service role for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// =====================================================================================
// CONFIGURATION
// =====================================================================================

const PORTFOLIOS = ASSET_ALLOCATION_PORTFOLIOS.map(p => ({
  id: p.id,
  name: p.name,
  allocations: p.allocations
}));

const ANALOGS = Object.values(HISTORICAL_ANALOGS);

// =====================================================================================
// PRE-COMPUTATION LOGIC
// =====================================================================================

interface ComputeOptions {
  version?: number;
  analogId?: string;
  force?: boolean;
}

/**
 * Compute scores for all portfolios against a specific analog
 */
async function computeScoresForAnalog(
  analogId: string,
  version: number
): Promise<CacheInsertData[]> {
  const analog = ANALOGS.find(a => a.id === analogId);
  
  if (!analog) {
    throw new Error(`Unknown analog: ${analogId}`);
  }

  console.log(`\n📊 Processing analog: ${analog.name} (${analog.dateRange.start} to ${analog.dateRange.end})`);
  console.log(`   Version: ${version}`);

  // We need to pass a question, but for pre-computation we'll use the analog ID directly
  // The scoring engine will map this to the correct scenario
  const questionForAnalog = analog.id; // e.g., "COVID_CRASH"

  const results: CacheInsertData[] = [];

  // Score all portfolios in parallel
  const scorePromises = PORTFOLIOS.map(async (portfolio) => {
    try {
      console.log(`\n   Scoring ${portfolio.name}...`);
      
      const scoreResult = await scoreAssetAllocationPortfolio(
        questionForAnalog,
        portfolio.allocations,
        portfolio.name
      );

      // Convert holdings for storage
      const holdings = assetAllocationToHoldings(portfolio.allocations);

      // Calculate upside/downside properly (not swapped!)
      // - upside = portfolioReturn + 2*volatility (best case)
      // - downside = negative of drawdown for losses, or portfolioReturn - 2*volatility
      const estimatedUpside = scoreResult.portfolioReturn + (0.18 * 2);  // +2 std devs
      const estimatedDownside = scoreResult.portfolioReturn < 0
        ? -scoreResult.portfolioDrawdown  // Negative drawdown for crash scenarios
        : scoreResult.portfolioReturn - (0.18 * 2);  // -2 std devs for positive returns
      
      const cacheEntry: CacheInsertData = {
        portfolio_id: portfolio.id,
        portfolio_name: portfolio.name,
        analog_id: analogId,
        analog_name: analog.name,
        analog_period: `${analog.dateRange.start} to ${analog.dateRange.end}`,
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
        estimated_upside: estimatedUpside,
        estimated_downside: estimatedDownside,
        scenario_id: scoreResult.scenarioId,
        scenario_name: scoreResult.scenarioName,
        holdings: holdings.map(h => ({
          ticker: h.ticker,
          weight: h.weight,
          assetClass: h.assetClass
        })),
        version
      };

      console.log(`   ✓ ${portfolio.name}: ${scoreResult.score}/100 (${scoreResult.label})`);
      console.log(`     Return: ${(scoreResult.portfolioReturn * 100).toFixed(2)}%, Drawdown: ${(scoreResult.portfolioDrawdown * 100).toFixed(2)}%`);

      return cacheEntry;
    } catch (error) {
      console.error(`   ❌ Failed to score ${portfolio.name}:`, error);
      return null;
    }
  });

  const portfolioResults = await Promise.all(scorePromises);
  
  // Filter out nulls (failed computations)
  const successfulResults = portfolioResults.filter((r): r is CacheInsertData => r !== null);
  
  results.push(...successfulResults);

  console.log(`\n   ✅ Completed ${successfulResults.length}/${PORTFOLIOS.length} portfolios for ${analog.name}`);
  
  return results;
}

/**
 * Main pre-computation function
 */
async function generateCache(options: ComputeOptions = {}): Promise<void> {
  const version = options.version || CURRENT_CACHE_VERSION;
  const force = options.force || false;

  console.log('\n🚀 Clockwise Portfolio Cache Generation');
  console.log('=' .repeat(60));
  console.log(`Version: ${version}`);
  console.log(`Portfolios: ${PORTFOLIOS.length}`);
  console.log(`Analogs: ${ANALOGS.length}`);
  console.log(`Total combinations: ${PORTFOLIOS.length * ANALOGS.length}`);
  console.log('=' .repeat(60));

  // Check if cache already exists
  if (!force) {
    const { count } = await supabaseAdmin
      .from('clockwise_portfolio_cache')
      .select('*', { count: 'exact', head: true })
      .eq('version', version);
    
    if (count === 16) {
      console.log('\n⚠️  Cache already populated for this version.');
      console.log('   Use --force flag to regenerate.');
      return;
    }
  }

  const startTime = Date.now();
  const allResults: CacheInsertData[] = [];

  // Determine which analogs to process
  const analogsToProcess = options.analogId 
    ? ANALOGS.filter(a => a.id === options.analogId)
    : ANALOGS;

  if (analogsToProcess.length === 0) {
    console.error(`\n❌ Analog not found: ${options.analogId}`);
    return;
  }

  // Process each analog sequentially (to avoid rate limits)
  for (const analog of analogsToProcess) {
    try {
      const results = await computeScoresForAnalog(analog.id, version);
      allResults.push(...results);
      
      // Small delay between analogs to be nice to data sources
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`\n❌ Failed to process ${analog.name}:`, error);
    }
  }

  // Store results in database
  if (allResults.length === 0) {
    console.error('\n❌ No results to store!');
    return;
  }

  console.log('\n💾 Storing results in database...');
  console.log(`   Inserting ${allResults.length} cache entries...`);
  
  const { data, error } = await supabaseAdmin
    .from('clockwise_portfolio_cache')
    .insert(allResults)
    .select();

  const insertResult = {
    success: !error,
    inserted: data?.length || 0,
    errors: error ? allResults.length : 0
  };

  if (error) {
    console.error('❌ Cache insert error:', error);
  } else {
    console.log(`✅ Inserted ${data?.length || 0} cache entries`);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Cache Generation Complete!');
  console.log('=' .repeat(60));
  console.log(`Total entries: ${allResults.length}`);
  console.log(`Inserted: ${insertResult.inserted}`);
  console.log(`Errors: ${insertResult.errors}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Version: ${version}`);
  console.log('=' .repeat(60));

  if (insertResult.success) {
    console.log('\n🎉 Cache is ready for use!');
    console.log('\n   Test it with:');
    console.log('   npm run test-cache -- --analog=COVID_CRASH');
  } else {
    console.error('\n❌ Cache generation failed. Check errors above.');
  }
}

// =====================================================================================
// CLI INTERFACE
// =====================================================================================

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: ComputeOptions = {};

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
Usage: npm run generate-cache [options]

Options:
  --version <number>    Cache version to generate (default: ${CURRENT_CACHE_VERSION})
  --analog <id>         Generate cache for specific analog only
  --force               Regenerate even if cache exists
  --help               Show this help message

Examples:
  npm run generate-cache
  npm run generate-cache -- --version=2
  npm run generate-cache -- --analog=COVID_CRASH
  npm run generate-cache -- --force
      `);
      process.exit(0);
    }
  }

  try {
    await generateCache(options);
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

export { generateCache, computeScoresForAnalog };
