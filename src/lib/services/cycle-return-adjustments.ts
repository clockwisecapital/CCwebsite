/**
 * Cycle-Adjusted Return Calculation Service
 * 
 * Implements the unified probability-weighted expected return model:
 * ExpectedReturn = R_Baseline + Σ(P_Cycle(Phase) × ΔR_Cycle(Phase))
 * 
 * Where:
 * - R_Baseline = Long-term historical average return
 * - P_Cycle = Weight/probability of each cycle's influence
 * - ΔR_Cycle = Deviation from baseline for that phase
 */

import type { CycleData } from '@/types/cycleAnalysis';
import {
  BASELINE_RETURNS,
  BUSINESS_CYCLE_DEVIATIONS,
  ECONOMIC_CYCLE_DEVIATIONS,
  TECHNOLOGY_CYCLE_DEVIATIONS,
  COUNTRY_CYCLE_DEVIATIONS,
  MARKET_CYCLE_DEVIATIONS,
  CYCLE_WEIGHTS,
  VOLATILITY_ADJUSTMENTS,
  type AssetClass,
  type AssetClassReturns,
  type PhaseDeviation,
} from '@/lib/constants/cycle-return-adjustments';

// Re-export types for convenience
export type { AssetClass, AssetClassReturns };
export { BASELINE_RETURNS };

/**
 * Input structure for cycle data
 */
export interface CyclePhaseInput {
  business?: CycleData;
  economic?: CycleData;
  technology?: CycleData;
  country?: CycleData;
  market?: CycleData;
}

/**
 * Result of cycle-adjusted return calculation
 */
export interface CycleAdjustedReturns {
  // Adjusted returns for each asset class
  returns: AssetClassReturns;
  
  // Adjusted volatilities (multiplier on base)
  volatilityMultiplier: number;
  
  // Individual cycle contributions (for transparency)
  contributions: {
    business: PhaseDeviation;
    economic: PhaseDeviation;
    technology: PhaseDeviation;
    country: PhaseDeviation;
    market: PhaseDeviation;
  };
  
  // Phases used in calculation
  phases: {
    business?: string;
    economic?: string;
    technology?: string;
    country?: string;
    market?: string;
  };
}

/**
 * Find the best matching phase deviation for a given phase name
 * AI-generated phase names may vary, so we use fuzzy matching
 */
function findClosestPhaseDeviation(
  phase: string,
  deviations: Record<string, PhaseDeviation>
): { deviation: PhaseDeviation | null; matchedPhase: string | null } {
  if (!phase) {
    return { deviation: null, matchedPhase: null };
  }

  const normalizedPhase = phase.toLowerCase().trim();
  
  // First, try exact match (case-insensitive)
  for (const [key, value] of Object.entries(deviations)) {
    if (normalizedPhase === key.toLowerCase()) {
      return { deviation: value, matchedPhase: key };
    }
  }
  
  // Second, try contains match
  for (const [key, value] of Object.entries(deviations)) {
    if (normalizedPhase.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedPhase)) {
      return { deviation: value, matchedPhase: key };
    }
  }
  
  // Third, try word-based partial match
  const phaseWords = normalizedPhase.split(/[\s\-_]+/);
  for (const [key, value] of Object.entries(deviations)) {
    const keyWords = key.toLowerCase().split(/[\s\-_]+/);
    // Check if any significant word matches
    for (const word of phaseWords) {
      if (word.length > 3 && keyWords.some(kw => kw.includes(word) || word.includes(kw))) {
        return { deviation: value, matchedPhase: key };
      }
    }
  }
  
  // No match found - return no adjustment
  console.log(`⚠️ No phase match found for: "${phase}"`);
  return { deviation: null, matchedPhase: null };
}

/**
 * Get volatility adjustment factor for a phase
 */
