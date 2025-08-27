import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chartType, portfolioData, analysisData } = await request.json();

    // Generate chart configuration for frontend rendering
    const chartConfig = generateChartConfig(chartType, portfolioData, analysisData);

    return NextResponse.json({
      success: true,
      chartConfig,
      chartType
    });

  } catch (error: any) {
    console.error('Chart generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate chart', details: error.message },
      { status: 500 }
    );
  }
}

function generateChartConfig(chartType: string, portfolioData: any, analysisData?: any) {
  const config = {
    type: chartType === 'allocation' ? 'doughnut' : 'bar',
    data: generateChartData(chartType, portfolioData, analysisData),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: getChartTitle(chartType),
          font: {
            size: 16,
            weight: 'bold'
          },
          color: '#1F2937'
        },
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 20,
            usePointStyle: true,
            color: '#374151'
          }
        }
      }
    }
  };

  return config;
}

function generateChartData(chartType: string, portfolioData: any, analysisData?: any) {
  switch (chartType) {
    case 'allocation':
      return {
        labels: ['Stocks', 'Bonds', 'Cash', 'Commodities', 'Real Estate', 'Alternatives'],
        datasets: [{
          data: [
            portfolioData.stocks || 0,
            portfolioData.bonds || 0,
            portfolioData.cash || 0,
            portfolioData.commodities || 0,
            portfolioData.realEstate || 0,
            portfolioData.alternatives || 0
          ],
          backgroundColor: [
            '#3B82F6', // Blue for stocks
            '#10B981', // Green for bonds
            '#F59E0B', // Yellow for cash
            '#EF4444', // Red for commodities
            '#8B5CF6', // Purple for real estate
            '#06B6D4'  // Cyan for alternatives
          ],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      };
    case 'comparison':
      return {
        labels: ['Stocks', 'Bonds', 'Cash', 'Commodities', 'Real Estate', 'Alternatives'],
        datasets: [
          {
            label: 'Your Portfolio',
            data: [
              portfolioData.stocks || 0,
              portfolioData.bonds || 0,
              portfolioData.cash || 0,
              portfolioData.commodities || 0,
              portfolioData.realEstate || 0,
              portfolioData.alternatives || 0
            ],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3B82F6',
            borderWidth: 2
          },
          {
            label: 'TIME ETF Target',
            data: [65, 20, 5, 5, 5, 10], // Typical cycle-aware allocation
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: '#10B981',
            borderWidth: 2
          }
        ]
      };
    default:
      return { labels: [], datasets: [] };
  }
}

function getChartTitle(chartType: string): string {
  const titles = {
    allocation: 'Portfolio Allocation',
    lifecycle: 'Market Lifecycle Positioning',
    risk_return: 'Risk vs Return Analysis',
    comparison: 'Portfolio vs TIME ETF Comparison'
  };
  return titles[chartType as keyof typeof titles] || 'Portfolio Analysis';
}
