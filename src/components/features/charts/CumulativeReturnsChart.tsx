'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { sortPortfolioNames, getPortfolioColor } from '@/lib/portfolio-order';

interface CumulativeReturnsChartProps {
  dates: string[];
  benchmarkName: string;
  benchmarkReturns: number[];
  benchmarkFinalReturn: number;
  portfolios: Record<string, {
    returns: number[];
    finalReturn: number;
  }>;
  chartTitle: string;
}

/**
 * Format date for display (show year or month depending on data density)
 */
function formatDate(dateStr: string, index: number, totalPoints: number): string {
  const date = new Date(dateStr);
  
  // If we have lots of data points, show fewer labels
  if (totalPoints > 50) {
    // Show only Jan or every 3 months
    const month = date.getMonth();
    if (month === 0) {
      return date.getFullYear().toString();
    }
    return '';
  }
  
  // For fewer points, show month abbreviation
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/**
 * Format percentage for display
 */
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function CumulativeReturnsChart({
  dates,
  benchmarkName,
  benchmarkReturns,
  benchmarkFinalReturn,
  portfolios,
  chartTitle,
}: CumulativeReturnsChartProps) {
  // Transform data for Recharts
  const chartData = dates.map((date, index) => {
    const dataPoint: Record<string, any> = {
      date,
      dateLabel: formatDate(date, index, dates.length),
      [benchmarkName]: benchmarkReturns[index] * 100, // Convert to percentage
    };
    
    // Add portfolio returns
    Object.entries(portfolios).forEach(([name, data]) => {
      dataPoint[name] = data.returns[index] * 100;
    });
    
    return dataPoint;
  });

  // Get portfolio names for legend (sorted in standard order)
  const portfolioNames = sortPortfolioNames(Object.keys(portfolios));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{chartTitle}</h3>
        <p className="text-sm text-gray-500 mt-1">
          Total return • {dates[0]} - {dates[dates.length - 1]}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#d1d5db' }}
            tickFormatter={(value) => `${value}%`}
            label={{ value: 'Total Return', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
          />
          <Tooltip
            formatter={(value: any) => [`${Number(value).toFixed(2)}%`, '']}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          {/* Render portfolio lines in sorted order */}
          {portfolioNames.map((name) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={getPortfolioColor(name)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
          
          {/* Render benchmark line last */}
          <Line
            type="monotone"
            dataKey={benchmarkName}
            stroke={getPortfolioColor(benchmarkName)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            content={(props) => {
              // Custom legend to control order and display
              const items = [
                ...portfolioNames.map((name) => ({
                  value: `${name} (${formatPercent(portfolios[name].finalReturn)})`,
                  color: getPortfolioColor(name),
                })),
                {
                  value: `${benchmarkName} (${formatPercent(benchmarkFinalReturn)})`,
                  color: getPortfolioColor(benchmarkName),
                }
              ];

              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', paddingTop: '20px' }}>
                  {items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: item.color,
                        marginRight: '6px',
                        borderRadius: '2px'
                      }} />
                      <span style={{ color: '#374151' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gray-500 border-t pt-3">
        <p>Prepared: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </div>
  );
}

