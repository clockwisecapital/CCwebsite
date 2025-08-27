import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AgentAnalysisRequest {
  query: string;
  portfolioContext?: {
    stocks: number;
    bonds: number;
    cash: number;
    commodities: number;
    realEstate: number;
    alternatives: number;
    currentValue: number;
    goalType: 'Annual Income' | 'Lump Sum';
    goalAmount: number;
  };
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

    const body: AgentAnalysisRequest = await request.json();
    const { query, portfolioContext, conversationHistory = [] } = body;

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Build context for the AI agent
    const systemPrompt = `You are an expert financial advisor specializing in portfolio analysis through the lens of accelerating market cycles. You have access to real-time market data and can provide current insights on economic conditions, market trends, and investment opportunities.

${portfolioContext ? `
Current Portfolio Context:
- Asset Allocation: ${portfolioContext.stocks || 0}% stocks, ${portfolioContext.bonds || 0}% bonds, ${portfolioContext.cash || 0}% cash, ${portfolioContext.commodities || 0}% commodities, ${portfolioContext.realEstate || 0}% real estate, ${portfolioContext.alternatives || 0}% alternatives
- Portfolio Value: ${portfolioContext.currentValue ? `$${portfolioContext.currentValue.toLocaleString()}` : 'Not specified'}
- Investment Goal: ${portfolioContext.goalType || 'Not specified'} ${portfolioContext.goalAmount ? `of $${portfolioContext.goalAmount.toLocaleString()}` : ''}
` : ''}

Guidelines:
- Provide specific, actionable advice based on current market conditions
- Reference Ray Dalio's Long-Term Debt Cycle and S&P 500 lifecycle stages when relevant
- Consider TIME ETF positioning and sector rotation opportunities
- Focus on cycle-aware investment strategies
- Be conversational but professional
- Ask clarifying questions when helpful for better analysis`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.slice(-8), // Keep last 8 messages for context
      { role: 'user' as const, content: query },
    ];

    // Use gpt-4.1 with function calling for web search capabilities
    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'search_market_data',
          description: 'Search for current market data, economic indicators, and financial news',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for market information',
              },
              focus: {
                type: 'string',
                enum: ['economic_indicators', 'market_trends', 'sector_analysis', 'cycle_analysis'],
                description: 'Focus area for the search',
              },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'analyze_time_etf',
          description: 'Get current TIME ETF data and positioning analysis',
          parameters: {
            type: 'object',
            properties: {
              comparison_type: {
                type: 'string',
                enum: ['holdings', 'performance', 'sector_allocation', 'risk_metrics'],
                description: 'Type of TIME ETF analysis to perform',
              },
            },
            required: ['comparison_type'],
          },
        },
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 600,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message;
    
    // Handle function calls if any
    if (response?.tool_calls) {
      const toolResults = await handleToolCalls(response.tool_calls);
      
      // Continue conversation with tool results
      const followUpMessages = [
        ...messages,
        { role: 'assistant' as const, content: response.content || '', tool_calls: response.tool_calls },
        ...toolResults.map(result => ({
          role: 'tool' as const,
          content: result.content,
          tool_call_id: result.tool_call_id,
        })),
      ];

      const finalCompletion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: followUpMessages,
        max_tokens: 600,
        temperature: 0.7,
      });

      return NextResponse.json({
        response: finalCompletion.choices[0]?.message?.content || 'Analysis completed.',
        usedTools: response.tool_calls.map(call => (call as any).function.name),
      });
    }

    return NextResponse.json({
      response: response?.content || 'I apologize, but I encountered an error processing your request.',
      usedTools: [],
    });
  } catch (error: any) {
    console.error('Agent analysis error:', error);
    
    // Handle specific OpenAI errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 500 }
      );
    } else if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Agent analysis failed' },
      { status: 500 }
    );
  }
}

