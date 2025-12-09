'use client';

import type { CycleAdjustmentData } from '@/types/cycleAnalysis';

interface PortfolioAllocation {
  stocks: number;
  bonds: number;
  realEstate: number;
  commodities: number;
  cash: number;
  alternatives?: number;
}

interface CycleInsightsBadgeProps {
  cycleAdjustments?: CycleAdjustmentData | null;
  loading?: boolean;
  variant?: 'compact' | 'expanded';
  portfolioAllocation?: PortfolioAllocation | null;
  timeHorizon?: number;
}

// Baseline returns (same as in goal-probability.ts)
const BASELINE_RETURNS = {
  stocks: 0.07,
  bonds: 0.02,
  realEstate: 0.05,
  commodities: 0.01,
  cash: 0.00,
  alternatives: 0.05,
};

/**
 * Calculate weighted portfolio return from allocation and returns
 */
function calculateWeightedReturn(
  allocation: PortfolioAllocation,
  returns: typeof BASELINE_RETURNS
): number {
  const total = allocation.stocks + allocation.bonds + allocation.realEstate + 
                allocation.commodities + allocation.cash + (allocation.alternatives || 0);
  
  if (total === 0) return 0;
  
  const normalize = (val: number) => val / total;
  
  return (
    normalize(allocation.stocks) * returns.stocks +
    normalize(allocation.bonds) * returns.bonds +
    normalize(allocation.realEstate) * returns.realEstate +
    normalize(allocation.commodities) * returns.commodities +
    normalize(allocation.cash) * returns.cash +
    normalize(allocation.alternatives || 0) * returns.alternatives
  );
}

/**
 * Small badge component showing cycle-adjusted return insights
 * Shows a loading state while cycle analysis is running
 */
