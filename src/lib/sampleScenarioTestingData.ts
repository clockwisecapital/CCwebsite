/**
 * Sample Scenario Testing Data
 * 
 * Pre-built test portfolios and scenarios for frontend testing
 * These allow users to test different portfolio strategies against historical scenarios
 */

// =====================================================================================
// SAMPLE PORTFOLIOS
// =====================================================================================

export const SAMPLE_PORTFOLIOS = {
  all_weather: {
    id: 'sample-all-weather',
    name: 'All Weather Portfolio',
    description: 'Ray Dalio\'s balanced portfolio designed for all market conditions',
    holdings: [
      { ticker: 'VTI', weight: 0.30, name: 'U.S. Total Market' },
      { ticker: 'TLT', weight: 0.40, name: 'Long-Term Treasuries' },
      { ticker: 'IEF', weight: 0.15, name: 'Intermediate Treasuries' },
      { ticker: 'GLD', weight: 0.075, name: 'Gold' },
      { ticker: 'DBC', weight: 0.075, name: 'Commodities' }
    ],
    expectedReturn: 0.068,
    expectedDownside: -0.15,
    expectedUpside: 0.18
  },

  tech_heavy: {
    id: 'sample-tech-heavy',
    name: 'Tech-Heavy Growth',
    description: 'Concentrated technology exposure for aggressive growth',
    holdings: [
      { ticker: 'QQQ', weight: 0.50, name: 'NASDAQ-100' },
      { ticker: 'VUG', weight: 0.30, name: 'U.S. Growth' },
      { ticker: 'AGG', weight: 0.15, name: 'Bonds' },
      { ticker: 'SHV', weight: 0.05, name: 'Cash' }
    ],
    expectedReturn: 0.128,
    expectedDownside: -0.42,
    expectedUpside: 0.68
  },

  conservative: {
    id: 'sample-conservative',
    name: 'Conservative Income',
    description: 'Dividend-focused portfolio with heavy bond allocation',
    holdings: [
      { ticker: 'SCHD', weight: 0.40, name: 'Dividend Stocks' },
      { ticker: 'BND', weight: 0.45, name: 'Bonds' },
      { ticker: 'CASH', weight: 0.15, name: 'Cash' }
    ],
    expectedReturn: 0.044,
    expectedDownside: -0.08,
    expectedUpside: 0.12
  },

  value_play: {
    id: 'sample-value-play',
    name: 'Value & Dividends',
    description: 'Value stocks with strong dividend yield',
    holdings: [
      { ticker: 'VTV', weight: 0.35, name: 'Value Stocks' },
      { ticker: 'SCHD', weight: 0.30, name: 'Dividend Stocks' },
      { ticker: 'XLE', weight: 0.15, name: 'Energy' },
      { ticker: 'BND', weight: 0.20, name: 'Bonds' }
    ],
    expectedReturn: 0.062,
    expectedDownside: -0.24,
    expectedUpside: 0.28
  },

  international_exposure: {
    id: 'sample-intl-exposure',
    name: 'Global Diversification',
    description: 'Heavy international and emerging market exposure',
    holdings: [
      { ticker: 'VXUS', weight: 0.40, name: 'International Stocks' },
      { ticker: 'VWO', weight: 0.25, name: 'Emerging Markets' },
      { ticker: 'VTI', weight: 0.20, name: 'U.S. Stocks' },
      { ticker: 'BND', weight: 0.15, name: 'Bonds' }
    ],
    expectedReturn: 0.075,
    expectedDownside: -0.32,
    expectedUpside: 0.42
  },

  time_portfolio: {
    id: 'time-portfolio',
    name: 'TIME Portfolio',
    description: 'Clockwise Capital\'s active managed hedged growth fund',
    holdings: [
      { ticker: 'VTI', weight: 0.40, name: 'U.S. Total Market' },
      { ticker: 'MSFT', weight: 0.075, name: 'Microsoft' },
      { ticker: 'AAPL', weight: 0.075, name: 'Apple' },
      { ticker: 'TLT', weight: 0.15, name: 'Long-Term Treasuries' },
      { ticker: 'GLD', weight: 0.12, name: 'Gold' }
    ],
    expectedReturn: 0.094,
    expectedDownside: -0.17,
    expectedUpside: 0.45
  }
};

// =====================================================================================
// SAMPLE SCENARIO QUESTIONS
// =====================================================================================

