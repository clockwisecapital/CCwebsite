/**
 * Kronos Portfolio Scoring Engine - Constants
 * 
 * Scenario mappings, historical analog definitions, and score labels
 */

import type { ScenarioId, ScenarioKeywords, HistoricalAnalog, ScoreLabel } from './types';

// =====================================================================================
// SCENARIO MAPPINGS
// =====================================================================================

/**
 * Maps question keywords to scenario IDs
 * Used for classification of user questions
 */
export const QUESTION_TO_SCENARIO: Record<string, ScenarioKeywords> = {
  'market-volatility': {
    keywords: ['volatility', 'crash', 'correction', 'market drop', 'downturn', 'panic', 'sell-off'],
    primaryRisk: 'Equity Drawdown'
  },
  'ai-supercycle': {
    keywords: ['AI', 'artificial intelligence', 'bubble', 'supercycle', 'tech boom', 'innovation'],
    primaryRisk: 'Sector Concentration'
  },
  'cash-vs-bonds': {
    keywords: ['cash', 'duration', 'bonds', 'treasuries', 'yield', 'fixed income', 'rates'],
    primaryRisk: 'Interest Rate'
  },
  'tech-concentration': {
    keywords: ['concentrated', 'tech heavy', 'Mag 7', 'big tech', 'FAANG', 'tech exposure'],
    primaryRisk: 'Momentum Reversal'
  },
  'inflation-hedge': {
    keywords: ['inflation', 'purchasing power', 'deflation', 'price increases', 'CPI'],
    primaryRisk: 'Purchasing Power'
  },
  'recession-risk': {
    keywords: ['recession', 'stagflation', 'economic downturn', 'slowdown', 'contraction'],
    primaryRisk: 'Economic Contraction'
  }
};

// =====================================================================================
// HISTORICAL ANALOGS
// =====================================================================================

/**
 * Historical analog definitions with date ranges
 * Each scenario maps to a worst-case historical period
 */
export const HISTORICAL_ANALOGS: Record<string, HistoricalAnalog> = {
  'COVID_CRASH': {
    id: 'COVID_CRASH',
    name: 'COVID Crash',
    dateRange: {
      start: '2020-02-01',
      end: '2020-03-31'
    },
    description: 'Feb-Mar 2020: COVID-19 pandemic market crash'
  },
  'DOT_COM_BUST': {
    id: 'DOT_COM_BUST',
    name: 'Dot-Com Bust',
    dateRange: {
      start: '2000-03-01',
      end: '2002-10-01'
    },
    description: '2000-2002: Technology bubble burst'
  },
  'RATE_SHOCK': {
    id: 'RATE_SHOCK',
    name: 'Rate Shock',
    dateRange: {
      start: '2022-01-01',
      end: '2022-12-31'
    },
    description: '2022: Rapid interest rate hikes'
  },
  'STAGFLATION': {
    id: 'STAGFLATION',
    name: 'Stagflation',
    dateRange: {
      start: '1973-01-01',
      end: '1974-12-31'
    },
    description: '1973-1974: Oil crisis and stagflation'
  }
};

/**
 * Maps scenario IDs to their historical analogs
 */
export const SCENARIO_TO_ANALOG: Record<ScenarioId, string> = {
  'market-volatility': 'COVID_CRASH',
  'ai-supercycle': 'DOT_COM_BUST',
  'cash-vs-bonds': 'RATE_SHOCK',
  'tech-concentration': 'DOT_COM_BUST',
  'inflation-hedge': 'STAGFLATION',
  'recession-risk': 'STAGFLATION'
};

// =====================================================================================
// S&P 500 BENCHMARKS
// =====================================================================================

/**
 * S&P 500 benchmark returns and drawdowns for each historical analog
 * These will be calculated dynamically from Yahoo Finance, but here are reference values
 * Note: Will be fetched in real-time, these are for validation
 */
export const SP500_BENCHMARKS_REFERENCE = {
  'COVID_CRASH': {
    return: -0.339,    // -33.9%
    drawdown: 0.339    // 33.9% max drawdown
  },
  'DOT_COM_BUST': {
    return: -0.491,    // -49.1%
    drawdown: 0.491    // 49.1% max drawdown
  },
  'RATE_SHOCK': {
    return: -0.181,    // -18.1%
    drawdown: 0.254    // 25.4% max drawdown
  },
  'STAGFLATION': {
    return: -0.482,    // -48.2%
    drawdown: 0.482    // 48.2% max drawdown
  }
};

// =====================================================================================
// SCORE LABELS
// =====================================================================================

/**
 * Score ranges and their labels with colors
 */
export const SCORE_LABELS: ScoreLabel[] = [
  {
    label: 'Excellent',
    color: '#10b981',  // Green
    minScore: 90,
    maxScore: 100
  },
  {
    label: 'Strong',
    color: '#2dd4bf',  // Teal
    minScore: 75,
    maxScore: 89
  },
  {
    label: 'Moderate',
    color: '#f59e0b',  // Orange
    minScore: 60,
    maxScore: 74
  },
  {
    label: 'Weak',
    color: '#f87171',  // Red
    minScore: 0,
    maxScore: 59
  }
];

// =====================================================================================
// DEFAULT VALUES
// =====================================================================================

export const DEFAULT_SCENARIO: ScenarioId = 'market-volatility';
export const DEFAULT_ANALOG = 'COVID_CRASH';

// =====================================================================================
// HELPER FUNCTIONS
// =====================================================================================

/**
 * Get score label based on score value
 */
export function getScoreLabelForValue(score: number): ScoreLabel {
  for (const label of SCORE_LABELS) {
    if (score >= label.minScore && score <= label.maxScore) {
      return label;
    }
  }
  // Default to Weak if no match found
  return SCORE_LABELS[SCORE_LABELS.length - 1];
}

/**
 * Get historical analog by ID
 */
export function getHistoricalAnalogById(analogId: string): HistoricalAnalog | null {
  return HISTORICAL_ANALOGS[analogId] || null;
}

/**
 * Get scenario keywords
 */
export function getScenarioKeywords(scenarioId: ScenarioId): string[] {
  return QUESTION_TO_SCENARIO[scenarioId]?.keywords || [];
}
