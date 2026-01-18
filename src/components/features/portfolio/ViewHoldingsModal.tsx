/**
 * View Holdings Modal
 * Displays portfolio holdings with tickers and allocations
 */

'use client';

import React from 'react';
import { FiX, FiPieChart } from 'react-icons/fi';

interface Holding {
  ticker?: string;
  name?: string;
  percentage?: number;
  weight?: number;
  dollarAmount?: number;
}

interface ViewHoldingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioName: string;
  holdings: Holding[];
  totalValue?: number;
}

export default function ViewHoldingsModal({
  isOpen,
  onClose,
  portfolioName,
  holdings,
  totalValue
}: ViewHoldingsModalProps) {
  if (!isOpen) return null;

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getWeight = (holding: Holding): number => {
    if (holding.weight !== undefined) return holding.weight * 100;
    if (holding.percentage !== undefined) return holding.percentage;
    return 0;
  };

  const sortedHoldings = [...holdings].sort((a, b) => getWeight(b) - getWeight(a));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] rounded-2xl border border-gray-700 
          shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
              <FiPieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{portfolioName}</h2>
              {totalValue && (
                <p className="text-sm text-gray-400">Total Value: {formatCurrency(totalValue)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Holdings List */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {holdings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">No holdings data available</p>
              <p className="text-sm text-gray-500">
                This portfolio may only have allocation percentages without specific ticker symbols.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedHoldings.map((holding, index) => {
                const weight = getWeight(holding);
                const dollarValue = totalValue ? (weight / 100) * totalValue : holding.dollarAmount;

                return (
                  <div
                    key={index}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {holding.ticker && (
                            <span className="px-2 py-1 bg-teal-500/20 border border-teal-500/30 rounded text-teal-400 text-xs font-bold">
                              {holding.ticker}
                            </span>
                          )}
                          <span className="text-white font-semibold">
                            {holding.name || holding.ticker || 'Unknown'}
                          </span>
                        </div>
                        {dollarValue && (
                          <p className="text-sm text-gray-400 mt-1">
                            {formatCurrency(dollarValue)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-teal-400">{formatPercent(weight)}</p>
                      </div>
                    </div>

                    {/* Visual bar */}
                    <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-blue-500"
                        style={{ width: `${weight}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-700 bg-gray-900/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Total Holdings:</span>
            <span className="text-white font-semibold">{holdings.length}</span>
          </div>
          {holdings.length > 0 && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-400">Total Allocation:</span>
              <span className="text-white font-semibold">
                {formatPercent(sortedHoldings.reduce((sum, h) => sum + getWeight(h), 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
