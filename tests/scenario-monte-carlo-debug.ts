/**
 * Debug Test: Scenario Testing Monte Carlo Issue
 * 
 * This test investigates why Expected Best Year and Expected Worst Year
 * are showing swapped values (best year is negative, worst year is positive)
 */

import { runPortfolioMonteCarloSimulation, type AssetClass } from '../src/lib/services/monte-carlo-portfolio';

console.log('\n🔍 DEBUG: Scenario Testing Monte Carlo Issue\n');
console.log('='.repeat(60));

// Test 1: Simple positive return portfolio
console.log('\n📊 Test 1: Portfolio with POSITIVE expected return (+10%)');
console.log('-'.repeat(60));

const positiveReturnMC = runPortfolioMonteCarloSimulation(
  [{
    weight: 1.0,
    year1Return: 0.10,  // +10% expected return
    year1Volatility: 0.18,
    assetClass: 'stocks' as AssetClass
  }],
  1
);

console.log('\nResults:');
console.log(`  Median Return: ${(positiveReturnMC.median * 100).toFixed(1)}%`);
console.log(`  Upside (95th): ${(positiveReturnMC.upside * 100).toFixed(1)}%`);
console.log(`  Downside (5th): ${(positiveReturnMC.downside * 100).toFixed(1)}%`);
console.log('\n✅ Expected: upside > median > downside');
console.log(`✅ Actual: ${positiveReturnMC.upside > positiveReturnMC.median && positiveReturnMC.median > positiveReturnMC.downside ? 'CORRECT' : '❌ WRONG'}`);

// Test 2: Negative return portfolio (like crash scenario)
console.log('\n\n📊 Test 2: Portfolio with NEGATIVE expected return (-22%)');
console.log('-'.repeat(60));

const negativeReturnMC = runPortfolioMonteCarloSimulation(
  [{
    weight: 1.0,
    year1Return: -0.22,  // -22% expected return (like TIME Portfolio in screenshot)
    year1Volatility: 0.18,
    assetClass: 'stocks' as AssetClass
  }],
  1
);

console.log('\nResults:');
console.log(`  Median Return: ${(negativeReturnMC.median * 100).toFixed(1)}%`);
console.log(`  Upside (95th): ${(negativeReturnMC.upside * 100).toFixed(1)}%`);
console.log(`  Downside (5th): ${(negativeReturnMC.downside * 100).toFixed(1)}%`);
console.log('\n✅ Expected: upside > median > downside (even with negative mean)');
console.log(`✅ Actual: ${negativeReturnMC.upside > negativeReturnMC.median && negativeReturnMC.median > negativeReturnMC.downside ? 'CORRECT' : '❌ WRONG'}`);

console.log('\n\n🎯 ANALYSIS:');
console.log('='.repeat(60));
console.log('If upside > downside in the Monte Carlo output, then the issue is:');
console.log('  1. The values are being SWAPPED somewhere after the Monte Carlo');
console.log('  2. OR the labels are swapped in the UI');
console.log('\nIf upside < downside in the Monte Carlo output, then:');
console.log('  1. The Monte Carlo percentile calculation is wrong');
console.log('  2. OR the array sorting is backwards');
console.log('\n' + '='.repeat(60));
