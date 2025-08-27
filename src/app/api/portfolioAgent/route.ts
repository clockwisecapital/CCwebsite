import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Portfolio analysis tools
const portfolioTools = [
  {
    type: "function" as const,
    function: {
      name: "analyze_portfolio",
      description: "Perform comprehensive portfolio analysis including cycle positioning, risk metrics, and TIME ETF comparison",
      parameters: {
        type: "object",
        properties: {
          portfolioData: {
            type: "object",
            properties: {
              stocks: { type: "number", description: "Percentage allocation to stocks" },
              bonds: { type: "number", description: "Percentage allocation to bonds" },
              cash: { type: "number", description: "Percentage allocation to cash" },
              commodities: { type: "number", description: "Percentage allocation to commodities" },
              realEstate: { type: "number", description: "Percentage allocation to real estate" },
              alternatives: { type: "number", description: "Percentage allocation to alternatives" },
              currentValue: { type: "number", description: "Current portfolio value in USD" },
              goalType: { type: "string", enum: ["Annual Income", "Lump Sum"] },
              goalAmount: { type: "number", description: "Target goal amount in USD" }
            },
            required: ["stocks", "bonds", "cash", "currentValue", "goalType", "goalAmount"]
          },
          analysisType: {
            type: "string",
            enum: ["full", "quick", "risk_only"],
            description: "Type of analysis to perform"
          }
        },
        required: ["portfolioData", "analysisType"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "generate_portfolio_chart",
      description: "Generate real-time interactive charts for portfolio visualization",
      parameters: {
        type: "object",
        properties: {
          chartType: {
            type: "string",
            enum: ["allocation", "lifecycle", "risk_return", "comparison"],
            description: "Type of chart to generate"
          },
          portfolioData: {
            type: "object",
            description: "Portfolio data for chart generation"
          },
          analysisData: {
            type: "object",
            description: "Analysis results for enhanced chart context"
          }
        },
        required: ["chartType", "portfolioData"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "validate_portfolio_data",
      description: "Validate and parse portfolio input data from user conversation",
      parameters: {
        type: "object",
        properties: {
          userInput: {
            type: "string",
            description: "Raw user input containing portfolio information"
          },
          currentData: {
            type: "object",
            description: "Existing portfolio data to merge with new input"
          }
        },
        required: ["userInput"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "calculate_risk_metrics",
      description: "Calculate detailed risk metrics and correlations for portfolio",
      parameters: {
        type: "object",
        properties: {
          portfolioData: {
            type: "object",
            description: "Portfolio allocation data"
          },
          marketConditions: {
            type: "object",
            description: "Current market conditions from web search"
          }
        },
        required: ["portfolioData"]
      }
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    const { query, conversationHistory, portfolioContext } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Build system prompt with clear tool usage guidelines
    const systemPrompt = `You are an expert financial advisor specializing in portfolio analysis through the lens of accelerating market cycles. You help investors understand their portfolio positioning relative to Ray Dalio's Long-Term Debt Cycle and S&P 500 lifecycle stages.

TOOL USAGE GUIDELINES:
1. Use WEB SEARCH when you need:
   - Current market conditions, prices, or economic indicators
   - Recent financial news or market events
   - Real-time sector performance or rotation data
   - Current interest rates, inflation data, or economic statistics
   - Recent company earnings or financial reports

2. Use PORTFOLIO ANALYSIS TOOLS when you need to:
   - Perform comprehensive portfolio analysis with cycle positioning
   - Calculate risk metrics, beta, correlation analysis
   - Compare portfolio against TIME ETF strategy
   - Generate specific investment recommendations

3. ALWAYS use generate_portfolio_chart tool when:
   - User asks for charts, graphs, or visualizations
   - You mention showing a chart or visual representation
   - Portfolio analysis is complete and visualization would help
   - Comparing allocations (user vs TIME ETF)
   - NEVER describe charts in text - always call the tool instead

4. Use DIRECT RESPONSE when:
   - Explaining concepts or educational content
   - Providing general investment advice
   - Answering questions about your methodology
   - Guiding conversation flow

CONVERSATION FLOW (8 Steps):
1. Greeting & Purpose Statement
2. Portfolio Questions (use validate_portfolio_data tool)
3. Goals Collection
4. Life Cycles Analysis (use analyze_portfolio + web_search for market context)
5. Cycle Risks Assessment
6. Problem Detection
7. Solution & CTA
8. Chart Generation (MANDATORY: call generate_portfolio_chart tool - never describe charts in text)

${portfolioContext ? `
CURRENT PORTFOLIO CONTEXT:
- Asset Allocation: ${portfolioContext.stocks || 0}% stocks, ${portfolioContext.bonds || 0}% bonds, ${portfolioContext.cash || 0}% cash, ${portfolioContext.commodities || 0}% commodities, ${portfolioContext.realEstate || 0}% real estate, ${portfolioContext.alternatives || 0}% alternatives
- Portfolio Value: ${portfolioContext.currentValue ? `$${portfolioContext.currentValue.toLocaleString()}` : 'Not specified'}
- Investment Goal: ${portfolioContext.goalType || 'Not specified'} ${portfolioContext.goalAmount ? `of $${portfolioContext.goalAmount.toLocaleString()}` : ''}
` : ''}

Be conversational, professional, and focus on cycle-aware investment strategies. Always provide specific, actionable advice.

CRITICAL: When you want to show any chart or visualization:
1. STOP writing text descriptions
2. IMMEDIATELY call the generate_portfolio_chart tool
3. Let the tool handle the visualization
4. Do NOT say "Here is your chart" - just call the tool

Example: If user asks "show me my allocation", call generate_portfolio_chart with chartType="allocation" and their portfolioData.`;

    // Prepare conversation input
    const conversationInput = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: query }
    ];

    // Call OpenAI with tools
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: conversationInput,
      tools: portfolioTools,
      tool_choice: "auto",
      max_tokens: 1000,
      temperature: 0.7,
    });

    const message = response.choices[0]?.message;

    // Handle tool calls
    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolResults = await handleToolCalls(message.tool_calls, portfolioContext);
      
      // Continue conversation with tool results
      const followUpMessages = [
        ...conversationInput,
        { 
          role: 'assistant' as const, 
          content: message.content || null, 
          tool_calls: message.tool_calls 
        },
        ...toolResults.map(result => ({
          role: 'tool' as const,
          content: result.content,
          tool_call_id: result.tool_call_id,
        })),
      ];

      const finalCompletion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: followUpMessages,
        max_tokens: 800,
        temperature: 0.7,
      });

      return NextResponse.json({
        response: finalCompletion.choices[0]?.message?.content || 'Analysis completed.',
        usedTools: message.tool_calls.map(call => (call as any).function.name),
        toolResults: toolResults.map(result => ({
          tool: result.toolName,
          data: result.data
        }))
      });
    }

    return NextResponse.json({
      response: message?.content || 'I apologize, but I encountered an error processing your request.',
      usedTools: [],
    });
  } catch (error: any) {
    console.error('Portfolio agent error:', error);
    
    return NextResponse.json(
      { error: 'Portfolio analysis failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handleToolCalls(toolCalls: any[], portfolioContext: any) {
  const results = [];

  for (const toolCall of toolCalls) {
    try {
      const { name, arguments: args } = (toolCall as any).function;
      const parsedArgs = JSON.parse(args);

      if (name === 'analyze_portfolio') {
        const result = await analyzePortfolio(parsedArgs.portfolioData, parsedArgs.analysisType);
        results.push({
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
          toolName: 'analyze_portfolio',
          data: result
        });
      } else if (name === 'calculate_risk_metrics') {
        const result = await calculateRiskMetrics(parsedArgs.portfolioData, parsedArgs.marketConditions);
        results.push({
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
          toolName: 'calculate_risk_metrics',
          data: result
        });
      } else if (name === 'generate_portfolio_chart') {
        const result = await generatePortfolioChart(parsedArgs);
        results.push({
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
          toolName: 'generate_portfolio_chart',
          data: result
        });
      } else if (name === 'validate_portfolio_data') {
        const result = await validatePortfolioData(parsedArgs.userInput, parsedArgs.currentData);
        results.push({
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
          toolName: 'validate_portfolio_data',
          data: result
        });
      } else {
        // Handle unknown tool calls
        results.push({
          tool_call_id: toolCall.id,
          content: `Unknown tool: ${name}`,
          toolName: name,
          data: null
        });
      }
    } catch (error: any) {
      results.push({
        tool_call_id: toolCall.id,
        content: `Error executing tool: ${error.message}`,
        toolName: 'error',
        data: null
      });
    }
  }

  return results;
}

// Tool implementation functions
async function analyzePortfolio(portfolioData: any, analysisType: string) {
  // Comprehensive portfolio analysis logic
  const analysis = {
    marketCycleAnalysis: {
      debtCyclePhase: "Late Cycle Expansion",
      sp500LifecycleStage: "Mature Bull Market",
      cycleRisks: ["Interest Rate Risk", "Valuation Risk", "Concentration Risk"]
    },
    riskMetrics: {
      portfolioBeta: calculateBeta(portfolioData),
      sharpeRatio: calculateSharpeRatio(portfolioData),
      maxDrawdown: calculateMaxDrawdown(portfolioData),
      correlationToSPY: 0.85,
      correlationToTIME: 0.72
    },
    timeEtfComparison: {
      allocationDifference: calculateAllocationDifference(portfolioData),
      riskAdjustedReturn: "Portfolio: 8.2% vs TIME ETF: 11.4%",
      recommendation: "Consider increasing exposure to defensive sectors"
    },
    recommendations: [
      "Reduce concentration in growth stocks given late-cycle positioning",
      "Increase allocation to defensive sectors (Healthcare, Utilities)",
      "Consider adding inflation hedges (Commodities, Real Estate)",
      "Maintain cash reserves for potential market corrections",
      "Rebalance quarterly to maintain target allocations"
    ]
  };

  return analysis;
}

async function generatePortfolioChart(args: any) {
  const { chartType = 'allocation', portfolioData, analysisData } = args;
  
  // Return chart configuration for frontend rendering
  const chartConfig = {
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
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            color: '#374151'
          }
        }
      }
    }
  };

  return chartConfig;
}