async function handleToolCalls(toolCalls: any[]) {
  const results = [];

  for (const toolCall of toolCalls) {
    const { name, arguments: args } = (toolCall as any).function;
    const parsedArgs = JSON.parse(args);

    try {
      if (name === 'search_market_data') {
        const result = await searchMarketData(parsedArgs.query, parsedArgs.focus);
        results.push({
          tool_call_id: toolCall.id,
          content: result,
        });
      } else if (name === 'analyze_time_etf') {
        const result = await analyzeTimeEtf(parsedArgs.comparison_type);
        results.push({
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    } catch (error) {
      console.error(`Tool call error for ${name}:`, error);
      results.push({
        tool_call_id: toolCall.id,
        content: `Error executing ${name}: Unable to retrieve current data.`,
      });
    }
  }

  return results;
}

async function searchMarketData(query: string, focus?: string): Promise<string> {
  // In production, this would integrate with financial data APIs like:
  // - Bloomberg API, Alpha Vantage, Yahoo Finance, FRED (Federal Reserve Economic Data)
  // - News APIs for current market sentiment
  
  // Mock implementation for demonstration
  const mockData = {
    economic_indicators: `Current Economic Indicators (Mock Data):
- Federal Funds Rate: 5.25-5.50%
- 10-Year Treasury Yield: 4.35%
- Inflation (CPI): 3.2% YoY
- Unemployment Rate: 3.8%
- GDP Growth: 2.1% (latest quarter)`,
    
    market_trends: `Current Market Trends (Mock Data):
- S&P 500: Trading near resistance at 4,400
- VIX: Elevated at 18.5, indicating moderate volatility
- Dollar Index (DXY): Strong at 103.2
- Sector Rotation: Technology showing weakness, Energy gaining strength`,
    
    sector_analysis: `Sector Analysis (Mock Data):
- Technology: -2.3% (week), facing headwinds from rates
- Energy: +4.1% (week), benefiting from oil price stability
- Healthcare: +1.2% (week), defensive positioning
- Financials: +2.8% (week), rate environment supportive`,
    
    cycle_analysis: `Market Cycle Analysis (Mock Data):
- Current Phase: Late-cycle expansion showing signs of maturity
- Credit Spreads: Widening slightly, indicating caution
- Yield Curve: Inverted, historically a recession indicator
- Corporate Earnings: Slowing growth, margin pressure evident`,
  };

  const focusArea = focus as keyof typeof mockData;
  return mockData[focusArea] || `Market data search for "${query}": Current market conditions show mixed signals with elevated volatility and sector rotation patterns.`;
}

async function analyzeTimeEtf(comparisonType: string): Promise<string> {
  // In production, this would fetch real TIME ETF data
  const mockTimeAnalysis = {
    holdings: `TIME ETF Holdings Analysis (Mock Data):
- Top Holdings: AAPL (8.2%), MSFT (7.1%), GOOGL (4.8%), AMZN (3.9%)
- Sector Allocation: Tech (28%), Healthcare (15%), Financials (13%)
- Geographic Exposure: US (75%), International Developed (20%), Emerging (5%)`,
    
    performance: `TIME ETF Performance (Mock Data):
- YTD Return: +12.4%
- 1-Year Return: +8.7%
- 3-Year Annualized: +11.2%
- Sharpe Ratio: 1.34
- Max Drawdown: -18.3% (2022)`,
    
    sector_allocation: `TIME ETF Sector Allocation (Mock Data):
- Technology: 28.5%
- Healthcare: 15.2%
- Financials: 13.1%
- Consumer Discretionary: 11.8%
- Industrials: 9.4%
- Communication Services: 8.7%
- Energy: 6.3%
- Utilities: 4.2%
- Materials: 2.8%`,
    
    risk_metrics: `TIME ETF Risk Metrics (Mock Data):
- Beta vs S&P 500: 0.92
- Standard Deviation: 16.8%
- Correlation to SPY: 0.89
- Expense Ratio: 0.65%
- Assets Under Management: $2.8B`,
  };

  return mockTimeAnalysis[comparisonType as keyof typeof mockTimeAnalysis] || 
         'TIME ETF analysis data temporarily unavailable.';
}
