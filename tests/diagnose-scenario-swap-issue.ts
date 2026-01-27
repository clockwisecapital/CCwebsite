/**
 * Diagnostic Test: Scenario Testing Upside/Downside Swap Issue
 * 
 * This test helps diagnose whether existing test results in the database
 * have swapped upside/downside values.
 * 
 * Run with: npx tsx tests/diagnose-scenario-swap-issue.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSwapIssue() {
  console.log('\n🔍 DIAGNOSTIC: Scenario Testing Upside/Downside Swap Issue');
  console.log('='.repeat(70));
  
  // Fetch all test results with upside/downside values
  const { data: tests, error } = await supabase
    .from('question_tests')
    .select('id, portfolio_id, score, expected_return, upside, downside, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('❌ Error fetching test results:', error);
    return;
  }
  
  if (!tests || tests.length === 0) {
    console.log('⚠️ No test results found in database');
    return;
  }
  
  console.log(`\n📊 Analyzing ${tests.length} test results...\n`);
  
  let swappedCount = 0;
  let correctCount = 0;
  let ambiguousCount = 0;
  
  const swappedResults: any[] = [];
  
  for (const test of tests) {
    const { id, expected_return, upside, downside } = test;
    
    // Check if upside < downside (WRONG!)
    const isSwapped = upside < downside;
    
    // Also check if the relationship makes sense with expected_return
    // Expected: downside < expected_return < upside
    const isLogicalOrder = downside < expected_return && expected_return < upside;
    
    if (isSwapped) {
      swappedCount++;
      swappedResults.push({
        id,
        expected_return: (expected_return * 100).toFixed(2) + '%',
        upside: (upside * 100).toFixed(2) + '%',
        downside: (downside * 100).toFixed(2) + '%',
        issue: 'SWAPPED'
      });
      
      console.log(`❌ SWAPPED DETECTED - Test ID: ${id.substring(0, 8)}...`);
      console.log(`   Expected Return: ${(expected_return * 100).toFixed(2)}%`);
      console.log(`   Upside (should be best): ${(upside * 100).toFixed(2)}%`);
      console.log(`   Downside (should be worst): ${(downside * 100).toFixed(2)}%`);
      console.log(`   → upside < downside (WRONG!)\n`);
    } else if (isLogicalOrder) {
      correctCount++;
    } else {
      ambiguousCount++;
      console.log(`⚠️ AMBIGUOUS - Test ID: ${id.substring(0, 8)}...`);
      console.log(`   Expected Return: ${(expected_return * 100).toFixed(2)}%`);
      console.log(`   Upside: ${(upside * 100).toFixed(2)}%`);
      console.log(`   Downside: ${(downside * 100).toFixed(2)}%`);
      console.log(`   → Order is unclear\n`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total tests analyzed: ${tests.length}`);
  console.log(`✅ Correct (upside > downside): ${correctCount}`);
  console.log(`❌ Swapped (upside < downside): ${swappedCount}`);
  console.log(`⚠️ Ambiguous: ${ambiguousCount}`);
  
  if (swappedCount > 0) {
    console.log(`\n❌ FOUND ${swappedCount} TEST RESULTS WITH SWAPPED VALUES!`);
    console.log(`\nThese records need to be fixed. Run the fix script to swap them back.`);
    
    // Show first few swapped results
    console.log(`\n📋 Sample of swapped results (first 5):`);
    swappedResults.slice(0, 5).forEach((result, idx) => {
      console.log(`\n${idx + 1}. Test ID: ${result.id.substring(0, 8)}...`);
      console.log(`   Expected Return: ${result.expected_return}`);
      console.log(`   Upside (currently): ${result.upside}`);
      console.log(`   Downside (currently): ${result.downside}`);
      console.log(`   Fix: Swap upside ↔ downside`);
    });
  } else if (correctCount === tests.length) {
    console.log(`\n✅ ALL TEST RESULTS ARE CORRECT!`);
    console.log(`No swapped values found. The issue may be in the calculation code.`);
  }
  
  console.log('\n' + '='.repeat(70));
}

// Run the diagnostic
diagnoseSwapIssue().catch(console.error);