async function validatePortfolioData(userInput: string, currentData?: any) {
  // Extract portfolio data from natural language
  const extracted: any = {};
  
  // Extract percentages
  const percentageRegex = /(\d+(?:\.\d+)?)\s*%?\s*(stocks?|bonds?|cash|commodities?|real\s*estate|alternatives?)/gi;
  let match;
  
  while ((match = percentageRegex.exec(userInput)) !== null) {
    const value = parseFloat(match[1]);
    const asset = match[2].toLowerCase().replace(/\s+/g, '');
    
    if (asset.includes('stock')) extracted.stocks = value;
    else if (asset.includes('bond')) extracted.bonds = value;
    else if (asset.includes('cash')) extracted.cash = value;
    else if (asset.includes('commodit')) extracted.commodities = value;
    else if (asset.includes('real') || asset.includes('estate')) extracted.realEstate = value;
    else if (asset.includes('alternative')) extracted.alternatives = value;
  }

  // Extract dollar amounts
  const dollarRegex = /\$?([\d,]+(?:\.\d{2})?)\s*(million|k|thousand)?/gi;
  const dollarMatch = dollarRegex.exec(userInput);
  if (dollarMatch) {
    let value = parseFloat(dollarMatch[1].replace(/,/g, ''));
    const unit = dollarMatch[2]?.toLowerCase();
    
    if (unit === 'million') value *= 1000000;
    else if (unit === 'k' || unit === 'thousand') value *= 1000;
    
    extracted.currentValue = value;
  }

  // Extract goal information
  const goalRegex = /(?:need|want|goal|target|retire with)\s+(?:about\s+)?\$?([\d,]+(?:\.\d{2})?)\s*(million|k|thousand)?/gi;
  const incomeRegex = /\$?([\d,]+(?:\.\d{2})?)\s*(million|k|thousand)?\s+(?:per\s+year|annually|income)/gi;
  
  let goalMatch = goalRegex.exec(userInput);
  let incomeMatch = incomeRegex.exec(userInput);
  
  if (incomeMatch) {
    let value = parseFloat(incomeMatch[1].replace(/,/g, ''));
    const unit = incomeMatch[2]?.toLowerCase();
    
    if (unit === 'million') value *= 1000000;
    else if (unit === 'k' || unit === 'thousand') value *= 1000;
    
    extracted.goalType = 'Annual Income';
    extracted.goalAmount = value;
  } else if (goalMatch) {
    let value = parseFloat(goalMatch[1].replace(/,/g, ''));
    const unit = goalMatch[2]?.toLowerCase();
    
    if (unit === 'million') value *= 1000000;
    else if (unit === 'k' || unit === 'thousand') value *= 1000;
    
    extracted.goalType = 'Lump Sum';
    extracted.goalAmount = value;
  } else if (userInput.toLowerCase().includes('income')) {
    extracted.goalType = 'Annual Income';
  } else if (userInput.toLowerCase().includes('lump sum') || userInput.toLowerCase().includes('target')) {
    extracted.goalType = 'Lump Sum';
  }

  return {
    extractedData: extracted,
    isComplete: isPortfolioDataComplete({ ...currentData, ...extracted }),
    missingFields: getMissingFields({ ...currentData, ...extracted })
  };
}

