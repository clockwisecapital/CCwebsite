"use client";

import React from "react";
import Link from 'next/link';

// Single transparent-glass card wrapper
interface OverlayCardProps {
  title: string;
  summary: React.ReactNode;
  details: React.ReactNode;
}

const OverlayCard: React.FC<OverlayCardProps> = ({ title, summary, details }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl text-gray-100">
      <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
      {summary}
      {open && <div className="mt-4 space-y-3 text-sm text-gray-200">{details}</div>}
      <button
        className="mt-4 text-teal-300 underline"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Show less" : "Read more"}
      </button>
    </section>
  );
};

const EconomicExplainers: React.FC = () => (
  <section className="relative w-full min-h-screen overflow-hidden">
    {/* background video */}
    <video
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      src="/navigationsection/social_u9354481378_Cinematic_beach_scene_split_ocean_view_left_surfe_556968b1-f947-41d8-b525-2ef2881f11b9_3.mp4"
    />
    {/* dark overlay for readability */}
    <div className="absolute inset-0 bg-black/40" />

    {/* overlay cards */}
    <div className="relative z-10 container py-24 grid gap-10 md:grid-cols-2">
      {/* card 1 */}
      <OverlayCard
        title="Stock-Bond Correlation: 40-Year Trend Is Over"
        summary={(
          <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-gray-200">
            <li>Historical average (1990-2010): −0.30 (strong diversification)</li>
            <li>Current level (2020-2025): +0.60 (assets moving together)</li>
            <li>Crisis spikes (COVID-19, 2022): +0.80 (diversification fails)</li>
          </ul>
        )}
        details={(
          <>
            <p>
              The classic negative relationship between stocks and bonds supported the 60/40 portfolio for decades. Inflation shocks
              and synchronized policy moves have pushed both asset classes in the same direction, removing the natural hedge.
            </p>
            <p>
              Volatility is higher, and static portfolios experience larger swings. Investors must explore alternative hedges and more
              dynamic allocation methods.
            </p>
          </>
        )}
      />

      {/* card 2 */}
      <OverlayCard
        title="Passive vs Adaptive ETF Portfolios"
        summary={(
          <p className="text-gray-200 text-sm">
            In 2022 a passive 60/40 portfolio fell 18 – 25 %. An adaptive Clockwise AI portfolio finished +8 – 15 % by recalculating
            optimal allocations daily.
          </p>
        )}
        details={(
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
            <div>
              <h4 className="font-semibold text-white mb-1">Passive</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Fixed 60/40 allocation</li>
                <li>Rebalanced quarterly/yearly</li>
                <li>Ignores market volatility</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Adaptive (AI)</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Scans thousands of data points daily</li>
                <li>Adjusts exposure with risk</li>
                <li>Seeks downside protection and upside capture</li>
              </ul>
            </div>
          </div>
        )}
      />
    </div>

    {/* CTA outside cards */}
    <div className="relative z-10 mt-12 text-center">
      <Link href="#chatbot" className="group relative overflow-hidden bg-[#1FAAA3] text-white font-sans font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 inline-block">
        <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
        <span className="relative flex items-center justify-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>Ask Clockwise AI</span>
        </span>
      </Link>
    </div>
  </section>
);

export default EconomicExplainers;