function getVolatilityAdjustment(phase: string): number {
  if (!phase) return 1.0;
  
  const normalizedPhase = phase.toLowerCase().trim();
  
  // Try exact match first
  for (const [key, value] of Object.entries(VOLATILITY_ADJUSTMENTS)) {
    if (normalizedPhase === key.toLowerCase()) {
      return value;
    }
  }
  
  // Try contains match
  for (const [key, value] of Object.entries(VOLATILITY_ADJUSTMENTS)) {
    if (normalizedPhase.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return VOLATILITY_ADJUSTMENTS['default'];
}

/**
 * Calculate cycle-adjusted returns for each asset class
 * 
 * Main formula: ExpectedReturn = R_Baseline + Σ(Weight_Cycle × ΔR_Cycle(Phase))
 * 
 * @param cycles - Current cycle phases from AI analysis
 * @param weights - Optional custom weights for each cycle (defaults to CYCLE_WEIGHTS)
 * @returns Adjusted returns for each asset class plus metadata
 */
export function calculateCycleAdjustedReturns(
  cycles: CyclePhaseInput,
  weights: typeof CYCLE_WEIGHTS = CYCLE_WEIGHTS
): CycleAdjustedReturns {
  // Start with baseline returns
  const adjustedReturns = { ...BASELINE_RETURNS };
  
  // Track contributions from each cycle
  const contributions: CycleAdjustedReturns['contributions'] = {
    business: {},
    economic: {},
    technology: {},
    country: {},
    market: {},
  };
  
  // Track matched phases
  const phases: CycleAdjustedReturns['phases'] = {};
  
  // Track volatility adjustments (weighted average)
  let totalVolatilityAdjustment = 0;
  let totalWeight = 0;

  // Process Business Cycle
  if (cycles.business) {
    const { deviation, matchedPhase } = findClosestPhaseDeviation(
      cycles.business.phase,
      BUSINESS_CYCLE_DEVIATIONS
    );
    phases.business = matchedPhase || cycles.business.phase;
    
    if (deviation) {
      for (const asset of Object.keys(BASELINE_RETURNS) as AssetClass[]) {
        const delta = (deviation[asset] || 0) * weights.business;
        adjustedReturns[asset] += delta;
        contributions.business[asset] = delta;
      }
      
      totalVolatilityAdjustment += getVolatilityAdjustment(cycles.business.phase) * weights.business;
      totalWeight += weights.business;
    }
  }

  // Process Economic Cycle
  if (cycles.economic) {
    const { deviation, matchedPhase } = findClosestPhaseDeviation(
      cycles.economic.phase,
      ECONOMIC_CYCLE_DEVIATIONS
    );
    phases.economic = matchedPhase || cycles.economic.phase;
    
    if (deviation) {
      for (const asset of Object.keys(BASELINE_RETURNS) as AssetClass[]) {
        const delta = (deviation[asset] || 0) * weights.economic;
        adjustedReturns[asset] += delta;
        contributions.economic[asset] = delta;
      }
      
      totalVolatilityAdjustment += getVolatilityAdjustment(cycles.economic.phase) * weights.economic;
      totalWeight += weights.economic;
    }
  }

  // Process Technology Cycle
  if (cycles.technology) {
    const { deviation, matchedPhase } = findClosestPhaseDeviation(
      cycles.technology.phase,
      TECHNOLOGY_CYCLE_DEVIATIONS
    );
    phases.technology = matchedPhase || cycles.technology.phase;
    
    if (deviation) {
      for (const asset of Object.keys(BASELINE_RETURNS) as AssetClass[]) {
        const delta = (deviation[asset] || 0) * weights.technology;
        adjustedReturns[asset] += delta;
        contributions.technology[asset] = delta;
      }
      
      totalVolatilityAdjustment += getVolatilityAdjustment(cycles.technology.phase) * weights.technology;
      totalWeight += weights.technology;
    }
  }

  // Process Country Cycle
  if (cycles.country) {
    const { deviation, matchedPhase } = findClosestPhaseDeviation(
      cycles.country.phase,
      COUNTRY_CYCLE_DEVIATIONS
    );
    phases.country = matchedPhase || cycles.country.phase;
    
    if (deviation) {
      for (const asset of Object.keys(BASELINE_RETURNS) as AssetClass[]) {
        const delta = (deviation[asset] || 0) * weights.country;
        adjustedReturns[asset] += delta;
        contributions.country[asset] = delta;
      }
      
      totalVolatilityAdjustment += getVolatilityAdjustment(cycles.country.phase) * weights.country;
      totalWeight += weights.country;
    }
  }

  // Process Market Cycle (S&P 500)
  if (cycles.market) {
    const { deviation, matchedPhase } = findClosestPhaseDeviation(
      cycles.market.phase,
      MARKET_CYCLE_DEVIATIONS
    );
    phases.market = matchedPhase || cycles.market.phase;
    
    if (deviation) {
      for (const asset of Object.keys(BASELINE_RETURNS) as AssetClass[]) {
        const delta = (deviation[asset] || 0) * weights.market;
        adjustedReturns[asset] += delta;
        contributions.market[asset] = delta;
      }
      
      totalVolatilityAdjustment += getVolatilityAdjustment(cycles.market.phase) * weights.market;
      totalWeight += weights.market;
    }
  }

  // Calculate final volatility multiplier (normalize by total weight used)
  const volatilityMultiplier = totalWeight > 0 
    ? totalVolatilityAdjustment / totalWeight 
    : 1.0;

  // Log the calculation for debugging
  console.log('📊 Cycle-Adjusted Returns Calculated:', {
    phases,
    baseline: BASELINE_RETURNS,
    adjusted: adjustedReturns,
    volatilityMultiplier,
    contributions,
  });

  return {
    returns: adjustedReturns,
    volatilityMultiplier,
    contributions,
    phases,
  };
}

/**
 * Calculate expected portfolio return using cycle-adjusted asset class returns
 * 
 * @param portfolio - Portfolio allocation (percentages)
 * @param cycleAdjustedReturns - Adjusted returns from calculateCycleAdjustedReturns
 * @returns Weighted average expected return
 */
export function calculatePortfolioExpectedReturn(
  portfolio: {
    stocks: number;
    bonds: number;
    realEstate: number;
    commodities: number;
    cash: number;
    alternatives?: number;
  },
  cycleAdjustedReturns: AssetClassReturns
): number {
  const totalAllocation = 
    portfolio.stocks + 
    portfolio.bonds + 
    portfolio.cash + 
    portfolio.realEstate + 
    portfolio.commodities + 
    (portfolio.alternatives || 0);

  if (totalAllocation === 0) {
    return 0;
  }

  // Normalize to handle cases where allocation doesn't sum to 100
  const normalize = (value: number) => (value / totalAllocation);

  const weightedReturn = 
    normalize(portfolio.stocks) * cycleAdjustedReturns.stocks +
    normalize(portfolio.bonds) * cycleAdjustedReturns.bonds +
    normalize(portfolio.cash) * cycleAdjustedReturns.cash +
    normalize(portfolio.realEstate) * cycleAdjustedReturns.realEstate +
    normalize(portfolio.commodities) * cycleAdjustedReturns.commodities +
    normalize(portfolio.alternatives || 0) * cycleAdjustedReturns.alternatives;

  return weightedReturn;
}

/**
 * Format cycle-adjusted returns for display
 */
export function formatCycleAdjustedReturns(returns: AssetClassReturns): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  for (const [asset, value] of Object.entries(returns)) {
    const sign = value >= 0 ? '+' : '';
    formatted[asset] = `${sign}${(value * 100).toFixed(1)}%`;
  }
  
  return formatted;
}

/**
 * Get summary of cycle adjustments for display
 */
export function getCycleAdjustmentSummary(
  adjustment: CycleAdjustedReturns
): {
  direction: 'bullish' | 'bearish' | 'neutral';
  magnitude: 'strong' | 'moderate' | 'mild';
  summary: string;
} {
  // Calculate net change in stocks (primary indicator)
  const stocksDelta = adjustment.returns.stocks - BASELINE_RETURNS.stocks;
  
  // Determine direction
  let direction: 'bullish' | 'bearish' | 'neutral';
  if (stocksDelta > 0.005) direction = 'bullish';
  else if (stocksDelta < -0.005) direction = 'bearish';
  else direction = 'neutral';
  
  // Determine magnitude
  let magnitude: 'strong' | 'moderate' | 'mild';
  const absDelta = Math.abs(stocksDelta);
  if (absDelta > 0.02) magnitude = 'strong';
  else if (absDelta > 0.01) magnitude = 'moderate';
  else magnitude = 'mild';
  
  // Build summary
  const activePhases = Object.entries(adjustment.phases)
    .filter(([, phase]) => phase)
    .map(([cycle, phase]) => `${cycle}: ${phase}`)
    .join(', ');
  
  const returnChange = stocksDelta >= 0 ? `+${(stocksDelta * 100).toFixed(1)}%` : `${(stocksDelta * 100).toFixed(1)}%`;
  
  const summary = direction === 'neutral'
    ? `Cycles suggest baseline returns. Active phases: ${activePhases}`
    : `${magnitude.charAt(0).toUpperCase() + magnitude.slice(1)} ${direction} signal (stocks ${returnChange} from baseline). Active phases: ${activePhases}`;
  
  return { direction, magnitude, summary };
}

