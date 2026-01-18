/**
 * Kronos Scoring Engine Test
 * 
 * Test the scoring engine with the "All Weather" portfolio example from the PRD
 * Expected score: ~97 for market volatility scenario
 */

import { scorePortfolio } from '../src/lib/kronos/scoring';
import type { Holding } from '../src/lib/kronos/types';

async function testAllWeatherPortfolio() {
  console.log('\n' + '='.repeat(80));
  console.log('KRONOS SCORING ENGINE TEST');
  console.log('='.repeat(80));
  
  // All Weather Portfolio (Ray Dalio)
  // VTI (30%), TLT (40%), IEF (15%), GLD (7.5%), DBC (7.5%)
  const holdings: Holding[] = [
    { ticker: 'VTI', weight: 0.30, assetClass: 'us-large-cap' },
    { ticker: 'TLT', weight: 0.40, assetClass: 'long-treasuries' },
    { ticker: 'IEF', weight: 0.15, assetClass: 'intermediate-treasuries' },
    { ticker: 'GLD', weight: 0.075, assetClass: 'gold' },
    { ticker: 'DBC', weight: 0.075, assetClass: 'commodities' }
  ];
  
  // Test question for market volatility scenario
  const question = "How does my portfolio handle market volatility and sudden crashes?";
  
  console.log('\n📋 TEST PORTFOLIO: All Weather');
  console.log('Holdings:');
  for (const holding of holdings) {
    console.log(`  ${holding.ticker}: ${(holding.weight * 100).toFixed(1)}% (${holding.assetClass})`);
  }
  console.log(`\n❓ QUESTION: "${question}"`);
  
  try {
    // Run scoring engine
    const result = await scorePortfolio(question, holdings);
    
    console.log('\n' + '='.repeat(80));
    console.log('RESULTS');
    console.log('='.repeat(80));
    console.log(`\n✨ SCORE: ${result.score}/100 (${result.label})`);
    console.log(`   Color: ${result.color}`);
    console.log(`\n📊 SCENARIO: ${result.scenarioName} (${result.scenarioId})`);
    console.log(`   Historical Analog: ${result.analogName}`);
    console.log(`   Period: ${result.analogPeriod}`);
    console.log(`\n📈 RETURNS:`);
    console.log(`   Portfolio: ${(result.portfolioReturn * 100).toFixed(2)}%`);
    console.log(`   Benchmark (S&P 500): ${(result.benchmarkReturn * 100).toFixed(2)}%`);
    console.log(`   Outperformance: ${(result.outperformance * 100).toFixed(2)}%`);
    console.log(`\n📉 DRAWDOWNS:`);
    console.log(`   Portfolio: ${(result.portfolioDrawdown * 100).toFixed(2)}%`);
    console.log(`   Benchmark: ${(result.benchmarkDrawdown * 100).toFixed(2)}%`);
    console.log(`   Protection: ${((result.benchmarkDrawdown - result.portfolioDrawdown) * 100).toFixed(2)}%`);
    console.log(`\n🎯 SCORE COMPONENTS:`);
    console.log(`   Return Score: ${result.returnScore}/100`);
    console.log(`   Drawdown Score: ${result.drawdownScore}/100`);
    console.log(`   Final Score: ${result.score}/100`);
    
    // Validate against PRD expectations
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION');
    console.log('='.repeat(80));
    
    const expectedScore = 97;
    const scoreDiff = Math.abs(result.score - expectedScore);
    
    if (result.scenarioId === 'market-volatility') {
      console.log('✅ Scenario correctly identified as market-volatility');
    } else {
      console.log(`❌ Expected market-volatility, got ${result.scenarioId}`);
    }
    
    if (result.analogId === 'COVID_CRASH') {
      console.log('✅ Analog correctly identified as COVID_CRASH');
    } else {
      console.log(`⚠️ Expected COVID_CRASH, got ${result.analogId}`);
    }
    
    if (scoreDiff <= 10) {
      console.log(`✅ Score ${result.score} is within acceptable range of expected ${expectedScore}`);
    } else {
      console.log(`⚠️ Score ${result.score} differs significantly from expected ${expectedScore}`);
    }
    
    if (result.outperformance > 0) {
      console.log('✅ Portfolio outperformed benchmark during crash');
    } else {
      console.log('❌ Portfolio underperformed benchmark');
    }
    
    if (result.portfolioDrawdown < result.benchmarkDrawdown) {
      console.log('✅ Portfolio had less drawdown than benchmark');
    } else {
      console.log('❌ Portfolio had more drawdown than benchmark');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETE');
    console.log('='.repeat(80) + '\n');
    
    return result;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAllWeatherPortfolio()
    .then(() => {
      console.log('✅ All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    });
}

export { testAllWeatherPortfolio };
