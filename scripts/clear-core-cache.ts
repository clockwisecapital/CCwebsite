/**
 * Clear Core Portfolios Cache
 * 
 * Clears the core_portfolios_cache table to force regeneration
 * 
 * Usage: npx tsx scripts/clear-core-cache.ts
 */

import { createClient } from '@supabase/supabase-js';

async function clearCache() {
  // Hardcode the values for now - they're in the codebase anyway
  const supabaseUrl = 'https://ftplqetmkuzuahoatuaa.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🗑️  Clearing core_portfolios_cache...');

  const { error } = await supabase
    .from('core_portfolios_cache')
    .delete()
    .neq('portfolio_id', ''); // Delete all

  if (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }

  console.log('✅ Core portfolios cache cleared!');
  console.log('💡 The cache will regenerate on the next API call');
}

clearCache();
