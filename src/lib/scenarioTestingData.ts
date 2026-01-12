/**
 * Mock Data for Scenario Testing
 * 
 * Sample questions and portfolios for UI demonstration
 */

import type { ScenarioQuestion, ScenarioPortfolio } from '@/types/scenarioTesting';

export const SCENARIO_QUESTIONS: ScenarioQuestion[] = [
  {
    id: 'late-cycle',
    title: 'Late Cycle',
    subtitle: '2006-2008 • Pre-GFC Late Cycle',
    question: 'Prepared for a late stage economic cycle?',
    icon: 'FiClock',
    stats: {
      percentageBadge: '↑ 15%',
      timePeriod: '24w',
      investorCount: 5102,
    },
    winningPortfolio: {
      name: 'Fortress Defense',
      score: 89,
    },
  },
  {
    id: 'ai-supercycle',
    title: 'AI Supercycle',
    subtitle: '2020-2024 • Technology Boom',
    question: 'Is AI a productivity supercycle or bubble?',
    icon: 'FiZap',
    stats: {
      percentageBadge: '↑ 18%',
      timePeriod: '16w',
      investorCount: 6210,
    },
    winningPortfolio: {
      name: 'Anti-Mag7',
      score: 72,
    },
  },
  {
    id: 'recession-stagflation',
    title: 'Recession / Stagflation',
    subtitle: '2022-2023 • Inflation Era',
    question: 'Are we headed for a recession or stagflation?',
    icon: 'FiTrendingDown',
    stats: {
      percentageBadge: '↑ 12%',
      timePeriod: '14w',
      investorCount: 3204,
    },
    winningPortfolio: {
      name: 'Fortress Defense',
      score: 94,
    },
  },
  {
    id: 'inflation-hedge',
    title: 'Inflation Hedge',
    subtitle: '1970s-1980s • Stagflation Period',
    question: 'Will inflation come back—and how do I hedge?',
    icon: 'FiTrendingUp',
    stats: {
      percentageBadge: '↑ 9%',
      timePeriod: '11w',
      investorCount: 2044,
    },
    winningPortfolio: {
      name: 'Real Asset Shield',
      score: 93,
    },
  },
  {
    id: 'cash-vs-bonds',
    title: 'Cash vs Bonds',
    subtitle: '2023-2024 • Rate Normalization',
    question: 'Should I stay in cash or extend duration?',
    icon: 'FiDollarSign',
    stats: {
      percentageBadge: '↑ 6%',
      timePeriod: '10w',
      investorCount: 1732,
    },
    winningPortfolio: {
      name: 'Rate Play',
      score: 92,
    },
  },
];

