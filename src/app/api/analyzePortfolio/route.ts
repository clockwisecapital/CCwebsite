import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PortfolioData {
  stocks: number;
  bonds: number;
  cash: number;
  commodities: number;
  realEstate: number;
  alternatives: number;
  topHoldings: string[];
  sectorExposure: string[];
  currentValue: number;
  goalType: 'Annual Income' | 'Lump Sum';
  goalAmount: number;
}

interface AnalysisRequest {
  mode: 'standard' | 'agent';
  portfolioData: PortfolioData;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: AnalysisRequest = await request.json();
    const { mode, portfolioData, conversationHistory = [] } = body;

    // Validate portfolio data
    const totalAllocation = portfolioData.stocks + portfolioData.bonds + portfolioData.cash + 
                           portfolioData.commodities + portfolioData.realEstate + portfolioData.alternatives;
    
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return NextResponse.json(
        { error: 'Portfolio allocation must total 100%' },
        { status: 400 }
      );
    }

    // Calculate portfolio metrics
    const portfolioBreakdown = calculatePortfolioBreakdown(portfolioData);
    const marketCycleAnalysis = await analyzeMarketCycles(mode);
    const timeEtfComparison = calculateTimeEtfComparison(portfolioData);
    const riskAssessment = calculateRiskMetrics(portfolioData);
    const goalAlignment = analyzeGoalAlignment(portfolioData, riskAssessment);
    
    // Generate AI analysis narrative
    const analysisNarrative = await generateAnalysisNarrative(
      mode,
      portfolioData,
      portfolioBreakdown,
      marketCycleAnalysis,
      timeEtfComparison,
      riskAssessment,
      goalAlignment
    );

    const result = {
      portfolioBreakdown,
      marketCycleAnalysis,
      timeEtfComparison,
      riskAssessment,
      goalAlignment,
      analysisNarrative,
      recommendations: await generateRecommendations(mode, portfolioData, riskAssessment),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

function calculatePortfolioBreakdown(portfolioData: PortfolioData) {
  return {
    assetAllocation: {
      stocks: portfolioData.stocks,
      bonds: portfolioData.bonds,
      cash: portfolioData.cash,
      commodities: portfolioData.commodities,
      realEstate: portfolioData.realEstate,
      alternatives: portfolioData.alternatives,
    },
    totalValue: portfolioData.currentValue,
    topHoldings: portfolioData.topHoldings,
    sectorExposure: portfolioData.sectorExposure,
  };
}

async function analyzeMarketCycles(mode: 'standard' | 'agent') {
  // Economic cycle phases based on Ray Dalio's framework
  const debtCyclePhases = ['Early Expansion', 'Mid-Cycle', 'Late-Cycle', 'Deleveraging', 'Reflation/Reset'] as const;
  const sp500Stages = ['Early Bull', 'Mid Bull', 'Late Bull', 'Bear Market', 'Recovery'];
  
  let contextualAnalysis = '';
  
  if (mode === 'agent') {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst. Provide current market cycle analysis based on Ray Dalio\'s Long-Term Debt Cycle and recent economic indicators.'
          },
          {
            role: 'user',
            content: 'What is the current phase of the economic cycle and S&P 500 lifecycle stage based on recent market conditions?'
          }
        ],
        max_tokens: 300,
      });
      
      contextualAnalysis = completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
    }
  }

  return {
    debtCyclePhase: debtCyclePhases[Math.floor(Math.random() * debtCyclePhases.length)],
    sp500LifecycleStage: sp500Stages[Math.floor(Math.random() * sp500Stages.length)],
    contextualAnalysis,
  };
}

function calculateTimeEtfComparison(portfolioData: PortfolioData) {
  // Mock TIME ETF comparison (in production, use real ETF data)
  const sectorConcentration: Record<string, number> = {
    'Technology': Math.random() * 30 + 10,
    'Healthcare': Math.random() * 20 + 5,
    'Financial': Math.random() * 20 + 5,
    'Consumer': Math.random() * 15 + 5,
    'Industrial': Math.random() * 15 + 5,
    'Energy': Math.random() * 10 + 2,
    'Utilities': Math.random() * 8 + 2,
    'Materials': Math.random() * 8 + 2,
  };

  return {
    betaVsSpy: Math.random() * 0.6 + 0.7,
    betaVsTime: Math.random() * 0.8 + 0.6,
    correlation: Math.random() * 0.4 + 0.6,
    sectorConcentration,
  };
}

function calculateRiskMetrics(portfolioData: PortfolioData) {
  // Calculate risk metrics based on asset allocation
  const stockWeight = portfolioData.stocks / 100;
  const bondWeight = portfolioData.bonds / 100;
  
  // Mock calculations (in production, use real historical data)
  const volatility = stockWeight * 0.16 + bondWeight * 0.04 + 0.02; // Base volatility
  const sharpeRatio = Math.max(0.3, Math.random() * 1.5 + 0.5);
  const beta = stockWeight * 1.0 + bondWeight * 0.2 + Math.random() * 0.3;

  return {
    volatility1Y: volatility,
    volatility3Y: volatility * 0.9,
    volatility5Y: volatility * 0.85,
    sharpeRatio,
    beta,
    concentrationRisk: calculateConcentrationRisk(portfolioData),
  };
}

