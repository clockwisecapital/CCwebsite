'use client';

import { useState, useMemo } from 'react';
import { FiClock as ClockIcon } from 'react-icons/fi';

// ---------------- Types ----------------
interface Holding {
  ticker: string;
  name: string;
  shares: number;
  price: number;
  clockwiseSector: string;
  bias: 'Risk-On' | 'Risk-Off' | string;
  path: 'Known' | 'Neutral' | 'Unknown' | string;
  optionality: 'Low' | 'Neutral' | 'High' | string;
  trueBeta: number;
}

// Cycle ordering
const CLOCK_ORDER = [
  'country',
  'technology',
  'longEcon',
  'shortEcon',
  'market',
  'company',
] as const;

type ClockKey = (typeof CLOCK_ORDER)[number];

// Map keys to nice labels and short blurbs
const CLOCK_META: Record<ClockKey, { title: string; sub: string }> = {
  country: { title: 'Country Cycle', sub: 'Strauss–Howe / Late–Crisis' },
  technology: { title: 'Technology Cycle', sub: 'AI Cycle: Frenzy→Synergy' },
  longEcon: { title: 'Economic Cycle', sub: 'Kondratiev Wave' },
  shortEcon: { title: 'Business Cycle', sub: 'Expansion→Downturn' },
  market: { title: 'S&P 500 Cycle', sub: 'Bull/Bear Phase' },
  company: { title: 'Company Cycle', sub: 'Lifecycle / Maturity' },
};

// Lightweight phase timelines per cycle
const CLOCK_TIMELINE: Record<ClockKey, { phase: string; desc: string }[]> = {
  country: [
    { phase: 'High', desc: 'Institutions strong, social trust high.' },
    { phase: 'Awakening', desc: 'Values shift, authority questioned.' },
    { phase: 'Unraveling', desc: 'Institutions weaken, individualism rises.' },
    { phase: 'Crisis', desc: 'Institutional rebuild; decisive action.' },
  ],
  technology: [
    { phase: 'Discovery', desc: 'Breakthroughs + early prototypes.' },
    { phase: 'Installation', desc: 'Capital floods in; platforms form.' },
    { phase: 'Frenzy', desc: 'Hype + bubbles; rapid adoption.' },
    { phase: 'Synergy', desc: 'Real productivity; standards consolidate.' },
  ],
  longEcon: [
    { phase: 'Spring', desc: 'Disinflation, innovation seeds.' },
    { phase: 'Summer', desc: 'Growth broadens; capex returns.' },
    { phase: 'Autumn', desc: 'Financialization; leverage builds.' },
    { phase: 'Winter', desc: 'Deleveraging and reset.' },
  ],
  shortEcon: [
    { phase: 'Early', desc: 'Earnings inflect; credit easy.' },
    { phase: 'Mid', desc: 'Growth above trend; breadth strong.' },
    { phase: 'Late', desc: 'Inflationary pressures; margins peak.' },
    { phase: 'Downturn', desc: 'Contraction and policy response.' },
  ],
  market: [
    { phase: 'Early Bull', desc: 'Recovery, multiple expansion.' },
    { phase: 'Mid Bull', desc: 'Earnings drive returns.' },
    { phase: 'Late Bull', desc: 'Narrow leadership; euphoria risk.' },
    { phase: 'Bear', desc: 'De-risking and base-building.' },
  ],
  company: [
    { phase: 'Startup', desc: 'Product/market fit hunt.' },
    { phase: 'Growth', desc: 'Scale-up; reinvestment heavy.' },
    { phase: 'Maturity', desc: 'Cash returns; efficiency focus.' },
    { phase: 'Renew/Decline', desc: 'Reinvent or fade.' },
  ],
};

