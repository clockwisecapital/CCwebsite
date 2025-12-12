'use client'

import { useState } from 'react'
import type { MultiPortfolioResult, PeriodMetrics } from '@/lib/portfolio-metrics'

interface PortfolioPerformanceTableProps {
  data: MultiPortfolioResult
  selectedPortfolio?: string
}

/**
 * Format percentage value for display
 */
function formatPct(value: number | null, decimals: number = 1): string {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format numeric value for display
 */
function formatNum(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined) return '-'
  return value.toFixed(decimals)
}

/**
 * Portfolio Performance Table Component
 * 
 * Displays Kwanti-style risk metrics comparing portfolio vs S&P 500 benchmark.
 * Matches the format from industry-standard portfolio analytics platforms.
 */
export default function PortfolioPerformanceTable({
  data,
  selectedPortfolio
}: PortfolioPerformanceTableProps) {
  const portfolioNames = Object.keys(data.portfolios)
  const [activePortfolio, setActivePortfolio] = useState(
    selectedPortfolio || portfolioNames[0]
  )

  const portfolioResult = data.portfolios[activePortfolio]
  if (!portfolioResult) {
    return <div className="text-red-600">Portfolio not found</div>
  }

  const periods = portfolioResult.periods
  const periodNames = periods.map(p => p.periodName)

  // Define metrics to display
  const metricsConfig: Array<{
    label: string
    portfolioKey: keyof PeriodMetrics
    benchmarkKey: keyof PeriodMetrics
    formatter: (v: number | null) => string
  }> = [
    {
      label: 'Risk (standard deviation)',
      portfolioKey: 'portfolioStdDev',
      benchmarkKey: 'benchmarkStdDev',
      formatter: (v) => formatPct(v, 1)
    },
    {
      label: 'Alpha',
      portfolioKey: 'portfolioAlpha',
      benchmarkKey: 'benchmarkAlpha',
      formatter: (v) => formatPct(v, 1)
    },
    {
      label: 'Beta',
      portfolioKey: 'portfolioBeta',
      benchmarkKey: 'benchmarkBeta',
      formatter: (v) => formatNum(v, 2)
    },
    {
      label: 'Sharpe ratio',
      portfolioKey: 'portfolioSharpeRatio',
      benchmarkKey: 'benchmarkSharpeRatio',
      formatter: (v) => formatNum(v, 2)
    },
    {
      label: 'Maximum drawdown',
      portfolioKey: 'portfolioMaxDrawdown',
      benchmarkKey: 'benchmarkMaxDrawdown',
      formatter: (v) => formatPct(v, 1)
    },
    {
      label: 'Up capture ratio',
      portfolioKey: 'portfolioUpCapture',
      benchmarkKey: 'benchmarkUpCapture',
      formatter: (v) => formatNum(v, 2)
    },
    {
      label: 'Down capture ratio',
      portfolioKey: 'portfolioDownCapture',
      benchmarkKey: 'benchmarkDownCapture',
      formatter: (v) => formatNum(v, 2)
    }
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Performance</h2>
            <p className="text-sm text-gray-500 mt-1">
              As of {data.asOfDate}
            </p>
          </div>
          
          {/* Portfolio selector */}
          {portfolioNames.length > 1 && (
            <select
              value={activePortfolio}
              onChange={(e) => setActivePortfolio(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {portfolioNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Returns Section */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Periodic Returns</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-sm font-medium text-gray-500 w-64"></th>
                {periodNames.map(name => (
                  <th key={name} className="text-right py-2 px-3 text-sm font-medium text-gray-500 min-w-[80px]">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Portfolio row */}
              <tr>
                <td className="py-2 pr-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 mr-3 flex-shrink-0"></span>
                    <span className="text-sm font-medium text-gray-900">{activePortfolio}</span>
                  </div>
                </td>
                {periods.map(p => (
                  <td key={p.periodName} className="py-2 px-3 text-right text-sm font-medium text-gray-900">
                    {formatPct(p.portfolioReturn, 2)}
                  </td>
                ))}
              </tr>
              {/* Benchmark row */}
              <tr>
                <td className="py-2 pr-4">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-orange-400 mr-3 flex-shrink-0"></span>
                    <span className="text-sm font-medium text-gray-700">$SPX</span>
                  </div>
                </td>
                {periods.map(p => (
                  <td key={p.periodName} className="py-2 px-3 text-right text-sm text-gray-700">
                    {formatPct(p.benchmarkReturn, 2)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Metrics Section */}
      <div className="px-6 py-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Risk metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-sm font-medium text-gray-500 w-64"></th>
                {periodNames.map(name => (
                  <th key={name} className="text-right py-2 px-3 text-sm font-medium text-gray-500 min-w-[80px]">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricsConfig.map((metric, index) => (
                <MetricRows
                  key={metric.label}
                  label={metric.label}
                  portfolioName={activePortfolio}
                  periods={periods}
                  portfolioKey={metric.portfolioKey}
                  benchmarkKey={metric.benchmarkKey}
                  formatter={metric.formatter}
                  isFirst={index === 0}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Benchmark note */}
        <p className="text-xs text-gray-500 mt-4">
          The benchmark used to calculate alpha, beta, capture ratio is: S&P 500 Index TR
        </p>
      </div>

      {/* 3Y Cumulative Section */}
      {portfolioResult.cumulative3Y && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <h3 className="text-base font-semibold text-gray-900 mb-3">3-Year Cumulative</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Return</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatPct(portfolioResult.cumulative3Y.portfolioReturn, 2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Alpha</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatPct(portfolioResult.cumulative3Y.portfolioAlpha, 2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sharpe Ratio</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNum(portfolioResult.cumulative3Y.portfolioSharpeRatio)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Max Drawdown</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatPct(portfolioResult.cumulative3Y.portfolioMaxDrawdown, 1)}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/**
 * Metric rows component - renders portfolio and benchmark rows for a single metric
 */
function MetricRows({
  label,
  portfolioName,
  periods,
  portfolioKey,
  benchmarkKey,
  formatter,
  isFirst
}: {
  label: string
  portfolioName: string
  periods: PeriodMetrics[]
  portfolioKey: keyof PeriodMetrics
  benchmarkKey: keyof PeriodMetrics
  formatter: (v: number | null) => string
  isFirst: boolean
}) {
  return (
    <>
      {/* Metric label row */}
      <tr>
        <td colSpan={periods.length + 1} className={`pt-4 pb-1 ${isFirst ? '' : 'border-t border-gray-100'}`}>
          <span className="text-sm font-medium text-gray-900">{label}</span>
        </td>
      </tr>
      {/* Portfolio value row */}
      <tr>
        <td className="py-1 pr-4 pl-4">
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">{portfolioName}</span>
          </div>
        </td>
        {periods.map(p => {
          const value = p[portfolioKey] as number | null
          // Bold values that are better than benchmark
          const benchmarkValue = p[benchmarkKey] as number | null
          const isBetter = compareBetterValue(portfolioKey, value, benchmarkValue)
          return (
            <td 
              key={p.periodName} 
              className={`py-1 px-3 text-right text-sm ${isBetter ? 'font-bold text-gray-900' : 'text-gray-700'}`}
            >
              {formatter(value)}
            </td>
          )
        })}
      </tr>
      {/* Benchmark value row */}
      <tr>
        <td className="py-1 pr-4 pl-4">
          <div className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 mr-2.5 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">$SPX</span>
          </div>
        </td>
        {periods.map(p => {
          const value = p[benchmarkKey] as number | null
          const portfolioValue = p[portfolioKey] as number | null
          const isBetter = compareBetterValue(portfolioKey, value, portfolioValue)
          return (
            <td 
              key={p.periodName} 
              className={`py-1 px-3 text-right text-sm ${isBetter ? 'font-bold text-gray-900' : 'text-gray-700'}`}
            >
              {formatter(value)}
            </td>
          )
        })}
      </tr>
    </>
  )
}

/**
 * Determine if value1 is "better" than value2 for a given metric
 */
function compareBetterValue(
  metricKey: keyof PeriodMetrics,
  value1: number | null,
  value2: number | null
): boolean {
  if (value1 === null || value2 === null) return false
  
  // For these metrics, higher is better
  const higherIsBetter = [
    'portfolioReturn', 'portfolioAlpha', 'portfolioSharpeRatio', 
    'portfolioUpCapture', 'benchmarkReturn', 'benchmarkSharpeRatio'
  ]
  
  // For these metrics, lower is better
  const lowerIsBetter = [
    'portfolioStdDev', 'portfolioMaxDrawdown', 'portfolioDownCapture',
    'benchmarkStdDev', 'benchmarkMaxDrawdown'
  ]
  
  // Beta - closer to 1 is neutral, context matters
  if (metricKey.includes('Beta')) {
    return false // Don't highlight beta
  }
  
  if (higherIsBetter.includes(metricKey as string)) {
    return value1 > value2
  }
  
  if (lowerIsBetter.includes(metricKey as string)) {
    return value1 < value2 // Lower drawdown/downside capture is better
  }
  
  return false
}

/**
 * Comparison Table - shows all portfolios side by side
 */
export function PortfolioComparisonTable({
  data
}: {
  data: MultiPortfolioResult
}) {
  const { comparison } = data
  const portfolioNames = comparison.portfolioNames
  const periodNames = comparison.periodNames

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900">Portfolio Comparison</h2>
        <p className="text-sm text-gray-500 mt-1">As of {data.asOfDate}</p>
      </div>

      {periodNames.map(periodName => (
        <div key={periodName} className="border-b border-gray-100 last:border-b-0">
          <div className="px-6 py-3 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">{periodName}</h3>
          </div>
          <div className="px-6 py-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-sm font-medium text-gray-500 w-40">Metric</th>
                  {portfolioNames.map(name => (
                    <th key={name} className="text-right py-2 px-3 text-sm font-medium text-gray-500 min-w-[100px]">
                      {name.replace('Clockwise ', '')}
                    </th>
                  ))}
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 min-w-[100px]">
                    S&P 500 TR
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(comparison.metrics).map(([key, metric]) => (
                  <tr key={key} className="border-t border-gray-50">
                    <td className="py-2 pr-4 text-sm text-gray-700">{metric.displayName}</td>
                    {portfolioNames.map(name => {
                      const value = metric.byPeriod[periodName]?.[name]
                      const isPercent = ['return', 'stdDev', 'alpha', 'maxDrawdown'].includes(key)
                      return (
                        <td key={name} className="py-2 px-3 text-right text-sm text-gray-900">
                          {isPercent ? formatPct(value, 1) : formatNum(value)}
                        </td>
                      )
                    })}
                    <td className="py-2 px-3 text-right text-sm text-gray-600">
                      {(() => {
                        const value = metric.benchmark[periodName]
                        const isPercent = ['return', 'stdDev', 'alpha', 'maxDrawdown'].includes(key)
                        return isPercent ? formatPct(value, 1) : formatNum(value)
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

