/**
 * Comprehensive Validation Script for All Historical Analogs
 * 
 * Validates that Expected Worst Year and Expected Return are correct across all scenarios
 * 
 * Usage: npx tsx scripts/validate-all-analogs.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { HISTORICAL_ANALOGS } from '@/lib/kronos/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface ValidationResult {
  analogId: string;
  analogName: string;
  portfolioName: string;
  expectedReturn: number;
  upside: number;
  downside: number;
  benchmarkReturn: number;
  validations: {
    downsideIsMoreNegative: boolean;
    upsideIsMorePositive: boolean;
    formulaCorrect: boolean;
    benchmarkReasonable: boolean;
  };
  issues: string[];
}

async function validateAllAnalogs() {
  console.log('\n🔍 COMPREHENSIVE VALIDATION: All Historical Analogs');
  console.log('='.repeat(70));
  console.log('Testing that Expected Worst Year is ALWAYS more negative than Expected Return');
  console.log('='.repeat(70));

  const analogIds = Object.keys(HISTORICAL_ANALOGS);
  console.log(`\n📊 Analogs to test: ${analogIds.length}`);
  console.log(`   ${analogIds.join(', ')}\n`);

  const allResults: ValidationResult[] = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  // Fetch all cache entries
  const { data, error } = await supabase
    .from('clockwise_portfolio_cache')
    .select('*')
    .order('analog_id', { ascending: true })
    .order('portfolio_name', { ascending: true });

  if (error) {
    console.error('❌ Error fetching cache:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.error('❌ No cache entries found! Run: npm run generate-cache');
    return;
  }

  console.log(`✅ Found ${data.length} total cache entries\n`);

  // Group by analog
  const entriesByAnalog = data.reduce((acc, entry) => {
    if (!acc[entry.analog_id]) {
      acc[entry.analog_id] = [];
    }
    acc[entry.analog_id].push(entry);
    return acc;
  }, {} as Record<string, any[]>);

  // Test each analog
  for (const analogId of analogIds) {
    const entries = entriesByAnalog[analogId] || [];
    const analogInfo = HISTORICAL_ANALOGS[analogId];

    console.log('\n' + '─'.repeat(70));
    console.log(`📊 ${analogInfo.name.toUpperCase()} (${analogId})`);
    console.log(`   Period: ${analogInfo.dateRange.start} to ${analogInfo.dateRange.end}`);
    console.log('─'.repeat(70));

    if (entries.length === 0) {
      console.log(`❌ NO CACHE ENTRIES FOUND for ${analogId}`);
      console.log(`   Run: npm run generate-cache -- --analog=${analogId}`);
      continue;
    }

    console.log(`\n   Found ${entries.length} portfolio(s)\n`);

    // Test each portfolio for this analog
    for (const entry of entries) {
      totalTests++;

      const expectedReturn = entry.portfolio_return;
      const upside = entry.estimated_upside;
      const downside = entry.estimated_downside;
      const benchmarkReturn = entry.benchmark_return;

      const issues: string[] = [];

      // Validation 1: Downside must be MORE NEGATIVE than expected return
      const downsideIsMoreNegative = downside <= expectedReturn;
      if (!downsideIsMoreNegative) {
        issues.push(`Downside (${(downside * 100).toFixed(2)}%) is NOT more negative than Expected Return (${(expectedReturn * 100).toFixed(2)}%)`);
      }

      // Validation 2: Upside must be MORE POSITIVE than expected return
      const upsideIsMorePositive = upside >= expectedReturn;
      if (!upsideIsMorePositive) {
        issues.push(`Upside (${(upside * 100).toFixed(2)}%) is NOT more positive than Expected Return (${(expectedReturn * 100).toFixed(2)}%)`);
      }

      // Validation 3: Formula correctness (upside/downside = expectedReturn ± 0.36)
      const expectedUpside = expectedReturn + 0.36;
      const expectedDownside = expectedReturn - 0.36;
      const upsideFormulaCorrect = Math.abs(upside - expectedUpside) < 0.01;
      const downsideFormulaCorrect = Math.abs(downside - expectedDownside) < 0.01;
      const formulaCorrect = upsideFormulaCorrect && downsideFormulaCorrect;

      if (!formulaCorrect) {
        if (!upsideFormulaCorrect) {
          issues.push(`Upside formula mismatch: Expected ${(expectedUpside * 100).toFixed(2)}%, Got ${(upside * 100).toFixed(2)}%`);
        }
        if (!downsideFormulaCorrect) {
          issues.push(`Downside formula mismatch: Expected ${(expectedDownside * 100).toFixed(2)}%, Got ${(downside * 100).toFixed(2)}%`);
        }
      }

      // Validation 4: Benchmark return is reasonable for this analog
      let benchmarkReasonable = true;
      if (analogId === 'GFC_RECOVERY' && benchmarkReturn <= 0) {
        issues.push(`GFC_RECOVERY should have POSITIVE S&P return, got ${(benchmarkReturn * 100).toFixed(2)}%`);
        benchmarkReasonable = false;
      }
      if (['COVID_CRASH', 'DOT_COM_BUST', 'RATE_SHOCK', 'STAGFLATION'].includes(analogId) && benchmarkReturn > 0) {
        issues.push(`Crash/downturn analog should have NEGATIVE S&P return, got ${(benchmarkReturn * 100).toFixed(2)}%`);
        benchmarkReasonable = false;
      }

      const allValid = issues.length === 0;
      const status = allValid ? '✅' : '❌';

      if (allValid) {
        totalPassed++;
      } else {
        totalFailed++;
      }

      // Store result
      allResults.push({
        analogId,
        analogName: analogInfo.name,
        portfolioName: entry.portfolio_name,
        expectedReturn,
        upside,
        downside,
        benchmarkReturn,
        validations: {
          downsideIsMoreNegative,
          upsideIsMorePositive,
          formulaCorrect,
          benchmarkReasonable
        },
        issues
      });

      // Print result
      console.log(`   ${status} ${entry.portfolio_name}`);
      console.log(`      Expected Return:      ${(expectedReturn * 100).toFixed(2)}%`);
      console.log(`      Expected Upside:      ${(upside * 100).toFixed(2)}%`);
      console.log(`      Expected Worst Year:  ${(downside * 100).toFixed(2)}%`);
      console.log(`      S&P Benchmark:        ${(benchmarkReturn * 100).toFixed(2)}%`);

      if (issues.length > 0) {
        console.log(`      ❌ ISSUES:`);
        issues.forEach(issue => console.log(`         - ${issue}`));
      } else {
        console.log(`      ✅ All validations passed`);
      }
      console.log('');
    }
  }

  // Summary Report
  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests:        ${totalTests}`);
  console.log(`✅ Passed:          ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed:          ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);
  console.log('='.repeat(70));

  if (totalFailed > 0) {
    console.log('\n❌ FAILED TESTS:\n');
    allResults.filter(r => r.issues.length > 0).forEach(result => {
      console.log(`❌ ${result.analogName} - ${result.portfolioName}`);
      result.issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('');
    });
  }

  // Final verdict
  console.log('\n' + '='.repeat(70));
  if (totalFailed === 0) {
    console.log('✅✅✅ ALL TESTS PASSED! ✅✅✅');
    console.log('   The fix is working correctly across all historical analogs.');
    console.log('   Expected Worst Year is always more negative than Expected Return.');
  } else {
    console.log('❌❌❌ SOME TESTS FAILED ❌❌❌');
    console.log(`   ${totalFailed} issue(s) found across analogs.`);
    console.log('   Please review the issues above and fix the cache generation.');
  }
  console.log('='.repeat(70));

  // Special checks
  console.log('\n📋 SPECIAL CHECKS:');
  console.log('─'.repeat(70));

  // Check 1: GFC_RECOVERY has positive returns
  const gfcEntries = allResults.filter(r => r.analogId === 'GFC_RECOVERY');
  const allGfcPositive = gfcEntries.every(r => r.expectedReturn > 0 && r.benchmarkReturn > 0);
  console.log(`${allGfcPositive ? '✅' : '❌'} GFC_RECOVERY: All returns are positive`);
  if (!allGfcPositive) {
    console.log('   ❌ GFC_RECOVERY should show positive returns (2009-2020 bull market)');
  }

  // Check 2: Crash analogs have negative returns
  const crashAnalogs = ['COVID_CRASH', 'DOT_COM_BUST', 'RATE_SHOCK', 'STAGFLATION'];
  const crashEntries = allResults.filter(r => crashAnalogs.includes(r.analogId));
  const allCrashNegative = crashEntries.every(r => r.expectedReturn < 0 && r.benchmarkReturn < 0);
  console.log(`${allCrashNegative ? '✅' : '❌'} Crash Analogs: All returns are negative`);
  if (!allCrashNegative) {
    console.log('   ⚠️ Some crash analogs showing positive returns (may be portfolio-specific)');
  }

  // Check 3: Upside/Downside spread is consistent (36% each direction)
  const spreadsCorrect = allResults.every(r => {
    const upsideSpread = r.upside - r.expectedReturn;
    const downsideSpread = r.expectedReturn - r.downside;
    return Math.abs(upsideSpread - 0.36) < 0.01 && Math.abs(downsideSpread - 0.36) < 0.01;
  });
  console.log(`${spreadsCorrect ? '✅' : '❌'} Upside/Downside Spread: ±36% (2× std dev of 18%)`);

  console.log('='.repeat(70) + '\n');

  process.exit(totalFailed > 0 ? 1 : 0);
}

validateAllAnalogs();