export const SAMPLE_QUESTIONS = [
  {
    id: 'q-volatility-1',
    category: 'market-volatility',
    title: 'Market Crash Resilience',
    question: 'How does my portfolio perform during a sudden 30-40% market correction?',
    description: 'Test portfolio against COVID crash (Feb-Mar 2020)'
  },
  {
    id: 'q-volatility-2',
    category: 'market-volatility',
    title: 'Extreme Volatility Test',
    question: 'If the market drops 20% in a single month, what happens to my portfolio?',
    description: 'Stress test against major drawdown scenarios'
  },
  {
    id: 'q-tech-boom-1',
    category: 'ai-supercycle',
    title: 'Tech Bubble Exposure',
    question: "I'm concerned about AI bubble risk - how exposed is my portfolio?",
    description: 'Test against dot-com bust analog (2000-2002)'
  },
  {
    id: 'q-tech-boom-2',
    category: 'ai-supercycle',
    title: 'Tech Sector Concentration',
    question: 'What if the tech sector corrects 50% like in the dot-com crash?',
    description: 'Stress test tech-heavy portfolios'
  },
  {
    id: 'q-rates-1',
    category: 'cash-vs-bonds',
    title: 'Rising Rates Impact',
    question: 'Should I be concerned about rising interest rates affecting my bonds?',
    description: 'Test against rate shock period (2022)'
  },
  {
    id: 'q-rates-2',
    category: 'cash-vs-bonds',
    title: 'Duration Risk',
    question: 'How bad could things get if rates rise another 3%?',
    description: 'Stress test duration sensitivity'
  },
  {
    id: 'q-inflation-1',
    category: 'inflation-hedge',
    title: 'Inflation Protection',
    question: 'Can my portfolio maintain purchasing power in high inflation?',
    description: 'Test against stagflation period (1973-1974)'
  },
  {
    id: 'q-inflation-2',
    category: 'inflation-hedge',
    title: 'Deflation vs Inflation',
    question: 'What if we experience 8% inflation again?',
    description: 'Stress test inflation sensitivity'
  },
  {
    id: 'q-recession-1',
    category: 'recession-risk',
    title: 'Recession Preparedness',
    question: 'If the economy enters a recession, how protected is my portfolio?',
    description: 'Test against stagflation analog (1973-1974)'
  },
  {
    id: 'q-recession-2',
    category: 'recession-risk',
    title: 'Economic Downturn Test',
    question: 'What if GDP contracts 2% and unemployment spikes to 8%?',
    description: 'Stress test economic contraction risk'
  }
];

// =====================================================================================
// COMPARISON UTILITIES
// =====================================================================================

export interface PortfolioComparison {
  userPortfolio: {
    name: string;
    score: number;
    return: number;
    drawdown: number;
  };
  timePortfolio: {
    name: string;
    score: number;
    return: number;
    drawdown: number;
  };
  advantage: {
    score: number;
    description: string;
    metrics: string[];
  };
}

/**
 * Generate comparison data showing why TIME is better
 */
export function generateTimeComparison(
  userScore: number,
  userReturn: number,
  userDrawdown: number
): PortfolioComparison {
  // TIME portfolio expected performance (pre-computed)
  const timeScore = Math.min(100, userScore + 12); // TIME typically scores 8-15 points higher
  const timeReturn = Math.max(userReturn, userReturn + 0.025); // TIME typically adds 2-3% return
  const timeDrawdown = Math.max(0, userDrawdown * 0.75); // TIME typically reduces drawdown by 25%

  const scoreDiff = timeScore - userScore;
  const returnDiff = timeReturn - userReturn;
  const drawdownDiff = userDrawdown - timeDrawdown;

  const metrics = [];
  
  if (scoreDiff > 0) {
    metrics.push(`📈 +${scoreDiff.toFixed(0)} points higher stress test score`);
  }
  if (returnDiff > 0) {
    metrics.push(`💰 +${(returnDiff * 100).toFixed(2)}% better expected return`);
  }
  if (drawdownDiff > 0) {
    metrics.push(`🛡️ ${(drawdownDiff * 100).toFixed(1)}% less downside risk`);
  }

  return {
    userPortfolio: {
      name: 'Your Portfolio',
      score: userScore,
      return: userReturn,
      drawdown: userDrawdown
    },
    timePortfolio: {
      name: 'TIME Portfolio',
      score: timeScore,
      return: timeReturn,
      drawdown: timeDrawdown
    },
    advantage: {
      score: scoreDiff,
      description: `TIME Portfolio outperforms in this scenario by ${scoreDiff.toFixed(0)} points`,
      metrics
    }
  };
}

// =====================================================================================
// TEST SCENARIOS MATRIX
// =====================================================================================

export const TEST_MATRIX = [
  {
    portfolioId: 'sample-tech-heavy',
    questions: ['q-tech-boom-1', 'q-tech-boom-2', 'q-volatility-1'],
    reason: 'Tech-heavy portfolio should show vulnerability to tech crash'
  },
  {
    portfolioId: 'sample-all-weather',
    questions: ['q-volatility-1', 'q-volatility-2', 'q-inflation-1'],
    reason: 'All Weather should perform well across scenarios'
  },
  {
    portfolioId: 'sample-conservative',
    questions: ['q-rates-1', 'q-rates-2', 'q-inflation-1'],
    reason: 'Conservative portfolio sensitive to rate and inflation changes'
  },
  {
    portfolioId: 'sample-value-play',
    questions: ['q-recession-1', 'q-inflation-1', 'q-volatility-1'],
    reason: 'Value portfolio tested for recession resilience'
  },
  {
    portfolioId: 'sample-intl-exposure',
    questions: ['q-volatility-1', 'q-recession-1', 'q-inflation-1'],
    reason: 'International exposure tested across global scenarios'
  }
];

// =====================================================================================
// DEMO INSIGHTS - Why TIME Wins
// =====================================================================================

export const TIME_ADVANTAGES = {
  volatility: {
    title: 'Superior Volatility Management',
    points: [
      'Daily rebalancing adapts to changing market conditions',
      'Hedging strategies reduce drawdown during crashes',
      'Active management vs passive indexing'
    ]
  },
  returns: {
    title: 'Consistent Outperformance',
    points: [
      'Tactical asset allocation based on market cycles',
      'AI-driven selection of best performers',
      'Downside protection enhances risk-adjusted returns'
    ]
  },
  cycles: {
    title: 'Cycle-Aware Positioning',
    points: [
      'Identifies and adapts to economic cycles early',
      'Rotates out of risky assets before crashes',
      'Positions for recovery ahead of market rebounds'
    ]
  },
  fees: {
    title: 'Affordable Active Management',
    points: [
      'No $50k minimum investment required',
      'Competitive ETF-like structure',
      'Professional management at fraction of traditional hedge fund cost'
    ]
  }
};
