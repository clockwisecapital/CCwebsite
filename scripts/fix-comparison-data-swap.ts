/**
 * Fix Script: Swap Upside/Downside in comparison_data JSONB Column
 * 
 * The comparison_data JSONB column contains nested upside/downside values
 * that also need to be swapped. This script fixes those.
 * 
 * Run with: npx tsx scripts/fix-comparison-data-swap.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixComparisonDataSwap() {
  console.log('\n🔧 FIX SCRIPT: Swap Upside/Downside in comparison_data JSONB');
  console.log('='.repeat(70));
  
  // Fetch all test results with comparison_data
  const { data: tests, error: fetchError } = await supabase
    .from('question_tests')
    .select('id, comparison_data');
  
  if (fetchError) {
    console.error('❌ Error fetching test results:', fetchError);
    return;
  }
  
  if (!tests || tests.length === 0) {
    console.log('⚠️ No test results found');
    return;
  }
  
  console.log(`\n📊 Analyzing ${tests.length} test results...\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (const test of tests) {
    const compData: any = test.comparison_data;
    
    if (!compData || typeof compData !== 'object') {
      skippedCount++;
      continue;
    }
    
    let needsFix = false;
    const updatedCompData = { ...compData };
    
    // Fix userPortfolio upside/downside if swapped
    if (compData.userPortfolio) {
      const user = compData.userPortfolio;
      if (user.upside !== undefined && user.downside !== undefined && user.upside < user.downside) {
        console.log(`❌ SWAP in userPortfolio for test ${test.id.substring(0, 8)}...`);
        console.log(`   upside: ${(user.upside * 100).toFixed(2)}% → ${(user.downside * 100).toFixed(2)}%`);
        console.log(`   downside: ${(user.downside * 100).toFixed(2)}% → ${(user.upside * 100).toFixed(2)}%`);
        
        updatedCompData.userPortfolio = {
          ...user,
          upside: user.downside,
          downside: user.upside
        };
        needsFix = true;
      }
    }
    
    // Fix timePortfolio upside/downside if swapped
    if (compData.timePortfolio) {
      const time = compData.timePortfolio;
      if (time.upside !== undefined && time.downside !== undefined && time.upside < time.downside) {
        console.log(`❌ SWAP in timePortfolio for test ${test.id.substring(0, 8)}...`);
        console.log(`   upside: ${(time.upside * 100).toFixed(2)}% → ${(time.downside * 100).toFixed(2)}%`);
        console.log(`   downside: ${(time.downside * 100).toFixed(2)}% → ${(time.upside * 100).toFixed(2)}%`);
        
        updatedCompData.timePortfolio = {
          ...time,
          upside: time.downside,
          downside: time.upside
        };
        needsFix = true;
      }
    }
    
    // Fix clockwisePortfolios array if present
    if (Array.isArray(compData.clockwisePortfolios)) {
      const updatedClockwise = compData.clockwisePortfolios.map((p: any) => {
        if (p.upside !== undefined && p.downside !== undefined && p.upside < p.downside) {
          console.log(`❌ SWAP in clockwise portfolio ${p.name} for test ${test.id.substring(0, 8)}...`);
          return {
            ...p,
            upside: p.downside,
            downside: p.upside
          };
        }
        return p;
      });
      
      if (JSON.stringify(updatedClockwise) !== JSON.stringify(compData.clockwisePortfolios)) {
        updatedCompData.clockwisePortfolios = updatedClockwise;
        needsFix = true;
      }
    }
    
    // Update record if needed
    if (needsFix) {
      const { error: updateError } = await supabase
        .from('question_tests')
        .update({ comparison_data: updatedCompData })
        .eq('id', test.id);
      
      if (updateError) {
        console.error(`❌ Error updating test ${test.id}:`, updateError);
        errorCount++;
      } else {
        fixedCount++;
      }
    } else {
      skippedCount++;
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 FIX SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total tests: ${tests.length}`);
  console.log(`✅ Fixed: ${fixedCount}`);
  console.log(`⏭️ Skipped (no swap): ${skippedCount}`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }
  console.log('\n✨ Done! comparison_data JSONB values corrected.');
}

// Run the fix
fixComparisonDataSwap().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
