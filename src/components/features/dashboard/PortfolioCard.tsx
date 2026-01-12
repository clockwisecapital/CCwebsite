'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiMoreVertical,
} from 'react-icons/fi';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  portfolio_score?: number;
  goal_probability?: number;
  total_value?: number;
  allocation?: {
    stocks: number;
    bonds: number;
    cash: number;
    realEstate?: number;
    commodities?: number;
    alternatives?: number;
  };
  risk_tolerance?: string;
  is_scenario_test?: boolean;
  scenario_name?: string;
  is_public: boolean;
}

interface PortfolioCardProps {
  portfolio: Portfolio;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onTest?: (id: string) => void;
}

export default function PortfolioCard({ portfolio, onDelete, onRename, onTest }: PortfolioCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(portfolio.name);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleView = () => {
    router.push(`/dashboard/portfolio/${portfolio.id}`);
  };

  const handleTest = () => {
    if (onTest) {
      onTest(portfolio.id);
    } else {
      // Store portfolio ID in sessionStorage and redirect to Kronos
      sessionStorage.setItem('loadPortfolioId', portfolio.id);
      router.push('/kronos');
    }
    setShowMenu(false);
  };

  const handleRename = () => {
    if (onRename && newName.trim() && newName !== portfolio.name) {
      onRename(portfolio.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleDelete = () => {
    if (onDelete && confirm(`Delete "${portfolio.name}"? This cannot be undone.`)) {
      onDelete(portfolio.id);
    }
    setShowMenu(false);
  };

  return (
    <div className="group relative bg-gray-800 rounded-xl p-6 border border-gray-700
      hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/20 
      transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setNewName(portfolio.name);
                  setIsRenaming(false);
                }
              }}
              className="w-full bg-gray-700 text-white px-3 py-1.5 rounded-lg 
                border border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
          ) : (
            <h3 className="text-xl font-bold text-white truncate group-hover:text-teal-400 transition-colors">
              {portfolio.name}
            </h3>
          )}
          {portfolio.is_scenario_test && portfolio.scenario_name && (
            <p className="text-xs text-teal-400 mt-1">
              📊 Scenario: {portfolio.scenario_name}
            </p>
          )}
        </div>
        
        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 
              hover:text-white"
          >
            <FiMoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl 
                border border-gray-600 z-20 overflow-hidden">
                <button
                  onClick={handleTest}
                  className="w-full px-4 py-3 text-left text-sm text-blue-400 hover:bg-gray-600 
                    hover:text-blue-300 transition-colors flex items-center gap-3 font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Test Portfolio
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsRenaming(true);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-600 
                    hover:text-white transition-colors flex items-center gap-3"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Rename
                </button>
                <button
                  onClick={handleView}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-600 
                    hover:text-white transition-colors flex items-center gap-3"
                >
                  <FiEye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-900/20 
                    hover:text-red-300 transition-colors flex items-center gap-3"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Portfolio Info */}
      {portfolio.total_value && (
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-1">Portfolio Value</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(portfolio.total_value)}
          </p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {portfolio.portfolio_score !== null && portfolio.portfolio_score !== undefined && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiTrendingUp className="w-4 h-4 text-teal-400" />
              <p className="text-xs text-gray-400">Score</p>
            </div>
            <p className="text-lg font-bold text-white">{portfolio.portfolio_score}</p>
          </div>
        )}
        
        {portfolio.goal_probability !== null && portfolio.goal_probability !== undefined && (
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiTrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="text-xs text-gray-400">Goal Probability</p>
            </div>
            <p className="text-lg font-bold text-emerald-400">
              {(portfolio.goal_probability * 100).toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      {/* Allocation Bar */}
      {portfolio.allocation && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">Allocation</p>
          <div className="flex h-2 rounded-full overflow-hidden">
            {portfolio.allocation.stocks > 0 && (
              <div 
                className="bg-blue-500"
                style={{ width: `${portfolio.allocation.stocks}%` }}
                title={`Stocks: ${portfolio.allocation.stocks}%`}
              />
            )}
            {portfolio.allocation.bonds > 0 && (
              <div 
                className="bg-emerald-500"
                style={{ width: `${portfolio.allocation.bonds}%` }}
                title={`Bonds: ${portfolio.allocation.bonds}%`}
              />
            )}
            {portfolio.allocation.cash > 0 && (
              <div 
                className="bg-yellow-500"
                style={{ width: `${portfolio.allocation.cash}%` }}
                title={`Cash: ${portfolio.allocation.cash}%`}
              />
            )}
            {portfolio.allocation.realEstate && portfolio.allocation.realEstate > 0 && (
              <div 
                className="bg-purple-500"
                style={{ width: `${portfolio.allocation.realEstate}%` }}
                title={`Real Estate: ${portfolio.allocation.realEstate}%`}
              />
            )}
          </div>
          <div className="flex gap-3 mt-2 text-xs">
            {portfolio.allocation.stocks > 0 && (
              <span className="text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />
                Stocks {portfolio.allocation.stocks}%
              </span>
            )}
            {portfolio.allocation.bonds > 0 && (
              <span className="text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                Bonds {portfolio.allocation.bonds}%
              </span>
            )}
            {portfolio.allocation.cash > 0 && (
              <span className="text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />
                Cash {portfolio.allocation.cash}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FiCalendar className="w-4 h-4" />
          {formatDate(portfolio.created_at)}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold 
              rounded-lg transition-colors flex items-center gap-2"
            title="Re-test this portfolio"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Test
          </button>
          <button
            onClick={handleView}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold 
              rounded-lg transition-colors flex items-center gap-2"
          >
            View
            <FiEye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Public Badge */}
      {portfolio.is_public && (
        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 
            text-emerald-400 text-xs font-semibold rounded-full">
            Public
          </span>
        </div>
      )}
    </div>
  );
}

