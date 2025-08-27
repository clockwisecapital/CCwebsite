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
    data: any;
    config: any;
    chartData: any;
  };
}

export function PortfolioChart({ chartConfig }: PortfolioChartProps) {
  const { type, chartData, config } = chartConfig;

  const renderChart = () => {
    switch (type) {
      case 'allocation':
        return (
          <div className="w-full h-64">
            <Pie data={chartData} options={config} />
          </div>
        );
      case 'lifecycle':
        return (
          <div className="w-full h-64">
            <Line data={chartData} options={config} />
          </div>
        );
      case 'risk_return':
        return (
          <div className="w-full h-64">
            <Line data={chartData} options={config} />
          </div>
        );
      case 'comparison':
        return (
          <div className="w-full h-64">
            <Bar data={chartData} options={config} />
          </div>
        );
      default:
        return (
          <div className="w-full h-64 flex items-center justify-center bg-slate-800 rounded-lg">
            <p className="text-slate-400">Chart type not supported</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h3 className="text-white text-lg font-semibold mb-4">
        {config.plugins?.title?.text || 'Portfolio Chart'}
      </h3>
      {renderChart()}
    </div>
  );
}
