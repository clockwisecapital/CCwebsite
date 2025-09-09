'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface PortfolioChartProps {
  chartConfig: {
    type: string;
    data: unknown;
    config: unknown;
    chartData: unknown;
  };
}

export function PortfolioChart({ chartConfig }: PortfolioChartProps) {
  const { type, chartData, config } = chartConfig;

  const renderChart = () => {
    switch (type) {
      case 'allocation':
        return (
          <Pie data={chartData as never} options={config as never} />
        );
      case 'performance':
        return (
          <Line data={chartData as never} options={config as never} />
        );
      case 'comparison':
        return (
          <Line data={chartData as never} options={config as never} />
        );
      case 'analysis':
        return (
          <Bar data={chartData as never} options={config as never} />
        );
      default:
        return (
          <div className="w-full h-64 flex items-center justify-center bg-slate-800 rounded-lg">
            <p className="text-slate-400">Chart type not supported</p>
          </div>
        );
    }
  };

  const configWithTitle = config as { plugins?: { title?: { text?: string } } };

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-white text-lg font-semibold mb-4">
        {configWithTitle.plugins?.title?.text || 'Portfolio Chart'}
      </h3>
      {renderChart()}
    </div>
  );
}
