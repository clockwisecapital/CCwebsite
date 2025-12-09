/**
 * Cycle-Adjusted Return Constants
 * 
 * Based on the cycle_adjusted_returns.md specification:
 * - Five major cycles influence expected returns
 * - Each cycle phase has probability-weighted impacts on asset classes
 * - Formula: ExpectedReturn = R_Baseline + Σ(P_Cycle(Phase) × ΔR_Cycle(Phase))
 */

// =====================================================
// BASELINE RETURNS (Long-Term Historical Averages)
// These are REAL (inflation-adjusted) returns
// =====================================================
export const BASELINE_RETURNS: AssetClassReturns = {
  stocks: 0.07,       // 7% real (vs 10% nominal in spec)
  bonds: 0.02,        // 2% real (vs 5% nominal in spec)
  realEstate: 0.05,   // 5% real (vs 10% nominal in spec)
  commodities: 0.01,  // 1% real (vs 5% nominal in spec)
  cash: 0.00,         // 0% real (vs 3% nominal in spec)
  alternatives: 0.05, // 5% real
};

// Type for asset class returns (allows any number value)
export interface AssetClassReturns {
  stocks: number;
  bonds: number;
  realEstate: number;
  commodities: number;
  cash: number;
  alternatives: number;
}

export type AssetClass = keyof AssetClassReturns;

// Type for phase deviations (partial asset class returns)
export type PhaseDeviation = Partial<AssetClassReturns>;

// =====================================================
// BUSINESS CYCLE PHASE DEVIATIONS (ΔR from baseline)
// Short-term debt cycle (5-10 years)
// Frameworks: Ray Dalio, Burns & Mitchell, Schumpeter, Minsky
// =====================================================
export const BUSINESS_CYCLE_DEVIATIONS: Record<string, PhaseDeviation> = {
  // Expansion: Credit growth, rising employment, business investment
  'Expansion': {
    stocks: +0.03,        // Strong corporate earnings
    bonds: -0.01,         // Rising rates hurt bonds
    realEstate: +0.02,    // Property values rise
    commodities: +0.02,   // Demand-driven price increases
    cash: 0.00,
    alternatives: +0.02,
  },
  // Peak: Maximum economic output, inflation pressures
  'Peak': {
    stocks: +0.01,        // Slowing growth
    bonds: -0.01,         // Rate hikes
    realEstate: +0.01,    // Still positive but slowing
    commodities: +0.03,   // Inflation hedge peaks
    cash: +0.01,          // Higher short-term rates
    alternatives: +0.01,
  },
  // Slowdown/Contraction: Declining growth, credit tightening
  'Slowdown': {
    stocks: -0.02,
    bonds: +0.01,         // Flight to safety begins
    realEstate: -0.01,
    commodities: -0.01,
    cash: 0.00,
    alternatives: -0.01,
  },
  'Contraction': {
    stocks: -0.03,
    bonds: +0.02,
    realEstate: -0.02,
    commodities: -0.02,
    cash: +0.01,
    alternatives: -0.02,
  },
  // Recession: Economic decline, deleveraging
  'Recession': {
    stocks: -0.05,        // Significant drawdowns
    bonds: +0.03,         // Strong flight to safety
    realEstate: -0.04,    // Property market declines
    commodities: -0.03,   // Demand collapse
    cash: +0.01,          // Preservation focus
    alternatives: -0.03,
  },
  // Recovery: Early expansion, credit healing
  'Recovery': {
    stocks: +0.05,        // Strong rebound potential
    bonds: 0.00,          // Rates stabilize
    realEstate: +0.02,    // Gradual recovery
    commodities: +0.02,   // Demand returning
    cash: 0.00,
    alternatives: +0.03,
  },
  // Trough: Bottom of cycle
  'Trough': {
    stocks: +0.04,
    bonds: +0.01,
    realEstate: +0.01,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.02,
  },
};

