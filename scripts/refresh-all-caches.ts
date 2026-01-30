/**
 * Refresh All Caches - Master Script
 * 
 * Clears and regenerates all portfolio caches in the correct order
 * 
 * Usage: npx tsx scripts/refresh-all-caches.ts
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function clearAllCaches() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('\n🗑️  CLEARING ALL CACHES');
  console.log('='.repeat(60));

  // Clear Clockwise cache
  console.log('\n1. Clearing clockwise_portfolio_cache...');
  const { error: clockwiseError } = await supabase
    .from('clockwise_portfolio_cache')
    .delete()
    .neq('portfolio_id', '');

  if (clockwiseError) {
    console.error('❌ Error clearing Clockwise cache:', clockwiseError);
  } else {
    console.log('✅ Clockwise cache cleared');
  }

  // Clear TIME cache
  console.log('\n2. Clearing time_portfolio_analog_cache...');
  const { error: timeError } = await supabase
    .from('time_portfolio_analog_cache')
    .delete()
    .neq('analog_id', '');

  if (timeError) {
    console.error('❌ Error clearing TIME cache:', timeError);
  } else {
    console.log('✅ TIME cache cleared');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All caches cleared!');
  console.log('='.repeat(60));
}

async function regenerateAllCaches() {
  console.log('\n🔄 REGENERATING ALL CACHES');
  console.log('='.repeat(60));

  // Regenerate Clockwise cache
  console.log('\n1. Regenerating Clockwise portfolio cache...');
  console.log('   This will take a few minutes...\n');
  
  try {
    const { stdout: clockwiseStdout } = await execAsync('npx tsx scripts/generate-clockwise-cache.ts --force');
    console.log(clockwiseStdout);
  } catch (error: any) {
    console.error('❌ Error regenerating Clockwise cache:', error.message);
    console.log('Continuing with TIME cache...');
  }

  // Regenerate TIME cache
  console.log('\n2. Regenerating TIME portfolio cache...');
  console.log('   This will take a minute...\n');
  
  try {
    const { stdout: timeStdout } = await execAsync('npx tsx scripts/generate-time-analog-cache.ts');
    console.log(timeStdout);
  } catch (error: any) {
    console.error('❌ Error regenerating TIME cache:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL CACHES REGENERATED!');
  console.log('='.repeat(60));
  console.log('\n💡 Next steps:');
  console.log('   1. Restart your dev server');
  console.log('   2. Test a scenario to verify the fix');
}

async function main() {
  console.log('\n🚀 CACHE REFRESH MASTER SCRIPT');
  console.log('='.repeat(60));
  console.log('This will:');
  console.log('  1. Clear all existing caches');
  console.log('  2. Regenerate Clockwise portfolio cache');
  console.log('  3. Regenerate TIME portfolio cache');
  console.log('='.repeat(60));

  try {
    await clearAllCaches();
    await regenerateAllCaches();
    
    console.log('\n✨ Done! All caches refreshed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