interface ScenarioTestingProps {
  portfolioData?: {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    alternatives: number;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ScenarioTesting({ portfolioData: _portfolioData }: ScenarioTestingProps) {
  // State
  const [selectedCycle, setSelectedCycle] = useState<ClockKey>('market');
  const [showTimeline, setShowTimeline] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<'crisis2008' | 'covid2020'>('crisis2008');

  // Sample portfolios for demonstration
  const currentHoldings: Holding[] = [
    {
      ticker: 'TSLA',
      name: 'Tesla',
      shares: 500,
      price: 245.0,
      clockwiseSector: 'Technology',
      bias: 'Risk-On',
      path: 'Unknown',
      optionality: 'High',
      trueBeta: 2.1,
    },
    {
      ticker: 'PLTR',
      name: 'Palantir',
      shares: 3000,
      price: 28.5,
      clockwiseSector: 'Software',
      bias: 'Risk-On',
      path: 'Unknown',
      optionality: 'High',
      trueBeta: 1.85,
    },
  ];

  // ----- Cycle Alignment + Scoring -----
  const calculateCycleAlignment = (portfolioHoldings: Holding[]) => {
    if (!portfolioHoldings || !portfolioHoldings.length)
      return {
        country: 0,
        longEcon: 0,
        shortEcon: 0,
        technology: 0,
        market: 0,
        company: 0,
      } as Record<ClockKey, number>;

    const totalValue = portfolioHoldings.reduce((s, h) => s + h.shares * h.price, 0);

    let countryScore = 0;
    let longEconScore = 0;
    let shortEconScore = 0;
    let techScore = 0;
    let marketScore = 0;
    let companyScore = 0;

    portfolioHoldings.forEach((h) => {
      const value = h.shares * h.price;
      const weight = value / totalValue;

      // Country cycle
      if (h.clockwiseSector === 'Hedge') countryScore += 30 * weight;
      else if (h.bias === 'Risk-Off') countryScore += 25 * weight;
      else if (h.bias === 'Risk-On') countryScore += 15 * weight;

      // Long-term economic cycle
      if (['Technology', 'Semis'].includes(h.clockwiseSector)) longEconScore += 25 * weight;
      else if (['Healthcare', 'Utilities'].includes(h.clockwiseSector)) longEconScore += 20 * weight;
      else longEconScore += 15 * weight;

      // Short-term business cycle
      if (h.trueBeta > 1.3) shortEconScore += 25 * weight;
      else if (h.trueBeta >= 0.8 && h.trueBeta <= 1.3) shortEconScore += 28 * weight;
      else shortEconScore += 15 * weight;

      // Technology cycle
      if (['Technology', 'Semis', 'Software'].includes(h.clockwiseSector)) techScore += 28 * weight;
      else techScore += 10 * weight;

      // Market cycle
      if (h.path === 'Known' && h.bias === 'Risk-On') marketScore += 28 * weight;
      else if (h.bias === 'Risk-On') marketScore += 22 * weight;
      else marketScore += 18 * weight;

      // Company cycle
      if (h.path === 'Known') companyScore += 25 * weight;
      else companyScore += 18 * weight;
    });

    return {
      country: Math.round((countryScore * 100) / 30),
      longEcon: Math.round((longEconScore * 100) / 25),
      shortEcon: Math.round((shortEconScore * 100) / 28),
      technology: Math.round((techScore * 100) / 28),
      market: Math.round((marketScore * 100) / 28),
      company: Math.round((companyScore * 100) / 25),
    } as Record<ClockKey, number>;
  };

  // Calculate metrics
  const currentMetrics = useMemo(() => {
    const totalValue = currentHoldings.reduce((s, h) => s + h.shares * h.price, 0);
    const beta = currentHoldings.reduce(
      (sum, h) => sum + (h.trueBeta * (h.shares * h.price)) / (totalValue || 1),
      0
    );
    const cycles = calculateCycleAlignment(currentHoldings);
    return { totalValue, beta, cycles };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedClockScore = currentMetrics.cycles[selectedCycle];

  // ---------------- Simulation Engine ----------------
  type SimResult = { median: number; p95: number; p05: number; mdd95: number };

  const hashString = (s: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const mulberry32 = (a: number) => {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const randnBM = (rand: () => number) => {
    let u = 0,
      v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const scenarioParams = (scenario: string) => {
    switch (scenario) {
      case 'crisis2008':
        return { meanShift: -0.05, volMult: 1.6 };
      case 'covid2020':
        return { meanShift: 0.0, volMult: 1.8 };
      default:
        return { meanShift: 0, volMult: 1 };
    }
  };

  const environmentParams = (cycle: string) => {
    switch (cycle) {
      case 'technology':
        return { meanMult: 1.05, volMult: 1.2 };
      case 'market':
        return { meanMult: 1.0, volMult: 1.3 };
      case 'shortEcon':
        return { meanMult: 0.95, volMult: 1.1 };
      case 'country':
        return { meanMult: 0.9, volMult: 1.2 };
      case 'company':
        return { meanMult: 1.0, volMult: 0.9 };
      case 'longEcon':
        return { meanMult: 0.95, volMult: 1.0 };
      default:
        return { meanMult: 1.0, volMult: 1.0 };
    }
  };

  const simulatePortfolio = (
    key: string,
    beta: number,
    envScore: number,
    cycleKey: string,
    scenarioKey: string,
    nPaths = 10000,
    nMonths = 12
  ): SimResult => {
    const baseMean = -0.1 + (envScore / 100) * 0.3;
    const baseVol = 0.18 * Math.max(0.3, beta);

    const sp = scenarioParams(scenarioKey);
    const ep = environmentParams(cycleKey);

    const muAnnual = (baseMean + sp.meanShift) * ep.meanMult;
    const sigmaAnnual = baseVol * sp.volMult * ep.volMult;

    const muMonthly = Math.log(1 + muAnnual) / 12;
    const sigmaMonthly = sigmaAnnual / Math.sqrt(12);

    const seed = hashString(`${key}|${cycleKey}|${scenarioKey}|${Math.round(envScore)}`);
    const rand = mulberry32(seed);

    const finals: number[] = new Array(nPaths);
    const drawdowns: number[] = new Array(nPaths);

    for (let p = 0; p < nPaths; p++) {
      let price = 1.0;
      let peak = 1.0;
      let worstDD = 0.0;
      for (let m = 0; m < nMonths; m++) {
        const z = randnBM(rand);
        const r = Math.exp(muMonthly - 0.5 * sigmaMonthly * sigmaMonthly + sigmaMonthly * z);
        price *= r;
        if (price > peak) peak = price;
        const dd = (price - peak) / peak;
        if (dd < worstDD) worstDD = dd;
      }
      finals[p] = price - 1.0;
      drawdowns[p] = worstDD;
    }

    const percentile = (arr: number[], q: number) => {
      const a = [...arr].sort((x, y) => x - y);
      const idx = Math.min(a.length - 1, Math.max(0, Math.floor(q * (a.length - 1))));
      return a[idx];
    };

    const median = percentile(finals, 0.5);
    const p95 = percentile(finals, 0.95);
    const p05 = percentile(finals, 0.05);
    const mdd95 = percentile(drawdowns, 0.95);

    return { median, p95, p05, mdd95 };
  };

  const simCurrent = useMemo(
    () =>
      simulatePortfolio(
        'CURRENT',
        currentMetrics.beta || 1,
        selectedClockScore,
        selectedCycle,
        selectedScenario
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentMetrics.beta, selectedClockScore, selectedCycle, selectedScenario]
  );

  // Visual Components
  const ClockDial: React.FC<{
    value: number;
    label: string;
    size?: number;
    onClick?: () => void;
  }> = ({ value, label, size = 220, onClick }) => {
    const radius = (size - 16) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(100, value));
    const dash = (progress / 100) * circumference;
    const angle = (progress / 100) * 360;

    return (
      <div className="flex flex-col items-center select-none">
        <button
          onClick={onClick}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-secondary-teal/60"
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow">
            <circle
              cx={center}
              cy={center}
              r={radius}
              className="fill-none stroke-gray-300"
              strokeWidth={10}
            />
            <g transform={`rotate(-90 ${center} ${center})`}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                className="fill-none stroke-secondary-teal"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                strokeWidth={10}
              />
            </g>
            <circle cx={center} cy={center} r={4} className="fill-primary-blue" />
            <g transform={`rotate(${angle - 90} ${center} ${center})`}>
              <line
                x1={center}
                y1={center}
                x2={center}
                y2={center - radius + 10}
                className="stroke-accent-gold"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </g>
            {[0, 25, 50, 75, 100].map((t) => {
              const a = (t / 100) * 2 * Math.PI - Math.PI / 2;
              const x1 = center + Math.cos(a) * (radius - 2);
              const y1 = center + Math.sin(a) * (radius - 2);
              const x2 = center + Math.cos(a) * (radius - 10);
              const y2 = center + Math.sin(a) * (radius - 10);
              return (
                <line
                  key={t}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="stroke-gray-400"
                  strokeWidth={2}
                />
              );
            })}
          </svg>
        </button>
        <div className="mt-2 text-center">
          <div className="text-sm font-semibold text-gray-900">{label}</div>
          <div className="text-xs text-gray-600">{progress}% into cycle</div>
          <div className="text-[10px] text-secondary-teal mt-1">Click dial to toggle timeline</div>
        </div>
      </div>
    );
  };

  const StatTile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-gray-600 text-xs">{label}</div>
      <div className="text-gray-900 font-bold">{value}</div>
      {sub && <div className="text-gray-500 text-[11px] mt-0.5">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Scenario Section */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <ClockIcon className="text-secondary-teal" size={32} />
            <h2 className="text-3xl font-bold text-primary-blue">Scenario Testing</h2>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as 'crisis2008' | 'covid2020')}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-secondary-teal focus:border-transparent"
              aria-label="Scenario"
            >
              <option value="crisis2008">Scenario: 2008 Financial Crisis</option>
              <option value="covid2020">Scenario: 2020 COVID Crash</option>
            </select>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value as ClockKey)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-secondary-teal focus:border-transparent"
              aria-label="Cycle"
            >
              {CLOCK_ORDER.map((k) => (
                <option key={k} value={k}>
                  {CLOCK_META[k].title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-gray-700 mb-4">
          Test your portfolio against historical market scenarios and different economic cycles.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-primary-blue">{CLOCK_META[selectedCycle].title}</h3>
              <p className="text-gray-600 text-sm">{CLOCK_META[selectedCycle].sub}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-2 flex justify-center">
              <ClockDial
                value={selectedClockScore}
                label={`${selectedClockScore}%`}
                size={240}
                onClick={() => setShowTimeline((s) => !s)}
              />
            </div>
            <div className="space-y-3 text-sm">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-gray-600 text-xs mb-1">Cycle Score</div>
                <div className="text-gray-900 text-2xl font-bold">{selectedClockScore}%</div>
                <div className="text-gray-500 text-xs mt-1">Portfolio alignment</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="text-emerald-700 text-xs">Expected Upside</div>
                  <div className="text-gray-900 font-bold">{(simCurrent.p95 * 100).toFixed(1)}%</div>
                  <div className="text-gray-500 text-[11px]">95th %ile, next 12m</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <div className="text-rose-700 text-xs">Expected Downside</div>
                  <div className="text-gray-900 font-bold">{(simCurrent.p05 * 100).toFixed(1)}%</div>
                  <div className="text-gray-500 text-[11px]">5th %ile, next 12m</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-gray-600 text-xs mb-1">Expected Return</div>
                <div className="text-gray-900 text-xl font-bold">
                  {(simCurrent.median * 100).toFixed(1)}%
                </div>
                <div className="text-gray-500 text-[11px]">Median, next 12m</div>
              </div>
            </div>
          </div>

          {/* Timeline (toggle) */}
          {showTimeline && (
            <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Cycle Timeline</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {CLOCK_TIMELINE[selectedCycle].map((step, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-3 border ${
                      idx <= Math.floor((selectedClockScore / 100) * 3)
                        ? 'border-secondary-teal bg-teal-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wide text-gray-700">
                      Phase {idx + 1}
                    </div>
                    <div className="text-gray-900 font-semibold">{step.phase}</div>
                    <div className="text-gray-600 text-xs mt-1">{step.desc}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-teal"
                  style={{ width: `${selectedClockScore}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Results */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-gray-900">Simulation Results</div>
          <div className="text-xs text-gray-600">
            10,000 simulations • 12 months • based on selected cycle & scenario
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <StatTile
            label="Expected Return (12 months)"
            value={`${(simCurrent.median * 100).toFixed(1)}%`}
            sub="Median outcome"
          />
          <StatTile label="Best Case (95th %ile)" value={`${(simCurrent.p95 * 100).toFixed(1)}%`} />
          <StatTile label="Worst Case (5th %ile)" value={`${(simCurrent.p05 * 100).toFixed(1)}%`} />
          <StatTile
            label="Max Drawdown Risk"
            value={`${(simCurrent.mdd95 * 100).toFixed(1)}%`}
            sub="95% confidence"
          />
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Disclaimer:</strong> These are hypothetical simulations based on historical data
            and do not guarantee future results. Past performance does not indicate future
            performance. Please consult with a financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
