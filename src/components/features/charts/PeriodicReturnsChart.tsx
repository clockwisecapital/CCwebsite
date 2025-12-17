'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PeriodicReturnsChartProps {
  portfolioNames: string[];
  periodNames: string[];
  returnsByPeriod: Record<string, Record<string, number | null>>;
  benchmarkReturns: Record<string, number | null>;
  benchmarkName: string;
}

/**
 * Portfolio colors - matching cumulative chart
 */
const PORTFOLIO_COLORS = [
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

const BENCHMARK_COLOR = '#f59e0b'; // Amber

/**
 * Format percentage for display
 */
function formatPercent(value: number | null): string {
  if (value === null) return '-';
  return `${(value * 100).toFixed(2)}%`;
}

export default function PeriodicReturnsChart({
  portfolioNames,
  periodNames,
  returnsByPeriod,
  benchmarkReturns,
  benchmarkName,
}: PeriodicReturnsChartProps) {
  // Transform data for Recharts
  const chartData = periodNames.map(period => {
    const dataPoint: Record<string, any> = {
      period,
    };
    
    // Add portfolio returns
    portfolioNames.forEach(name => {
      const value = returnsByPeriod[period]?.[name];
      dataPoint[name] = value !== null && value !== undefined ? value * 100 : null;
    });
    
    // Add benchmark return
    const benchmarkValue = benchmarkReturns[period];
    dataPoint[benchmarkName] = benchmarkValue !== null && benchmarkValue !== undefined ? benchmarkValue * 100 : null;
    
    return dataPoint;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Periodic Returns</h3>
        <p className="text-sm text-gray-500 mt-1">
          As of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={(value: any) => {
              if (value === null || value === undefined) return ['-', ''];
              return [`${Number(value).toFixed(2)}%`, ''];
            }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {/* Render portfolio bars */}
          {portfolioNames.map((name, index) => (
            <Bar
              key={name}
              dataKey={name}
              fill={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
          
          {/* Render benchmark bar */}
          <Bar
            dataKey={benchmarkName}
            fill={BENCHMARK_COLOR}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gray-500 italic border-t pt-3">
        <p>Periodic returns for periods longer than one year are annualized.</p>
      </div>
    </div>
  );
}