// =====================================================
// ECONOMIC CYCLE PHASE DEVIATIONS (Long-term debt cycle)
// 50-75 year super-cycles
// Frameworks: Dalio Big Debt Cycle, Kondratiev, Minsky
// =====================================================
export const ECONOMIC_CYCLE_DEVIATIONS: Record<string, PhaseDeviation> = {
  // Early Cycle: Low debt, credit expansion begins
  'Early Cycle': {
    stocks: +0.04,
    bonds: +0.01,
    realEstate: +0.03,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.03,
  },
  'Early': {
    stocks: +0.04,
    bonds: +0.01,
    realEstate: +0.03,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.03,
  },
  // Mid Cycle: Moderate debt, strong productivity growth
  'Mid Cycle': {
    stocks: +0.02,
    bonds: 0.00,
    realEstate: +0.02,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.02,
  },
  'Mid': {
    stocks: +0.02,
    bonds: 0.00,
    realEstate: +0.02,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.02,
  },
  // Late Cycle: High debt, financialization, asset bubbles
  'Late Cycle': {
    stocks: -0.01,
    bonds: -0.01,
    realEstate: -0.01,
    commodities: +0.02,   // Inflation hedge
    cash: 0.00,
    alternatives: 0.00,
  },
  'Late': {
    stocks: -0.01,
    bonds: -0.01,
    realEstate: -0.01,
    commodities: +0.02,
    cash: 0.00,
    alternatives: 0.00,
  },
  // Crisis/Deleveraging: Debt resolution, deflation risk
  'Crisis': {
    stocks: -0.05,
    bonds: +0.02,         // Safe haven (unless sovereign crisis)
    realEstate: -0.04,
    commodities: -0.02,
    cash: +0.02,          // Cash is king
    alternatives: -0.03,
  },
  'Deleveraging': {
    stocks: -0.04,
    bonds: +0.01,
    realEstate: -0.03,
    commodities: -0.01,
    cash: +0.01,
    alternatives: -0.02,
  },
};

// =====================================================
// TECHNOLOGY CYCLE PHASE DEVIATIONS
// 40-60 year technological revolutions
// Frameworks: Carlota Perez, Kondratiev Waves, Schumpeter
// =====================================================
export const TECHNOLOGY_CYCLE_DEVIATIONS: Record<string, PhaseDeviation> = {
  // Installation: Infrastructure building, early speculation
  'Installation': {
    stocks: +0.02,
    bonds: 0.00,
    realEstate: +0.01,    // Infrastructure-related
    commodities: +0.01,   // Input demand
    cash: 0.00,
    alternatives: +0.02,
  },
  // Frenzy: Bubble, peak hype, speculation
  'Frenzy': {
    stocks: +0.06,        // Bubble returns (unsustainable)
    bonds: -0.02,
    realEstate: +0.03,
    commodities: +0.02,
    cash: -0.01,
    alternatives: +0.04,
  },
  // Turning Point: Crash, revaluation
  'Turning Point': {
    stocks: -0.04,
    bonds: +0.02,
    realEstate: -0.02,
    commodities: -0.01,
    cash: +0.01,
    alternatives: -0.02,
  },
  'Crash': {
    stocks: -0.06,
    bonds: +0.03,
    realEstate: -0.03,
    commodities: -0.02,
    cash: +0.02,
    alternatives: -0.04,
  },
  // Synergy/Deployment: Real productivity gains, widespread adoption
  'Synergy': {
    stocks: +0.03,
    bonds: 0.00,
    realEstate: +0.02,
    commodities: 0.00,
    cash: 0.00,
    alternatives: +0.02,
  },
  'Deployment': {
    stocks: +0.03,
    bonds: 0.00,
    realEstate: +0.02,
    commodities: 0.00,
    cash: 0.00,
    alternatives: +0.02,
  },
  // Maturity: Diminishing returns, seeking new paradigm
  'Maturity': {
    stocks: -0.01,
    bonds: +0.01,
    realEstate: 0.00,
    commodities: 0.00,
    cash: 0.00,
    alternatives: 0.00,
  },
};

