/**
 * Check Question Metadata
 * 
 * Quick script to inspect a question's metadata to see if it has analog_id stored
 * 
 * Usage: npx tsx scripts/check-question-metadata.ts "Meme Stock"
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

async function main() {
  const searchTerm = process.argv[2] || 'Meme';
  
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

  console.log(`\n🔍 Searching for questions matching: "${searchTerm}"\n`);
  console.log('='.repeat(80));

  const { data: questions, error } = await supabase
    .from('scenario_questions')
    .select('id, title, question_text, metadata, historical_period, created_at')
    .ilike('title', `%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error querying questions:', error);
    process.exit(1);
  }

  if (!questions || questions.length === 0) {
    console.log('❌ No questions found');
    process.exit(0);
  }

  for (const question of questions) {
    console.log(`\n📝 Question: ${question.title}`);
    console.log(`   ID: ${question.id}`);
    console.log(`   Question Text: ${question.question_text}`);
    console.log(`   Created: ${new Date(question.created_at).toLocaleString()}`);
    
    console.log(`\n   📅 Historical Period:`);
    if (question.historical_period && Array.isArray(question.historical_period)) {
      question.historical_period.forEach((period: any) => {
        console.log(`      ${period.start}-${period.end}: ${period.label}`);
      });
    } else {
      console.log('      None');
    }
    
    console.log(`\n   📊 Metadata:`);
    const metadata = question.metadata as any;
    
    if (!metadata || Object.keys(metadata).length === 0) {
      console.log('      ❌ EMPTY - No metadata stored');
    } else {
      console.log(`      Keys: ${Object.keys(metadata).join(', ')}`);
      
      // Check for analog data
      if (metadata.analog_id) {
        console.log(`\n      ✅ HAS ANALOG STORED:`);
        console.log(`         analog_id: ${metadata.analog_id}`);
        console.log(`         analog_name: ${metadata.analog_name || 'N/A'}`);
        console.log(`         analog_period: ${metadata.analog_period || 'N/A'}`);
        console.log(`         analog_similarity: ${metadata.analog_similarity || 'N/A'}%`);
        console.log(`         analog_reasoning: ${metadata.analog_reasoning || 'N/A'}`);
      } else {
        console.log(`\n      ❌ NO ANALOG_ID - Legacy question (will use AI selection on each test)`);
      }
      
      // Check for sp500_return
      if (metadata.sp500_return !== undefined) {
        console.log(`\n      S&P 500 Return: ${(metadata.sp500_return * 100).toFixed(2)}%`);
      }
      
      // Show all metadata for debugging
      console.log(`\n      Full Metadata:`);
      console.log(JSON.stringify(metadata, null, 8));
    }
    
    console.log('\n' + '='.repeat(80));
  }
  
  console.log('\n💡 Summary:');
  console.log(`   Found ${questions.length} question(s)`);
  
  const withAnalog = questions.filter(q => (q.metadata as any)?.analog_id).length;
  const withoutAnalog = questions.length - withAnalog;
  
  console.log(`   ✅ With analog_id: ${withAnalog}`);
  console.log(`   ❌ Without analog_id: ${withoutAnalog}`);
  
  if (withoutAnalog > 0) {
    console.log(`\n   ⚠️  Questions without analog_id will have inconsistent benchmarks!`);
    console.log(`   💡 Solution: Delete and recreate these questions to get analog storage`);
  }
}

main();