export const SCENARIO_PORTFOLIOS: Record<string, ScenarioPortfolio[]> = {
  'late-cycle': [
    {
      id: 'fortress-defense',
      name: 'Fortress Defense',
      subtitle: 'Top Defender • 12w streak',
      icon: 'FiShield',
      metrics: {
        votes: 1124,
        expectedReturn: 5.2,
        timePeriod: '12-mo est.',
        score: 89,
      },
    },
    {
      id: 'sleep-well-tonight',
      name: 'Sleep Well Tonight',
      subtitle: 'Steady Hand • 15w streak',
      icon: 'FiMoon',
      metrics: {
        votes: 1042,
        expectedReturn: 5.6,
        timePeriod: '12-mo est.',
        score: 86,
      },
    },
    {
      id: 'rate-play',
      name: 'Rate Play',
      subtitle: 'Bond King • 6w streak',
      icon: 'FiBarChart2',
      metrics: {
        votes: 521,
        expectedReturn: 4.4,
        timePeriod: '12-mo est.',
        score: 84,
      },
    },
    {
      id: 'all-weather',
      name: 'All Weather Portfolio',
      subtitle: 'All Seasons • 22w streak',
      icon: 'FiCloud',
      metrics: {
        votes: 2847,
        expectedReturn: 6.1,
        timePeriod: '12-mo est.',
        score: 78,
      },
    },
    {
      id: 'anti-mag7',
      name: 'Anti-Mag7',
      subtitle: 'Contrarian • 5w streak',
      icon: 'FiTarget',
      metrics: {
        votes: 654,
        expectedReturn: 6.8,
        timePeriod: '12-mo est.',
        score: 78,
      },
    },
  ],
  'ai-supercycle': [
    {
      id: 'anti-mag7-ai',
      name: 'Anti-Mag7',
      subtitle: 'Contrarian • 16w streak',
      icon: 'FiTarget',
      metrics: {
        votes: 892,
        expectedReturn: 12.4,
        timePeriod: '12-mo est.',
        score: 72,
      },
    },
    {
      id: 'tech-titans',
      name: 'Tech Titans',
      subtitle: 'Growth Leader • 8w streak',
      icon: 'FiCpu',
      metrics: {
        votes: 1456,
        expectedReturn: 18.2,
        timePeriod: '12-mo est.',
        score: 68,
      },
    },
    {
      id: 'ai-infrastructure',
      name: 'AI Infrastructure',
      subtitle: 'Picks & Shovels • 12w streak',
      icon: 'FiServer',
      metrics: {
        votes: 723,
        expectedReturn: 15.6,
        timePeriod: '12-mo est.',
        score: 65,
      },
    },
    {
      id: 'balanced-tech',
      name: 'Balanced Tech',
      subtitle: 'Diversified • 5w streak',
      icon: 'FiLayers',
      metrics: {
        votes: 534,
        expectedReturn: 10.8,
        timePeriod: '12-mo est.',
        score: 62,
      },
    },
    {
      id: 'mega-cap-blend',
      name: 'Mega-Cap Blend',
      subtitle: 'Quality Focus • 9w streak',
      icon: 'FiPieChart',
      metrics: {
        votes: 1123,
        expectedReturn: 14.2,
        timePeriod: '12-mo est.',
        score: 60,
      },
    },
  ],
  'recession-stagflation': [
    {
      id: 'fortress-defense-recession',
      name: 'Fortress Defense',
      subtitle: 'Top Defender • 14w streak',
      icon: 'FiShield',
      metrics: {
        votes: 1567,
        expectedReturn: 4.8,
        timePeriod: '12-mo est.',
        score: 94,
      },
    },
    {
      id: 'real-asset-shield',
      name: 'Real Asset Shield',
      subtitle: 'Inflation Fighter • 11w streak',
      icon: 'FiHome',
      metrics: {
        votes: 982,
        expectedReturn: 6.2,
        timePeriod: '12-mo est.',
        score: 91,
      },
    },
    {
      id: 'commodity-king',
      name: 'Commodity King',
      subtitle: 'Hard Assets • 8w streak',
      icon: 'FiTrendingUp',
      metrics: {
        votes: 645,
        expectedReturn: 7.4,
        timePeriod: '12-mo est.',
        score: 87,
      },
    },
    {
      id: 'dividend-aristocrats',
      name: 'Dividend Aristocrats',
      subtitle: 'Income Focus • 19w streak',
      icon: 'FiDollarSign',
      metrics: {
        votes: 1234,
        expectedReturn: 5.6,
        timePeriod: '12-mo est.',
        score: 83,
      },
    },
    {
      id: 'volatility-shield',
      name: 'Volatility Shield',
      subtitle: 'Low Beta • 6w streak',
      icon: 'FiUmbrella',
      metrics: {
        votes: 456,
        expectedReturn: 3.9,
        timePeriod: '12-mo est.',
        score: 80,
      },
    },
  ],
  'inflation-hedge': [
    {
      id: 'real-asset-shield-inflation',
      name: 'Real Asset Shield',
      subtitle: 'Inflation Fighter • 11w streak',
      icon: 'FiHome',
      metrics: {
        votes: 1289,
        expectedReturn: 8.4,
        timePeriod: '12-mo est.',
        score: 93,
      },
    },
    {
      id: 'tips-treasury',
      name: 'TIPS Treasury',
      subtitle: 'Inflation Protected • 9w streak',
      icon: 'FiLock',
      metrics: {
        votes: 876,
        expectedReturn: 6.8,
        timePeriod: '12-mo est.',
        score: 90,
      },
    },
    {
      id: 'gold-commodities',
      name: 'Gold & Commodities',
      subtitle: 'Hard Money • 7w streak',
      icon: 'FiCircle',
      metrics: {
        votes: 654,
        expectedReturn: 9.2,
        timePeriod: '12-mo est.',
        score: 88,
      },
    },
    {
      id: 'energy-infrastructure',
      name: 'Energy Infrastructure',
      subtitle: 'Real Assets • 5w streak',
      icon: 'FiZap',
      metrics: {
        votes: 432,
        expectedReturn: 10.6,
        timePeriod: '12-mo est.',
        score: 85,
      },
    },
    {
      id: 'floating-rate',
      name: 'Floating Rate',
      subtitle: 'Rate Adaptive • 4w streak',
      icon: 'FiActivity',
      metrics: {
        votes: 298,
        expectedReturn: 7.1,
        timePeriod: '12-mo est.',
        score: 82,
      },
    },
  ],
  'cash-vs-bonds': [
    {
      id: 'rate-play-bonds',
      name: 'Rate Play',
      subtitle: 'Bond King • 6w streak',
      icon: 'FiBarChart2',
      metrics: {
        votes: 953,
        expectedReturn: 4.4,
        timePeriod: '12-mo est.',
        score: 92,
      },
    },
    {
      id: 'duration-ladder',
      name: 'Duration Ladder',
      subtitle: 'Yield Curve • 8w streak',
      icon: 'FiTrendingUp',
      metrics: {
        votes: 742,
        expectedReturn: 5.2,
        timePeriod: '12-mo est.',
        score: 89,
      },
    },
    {
      id: 'short-duration',
      name: 'Short Duration',
      subtitle: 'Low Risk • 10w streak',
      icon: 'FiMinimize2',
      metrics: {
        votes: 623,
        expectedReturn: 3.8,
        timePeriod: '12-mo est.',
        score: 86,
      },
    },
    {
      id: 'corporate-bond',
      name: 'Corporate Bond Mix',
      subtitle: 'Credit Focus • 4w streak',
      icon: 'FiBriefcase',
      metrics: {
        votes: 534,
        expectedReturn: 5.8,
        timePeriod: '12-mo est.',
        score: 84,
      },
    },
    {
      id: 'money-market-plus',
      name: 'Money Market Plus',
      subtitle: 'Cash Enhanced • 7w streak',
      icon: 'FiDollarSign',
      metrics: {
        votes: 412,
        expectedReturn: 4.5,
        timePeriod: '12-mo est.',
        score: 81,
      },
    },
  ],
};

export function getQuestionById(id: string): ScenarioQuestion | undefined {
  return SCENARIO_QUESTIONS.find((q) => q.id === id);
}

export function getPortfoliosByQuestionId(questionId: string): ScenarioPortfolio[] {
  return SCENARIO_PORTFOLIOS[questionId] || [];
}

export function getPortfolioById(questionId: string, portfolioId: string): ScenarioPortfolio | undefined {
  const portfolios = getPortfoliosByQuestionId(questionId);
  return portfolios.find((p) => p.id === portfolioId);
}


