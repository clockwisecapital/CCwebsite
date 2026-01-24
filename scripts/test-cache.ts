/**
 * Test Cache Lookup
 * 
 * Quick utility to test cache lookups for debugging
 * 
 * Usage:
 *   npm run test-cache
 *   npm run test-cache -- --analog=COVID_CRASH
 */

import { getCachedClockwiseScores, getCacheStats, CURRENT_CACHE_VERSION } from '@/lib/kronos/cache-utils';

async function testCache(analogId?: string) {
  console.log('\n🔍 Testing Cache Lookup');
  console.log('=' .repeat(60));

  if (analogId) {
    // Test specific analog
    console.log(`\nAnalog: ${analogId}`);
    console.log(`Version: ${CURRENT_CACHE_VERSION}`);
    
    const startTime = Date.now();
    const result = await getCachedClockwiseScores(analogId, CURRENT_CACHE_VERSION);
    const duration = Date.now() - startTime;

    console.log(`\nResult: ${result.found ? '✅ CACHE HIT' : '❌ CACHE MISS'}`);
    console.log(`Source: ${result.source}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Portfolios found: ${result.portfolios.length}/4`);

    if (result.portfolios.length > 0) {
      console.log('\nPortfolio Scores:');
      result.portfolios.forEach(p => {
        console.log(`  ${p.portfolio_name.padEnd(20)} ${p.score}/100 (${p.label})`);
        console.log(`    Return: ${(p.portfolio_return * 100).toFixed(2)}%  Drawdown: ${(p.portfolio_drawdown * 100).toFixed(2)}%`);
      });
    }
  } else {
    // Show cache statistics
    console.log('\nCache Statistics:\n');
    const stats = await getCacheStats();
    
    if (stats.length === 0) {
      console.log('❌ No cache data found');
    } else {
      stats.forEach(stat => {
        console.log(`Version ${stat.version ?? 'unknown'}:`);
        console.log(`  Total Entries: ${stat.total_entries ?? 0}`);
        console.log(`  Unique Analogs: ${stat.unique_analogs ?? 0}`);
        console.log(`  Unique Portfolios: ${stat.unique_portfolios ?? 0}`);
        console.log(`  Average Score: ${stat.avg_score ?? 0}/100`);
        console.log(`  Last Updated: ${stat.last_update ? new Date(stat.last_update).toLocaleString() : 'N/A'}`);
        console.log('');
      });
    }
  }

  console.log('=' .repeat(60));
}

async function main() {
  const args = process.argv.slice(2);
  let analogId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--analog' && args[i + 1]) {
      analogId = args[i + 1];
      i++;
    } else if (arg === '--help') {
      console.log(`
Usage: npm run test-cache [options]

Options:
  --analog <id>    Test cache for specific analog (e.g., COVID_CRASH)
  --help          Show this help message

Examples:
  npm run test-cache
  npm run test-cache -- --analog=COVID_CRASH
  npm run test-cache -- --analog=DOT_COM_BUST
      `);
      process.exit(0);
    }
  }

  try {
    await testCache(analogId);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { testCache };
