'use client';

import React from 'react';
import {
  FiClock,
  FiZap,
  FiTrendingDown,
  FiTrendingUp,
  FiDollarSign,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';

interface ScenarioHeaderProps {
  icon: string;
  title: string;
  subtitle: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FiClock,
  FiZap,
  FiTrendingDown,
  FiTrendingUp,
  FiDollarSign,
};

export default function ScenarioHeader({
  icon,
  title,
  subtitle,
  isCollapsible = false,
  isCollapsed = false,
  onToggle,
}: ScenarioHeaderProps) {
  const IconComponent = ICON_MAP[icon] || FiClock;

  const content = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
          <IconComponent className="w-6 h-6 text-teal-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>
      
      {isCollapsible && (
        <div className="flex-shrink-0">
          {isCollapsed ? (
            <FiChevronDown className="w-6 h-6 text-gray-400" />
          ) : (
            <FiChevronUp className="w-6 h-6 text-gray-400" />
          )}
        </div>
      )}
    </div>
  );

  if (isCollapsible) {
    return (
      <button
        onClick={onToggle}
        className="w-full bg-gray-800/50 rounded-xl p-6 border border-gray-700
          hover:border-gray-600 transition-all duration-300 text-left"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      {content}
    </div>
  );
}


