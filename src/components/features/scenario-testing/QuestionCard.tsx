'use client';

import React from 'react';
import { 
  FiClock, 
  FiZap, 
  FiTrendingDown, 
  FiTrendingUp, 
  FiDollarSign,
  FiArrowRight,
  FiAward
} from 'react-icons/fi';

interface QuestionCardProps {
  rank: number;
  icon: string;
  title: string;
  subtitle: string;
  question: string;
  stats: {
    percentageBadge: string;
    timePeriod: string;
    investorCount: number;
  };
  winningPortfolio: {
    name: string;
    score: number;
  };
  onClick?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FiClock,
  FiZap,
  FiTrendingDown,
  FiTrendingUp,
  FiDollarSign,
};

export default function QuestionCard({
  rank,
  icon,
  title,
  subtitle,
  question,
  stats,
  winningPortfolio,
  onClick,
}: QuestionCardProps) {
  const IconComponent = ICON_MAP[icon] || FiClock;

  return (
    <button
      onClick={onClick}
      className="group relative w-full bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-700
        hover:border-teal-500/50 hover:scale-[1.02] hover:shadow-xl 
        hover:shadow-teal-500/20 transition-all duration-300 text-left"
    >
      <div className="flex items-start gap-3 md:gap-6">
        {/* Rank Number */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-xl md:text-2xl font-bold text-gray-300">{rank}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Icon and Title */}
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <IconComponent className="w-4 h-4 md:w-5 md:h-5 text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-xl font-bold text-white truncate">{title}</h3>
              <p className="text-xs text-gray-400 truncate">{subtitle}</p>
            </div>
          </div>

          {/* Question */}
          <p className="text-sm md:text-base text-gray-200 mb-3 md:mb-4">{question}</p>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
            <span className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded-full 
              bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-semibold">
              {stats.percentageBadge}
            </span>
            <span className="inline-flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 rounded-full 
              bg-gray-700 border border-gray-600 text-gray-300 text-xs font-semibold">
              {stats.timePeriod}
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">
              Investors testing: <span className="font-semibold text-gray-300">{stats.investorCount.toLocaleString()}</span> this week
            </span>
          </div>

          {/* Winning Portfolio */}
          <div className="flex items-center gap-2 text-xs md:text-sm flex-wrap">
            <FiAward className="w-3 h-3 md:w-4 md:h-4 text-accent-gold" />
            <span className="text-gray-400">
              <span className="font-semibold text-white">{winningPortfolio.name}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-gold/20 
              border border-accent-gold/30 text-accent-gold text-xs font-bold">
              Winner
            </span>
          </div>
        </div>

        {/* Score and Arrow */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2 md:gap-3">
          <div className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-teal-600 text-white font-bold text-sm md:text-lg min-w-[70px] md:min-w-[80px] text-center">
            <span className="hidden md:inline">score </span>{winningPortfolio.score}
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-700 group-hover:bg-teal-600 
            flex items-center justify-center transition-colors duration-300">
            <FiArrowRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-white" />
          </div>
        </div>
      </div>
    </button>
  );
}