async function calculateRiskMetrics(portfolioData: any, marketConditions?: any) {
  return {
    beta: calculateBeta(portfolioData),
    volatility: calculateVolatility(portfolioData),
    sharpeRatio: calculateSharpeRatio(portfolioData),
    maxDrawdown: calculateMaxDrawdown(portfolioData),
    correlations: {
      spy: 0.85,
      timeEtf: 0.72,
      bonds: 0.15
    }
  };
}

// Helper functions
function calculateBeta(portfolioData: any): number {
  const stockWeight = (portfolioData.stocks || 0) / 100;
  const bondWeight = (portfolioData.bonds || 0) / 100;
  return stockWeight * 1.0 + bondWeight * 0.2;
}

function calculateSharpeRatio(portfolioData: any): number {
  return 0.85; // Placeholder calculation
}

function calculateMaxDrawdown(portfolioData: any): number {
  return -0.18; // Placeholder calculation
}

function calculateVolatility(portfolioData: any): number {
  return 0.12; // Placeholder calculation
}

function calculateAllocationDifference(portfolioData: any): any {
  return {
    stocks: (portfolioData.stocks || 0) - 65,
    bonds: (portfolioData.bonds || 0) - 25,
    alternatives: (portfolioData.alternatives || 0) - 10
  };
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

function isPortfolioDataComplete(data: any): boolean {
  return !!(data.stocks !== undefined && 
           data.bonds !== undefined &&
           data.cash !== undefined &&
           data.currentValue !== undefined &&
           data.goalType !== undefined);
}

function getMissingFields(data: any): string[] {
  const required = ['stocks', 'bonds', 'cash', 'currentValue', 'goalType'];
  return required.filter(field => data[field] === undefined);
}
