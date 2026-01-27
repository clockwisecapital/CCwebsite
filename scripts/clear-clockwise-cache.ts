/**
 * Clear Clockwise Portfolio Cache
 * 
 * Clears the clockwise_portfolio_cache table to force regeneration
 * 
 * Usage: npx tsx scripts/clear-clockwise-cache.ts
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function clearCache() {
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

  console.log('🗑️  Clearing clockwise_portfolio_cache...');

  const { error } = await supabase
    .from('clockwise_portfolio_cache')
    .delete()
    .neq('portfolio_id', ''); // Delete all

  if (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }

  console.log('✅ Clockwise portfolio cache cleared!');
  console.log('💡 Run: npx tsx scripts/generate-clockwise-cache.ts --force');
}

clearCache();
