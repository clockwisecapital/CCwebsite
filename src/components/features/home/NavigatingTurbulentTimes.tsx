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

  // Automatically cycle through phases every 5 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const currentIndex = phases.findIndex((ph) => ph.id === prev.id);
        const next = phases[(currentIndex + 1) % phases.length];
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="relative w-full bg-white bg-cover bg-center text-gray-200 px-4"
      style={{ backgroundImage: "url(/navigationsection/hidimba_Lufthansa_flight_departure_from_Toulouse_Airport_early__000dadca-0c15-4825-a4b4-cff6af17ca09.png)" }}
      aria-hidden="true"
    >
      {/* heavy tint overlay */}
      <div className="absolute inset-0 -z-10 bg-black/70 mix-blend-multiply z-10" aria-hidden="true" />
      <div className="container relative z-10 py-24 md:py-32 space-y-20">
        <h2 className="text-3xl md:text-4xl font-semibold text-center text-white mb-2">
          Navigating Turbulent Times
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full" />
        <p className="text-center text-white mx-auto md:whitespace-nowrap md:text-lg">
          A visual roadmap of the economic cycle – where we’ve been, where we are today, and what may lie ahead.
        </p>

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
                  active.id === p.id ? "bg-teal-300" : "bg-white"
                }`}
              />
              <span
                className={`text-xs whitespace-nowrap font-medium ${
                  active.id === p.id ? "text-white" : "text-white"
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
            <p className="leading-relaxed mb-4">
              {active.synopsis}
            </p>
            <p className="text-sm">
              These dynamics directly influence the breakdown in stock-bond diversification and the rise of adaptive strategies you’ll see in the next section.
            </p>
            {/* CTA after phase 4 */}
            {active.id >= 4 && (
              <Link href="#investment-options" className="group relative overflow-hidden bg-[#1FAAA3] text-white font-sans font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 inline-block mt-4">
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
                  dot={{ r: 4, stroke: '#FFFFFF', strokeWidth: 1, fill: '#1FAAA3' }} isAnimationActive>
                  <LabelList dataKey="value" position="top" fill="#E5E7EB" fontSize={10} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NavigatingTurbulentTimes;
