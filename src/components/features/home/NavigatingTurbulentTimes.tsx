"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

import { phases, Phase } from "@/utils/turbulentData";

// Card data for the new layout
const investmentCards = [
  {
    id: 1,
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
    title: "60/40 Is Broken",
    description: "Stocks and bonds now move together. The diversification that protected portfolios for decades no longer works.",
    stat: "+0.60",
    statLabel: "correlation (was -0.30)"
  },
  {
    id: 2,
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        <path d="M9 4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" />
      </svg>
    ),
    title: "Volatility Is Higher",
    description: "Markets swing more violently than before. Static portfolios experience larger drawdowns during crises.",
    stat: "2.3×",
    statLabel: "avg. swing vs. 2010s"
  },
  {
    id: 3,
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    title: "Cycles Are Accelerating",
    description: "Technology, monetary policy, and geopolitics create faster rotations. Annual rebalancing isn't enough.",
    stat: "6",
    statLabel: "cycles we track daily"
  }
];
/*

    chart: [
      { name: "1945", value: 20 },
      { name: "1960", value: 40 },
      { name: "1980", value: 60 },
    ],
  },
  {
    id: 2,
    title: "Bubble Phase",
    years: "1980-2000",
    synopsis:
      "Cheap credit, leverage grows. Tech boom and housing mania create bubbles.",
    chart: [
      { name: "1980", value: 60 },
      { name: "1990", value: 90 },
      { name: "2000", value: 120 },
    ],
  },
  {
    id: 3,
    title: "Peak & Crash",
    years: "2000-2008",
    synopsis:
      "Debt can’t be paid back, bubbles pop, 2008 crisis hits.",
    chart: [
      { name: "2000", value: 120 },
      { name: "2004", value: 100 },
      { name: "2008", value: 60 },
    ],
  },
  {
    id: 4,
    title: "Great Deleveraging",
    years: "2008-Present",
    synopsis:
      "Zero rates, money printing, extreme volatility. We are here.",
    chart: [
      { name: "2008", value: 60 },
      { name: "2016", value: 80 },
      { name: "2025", value: 70 },
    ],
  },
  {
    id: 5,
    title: "Reset (Forecast)",
    years: "2030-2040?",
    synopsis:
      "Major economic restructuring, new cycle begins – high risk & reward.",
    chart: [
      { name: "2030", value: 70 },
      { name: "2035", value: 90 },

*/

const NavigatingTurbulentTimes: React.FC = () => {
  const [active, setActive] = useState<Phase>(phases[3]); // default to current phase
  const [isPaused, setIsPaused] = useState<boolean>(false); // track pause state
  const [showRoadmap, setShowRoadmap] = useState<boolean>(false); // toggle roadmap visibility

  // Automatically cycle through phases every 5 seconds when not paused
  useEffect(() => {
    let id: NodeJS.Timeout;
    
    if (!isPaused && showRoadmap) {
      id = setInterval(() => {
        setActive((prev) => {
          const currentIndex = phases.findIndex((ph) => ph.id === prev.id);
          const next = phases[(currentIndex + 1) % phases.length];
          return next;
        });
      }, 5000);
    }
    
    return () => {
      if (id) clearInterval(id);
    };
  }, [isPaused, showRoadmap]); // re-run effect when pause state or roadmap visibility changes
  
  // Toggle pause/play
  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <section
      id="learn"
      className="relative w-full bg-[#0e171e] text-gray-200 py-20 md:py-28"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            The Rules of Investing Have Changed
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            The strategies that worked for 40 years are breaking down. Here&apos;s what&apos;s different now.
          </p>
        </div>

        {/* Three Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {investmentCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#1A2332] to-[#0F1419] rounded-xl p-8 border border-white/10 hover:border-[#1FAAA3]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#1FAAA3]/10"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-[#1FAAA3]/10 rounded-lg flex items-center justify-center text-[#1FAAA3] mb-6">
                {card.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 mb-6 leading-relaxed">
                {card.description}
              </p>

              {/* Stat */}
              <div className="pt-4 border-t border-white/10">
                <div className="text-3xl font-bold text-[#1FAAA3] mb-1">
                  {card.stat}
                </div>
                <div className="text-sm text-gray-500">
                  {card.statLabel}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Toggle Button for Roadmap */}
        <div className="text-center">
          <button
            onClick={() => setShowRoadmap(!showRoadmap)}
            className="group inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#1FAAA3]/50 rounded-lg text-white font-medium transition-all duration-300"
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${showRoadmap ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>{showRoadmap ? 'Hide' : 'View'} Economic Roadmap</span>
          </button>
        </div>

        {/* Collapsible Roadmap Section */}
        {showRoadmap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-12 pt-12 border-t border-white/10"
          >
            <div className="space-y-12">
              <div className="text-center">
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                  Economic Cycle Roadmap
                </h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  A visual roadmap of the economic cycle – where we&apos;ve been, where we are today, and what may lie ahead.
                </p>
              </div>

              {/* Timeline with Pause/Play button */}
              <div className="relative flex flex-col items-center mb-4">
                <button 
                  onClick={togglePlayPause} 
                  className="bg-[#1FAAA3] hover:bg-[#17867A] text-white rounded-full p-2 mb-4 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label={isPaused ? "Play timeline animation" : "Pause timeline animation"}
                >
                  {isPaused ? (
                    // Play icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    // Pause icon
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Timeline */}
              <div className="relative flex overflow-x-auto space-x-8 pb-6 mb-10 scroll-snap-x mandatory">
                {phases.map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center flex-none scroll-snap-align-center cursor-pointer focus:outline-none`}
                    onClick={() => setActive(p)}
                  >
                    <div
                      className={`w-4 h-4 rounded-full mb-2 transition-colors duration-300 ${
                        active.id === p.id ? "bg-[#1FAAA3]" : "bg-white/50"
                      }`}
                    />
                    <span
                      className={`text-xs whitespace-nowrap font-medium ${
                        active.id === p.id ? "text-white" : "text-gray-400"
                      }`}
                    >
                      {p.years}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Metric Panel */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-white">
                  <h3 className="text-2xl font-semibold mb-2">
                    {active.title}
                  </h3>
                  <p className="leading-relaxed mb-4 text-gray-300">
                    {active.synopsis}
                  </p>
                  <p className="text-sm text-gray-400">
                    These dynamics directly influence the breakdown in stock-bond diversification and the rise of adaptive strategies you&apos;ll see in the next section.
                  </p>
                  {/* CTA after phase 4 */}
                  {active.id >= 4 && (
                    <Link href="#grow" className="group relative overflow-hidden bg-[#1FAAA3] hover:bg-[#1FAAA3]/90 text-white font-sans font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 inline-block mt-4">
                      <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
                      <span className="relative flex items-center justify-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span>See Recommended Portfolios</span>
                      </span>
                    </Link>
                  )}
                </div>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={active.chart} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 12, color: '#FFFFFF' }} />
                      <defs>
                        <linearGradient id="cycleStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#1FAAA3" />
                          <stop offset="100%" stopColor="#1A3A5F" />
                        </linearGradient>
                        <linearGradient id="cycleFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1FAAA3" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#1FAAA3" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 12 }} domain={[0, "dataMax"]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="url(#cycleStroke)"
                        strokeWidth={3}
                        dot={{ r: 4, stroke: '#FFFFFF', strokeWidth: 1, fill: '#1FAAA3' }} 
                        isAnimationActive
                      >
                        <LabelList dataKey="value" position="top" fill="#E5E7EB" fontSize={10} />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default NavigatingTurbulentTimes;
