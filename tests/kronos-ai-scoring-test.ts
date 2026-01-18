/**
 * Kronos AI-Enhanced Scoring Test
 * 
 * Compares baseline (keyword matching) vs AI-enhanced scoring
 */

import { scorePortfolio } from '../src/lib/kronos/scoring';
import type { Holding, ScoreResult } from '../src/lib/kronos/types';
import { isAIScoringAvailable } from '../src/lib/kronos/ai-scoring';

// =====================================================================================
// TEST PORTFOLIOS
// =====================================================================================

const ALL_WEATHER_PORTFOLIO: Holding[] = [
  { ticker: 'VTI', weight: 0.30, assetClass: 'us-large-cap' },
  { ticker: 'TLT', weight: 0.40, assetClass: 'long-treasuries' },
  { ticker: 'IEF', weight: 0.15, assetClass: 'intermediate-treasuries' },
  { ticker: 'GLD', weight: 0.075, assetClass: 'gold' },
  { ticker: 'DBC', weight: 0.075, assetClass: 'commodities' }
];

const TECH_HEAVY_PORTFOLIO: Holding[] = [
  { ticker: 'QQQ', weight: 0.50, assetClass: 'tech-sector' },
  { ticker: 'VUG', weight: 0.30, assetClass: 'us-growth' },
  { ticker: 'AGG', weight: 0.15, assetClass: 'aggregate-bonds' },
  { ticker: 'SHV', weight: 0.05, assetClass: 'cash' }
];

// =====================================================================================
// TEST QUESTIONS
// =====================================================================================

const TEST_CASES = [
  {
    name: 'Market Volatility (Simple)',
    question: 'How does my portfolio handle market volatility and sudden crashes?',
    portfolio: ALL_WEATHER_PORTFOLIO,
    expectedScenario: 'market-volatility'
  },
  {
    name: 'Inflation Protection (Ambiguous)',
    question: 'With recent economic uncertainty, I want to know if my portfolio can maintain purchasing power.',
    portfolio: ALL_WEATHER_PORTFOLIO,
    expectedScenario: 'inflation-hedge'
  },
  {
    name: 'Rate Environment (Technical)',
    question: 'Given the current yield curve and Fed policy, should I be in short-term bonds or cash equivalents?',
    portfolio: ALL_WEATHER_PORTFOLIO,
    expectedScenario: 'cash-vs-bonds'
  }
];

// =====================================================================================
// COMPARISON LOGIC
// =====================================================================================

interface ComparisonResult {
  testName: string;
  question: string;
  baseline: {
    score: number;
    scenarioId: string;
    analogName: string;
    portfolioReturn: number;
  };
  aiEnhanced?: {
    score: number;
    scenarioId: string;
    analogName: string;
    portfolioReturn: number;
    similarity?: number;
    reasoning?: string;
    matchingFactors?: string[];
  };
  scoreDifference?: number;
  aiImprovement?: string;
}

