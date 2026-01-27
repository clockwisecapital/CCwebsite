/**
 * Fix Script: Swap Back Incorrectly Stored Upside/Downside Values
 * 
 * This script finds and fixes test results where upside < downside,
 * which indicates the values were stored backwards.
 * 
 * Run with: npx tsx scripts/fix-swapped-scenario-values.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixSwappedValues() {
  console.log('\n🔧 FIX SCRIPT: Swap Back Incorrectly Stored Upside/Downside Values');
  console.log('='.repeat(70));
  
  // Step 1: Find all swapped records
  const { data: tests, error: fetchError } = await supabase
    .from('question_tests')
    .select('id, portfolio_id, expected_return, upside, downside, created_at');
  
  if (fetchError) {
    console.error('❌ Error fetching test results:', fetchError);
    return;
  }
  
  if (!tests || tests.length === 0) {
    console.log('⚠️ No test results found in database');
    return;
  }
  
  // Filter for swapped records (upside < downside)
  const swappedRecords = tests.filter(test => test.upside < test.downside);
  
  console.log(`\n📊 Analysis:`);
  console.log(`   Total test results: ${tests.length}`);
  console.log(`   Swapped records found: ${swappedRecords.length}`);
  
  if (swappedRecords.length === 0) {
    console.log('\n✅ No swapped records found! All values are correct.');
    rl.close();
    return;
  }
  
  // Show sample of what will be fixed
  console.log(`\n📋 Sample of records that will be fixed (first 5):`);
  swappedRecords.slice(0, 5).forEach((record, idx) => {
    console.log(`\n${idx + 1}. Test ID: ${record.id.substring(0, 8)}...`);
    console.log(`   Created: ${new Date(record.created_at).toLocaleDateString()}`);
    console.log(`   Expected Return: ${(record.expected_return * 100).toFixed(2)}%`);
    console.log(`   Current upside: ${(record.upside * 100).toFixed(2)}% → Will become: ${(record.downside * 100).toFixed(2)}%`);
    console.log(`   Current downside: ${(record.downside * 100).toFixed(2)}% → Will become: ${(record.upside * 100).toFixed(2)}%`);
  });
  
  // Ask for confirmation
  console.log(`\n⚠️  WARNING: This will update ${swappedRecords.length} records in the database!`);
  const answer = await askQuestion('\nDo you want to proceed? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Operation cancelled by user');
    rl.close();
    return;
  }
  
  // Step 2: Fix each swapped record
  console.log(`\n🔄 Fixing ${swappedRecords.length} swapped records...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const record of swappedRecords) {
    // Swap the values
    const newUpside = record.downside;  // Old downside becomes new upside
    const newDownside = record.upside;   // Old upside becomes new downside
    
    const { error: updateError } = await supabase
      .from('question_tests')
      .update({
        upside: newUpside,
        downside: newDownside
      })
      .eq('id', record.id);
    
    if (updateError) {
      console.error(`❌ Error fixing record ${record.id}:`, updateError);
      errorCount++;
    } else {
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`   ✓ Fixed ${successCount}/${swappedRecords.length} records...`);
      }
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 FIX SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successfully fixed: ${successCount} records`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} records`);
  }
  console.log(`\n✨ Done! All swapped values have been corrected.`);
  console.log(`\n💡 Note: Users may need to refresh their browser to see the updated values.`);
  
  rl.close();
}

// Run the fix script
fixSwappedValues().catch(error => {
  console.error('❌ Unexpected error:', error);
  rl.close();
  process.exit(1);
});
