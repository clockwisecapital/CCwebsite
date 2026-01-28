/**
 * Test: Portfolio Dollar Amount Allocation Fix
 * 
 * This test verifies that portfolios created with dollar amounts (numeric values)
 * are properly extracted and allocated correctly.
 */

import { extractHoldingsFromPortfolio, type PortfolioRecord } from '../src/lib/kronos/portfolio-extractor';

async function testDollarAmountAllocation() {
  console.log('\n🧪 Testing Portfolio Dollar Amount Allocation Fix\n');
  console.log('='.repeat(60));

  // Test Case 1: Portfolio with dollar amounts in intake_data.specificHoldings
  console.log('\n📋 Test Case 1: Dollar Amounts in intake_data.specificHoldings');
  console.log('-'.repeat(60));
  
  const portfolioWithDollarAmounts: PortfolioRecord = {
    id: 'test-1',
    name: 'Test Portfolio with Dollar Amounts',
    portfolio_data: {
      totalValue: 100000,
      stocks: 100,
      bonds: 0,
      cash: 0,
    },
    intake_data: {
      portfolioTotalValue: 100000,
      specificHoldings: [
        { ticker: 'AAPL', dollarAmount: 50000, percentage: 0 },
        { ticker: 'GOOGL', dollarAmount: 30000, percentage: 0 },
        { ticker: 'AGG', dollarAmount: 20000, percentage: 0 },
      ],
    },
  };

  try {
    const holdings1 = await extractHoldingsFromPortfolio(portfolioWithDollarAmounts);
    console.log('✅ Holdings extracted successfully:');
    holdings1.forEach(h => {
      console.log(`   ${h.ticker}: ${(h.weight * 100).toFixed(1)}% (${h.assetClass})`);
    });
    
    // Verify weights
    const totalWeight = holdings1.reduce((sum, h) => sum + h.weight, 0);
    console.log(`   Total Weight: ${(totalWeight * 100).toFixed(1)}%`);
    
    if (Math.abs(totalWeight - 1.0) < 0.01) {
      console.log('✅ PASS: Weights sum to 100%');
    } else {
      console.log('❌ FAIL: Weights do not sum to 100%');
    }
    
    // Verify individual allocations
    const aaplWeight = holdings1.find(h => h.ticker === 'AAPL')?.weight;
    const googlWeight = holdings1.find(h => h.ticker === 'GOOGL')?.weight;
    const aggWeight = holdings1.find(h => h.ticker === 'AGG')?.weight;
    
    if (Math.abs(aaplWeight! - 0.5) < 0.01 && 
        Math.abs(googlWeight! - 0.3) < 0.01 && 
        Math.abs(aggWeight! - 0.2) < 0.01) {
      console.log('✅ PASS: Individual allocations are correct (50%, 30%, 20%)');
    } else {
      console.log('❌ FAIL: Individual allocations are incorrect');
      console.log(`   Expected: AAPL=50%, GOOGL=30%, AGG=20%`);
      console.log(`   Got: AAPL=${(aaplWeight! * 100).toFixed(1)}%, GOOGL=${(googlWeight! * 100).toFixed(1)}%, AGG=${(aggWeight! * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.log('❌ FAIL: Error extracting holdings:', error);
  }

  // Test Case 2: Portfolio with dollar amounts but no totalValue (auto-calculate)
  console.log('\n📋 Test Case 2: Auto-calculate totalValue from dollar amounts');
  console.log('-'.repeat(60));
  
  const portfolioAutoTotal: PortfolioRecord = {
    id: 'test-2',
    name: 'Test Portfolio - Auto Total',
    portfolio_data: {
      stocks: 100,
      bonds: 0,
      cash: 0,
    },
    intake_data: {
      specificHoldings: [
        { ticker: 'VTI', dollarAmount: 40000, percentage: 0 },
        { ticker: 'VXUS', dollarAmount: 30000, percentage: 0 },
        { ticker: 'BND', dollarAmount: 20000, percentage: 0 },
        { ticker: 'VNQ', dollarAmount: 10000, percentage: 0 },
      ],
    },
  };

  try {
    const holdings2 = await extractHoldingsFromPortfolio(portfolioAutoTotal);
    console.log('✅ Holdings extracted successfully:');
    holdings2.forEach(h => {
      console.log(`   ${h.ticker}: ${(h.weight * 100).toFixed(1)}% (${h.assetClass})`);
    });
    
    const totalWeight = holdings2.reduce((sum, h) => sum + h.weight, 0);
    console.log(`   Total Weight: ${(totalWeight * 100).toFixed(1)}%`);
    
    if (Math.abs(totalWeight - 1.0) < 0.01) {
      console.log('✅ PASS: Weights sum to 100% (auto-calculated total)');
    } else {
      console.log('❌ FAIL: Weights do not sum to 100%');
    }
  } catch (error) {
    console.log('❌ FAIL: Error extracting holdings:', error);
  }

  // Test Case 3: Portfolio with percentage allocations (should still work)
  console.log('\n📋 Test Case 3: Percentage Allocations (backward compatibility)');
  console.log('-'.repeat(60));
  
  const portfolioWithPercentages: PortfolioRecord = {
    id: 'test-3',
    name: 'Test Portfolio with Percentages',
    portfolio_data: {
      totalValue: 500000,
      stocks: 100,
      bonds: 0,
      cash: 0,
    },
    intake_data: {
      portfolioTotalValue: 500000,
      specificHoldings: [
        { ticker: 'AAPL', percentage: 40, dollarAmount: 0 },
        { ticker: 'MSFT', percentage: 35, dollarAmount: 0 },
        { ticker: 'GOOGL', percentage: 25, dollarAmount: 0 },
      ],
    },
  };

  try {
    const holdings3 = await extractHoldingsFromPortfolio(portfolioWithPercentages);
    console.log('✅ Holdings extracted successfully:');
    holdings3.forEach(h => {
      console.log(`   ${h.ticker}: ${(h.weight * 100).toFixed(1)}% (${h.assetClass})`);
    });
    
    const totalWeight = holdings3.reduce((sum, h) => sum + h.weight, 0);
    console.log(`   Total Weight: ${(totalWeight * 100).toFixed(1)}%`);
    
    if (Math.abs(totalWeight - 1.0) < 0.01) {
      console.log('✅ PASS: Percentage allocations still work correctly');
    } else {
      console.log('❌ FAIL: Percentage allocations broken');
    }
  } catch (error) {
    console.log('❌ FAIL: Error extracting holdings:', error);
  }

  // Test Case 4: Portfolio with holdings in portfolio_data.holdings (fallback)
  console.log('\n📋 Test Case 4: Holdings in portfolio_data.holdings (fallback location)');
  console.log('-'.repeat(60));
  
  const portfolioWithHoldingsInData: PortfolioRecord = {
    id: 'test-4',
    name: 'Test Portfolio - Fallback Location',
    portfolio_data: {
      totalValue: 200000,
      stocks: 100,
      bonds: 0,
      cash: 0,
      holdings: [
        { ticker: 'SPY', dollarAmount: 120000, percentage: 0 },
        { ticker: 'AGG', dollarAmount: 80000, percentage: 0 },
      ],
    },
    intake_data: {},
  };

  try {
    const holdings4 = await extractHoldingsFromPortfolio(portfolioWithHoldingsInData);
    console.log('✅ Holdings extracted successfully:');
    holdings4.forEach(h => {
      console.log(`   ${h.ticker}: ${(h.weight * 100).toFixed(1)}% (${h.assetClass})`);
    });
    
    const totalWeight = holdings4.reduce((sum, h) => sum + h.weight, 0);
    console.log(`   Total Weight: ${(totalWeight * 100).toFixed(1)}%`);
    
    if (Math.abs(totalWeight - 1.0) < 0.01) {
      console.log('✅ PASS: Fallback location (portfolio_data.holdings) works');
    } else {
      console.log('❌ FAIL: Fallback location not working');
    }
  } catch (error) {
    console.log('❌ FAIL: Error extracting holdings:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
}

// Run tests
testDollarAmountAllocation().catch(console.error);