// =====================================================
// COUNTRY CYCLE PHASE DEVIATIONS
// 80-250 year empire/hegemony cycles
// Frameworks: Glubb, Turchin, Strauss & Howe, Dalio
// =====================================================
export const COUNTRY_CYCLE_DEVIATIONS: Record<string, PhaseDeviation> = {
  // Rise: Building institutions, productivity gains
  'Rise': {
    stocks: +0.04,
    bonds: +0.02,
    realEstate: +0.03,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.03,
  },
  // Expansion/Conquest: Global influence, reserve currency benefits
  'Expansion': {
    stocks: +0.03,
    bonds: +0.01,
    realEstate: +0.02,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.02,
  },
  'Conquest': {
    stocks: +0.03,
    bonds: +0.01,
    realEstate: +0.02,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.02,
  },
  // Affluence/Commerce: Wealth accumulation, inequality rises
  'Affluence': {
    stocks: +0.02,
    bonds: 0.00,
    realEstate: +0.01,
    commodities: 0.00,
    cash: 0.00,
    alternatives: +0.01,
  },
  'Commerce': {
    stocks: +0.02,
    bonds: 0.00,
    realEstate: +0.01,
    commodities: 0.00,
    cash: 0.00,
    alternatives: +0.01,
  },
  // Bureaucracy/Intellect: Institutional sclerosis
  'Bureaucracy': {
    stocks: -0.01,
    bonds: 0.00,
    realEstate: -0.01,
    commodities: 0.00,
    cash: 0.00,
    alternatives: 0.00,
  },
  'Intellect': {
    stocks: 0.00,
    bonds: 0.00,
    realEstate: 0.00,
    commodities: 0.00,
    cash: 0.00,
    alternatives: 0.00,
  },
  // Decadence: Wealth transfer, social division
  'Decadence': {
    stocks: -0.02,
    bonds: -0.01,
    realEstate: -0.02,
    commodities: +0.01,   // Hard assets
    cash: 0.00,
    alternatives: -0.01,
  },
  // Decline: Reserve currency loss, economic restructuring
  'Decline': {
    stocks: -0.04,
    bonds: -0.02,         // Sovereign risk
    realEstate: -0.03,
    commodities: +0.03,   // Hard assets outperform
    cash: +0.01,
    alternatives: -0.02,
  },
  // Crisis phases (Strauss & Howe)
  'Crisis': {
    stocks: -0.03,
    bonds: 0.00,
    realEstate: -0.02,
    commodities: +0.02,
    cash: +0.01,
    alternatives: -0.01,
  },
  'High': {
    stocks: +0.03,
    bonds: +0.01,
    realEstate: +0.02,
    commodities: 0.00,
    cash: 0.00,
    alternatives: +0.02,
  },
  'Awakening': {
    stocks: +0.01,
    bonds: 0.00,
    realEstate: +0.01,
    commodities: 0.00,
    cash: 0.00,
    alternatives: +0.01,
  },
  'Unraveling': {
    stocks: 0.00,
    bonds: 0.00,
    realEstate: 0.00,
    commodities: +0.01,
    cash: 0.00,
    alternatives: 0.00,
  },
};

// =====================================================
// MARKET CYCLE PHASE DEVIATIONS (S&P 500 specific)
// Shorter-term market phases
// =====================================================
export const MARKET_CYCLE_DEVIATIONS: Record<string, PhaseDeviation> = {
  'Bull Market': {
    stocks: +0.04,
    bonds: -0.01,
    realEstate: +0.02,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.02,
  },
  'Bear Market': {
    stocks: -0.05,
    bonds: +0.02,
    realEstate: -0.02,
    commodities: -0.01,
    cash: +0.01,
    alternatives: -0.02,
  },
  'Correction': {
    stocks: -0.02,
    bonds: +0.01,
    realEstate: -0.01,
    commodities: 0.00,
    cash: 0.00,
    alternatives: -0.01,
  },
  'Recovery': {
    stocks: +0.05,
    bonds: 0.00,
    realEstate: +0.02,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.03,
  },
  'Consolidation': {
    stocks: 0.00,
    bonds: 0.00,
    realEstate: 0.00,
    commodities: 0.00,
    cash: 0.00,
    alternatives: 0.00,
  },
  'Secular Bull': {
    stocks: +0.03,
    bonds: 0.00,
    realEstate: +0.02,
    commodities: +0.01,
    cash: 0.00,
    alternatives: +0.02,
  },
  'Secular Bear': {
    stocks: -0.03,
    bonds: +0.01,
    realEstate: -0.01,
    commodities: +0.01,
    cash: 0.00,
    alternatives: -0.01,
  },
};

// =====================================================
// CYCLE WEIGHTS (how much each cycle contributes)
// Total should equal 1.0
// =====================================================
export const CYCLE_WEIGHTS = {
  business: 0.30,     // Short-term has most immediate impact
  economic: 0.20,     // Long-term debt cycle
  technology: 0.20,   // Tech revolution phase
  country: 0.15,      // Hegemony/empire cycle
  market: 0.15,       // S&P 500 specific
} as const;

// =====================================================
// VOLATILITY ADJUSTMENTS BY CYCLE PHASE
// Phases with higher uncertainty get higher volatility
// =====================================================
export const VOLATILITY_ADJUSTMENTS: Record<string, number> = {
  // Business cycle
  'Expansion': 0.95,      // Slightly lower vol
  'Peak': 1.10,           // Rising uncertainty
  'Slowdown': 1.15,
  'Contraction': 1.20,
  'Recession': 1.35,      // High volatility
  'Recovery': 1.10,
  'Trough': 1.05,
  
  // Technology cycle
  'Installation': 1.00,
  'Frenzy': 1.40,         // Bubble volatility
  'Turning Point': 1.50,  // Crash volatility
  'Crash': 1.60,
  'Synergy': 0.90,        // Stable deployment
  'Deployment': 0.90,
  'Maturity': 0.95,
  
  // Economic cycle
  'Early Cycle': 0.95,
  'Early': 0.95,
  'Mid Cycle': 0.90,
  'Mid': 0.90,
  'Late Cycle': 1.15,
  'Late': 1.15,
  'Crisis': 1.50,
  'Deleveraging': 1.30,
  
  // Default
  'default': 1.00,
};

