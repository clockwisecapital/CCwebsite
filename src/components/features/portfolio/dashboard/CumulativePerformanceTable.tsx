'use client';

import { useState, useEffect } from 'react';
import type { ClockwisePortfolio } from '@/app/api/admin/portfolios/route';

interface CumulativePerformanceTableProps {
  className?: string;
}

/**
 * Format percentage value for display
 */
function formatPct(value: number | null, decimals: number = 1): string {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format numeric value for display
 */
function formatNum(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined) return '-';
  return value.toFixed(decimals);
}

/**
 * 3-Year Cumulative Performance Table Component
 * 
 * Displays Clockwise model portfolio performance metrics.
 * Fetches data from the clockwise_portfolios Supabase table.
 * Styled with dark blue theme to match the Review tab.
 */
export default function CumulativePerformanceTable({ className = '' }: CumulativePerformanceTableProps) {
  const [portfolios, setPortfolios] = useState<ClockwisePortfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/portfolios');
        const result = await response.json();
        
        if (result.success) {
          setPortfolios(result.data);
        } else {
          setError(result.message || 'Failed to load portfolio data');
        }
      } catch (err) {
        console.error('Error fetching portfolios:', err);
        setError('Failed to load portfolio data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolios();
  }, []);

  // Separate portfolios from benchmark
  const modelPortfolios = portfolios.filter(p => !p.is_benchmark);
  const benchmark = portfolios.find(p => p.is_benchmark);

  // Define metrics to display
  const metrics = [
    { key: 'return_3y', label: 'Return', formatter: (v: number | null) => formatPct(v, 2) },
    { key: 'std_dev', label: 'Std Dev', formatter: (v: number | null) => formatPct(v, 1) },
    { key: 'alpha', label: 'Alpha', formatter: (v: number | null) => formatPct(v, 1) },
    { key: 'beta', label: 'Beta', formatter: (v: number | null) => formatNum(v) },
    { key: 'sharpe_ratio', label: 'Sharpe Ratio', formatter: (v: number | null) => formatNum(v) },
    { key: 'max_drawdown', label: 'Max Drawdown', formatter: (v: number | null) => formatPct(v, 1) },
  ];

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-2xl p-6 border border-gray-700 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-teal-500/30 rounded-full border-t-teal-500 animate-spin"></div>
          <span className="ml-3 text-gray-400">Loading portfolio data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 rounded-2xl p-6 border border-gray-700 ${className}`}>
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-2xl p-6 border border-gray-700 ${className}`}>
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-400">No portfolio data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-cyan-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">3-Year Cumulative Performance</h3>
            <p className="text-xs text-gray-400">Key metrics across all portfolios</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider w-32">
                Metric
              </th>
              {modelPortfolios.map(portfolio => (
                <th 
                  key={portfolio.id} 
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider min-w-[100px]"
                >
                  {portfolio.name.replace('Clockwise ', '')}
                </th>
              ))}
              {benchmark && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px]">
                  {benchmark.name}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {metrics.map((metric, index) => (
              <tr 
                key={metric.key} 
                className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-300">
                  {metric.label}
                </td>
                {modelPortfolios.map(portfolio => {
                  const value = portfolio[metric.key as keyof ClockwisePortfolio] as number | null;
                  const isReturn = metric.key === 'return_3y';
                  const isPositive = value !== null && value > 0;
                  
                  return (
                    <td 
                      key={portfolio.id}
                      className={`px-4 py-3 text-sm text-right font-semibold ${
                        isReturn 
                          ? isPositive ? 'text-emerald-400' : 'text-rose-400'
                          : 'text-gray-100'
                      }`}
                    >
                      {metric.formatter(value)}
                    </td>
                  );
                })}
                {benchmark && (
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-400">
                    {metric.key === 'alpha' 
                      ? '0.0%'  // Benchmark alpha is always 0
                      : metric.key === 'beta'
                      ? '1.00'  // Benchmark beta is always 1
                      : metric.formatter(benchmark[metric.key as keyof ClockwisePortfolio] as number | null)
                    }
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with capture ratios */}
      <div className="px-4 md:px-6 py-4 border-t border-gray-700 bg-gray-800/50">
        <div className="flex flex-wrap gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-300">Up Capture:</span>
            {modelPortfolios.map(p => (
              <span key={p.id} className="text-gray-100">{formatNum(p.up_capture)}</span>
            ))}
            {benchmark && <span className="text-gray-500">1.00</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-300">Down Capture:</span>
            {modelPortfolios.map(p => (
              <span key={p.id} className="text-gray-100">{formatNum(p.down_capture)}</span>
            ))}
            {benchmark && <span className="text-gray-500">1.00</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

