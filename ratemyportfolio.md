import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  TrendingUp,
  Target,
  GitCompare,
  Plus,
  Trash2,
  X,
  Clock as ClockIcon,
  Grid,
  PlayCircle,
} from "lucide-react";

// ---------------- Types ----------------
interface Holding {
  ticker: string;
  name: string;
  shares: number;
  price: number;
  clockwiseSector:
    | "Technology"
    | "Software"
    | "Semis"
    | "Healthcare"
    | "Discretionary"
    | "Industrials"
    | "Materials"
    | "Utilities"
    | "Staples"
    | "Energy"
    | "Fintech"
    | "Crypto"
    | "China"
    | "Hedge"
    | "Cash"
    | string;
  bias: "Risk-On" | "Risk-Off" | string;
  path: "Known" | "Neutral" | "Unknown" | string;
  optionality: "Low" | "Neutral" | "High" | string;
  trueBeta: number;
}

// Cycle ordering per request
const CLOCK_ORDER = [
  "country",
  "technology",
  "longEcon",
  "shortEcon",
  "market",
  "company",
] as const;

type ClockKey = (typeof CLOCK_ORDER)[number];

// Map keys to nice labels and short blurbs (Clock → Cycle)
const CLOCK_META: Record<ClockKey, { title: string; sub: string }> = {
  country: { title: "Country Cycle", sub: "Strauss–Howe / Late–Crisis" },
  technology: { title: "Technology Cycle", sub: "AI Cycle: Frenzy→Synergy" },
  longEcon: { title: "Economic Cycle", sub: "Kondratiev Wave" },
  shortEcon: { title: "Business Cycle", sub: "Expansion→Downturn" },
  market: { title: "S&P 500 Cycle", sub: "Bull/Bear Phase" },
  company: { title: "Company Cycle", sub: "Lifecycle / Maturity" },
};

// Lightweight phase timelines per cycle (click dial to reveal)
const CLOCK_TIMELINE: Record<ClockKey, { phase: string; desc: string }[]> = {
  country: [
    { phase: "High", desc: "Institutions strong, social trust high." },
    { phase: "Awakening", desc: "Values shift, authority questioned." },
    { phase: "Unraveling", desc: "Institutions weaken, individualism rises." },
    { phase: "Crisis", desc: "Institutional rebuild; decisive action." },
  ],
  technology: [
    { phase: "Discovery", desc: "Breakthroughs + early prototypes." },
    { phase: "Installation", desc: "Capital floods in; platforms form." },
    { phase: "Frenzy", desc: "Hype + bubbles; rapid adoption." },
    { phase: "Synergy", desc: "Real productivity; standards consolidate." },
  ],
  longEcon: [
    { phase: "Spring", desc: "Disinflation, innovation seeds." },
    { phase: "Summer", desc: "Growth broadens; capex returns." },
    { phase: "Autumn", desc: "Financialization; leverage builds." },
    { phase: "Winter", desc: "Deleveraging and reset." },
  ],
  shortEcon: [
    { phase: "Early", desc: "Earnings inflect; credit easy." },
    { phase: "Mid", desc: "Growth above trend; breadth strong." },
    { phase: "Late", desc: "Inflationary pressures; margins peak." },
    { phase: "Downturn", desc: "Contraction and policy response." },
  ],
  market: [
    { phase: "Early Bull", desc: "Recovery, multiple expansion." },
    { phase: "Mid Bull", desc: "Earnings drive returns." },
    { phase: "Late Bull", desc: "Narrow leadership; euphoria risk." },
    { phase: "Bear", desc: "De-risking and base-building." },
  ],
  company: [
    { phase: "Startup", desc: "Product/market fit hunt." },
    { phase: "Growth", desc: "Scale-up; reinvestment heavy." },
    { phase: "Maturity", desc: "Cash returns; efficiency focus." },
    { phase: "Renew/Decline", desc: "Reinvent or fade." },
  ],
};