function calculateConcentrationRisk(portfolioData: PortfolioData): string {
  const maxAllocation = Math.max(
    portfolioData.stocks,
    portfolioData.bonds,
    portfolioData.cash,
    portfolioData.commodities,
    portfolioData.realEstate,
    portfolioData.alternatives
  );

  if (maxAllocation > 70) return 'High';
  if (maxAllocation > 50) return 'Medium';
  return 'Low';
}

function analyzeGoalAlignment(portfolioData: PortfolioData, riskMetrics: any) {
  const stockWeight = portfolioData.stocks / 100;
  const expectedReturn = stockWeight * 0.10 + (1 - stockWeight) * 0.04; // Simplified expected return
  
  const yearsToGoal = portfolioData.goalType === 'Annual Income' 
    ? portfolioData.goalAmount / (portfolioData.currentValue * 0.04) // Assume 4% withdrawal
    : Math.log(portfolioData.goalAmount / portfolioData.currentValue) / Math.log(1 + expectedReturn);

  return {
    expectedAnnualReturn: expectedReturn,
    yearsToGoal: Math.max(1, yearsToGoal),
    probabilityOfSuccess: Math.min(0.95, Math.max(0.1, 0.7 + (expectedReturn - 0.06) * 2)),
    alignmentScore: stockWeight > 0.6 && portfolioData.goalType === 'Lump Sum' ? 'Good' : 'Needs Review',
  };
}

async function generateAnalysisNarrative(
  mode: 'standard' | 'agent',
  portfolioData: PortfolioData,
  portfolioBreakdown: any,
  marketCycleAnalysis: any,
  timeEtfComparison: any,
  riskAssessment: any,
  goalAlignment: any
) {
  try {
    const model = mode === 'standard' ? 'gpt-4.1-mini' : 'gpt-4.1';
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a professional financial advisor specializing in portfolio analysis through market cycles. Provide a comprehensive analysis narrative that covers:
1. Portfolio position in current economic cycles
2. Risk assessment and concentration analysis
3. Goal alignment evaluation
4. Specific recommendations for improvement

Be conversational, insightful, and actionable. Reference specific metrics and cycle positioning.`
        },
        {
          role: 'user',
          content: `Analyze this portfolio:

Asset Allocation: ${portfolioData.stocks}% stocks, ${portfolioData.bonds}% bonds, ${portfolioData.cash}% cash, ${portfolioData.commodities}% commodities, ${portfolioData.realEstate}% real estate, ${portfolioData.alternatives}% alternatives

Portfolio Value: $${portfolioData.currentValue?.toLocaleString() || 'Not specified'}
Goal: ${portfolioData.goalType || 'Not specified'} of $${portfolioData.goalAmount?.toLocaleString() || 'Not specified'}

Risk Metrics:
- Volatility: ${(riskAssessment.volatility1Y * 100).toFixed(1)}%
- Sharpe Ratio: ${riskAssessment.sharpeRatio.toFixed(2)}
- Beta: ${riskAssessment.beta.toFixed(2)}
- Concentration Risk: ${riskAssessment.concentrationRisk}

Market Cycle: ${marketCycleAnalysis.debtCyclePhase} phase, S&P 500 in ${marketCycleAnalysis.sp500LifecycleStage}

TIME ETF Comparison:
- Beta vs TIME: ${timeEtfComparison.betaVsTime.toFixed(2)}
- Correlation: ${timeEtfComparison.correlation.toFixed(2)}

Goal Alignment:
- Expected Return: ${(goalAlignment.expectedAnnualReturn * 100).toFixed(1)}%
- Years to Goal: ${goalAlignment.yearsToGoal.toFixed(1)}
- Success Probability: ${(goalAlignment.probabilityOfSuccess * 100).toFixed(0)}%

Provide a comprehensive analysis narrative.`
        }
      ],
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || 'Analysis narrative generation failed';
  } catch (error) {
    console.error('Narrative generation error:', error);
    return 'Unable to generate detailed analysis narrative at this time.';
  }
}

async function generateRecommendations(
  mode: 'standard' | 'agent',
  portfolioData: PortfolioData,
  riskMetrics: any
) {
  try {
    const model = mode === 'standard' ? 'gpt-4.1-mini' : 'gpt-4.1';
    
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'Generate 3-5 specific, actionable portfolio recommendations based on the analysis. Focus on cycle-aware positioning and risk management.'
        },
        {
          role: 'user',
          content: `Portfolio: ${portfolioData.stocks}% stocks, ${portfolioData.bonds}% bonds, ${portfolioData.cash}% cash
Goal: ${portfolioData.goalType || 'Not specified'} of $${portfolioData.goalAmount?.toLocaleString() || 'Not specified'}
Risk Level: ${riskMetrics.concentrationRisk} concentration risk, ${riskMetrics.sharpeRatio.toFixed(2)} Sharpe ratio

Provide specific recommendations.`
        }
      ],
      max_tokens: 400,
    });

    const content = completion.choices[0]?.message?.content || '';
    return content.split('\n').filter(line => line.trim()).slice(0, 5);
  } catch (error) {
    console.error('Recommendations generation error:', error);
    return [
      'Consider diversifying across multiple asset classes to reduce concentration risk.',
      'Review your portfolio allocation to ensure it aligns with your risk tolerance.',
      'Monitor market cycles and adjust positioning accordingly.',
      'Consider rebalancing quarterly to maintain target allocations.',
      'Schedule a consultation to discuss personalized strategies.',
    ];
  }
}
