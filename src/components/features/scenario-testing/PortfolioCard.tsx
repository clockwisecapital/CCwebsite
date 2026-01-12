'use client';

import React from 'react';
import {
  FiShield,
  FiMoon,
  FiBarChart2,
  FiCloud,
  FiTarget,
  FiCpu,
  FiServer,
  FiLayers,
  FiPieChart,
  FiHome,
  FiTrendingUp,
  FiDollarSign,
  FiUmbrella,
  FiLock,
  FiCircle,
  FiZap,
  FiActivity,
  FiMinimize2,
  FiBriefcase,
  FiArrowRight,
  FiArrowUp,
} from 'react-icons/fi';

interface PortfolioCardProps {
  rank: number;
  icon: string;
  name: string;
  subtitle: string;
  metrics: {
    votes: number;
    expectedReturn: number;
    timePeriod: string;
    score: number;
  };
  onClick?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FiShield,
  FiMoon,
  FiBarChart2,
  FiCloud,
  FiTarget,
  FiCpu,
  FiServer,
  FiLayers,
  FiPieChart,
  FiHome,
  FiTrendingUp,
  FiDollarSign,
  FiUmbrella,
  FiLock,
  FiCircle,
  FiZap,
  FiActivity,
  FiMinimize2,
  FiBriefcase,
};

export default function PortfolioCard({
  rank,
  icon,
  name,
  subtitle,
  metrics,
  onClick,
}: PortfolioCardProps) {
  const IconComponent = ICON_MAP[icon] || FiShield;

  return (
    <button
      onClick={onClick}
      className="group relative w-full bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700
        hover:border-teal-500/50 hover:scale-[1.02] hover:shadow-xl 
        hover:shadow-teal-500/20 transition-all duration-300 text-left"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        {/* Rank Number and Icon/Names - Mobile Layout */}
        <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto md:flex-1">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-xl md:text-2xl font-bold text-gray-300">{rank}</span>
            </div>
          </div>

          {/* Icon and Names */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 
              flex items-center justify-center border border-teal-500/30">
              <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-xl font-bold text-white mb-0.5 md:mb-1 truncate">{name}</h3>
              <p className="text-xs md:text-sm text-gray-400 truncate">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap w-full md:w-auto">
          {/* Votes */}
          <div className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-gray-700/50 border border-gray-600">
            <FiArrowUp className="w-3 h-3 md:w-4 md:h-4 text-teal-400" />
            <span className="text-xs md:text-sm font-semibold text-gray-300">
              {metrics.votes.toLocaleString()}
            </span>
          </div>

          {/* Expected Return */}
          <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-teal-500/20 border border-teal-500/30">
            <span className="text-xs md:text-sm font-bold text-teal-400">
              {metrics.expectedReturn}%
            </span>
          </div>

          {/* Time Period */}
          <div className="px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-gray-700/50 border border-gray-600">
            <span className="text-xs font-semibold text-gray-400">
              {metrics.timePeriod}
            </span>
          </div>

          {/* Score */}
          <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-teal-600 min-w-[70px] md:min-w-[90px] text-center">
            <span className="text-xs md:text-sm font-bold text-white">
              score {metrics.score}
            </span>
          </div>

          {/* Arrow */}
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 group-hover:bg-teal-600 
            flex items-center justify-center transition-colors duration-300">
            <FiArrowRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-white" />
          </div>
        </div>
      </div>
    </button>
  );
}