export default function CycleInsightsBadge({ 
  cycleAdjustments, 
  loading = false,
  variant = 'compact',
  portfolioAllocation,
  timeHorizon = 5
}: CycleInsightsBadgeProps) {
  // Loading state
  if (loading) {
    if (variant === 'expanded') {
      return (
        <div className="p-4 bg-gray-700/30 rounded-xl border border-gray-600 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            <div>
              <div className="text-sm font-semibold text-gray-400">Analyzing Market Cycles...</div>
              <div className="text-xs text-gray-500">Calculating your cycle-adjusted returns</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="h-3 bg-gray-600 rounded w-32 mb-3" />
              <div className="h-10 bg-gray-600 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-40" />
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="h-3 bg-gray-600 rounded w-40 mb-3" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-8 bg-gray-600 rounded" />
                <div className="h-8 bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg border border-gray-600 animate-pulse">
        <div className="w-3 h-3 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
        <span className="text-xs text-gray-400">Analyzing cycles...</span>
      </div>
    );
  }

  // No data available
  if (!cycleAdjustments) {
    return null;
  }

  const { summary, returns, volatilityMultiplier, phases } = cycleAdjustments;
  
  // Calculate the stock return delta from baseline (7%)
  const stocksDelta = returns.stocks - 0.07;
  const deltaDisplay = stocksDelta >= 0 
    ? `+${(stocksDelta * 100).toFixed(1)}%` 
    : `${(stocksDelta * 100).toFixed(1)}%`;
  
  // Direction indicator colors
  const directionColors = {
    bullish: {
      bg: 'bg-emerald-900/30',
      border: 'border-emerald-700/50',
      text: 'text-emerald-400',
      icon: '📈',
      label: 'Bullish'
    },
    bearish: {
      bg: 'bg-rose-900/30',
      border: 'border-rose-700/50',
      text: 'text-rose-400',
      icon: '📉',
      label: 'Bearish'
    },
    neutral: {
      bg: 'bg-gray-700/50',
      border: 'border-gray-600',
      text: 'text-gray-400',
      icon: '➡️',
      label: 'Neutral'
    }
  };

  const colors = directionColors[summary.direction];
  
  // Get active phases for tooltip
  const activePhases = Object.entries(phases)
    .filter(([, phase]) => phase)
    .map(([cycle, phase]) => `${cycle.charAt(0).toUpperCase() + cycle.slice(1)}: ${phase}`)
    .slice(0, 3); // Show max 3 phases

  if (variant === 'compact') {
    return (
      <div className="group relative inline-flex items-center gap-2">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${colors.bg} rounded-full border ${colors.border}`}>
          <span className="text-xs">{colors.icon}</span>
          <span className={`text-xs font-medium ${colors.text}`}>
            {summary.magnitude === 'strong' ? 'Strong ' : summary.magnitude === 'moderate' ? '' : 'Mild '}
            {colors.label}
          </span>
          <span className="text-xs text-gray-400">
            ({deltaDisplay} stocks)
          </span>
        </div>
        
        {/* Hover tooltip */}
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800 rounded-lg border border-gray-600 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="text-xs font-semibold text-white mb-2">Cycle-Adjusted Returns</div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div>
              <span className="text-gray-400">Stocks:</span>
              <span className={`ml-1 ${colors.text}`}>{(returns.stocks * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Bonds:</span>
              <span className="ml-1 text-gray-300">{(returns.bonds * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Vol:</span>
              <span className="ml-1 text-gray-300">{volatilityMultiplier.toFixed(2)}x</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
            {activePhases.join(' • ')}
          </div>
        </div>
      </div>
    );
  }

  // Calculate user's portfolio-specific returns if allocation provided
  const userBaselineReturn = portfolioAllocation 
    ? calculateWeightedReturn(portfolioAllocation, BASELINE_RETURNS)
    : null;
  const userCycleAdjustedReturn = portfolioAllocation 
    ? calculateWeightedReturn(portfolioAllocation, returns)
    : null;
  const userReturnDelta = userBaselineReturn !== null && userCycleAdjustedReturn !== null
    ? userCycleAdjustedReturn - userBaselineReturn
    : null;

  // Calculate projected growth over time horizon
  const baselineGrowth = userBaselineReturn !== null 
    ? Math.pow(1 + userBaselineReturn, timeHorizon) - 1 
    : null;
  const cycleAdjustedGrowth = userCycleAdjustedReturn !== null 
    ? Math.pow(1 + userCycleAdjustedReturn, timeHorizon) - 1 
    : null;

  // Expanded variant - focused on user's portfolio returns
  return (
    <div className={`p-4 ${colors.bg} rounded-xl border ${colors.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{colors.icon}</span>
          <div>
            <span className={`text-sm font-semibold ${colors.text}`}>
              Cycle-Adjusted Returns
            </span>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
              {summary.magnitude === 'strong' ? 'Strong ' : summary.magnitude === 'moderate' ? '' : 'Mild '}
              {colors.label}
            </span>
          </div>
        </div>
        {volatilityMultiplier > 1.05 && (
          <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded-lg border border-amber-700/30">
            ⚡ {volatilityMultiplier.toFixed(2)}x Volatility
          </span>
        )}
      </div>

      {/* User's Portfolio Returns - Main Content */}
      {userCycleAdjustedReturn !== null && userBaselineReturn !== null ? (
        <div className="space-y-4">
          {/* Annual Return */}
          <div className="bg-gray-800/70 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">Expected Annual Return</div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                userReturnDelta! >= 0 
                  ? 'bg-emerald-900/30 text-emerald-400' 
                  : 'bg-rose-900/30 text-rose-400'
              }`}>
                {userReturnDelta! >= 0 ? '+' : ''}{(userReturnDelta! * 100).toFixed(2)}% from baseline
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <div className={`text-4xl font-bold ${colors.text}`}>
                {(userCycleAdjustedReturn * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">
                <span className="line-through">{(userBaselineReturn * 100).toFixed(1)}%</span>
                <span className="ml-1 text-gray-600">baseline</span>
              </div>
            </div>
          </div>
          
          {/* Projected Growth Over Timeline */}
          {baselineGrowth !== null && cycleAdjustedGrowth !== null && (
            <div className="bg-gray-800/70 rounded-lg p-4 border border-gray-700/50">
              <div className="text-sm text-gray-400 mb-3">
                Projected Growth Over {timeHorizon} {timeHorizon === 1 ? 'Year' : 'Years'}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Cycle-Adjusted</div>
                  <div className={`text-2xl font-bold ${colors.text}`}>
                    +{(cycleAdjustedGrowth * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Historical Baseline</div>
                  <div className="text-2xl font-bold text-gray-500">
                    +{(baselineGrowth * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Difference over {timeHorizon} years</span>
                  <span className={userReturnDelta! >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {cycleAdjustedGrowth >= baselineGrowth ? '+' : ''}{((cycleAdjustedGrowth - baselineGrowth) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Context */}
          <p className="text-xs text-gray-400">
            Based on current market cycles ({activePhases.slice(0, 2).join(', ')}), your long-term return projections have been adjusted from historical averages.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          Cycle adjustments will be applied to your portfolio once allocation data is available.
        </p>
      )}
    </div>
  );
}

