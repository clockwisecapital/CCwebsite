/**
 * Kronos AI-Enhanced Scoring - Simple Direct Test
 * 
 * Direct comparison: Baseline vs AI-Enhanced Scoring
 * Loads environment from process and Next.js config
 */

import path from 'path';
import fs from 'fs';

// Manually load .env variables since we're running outside Next.js context
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !process.env[key]) {
      process.env[key] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

import { scorePortfolio } from '../src/lib/kronos/scoring';
import type { Holding } from '../src/lib/kronos/types';
import { isAIScoringAvailable } from '../src/lib/kronos/ai-scoring';

// =====================================================================================
// TEST DATA
// =====================================================================================

const ALL_WEATHER: Holding[] = [
  { ticker: 'VTI', weight: 0.30, assetClass: 'us-large-cap' },
  { ticker: 'TLT', weight: 0.40, assetClass: 'long-treasuries' },
  { ticker: 'IEF', weight: 0.15, assetClass: 'intermediate-treasuries' },
  { ticker: 'GLD', weight: 0.075, assetClass: 'gold' },
  { ticker: 'DBC', weight: 0.075, assetClass: 'commodities' }
];

const TEST_QUESTIONS = [
  'How resilient is my portfolio to sudden market crashes and volatility?',
  'If the economy enters a recession, how protected is my portfolio?',
  'Should I be concerned about rising interest rates affecting my fixed income?'
];

// =====================================================================================
// MAIN TEST
// =====================================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('KRONOS AI-ENHANCED SCORING - DIRECT TEST');
  console.log('='.repeat(80));
  
  console.log(`\n📋 Environment Check:`);
  console.log(`   API Key configured: ${process.env.ANTHROPIC_API_KEY ? '✅ YES' : '❌ NO'}`);
  console.log(`   AI Available: ${isAIScoringAvailable() ? '✅ YES' : '❌ NO'}`);
  console.log(`\n🏗️ Portfolio:`);
  ALL_WEATHER.forEach(h => {
    console.log(`   ${h.ticker}: ${(h.weight * 100).toFixed(1)}% (${h.assetClass})`);
  });
  
  if (!isAIScoringAvailable()) {
    console.log('\n❌ AI API key not available. Running baseline tests only.\n');
  }
  
  // Test each question
  for (let i = 0; i < TEST_QUESTIONS.length; i++) {
    const question = TEST_QUESTIONS[i];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST ${i + 1}/3: ${question}`);
    console.log(`${'='.repeat(80)}`);
    
    try {
      // Baseline (no AI)
      console.log(`\n📊 BASELINE SCORING (Keyword Matching)...`);
      const baseline = await scorePortfolio(question, ALL_WEATHER, false);
      
      console.log(`\n  Result: ${baseline.score}/100 (${baseline.label})`);
      console.log(`  Scenario: ${baseline.scenarioId}`);
      console.log(`  Analog: ${baseline.analogName}`);
      console.log(`  Portfolio Return: ${(baseline.portfolioReturn * 100).toFixed(2)}%`);
      console.log(`  vs Benchmark: ${(baseline.benchmarkReturn * 100).toFixed(2)}%`);
      
      // AI-Enhanced (if available)
      if (isAIScoringAvailable()) {
        console.log(`\n🤖 AI-ENHANCED SCORING...`);
        const aiEnhanced = await scorePortfolio(question, ALL_WEATHER, true);
        
        console.log(`\n  Result: ${aiEnhanced.score}/100 (${aiEnhanced.label})`);
        console.log(`  Scenario: ${aiEnhanced.scenarioId}`);
        console.log(`  Analog: ${aiEnhanced.analogName}`);
        console.log(`  Portfolio Return: ${(aiEnhanced.portfolioReturn * 100).toFixed(2)}%`);
        
        // Compare
        const aiData = (aiEnhanced as any).aiAnalysis;
        if (aiData) {
          console.log(`\n  ✨ AI Enhancements:`);
          console.log(`     Similarity Score: ${aiData.similarity}%`);
          console.log(`     Reasoning: ${aiData.reasoning?.substring(0, 120)}...`);
          if (aiData.matchingFactors?.length > 0) {
            console.log(`     Key Factors: ${aiData.matchingFactors[0]}`);
          }
        }
        
        const scoreDiff = aiEnhanced.score - baseline.score;
        const scenarioMatch = aiEnhanced.scenarioId === baseline.scenarioId ? '✅ Same' : '🔄 Different';
        const analogMatch = aiEnhanced.analogId === baseline.analogId ? '✅ Same' : '🔄 Different';
        
        console.log(`\n  📈 Comparison:`);
        console.log(`     Score Change: ${scoreDiff >= 0 ? '+' : ''}${scoreDiff} points`);
        console.log(`     Scenario: ${scenarioMatch} - ${aiEnhanced.scenarioId}`);
        console.log(`     Analog: ${analogMatch} - ${aiEnhanced.analogName}`);
      }
      
    } catch (error) {
      console.error(`\n❌ Error in test: ${error}`);
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('TESTS COMPLETE');
  console.log(`${'='.repeat(80)}\n`);
}

main().catch(console.error);