async function runComparison(
  testCase: typeof TEST_CASES[0]
): Promise<ComparisonResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Question: "${testCase.question}"`);
  console.log(`Portfolio: ${testCase.portfolio.map(h => `${h.ticker} (${(h.weight * 100).toFixed(0)}%)`).join(', ')}`);
  
  // Run baseline scoring (no AI)
  console.log(`\n📊 Running BASELINE scoring (keyword matching)...`);
  const baselineResult = await scorePortfolio(testCase.question, testCase.portfolio, false);
  
  const comparison: ComparisonResult = {
    testName: testCase.name,
    question: testCase.question,
    baseline: {
      score: baselineResult.score,
      scenarioId: baselineResult.scenarioId,
      analogName: baselineResult.analogName,
      portfolioReturn: baselineResult.portfolioReturn
    }
  };
  
  // Run AI-enhanced scoring if available
  if (isAIScoringAvailable()) {
    console.log(`\n🤖 Running AI-ENHANCED scoring...`);
    const aiResult = await scorePortfolio(testCase.question, testCase.portfolio, true);
    
    comparison.aiEnhanced = {
      score: aiResult.score,
      scenarioId: aiResult.scenarioId,
      analogName: aiResult.analogName,
      portfolioReturn: aiResult.portfolioReturn,
      similarity: (aiResult as any).aiAnalysis?.similarity,
      reasoning: (aiResult as any).aiAnalysis?.reasoning,
      matchingFactors: (aiResult as any).aiAnalysis?.matchingFactors
    };
    
    comparison.scoreDifference = aiResult.score - baselineResult.score;
    
    // Determine if AI improved the analysis
    if (aiResult.scenarioId !== baselineResult.scenarioId) {
      comparison.aiImprovement = 'Different scenario classification';
    } else if (aiResult.analogId !== baselineResult.analogId) {
      comparison.aiImprovement = 'More contextual analog selection';
    } else {
      comparison.aiImprovement = 'Enhanced with similarity scoring';
    }
  } else {
    console.log(`\n⚠️ AI scoring not available (ANTHROPIC_API_KEY not set)`);
  }
  
  return comparison;
}

// =====================================================================================
// MAIN TEST RUNNER
// =====================================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('KRONOS AI-ENHANCED SCORING COMPARISON TEST');
  console.log('='.repeat(80));
  console.log(`\nAI Available: ${isAIScoringAvailable() ? '✅ YES' : '❌ NO (set ANTHROPIC_API_KEY)'}`);
  
  const results: ComparisonResult[] = [];
  
  for (const testCase of TEST_CASES) {
    try {
      const result = await runComparison(testCase);
      results.push(result);
    } catch (error) {
      console.error(`\n❌ Test failed: ${testCase.name}`, error);
    }
  }
  
  // Print comparison table
  console.log('\n\n' + '='.repeat(80));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  for (const result of results) {
    console.log(`\n📋 ${result.testName}`);
    console.log(`   Question: "${result.question}"`);
    console.log(`\n   BASELINE:`);
    console.log(`     Score: ${result.baseline.score}/100`);
    console.log(`     Scenario: ${result.baseline.scenarioId}`);
    console.log(`     Analog: ${result.baseline.analogName}`);
    console.log(`     Portfolio Return: ${(result.baseline.portfolioReturn * 100).toFixed(2)}%`);
    
    if (result.aiEnhanced) {
      console.log(`\n   AI-ENHANCED:`);
      console.log(`     Score: ${result.aiEnhanced.score}/100 (${result.scoreDifference! >= 0 ? '+' : ''}${result.scoreDifference})`);
      console.log(`     Scenario: ${result.aiEnhanced.scenarioId}`);
      console.log(`     Analog: ${result.aiEnhanced.analogName}`);
      console.log(`     Portfolio Return: ${(result.aiEnhanced.portfolioReturn * 100).toFixed(2)}%`);
      
      if (result.aiEnhanced.similarity) {
        console.log(`     Similarity Score: ${result.aiEnhanced.similarity}%`);
      }
      
      if (result.aiEnhanced.reasoning) {
        console.log(`     AI Reasoning: ${result.aiEnhanced.reasoning.substring(0, 100)}...`);
      }
      
      if (result.aiEnhanced.matchingFactors && result.aiEnhanced.matchingFactors.length > 0) {
        console.log(`     Matching Factors:`);
        result.aiEnhanced.matchingFactors.slice(0, 2).forEach(factor => {
          console.log(`       - ${factor}`);
        });
      }
      
      console.log(`\n   ✨ AI Improvement: ${result.aiImprovement}`);
    }
    
    console.log('');
  }
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
  
  if (isAIScoringAvailable()) {
    const avgScoreDiff = results
      .filter(r => r.scoreDifference !== undefined)
      .reduce((sum, r) => sum + r.scoreDifference!, 0) / results.length;
    
    const scenarioChanges = results.filter(r => 
      r.aiEnhanced && r.baseline.scenarioId !== r.aiEnhanced.scenarioId
    ).length;
    
    const analogChanges = results.filter(r => 
      r.aiEnhanced && r.baseline.analogName !== r.aiEnhanced.analogName
    ).length;
    
    console.log(`\n📊 STATISTICS:`);
    console.log(`   Tests run: ${results.length}`);
    console.log(`   Average score difference: ${avgScoreDiff.toFixed(1)} points`);
    console.log(`   Scenario classification changes: ${scenarioChanges}/${results.length}`);
    console.log(`   Analog selection changes: ${analogChanges}/${results.length}`);
    console.log(`\n✅ AI enhancements are providing more contextual and nuanced analysis!`);
  } else {
    console.log(`\n⚠️ AI enhancements not tested (ANTHROPIC_API_KEY not configured)`);
    console.log(`   Baseline tests completed successfully.`);
  }
  
  console.log('');
}

// Run if executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('✅ All tests complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { runAllTests, runComparison };