// ---------------- New: Kronos Video Screen ----------------
const KronosScreen: React.FC<{
  url?: string; // e.g., YouTube/Vimeo embed URL
  title?: string;
  caption?: string;
}> = ({ url, title = "Kronos", caption = "AI Market Navigator" }) => {
  return (
    <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <PlayCircle className="text-cyan-400" size={32} />
          <h2 className="text-3xl font-bold text-white">{title}</h2>
        </div>
        <span className="text-xs px-3 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-md font-semibold">
          {caption}
        </span>
      </div>

      <div className="relative w-full rounded-xl overflow-hidden border border-slate-700/60 bg-black">
        {/* If a URL is provided, render the iframe. Otherwise, show a placeholder panel. */}
        {url ? (
          <div className="aspect-video">
            <iframe
              src={url}
              title="Kronos Video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video grid place-items-center">
            <div className="text-center p-6">
              <div className="text-white font-semibold mb-1">Add your Kronos video URL</div>
              <div className="text-slate-400 text-sm">Pass an embed URL to the <span className="font-mono">KronosScreen</span> component.</div>
              <div className="text-slate-500 text-xs mt-2">Example: https://www.youtube.com/embed/VIDEO_ID</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function RateMyPortfolio() {
  // ---------------- State ----------------
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [showWeightsEditor, setShowWeightsEditor] = useState(false);
  const [showAllCurrentHoldings, setShowAllCurrentHoldings] = useState(false);
  const [showAllTimeHoldings, setShowAllTimeHoldings] = useState(false);

  // Cycles (single at a time + dropdown)
  // Default: S&P 500 Cycle (market)
  const [selectedCycle, setSelectedCycle] = useState<ClockKey>("market");
  const [showTimeline, setShowTimeline] = useState(true); // reveal timeline on click; default open for discoverability

  // Scenarios
  const [selectedScenario, setSelectedScenario] = useState<"crisis2008" | "covid2020">("crisis2008");

  // Portfolios — 0 = Current (user), 1 = TIME
  const [selectedPortfolio, setSelectedPortfolio] = useState<0 | 1>(0);

  const [weights, setWeights] = useState({
    company: 50,
    country: 15,
    longEcon: 10,
    shortEcon: 10,
    technology: 10,
    market: 5,
  });

  const [newPosition, setNewPosition] = useState({
    ticker: "",
    name: "",
    shares: "",
    price: "",
    clockwiseSector: "Technology",
    bias: "Risk-On" as const,
    path: "Neutral" as const,
    optionality: "Neutral" as const,
    beta: "1.0",
  });

  // ---------------- Helpers ----------------
  const fmtUSD0 = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const palette: Record<string, { bg: string; border: string; borderEmph: string; text: string; gradFrom?: string; gradTo?: string }> = {
    purple: {
      bg: "bg-purple-500/20",
      border: "border-purple-500/50",
      borderEmph: "border-purple-400",
      text: "text-purple-400",
      gradFrom: "from-purple-500/10",
      gradTo: "to-pink-500/10",
    },
    teal: {
      bg: "bg-teal-500/20",
      border: "border-teal-500/50",
      borderEmph: "border-teal-400",
      text: "text-teal-400",
      gradFrom: "from-teal-500/10",
      gradTo: "to-cyan-500/10",
    },
  };

  const portfolioCardClasses = (colorKey: string, selected: boolean) => {
    const c = palette[colorKey] || palette.purple;
    if (selected) return `p-4 rounded-xl border-2 ${c.bg} ${c.borderEmph}`;
    return `p-4 rounded-xl border-2 bg-slate-900/50 border-slate-700 hover:${c.border} hover:bg-slate-900/70 transition-all`;
  };

  // ---------------- Data ----------------
  // Current Portfolio (editable)
  const [hypotheticalHoldings, setHypotheticalHoldings] = useState<Holding[]>([
    {
      ticker: "TSLA",
      name: "Tesla",
      shares: 500,
      price: 245.0,
      clockwiseSector: "Technology",
      bias: "Risk-On",
      path: "Unknown",
      optionality: "High",
      trueBeta: 2.1,
    },
    {
      ticker: "PLTR",
      name: "Palantir",
      shares: 3000,
      price: 28.5,
      clockwiseSector: "Software",
      bias: "Risk-On",
      path: "Unknown",
      optionality: "High",
      trueBeta: 1.85,
    },
  ]);

  // TIME Portfolio (defensive/tactical income lean)
  const [timeHoldings] = useState<Holding[]>([
    {
      ticker: "JNJ",
      name: "Johnson & Johnson",
      shares: 1200,
      price: 158.0,
      clockwiseSector: "Healthcare",
      bias: "Risk-Off",
      path: "Known",
      optionality: "Low",
      trueBeta: 0.68,
    },
    {
      ticker: "PG",
      name: "Procter & Gamble",
      shares: 950,
      price: 168.0,
      clockwiseSector: "Staples",
      bias: "Risk-Off",
      path: "Known",
      optionality: "Low",
      trueBeta: 0.55,
    },
    {
      ticker: "USD",
      name: "Cash",
      shares: 1,
      price: 125000.0,
      clockwiseSector: "Cash",
      bias: "Risk-Off",
      path: "Known",
      optionality: "Low",
      trueBeta: 0.0,
    },
  ]);

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

      // Country cycle (Late/Crisis)
      if (h.clockwiseSector === "Hedge") countryScore += 30 * weight;
      else if (h.bias === "Risk-Off") countryScore += 25 * weight;
      else if (h.bias === "Risk-On") countryScore += 15 * weight;

      // Long-term economic cycle (Crest/Transition)
      if (["Technology", "Semis"].includes(h.clockwiseSector)) longEconScore += 25 * weight;
      else if (["Healthcare", "Utilities"].includes(h.clockwiseSector)) longEconScore += 20 * weight;
      else longEconScore += 15 * weight;

      // Short-term business cycle (Late/Peak)
      if (h.trueBeta > 1.3) shortEconScore += 25 * weight;
      else if (h.trueBeta >= 0.8 && h.trueBeta <= 1.3) shortEconScore += 28 * weight;
      else shortEconScore += 15 * weight;

      // Technology cycle (Frenzy→Synergy)
      if (["Technology", "Semis", "Software"].includes(h.clockwiseSector)) techScore += 28 * weight;
      else techScore += 10 * weight;

      // Market cycle (Late Bull)
      if (h.path === "Known" && h.bias === "Risk-On") marketScore += 28 * weight;
      else if (h.bias === "Risk-On") marketScore += 22 * weight;
      else marketScore += 18 * weight;

      // Company cycle (Maturity)
      if (h.path === "Known") companyScore += 25 * weight;
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

  const calculatePortfolioScore = (portfolioHoldings: Holding[]) => {
    if (!portfolioHoldings || !portfolioHoldings.length) return 0;
    const cycles = calculateCycleAlignment(portfolioHoldings);
    const weightedScore =
      cycles.country * (weights.country / 100) +
      cycles.longEcon * (weights.longEcon / 100) +
      cycles.shortEcon * (weights.shortEcon / 100) +
      cycles.technology * (weights.technology / 100) +
      cycles.market * (weights.market / 100) +
      cycles.company * (weights.company / 100);
    return Math.round(weightedScore);
  };

  const selectedClockScoreFor = (holdings: Holding[], key: ClockKey) => {
    const map = {
      country: "country",
      company: "company",
      longEcon: "longEcon",
      shortEcon: "shortEcon",
      technology: "technology",
      market: "market",
    } as const;
    const scores = calculateCycleAlignment(holdings);
    return scores[map[key]];
  };

  // ----- Handlers -----
  const handleAddPosition = () => {
    if (!newPosition.ticker || !newPosition.shares || !newPosition.price) {
      alert("Please fill in ticker, shares, and price");
      return;
    }

    const position: Holding = {
      ticker: newPosition.ticker.toUpperCase(),
      name: newPosition.name || newPosition.ticker,
      shares: parseFloat(newPosition.shares),
      price: parseFloat(newPosition.price),
      clockwiseSector: newPosition.clockwiseSector,
      bias: newPosition.bias,
      path: newPosition.path,
      optionality: newPosition.optionality,
      trueBeta: parseFloat(newPosition.beta),
    } as unknown as Holding;

    setHypotheticalHoldings((prev) => [...prev, position]);
    setNewPosition({
      ticker: "",
      name: "",
      shares: "",
      price: "",
      clockwiseSector: "Technology",
      bias: "Risk-On",
      path: "Neutral",
      optionality: "Neutral",
      beta: "1.0",
    });
    setShowAddPosition(false);
  };

  const handleRemovePosition = (index: number) => {
    setHypotheticalHoldings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleWeightChange = (key: keyof typeof weights, value: string | number) => {
    const numValue = parseInt(String(value || 0), 10);
    setWeights((w) => ({
      ...w,
      [key]: Math.max(0, Math.min(100, isNaN(numValue) ? 0 : numValue)),
    }));
  };

  const getTotalWeight = () => Object.values(weights).reduce((s, w) => s + w, 0);

  const equalizeWeights = () => {
    const equal = Math.floor(100 / 6);
    const remainder = 100 - equal * 6;
    setWeights({
      company: equal + remainder,
      country: equal,
      longEcon: equal,
      shortEcon: equal,
      technology: equal,
      market: equal,
    });
  };

  const resetWeights = () => setWeights({ company: 50, country: 15, longEcon: 10, shortEcon: 10, technology: 10, market: 5 });

  // ----- Metrics -----
  const currentMetrics = useMemo(() => {
    const totalValue = hypotheticalHoldings.reduce((s, h) => s + h.shares * h.price, 0);
    const beta = hypotheticalHoldings.reduce((sum, h) => sum + (h.trueBeta * (h.shares * h.price)) / (totalValue || 1), 0);
    const score = calculatePortfolioScore(hypotheticalHoldings);
    return { totalValue, beta, score };
  }, [hypotheticalHoldings, weights]);

  const timeMetrics = useMemo(() => {
    const totalValue = timeHoldings.reduce((s, h) => s + h.shares * h.price, 0);
    const beta = timeHoldings.reduce((sum, h) => sum + (h.trueBeta * (h.shares * h.price)) / (totalValue || 1), 0);
    const score = calculatePortfolioScore(timeHoldings);
    return { totalValue, beta, score };
  }, [timeHoldings, weights]);

  // Per-portfolio selected cycle scores
  const selectedClockScoreCurrent = useMemo(() => selectedClockScoreFor(hypotheticalHoldings, selectedCycle), [hypotheticalHoldings, selectedCycle]);
  const selectedClockScoreTime = useMemo(() => selectedClockScoreFor(timeHoldings, selectedCycle), [timeHoldings, selectedCycle]);

  // For big dial: show score for the currently selected portfolio
  const bigDialScore = selectedPortfolio === 0 ? selectedClockScoreCurrent : selectedClockScoreTime;

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
      case "crisis2008":
        return { meanShift: -0.05, volMult: 1.6 };
      case "covid2020":
        return { meanShift: 0.0, volMult: 1.8 };
      default:
        return { meanShift: 0, volMult: 1 };
    }
  };

  const environmentParams = (cycle: string) => {
    switch (cycle) {
      case "technology":
        return { meanMult: 1.05, volMult: 1.2 };
      case "market":
        return { meanMult: 1.0, volMult: 1.3 };
      case "shortEcon":
        return { meanMult: 0.95, volMult: 1.1 };
      case "country":
        return { meanMult: 0.9, volMult: 1.2 };
      case "company":
        return { meanMult: 1.0, volMult: 0.9 };
      case "longEcon":
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
    const baseMean = -0.1 + (envScore / 100) * 0.3; // -10% to +20%
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
        const r = Math.exp(
          muMonthly - 0.5 * sigmaMonthly * sigmaMonthly + sigmaMonthly * z
        );
        price *= r;
        if (price > peak) peak = price;
        const dd = (price - peak) / peak; // negative
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

  // Per-portfolio environment (selected cycle) for sims
  const envScoreCurrent = selectedClockScoreCurrent;
  const envScoreTime = selectedClockScoreTime;

  // Per-portfolio simulation results (memoized)
  const simCurrent = useMemo(
    () =>
      simulatePortfolio(
        "CURRENT",
        currentMetrics.beta || 1,
        envScoreCurrent,
        selectedCycle,
        selectedScenario
      ),
    [currentMetrics.beta, envScoreCurrent, selectedCycle, selectedScenario]
  );

  const simTime = useMemo(
    () =>
      simulatePortfolio(
        "TIME",
        timeMetrics.beta || 1,
        envScoreTime,
        selectedCycle,
        selectedScenario
      ),
    [timeMetrics.beta, envScoreTime, selectedCycle, selectedScenario]
  );

  // Helper: simulation for the currently selected portfolio (for Cycle section)
  const simSelected = selectedPortfolio === 0 ? simCurrent : simTime;

  // Historical Market Analog (for S&P 500 Cycle)
  const marketAnalog = (score: number) => {
    if (score < 25) return { label: "Early Bull Analog", years: "2003–2004", blurb: "Post-recession recovery, broad leadership." };
    if (score < 50) return { label: "Mid Bull Analog", years: "2013–2014", blurb: "Earnings-led grind higher, buy-the-dip works." };
    if (score < 75) return { label: "Late Bull Analog", years: "1998–1999 / 2021", blurb: "Narrow leadership, momentum + valuation risk." };
    return { label: "Pre-Bear / Transition", years: "2007 H1 / 2020 Q1", blurb: "Fragile breadth, policy-sensitive tape." };
  };

  // ----- Dev Tests (runtime, non-breaking) -----
  const runDevTests = () => {
    try {
      const cycles = calculateCycleAlignment(timeHoldings);
      console.assert(Object.values(cycles).every((v) => v >= 0 && v <= 100), "Cycle scores must be within 0-100");
      console.assert(getTotalWeight() >= 0 && getTotalWeight() <= 1000, "Total weight sanity");
      const s1 = calculatePortfolioScore(timeHoldings);
      const prev = weights.market;
      setWeights((w) => ({ ...w, market: Math.min(100, w.market + 1) }));
      const s2 = calculatePortfolioScore(timeHoldings);
      setWeights((w) => ({ ...w, market: prev }));
      console.assert(typeof s1 === "number" && typeof s2 === "number", "Scores should be numbers");

      const a = simulatePortfolio("TEST", 1, 50, "country", "crisis2008", 2000, 6);
      const b = simulatePortfolio("TEST", 1, 50, "country", "crisis2008", 2000, 6);
      console.assert(Math.abs(a.median - b.median) < 1e-12, "Deterministic results expected");
    } catch (e) {
      console.warn("Dev tests failed:", e);
    }
  };

  useEffect(() => {
    if (typeof process === "undefined" || process?.env?.NODE_ENV !== "production") {
      runDevTests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- Visual Components ----------------
  const ClockDial: React.FC<{ value: number; label: string; size?: number; onClick?: () => void }> = ({ value, label, size = 220, onClick }) => {
    const radius = (size - 16) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(100, value));
    const dash = (progress / 100) * circumference;
    const angle = (progress / 100) * 360;

    return (
      <div className="flex flex-col items-center select-none">
        <button onClick={onClick} className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400/60">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow">
            <circle cx={center} cy={center} r={radius} className="fill-none stroke-slate-800" strokeWidth={10} />
            <g transform={`rotate(-90 ${center} ${center})`}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                className="fill-none stroke-indigo-500"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                strokeWidth={10}
              />
            </g>
            <circle cx={center} cy={center} r={4} className="fill-white" />
            <g transform={`rotate(${angle - 90} ${center} ${center})`}>
              <line x1={center} y1={center} x2={center} y2={center - radius + 10} className="stroke-cyan-400" strokeWidth={3} strokeLinecap="round" />
            </g>
            {[0, 25, 50, 75, 100].map((t) => {
              const a = (t / 100) * 2 * Math.PI - Math.PI / 2;
              const x1 = center + Math.cos(a) * (radius - 2);
              const y1 = center + Math.sin(a) * (radius - 2);
              const x2 = center + Math.cos(a) * (radius - 10);
              const y2 = center + Math.sin(a) * (radius - 10);
              return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-slate-500" strokeWidth={2} />;
            })}
          </svg>
        </button>
        <div className="mt-2 text-center">
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="text-xs text-slate-400">{progress}% into cycle</div>
          <div className="text-[10px] text-indigo-300/80 mt-1">Click dial to toggle timeline</div>
        </div>
      </div>
    );
  };

  const StatTile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="bg-slate-900/60 rounded-lg p-3">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="text-white font-bold">{value}</div>
      {sub && <div className="text-slate-500 text-[11px] mt-0.5">{sub}</div>}
    </div>
  );

  const SimulationPanel: React.FC<{ data: SimResult }> = ({ data }) => (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-white">Simulation</div>
        <div className="text-xs text-slate-400">10,000 simulations • 12 months • based on selected cycle & scenario</div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <StatTile label="Expected Return (12 months)" value={`${(data.median * 100).toFixed(1)}%`} sub="Median outcome" />
        <StatTile label="Best Case (95th %ile)" value={`${(data.p95 * 100).toFixed(1)}%`} />
        <StatTile label="Worst Case (5th %ile)" value={`${(data.p05 * 100).toFixed(1)}%`} />
        <StatTile label="Max Drawdown Risk" value={`${(data.mdd95 * 100).toFixed(1)}%`} sub="95% confidence" />
      </div>
    </div>
  );

  const HoldingsList = ({ holdings, onRemove }: { holdings: Holding[]; onRemove?: (idx: number) => void }) => (
    <div className="mt-2 max-h-52 overflow-y-auto space-y-1">
      {holdings.map((h, i) => (
        <div key={`${h.ticker}-${i}`} className="flex items-center justify-between text-xs bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold">{h.ticker}</span>
            <span className="text-slate-400">{h.name}</span>
            <span className="text-slate-500">• {h.clockwiseSector}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">{h.shares} @ ${h.price}</span>
            <span className="text-slate-400">β {h.trueBeta.toFixed(2)}</span>
            {onRemove && (
              <button className="p-1 rounded hover:bg-red-500/10 text-red-400" onClick={() => onRemove(i)} aria-label={`Remove ${h.ticker}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const WeightRow = ({ keyName, label }: { keyName: keyof typeof weights; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-200">{label}</span>
      <div className="flex items-center gap-2">
        <input type="range" min={0} max={100} value={(weights as any)[keyName]} onChange={(e) => handleWeightChange(keyName, e.target.value)} className="w-40 accent-indigo-500" />
        <input type="number" min={0} max={100} value={(weights as any)[keyName]} onChange={(e) => handleWeightChange(keyName, e.target.value)} className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100" />
        <span className="text-xs text-slate-400">
          %
        </span>
      </div>
    </div>
  );

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompare className="w-10 h-10 text-indigo-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">Rate My Portfolio</h1>
              <p className="text-slate-400">Compare your Current Portfolio to TIME</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddPosition(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-all">
              <Plus className="w-5 h-5" />
              Add Position
            </button>
            <button onClick={() => setShowWeightsEditor(true)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-semibold">
              Weights
            </button>
          </div>
        </div>

        {/* === NEW SECTION: KRONOS VIDEO (above Cycle) === */}
        <KronosScreen 
          // Provide your embed URL below. Example (YouTube): "https://www.youtube.com/embed/VIDEO_ID"
          // Example (Vimeo): "https://player.vimeo.com/video/VIDEO_ID"
          url={undefined}
          title="Kronos Video"
          caption="Market Intelligence"
        />

        {/* === SECTION 1: CYCLE (single) === */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <ClockIcon className="text-indigo-400" size={32} />
              <h2 className="text-3xl font-bold text-white">Cycle</h2>
            </div>
            <div className="flex items-center gap-3">
              <select value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value as any)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-semibold hover:bg-slate-700 transition-colors" aria-label="Scenario">
                <option value="crisis2008">Scenario: 2008 Financial Crisis</option>
                <option value="covid2020">Scenario: 2020 COVID Crash</option>
              </select>
              <select value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value as ClockKey)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-semibold hover:bg-slate-700 transition-colors" aria-label="Cycle">
                {CLOCK_ORDER.map((k) => (
                  <option key={k} value={k}>{CLOCK_META[k].title}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-slate-400 mb-4">One cycle at a time. Use the dropdown to switch. Click the dial to reveal the cycle timeline.</p>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{CLOCK_META[selectedCycle].title}</h3>
                <p className="text-slate-400 text-sm">{CLOCK_META[selectedCycle].sub}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2 flex justify-center">
                <ClockDial value={bigDialScore} label={`${bigDialScore}%`} size={240} onClick={() => setShowTimeline((s) => !s)} />
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                  <div className="text-slate-400 text-xs mb-1">Selected Cycle Score (Shown Dial)</div>
                  <div className="text-white text-2xl font-bold">{bigDialScore}%</div>
                  <div className="text-slate-500 text-xs mt-1">Score for {selectedPortfolio === 0 ? "Current" : "TIME"} portfolio</div>
                </div>
                {/* NEW: Expected Upside/Downside (based on selected cycle & portfolio) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-3">
                    <div className="text-emerald-300 text-xs">Expected Upside</div>
                    <div className="text-white font-bold">{(simSelected.p95 * 100).toFixed(1)}%</div>
                    <div className="text-slate-500 text-[11px]">95th %ile, next 12m</div>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-3">
                    <div className="text-rose-300 text-xs">Expected Downside</div>
                    <div className="text-white font-bold">{(simSelected.p05 * 100).toFixed(1)}%</div>
                    <div className="text-slate-500 text-[11px]">5th %ile, next 12m</div>
                  </div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
                  <div className="text-slate-400 text-xs mb-1">Expected Return</div>
                  <div className="text-white text-xl font-bold">{(simSelected.median * 100).toFixed(1)}%</div>
                  <div className="text-slate-500 text-[11px]">Median, next 12m</div>
                </div>
                {/* Historical Market Analog shown only for S&P 500 Cycle */}
                {selectedCycle === "market" && (
                  <div className="bg-indigo-500/10 border border-indigo-400/50 rounded-lg p-3">
                    {(() => {
                      const a = marketAnalog(bigDialScore);
                      return (
                        <>
                          <div className="text-indigo-300 text-xs">Historical Market Analog</div>
                          <div className="text-white font-bold">{a.label} — {a.years}</div>
                          <div className="text-slate-300 text-[12px] mt-1">{a.blurb}</div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline (toggle) */}
            {showTimeline && (
              <div className="mt-6 bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div className="text-sm font-semibold text-white mb-3">Cycle Timeline</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {CLOCK_TIMELINE[selectedCycle].map((step, idx) => (
                    <div key={idx} className={`rounded-lg p-3 border ${idx <= Math.floor((bigDialScore / 100) * 3) ? "border-indigo-400 bg-indigo-500/10" : "border-slate-700 bg-slate-800/40"}`}>
                      <div className="text-xs uppercase tracking-wide text-slate-300">Phase {idx + 1}</div>
                      <div className="text-white font-semibold">{step.phase}</div>
                      <div className="text-slate-400 text-xs mt-1">{step.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${bigDialScore}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === SECTION 2: PORTFOLIOS === */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Grid className="text-cyan-400" size={28} />
              <h3 className="text-2xl font-bold text-white">Portfolios</h3>
            </div>
          </div>

          {/* Select Portfolio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { name: "Current Portfolio", color: "purple", beta: currentMetrics.beta.toFixed(2), idx: 0 },
              { name: "TIME Portfolio", color: "teal", beta: timeMetrics.beta.toFixed(2), idx: 1 },
            ].map((p) => (
              <button key={p.idx} onClick={() => setSelectedPortfolio(p.idx as 0 | 1)} className={portfolioCardClasses(p.color, selectedPortfolio === (p.idx as 0 | 1))}>
                <div className="text-sm font-semibold text-white mb-1">{p.name}</div>
                <div className="text-xs text-slate-400">Beta: {p.beta}</div>
              </button>
            ))}
          </div>

          {/* Cards for each portfolio (condensed) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Portfolio */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border-2 border-purple-500/40 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Activity className="text-purple-400" size={24} />
                  <div>
                    <h4 className="text-lg font-bold text-purple-400">Current Portfolio</h4>
                    <p className="text-xs text-slate-400">Editable • Your positions</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-md font-semibold">CURRENT</span>
              </div>

              {/* Moved Scores to top per request */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/50 rounded-xl p-4">
                  <div className="text-sm font-semibold text-purple-300">All-Cycles Score</div>
                  <div className="text-2xl font-bold text-white">{currentMetrics.score}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/50 rounded-xl p-4">
                  <div className="text-sm font-semibold text-purple-300">Selected Cycle Score</div>
                  <div className="text-2xl font-bold text-white">{selectedClockScoreCurrent}</div>
                </div>
              </div>

              <div className="text-2xl font-bold text-white mb-4">{fmtUSD0(currentMetrics.totalValue)}</div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <StatTile label="Positions" value={`${hypotheticalHoldings.length}`} />
                <StatTile label="Beta" value={currentMetrics.beta.toFixed(2)} />
                <StatTile label="Hedges" value={`0%`} />
              </div>

              <SimulationPanel data={simCurrent} />

              <div className="border-t border-slate-700 pt-3">
                <button onClick={() => setShowAllCurrentHoldings((s) => !s)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/50 hover:bg-slate-900/70 rounded-lg transition-all">
                  <span className="text-xs font-semibold text-slate-400">Holdings ({hypotheticalHoldings.length} positions)</span>
                  <span className={`text-purple-400 transform transition-transform ${showAllCurrentHoldings ? "rotate-180" : ""}`}>▼</span>
                </button>
                {showAllCurrentHoldings && <HoldingsList holdings={hypotheticalHoldings} onRemove={handleRemovePosition} />}
              </div>
            </div>

            {/* TIME Portfolio */}
            <div className="bg-slate-900/50 rounded-2xl p-6 border-2 border-teal-500/40 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-teal-400" size={24} />
                  <div>
                    <h4 className="text-lg font-bold text-teal-400">TIME Portfolio</h4>
                    <p className="text-xs text-slate-400">Defensive / Income Lean</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 bg-teal-500/20 text-teal-400 rounded-md font-semibold">LIVE</span>
              </div>

              {/* Moved Scores to top per request */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 border-2 border-teal-500/50 rounded-xl p-4">
                  <div className="text-sm font-semibold text-teal-300">All-Cycles Score</div>
                  <div className="text-2xl font-bold text-white">{timeMetrics.score}</div>
                </div>
                <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 border-2 border-teal-500/50 rounded-xl p-4">
                  <div className="text-sm font-semibold text-teal-300">Selected Cycle Score</div>
                  <div className="text-2xl font-bold text-white">{selectedClockScoreTime}</div>
                </div>
              </div>

              <div className="text-2xl font-bold text-white mb-4">{fmtUSD0(timeMetrics.totalValue)}</div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <StatTile label="Positions" value={`${timeHoldings.length}`} />
                <StatTile label="Beta" value={timeMetrics.beta.toFixed(2)} />
                <StatTile label="Hedges" value={`0%`} />
              </div>

              <SimulationPanel data={simTime} />

              <div className="border-t border-slate-700 pt-3">
                <button onClick={() => setShowAllTimeHoldings((s) => !s)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/50 hover:bg-slate-900/70 rounded-lg transition-all">
                  <span className="text-xs font-semibold text-slate-400">Holdings ({timeHoldings.length} positions)</span>
                  <span className={`text-teal-400 transform transition-transform ${showAllTimeHoldings ? "rotate-180" : ""}`}>▼</span>
                </button>
                {showAllTimeHoldings && <HoldingsList holdings={timeHoldings} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Add Position Modal ---- */}
      {showAddPosition && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plus className="text-indigo-400" />
                <h4 className="text-lg font-bold text-white">Add Position</h4>
              </div>
              <button onClick={() => setShowAddPosition(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-300" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Ticker</label>
                <input className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" placeholder="AAPL" value={newPosition.ticker} onChange={(e) => setNewPosition({ ...newPosition, ticker: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Name</label>
                <input className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" placeholder="Apple Inc." value={newPosition.name} onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Shares</label>
                <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" placeholder="100" value={newPosition.shares} onChange={(e) => setNewPosition({ ...newPosition, shares: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Price</label>
                <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" placeholder="150" value={newPosition.price} onChange={(e) => setNewPosition({ ...newPosition, price: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Sector</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={newPosition.clockwiseSector} onChange={(e) => setNewPosition({ ...newPosition, clockwiseSector: e.target.value })}>
                  {["Technology","Software","Semis","Healthcare","Discretionary","Industrials","Materials","Utilities","Staples","Energy","Fintech","Crypto","China","Hedge","Cash"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Bias</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={newPosition.bias} onChange={(e) => setNewPosition({ ...newPosition, bias: e.target.value as any })}>
                  {( ["Risk-On", "Risk-Off"] as const).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Path</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={newPosition.path} onChange={(e) => setNewPosition({ ...newPosition, path: e.target.value as any })}>
                  {( ["Known", "Neutral", "Unknown"] as const).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Optionality</label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={newPosition.optionality} onChange={(e) => setNewPosition({ ...newPosition, optionality: e.target.value as any })}>
                  {( ["Low", "Neutral", "High"] as const).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">True Beta</label>
                <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" placeholder="1.00" value={newPosition.beta} onChange={(e) => setNewPosition({ ...newPosition, beta: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setShowAddPosition(false)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200">Cancel</button>
              <button onClick={handleAddPosition} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Weights Modal ---- */}
      {showWeightsEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="text-indigo-400" />
                <h4 className="text-lg font-bold text-white">Weights</h4>
              </div>
              <button onClick={() => setShowWeightsEditor(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-300" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-2">Distribute 100% across cycles to compute the all-cycles score.</p>

            <div className="space-y-1">
              <WeightRow keyName="country" label="Country Cycle" />
              <WeightRow keyName="technology" label="Technology Cycle" />
              <WeightRow keyName="longEcon" label="Economic Cycle" />
              <WeightRow keyName="shortEcon" label="Business Cycle" />
              <WeightRow keyName="market" label="S&P 500 Cycle" />
              <WeightRow keyName="company" label="Company Cycle" />
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
              <div className={`${getTotalWeight() === 100 ? "text-emerald-400" : "text-amber-400"} font-semibold`}>Total: {getTotalWeight()}%</div>
              <div className="flex gap-2">
                <button onClick={equalizeWeights} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100">Equalize</button>
                <button onClick={resetWeights} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100">Reset</button>
                <button onClick={() => setShowWeightsEditor(false)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
