import { NextRequest, NextResponse } from 'next/server';
import { saveSessionState, saveIntakeForm, getConversationBySessionId } from '@/lib/supabase/index';
import * as fs from 'fs';
import * as path from 'path';

// Types from dashboard
interface IntakeFormData {
  age?: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  riskTolerance: 'low' | 'medium' | 'high';  // NEW: User risk tolerance
  incomeGoal?: number;
  accumulationGoal?: string;
  goalAmount?: number;              // Target goal amount in dollars
  goalDescription?: string;         // Description of the financial goal
  timeHorizon?: number;             // Years to reach goal
  monthlyContribution?: number;     // Monthly contribution amount
  portfolio: {
    totalValue?: number;        // NEW: Total portfolio value in dollars
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    alternatives: number;
  };
  portfolioDescription?: string;
  specificHoldings?: Array<{    // NEW: Optional specific holdings
    name: string;
    ticker?: string;
    percentage: number;
    dollarAmount?: number;     // Dollar amount of this holding
  }>;
}

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userData, intakeData } = body as {
      userData: UserData;
      intakeData: IntakeFormData;
    };

    // Generate a session ID
    const sessionId = `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate portfolio value from holdings FIRST (before transformation)
    let calculatedPortfolioValue = intakeData.portfolio.totalValue;
    const hasSpecificHoldings = intakeData.specificHoldings && 
                               intakeData.specificHoldings.length > 0 &&
                               intakeData.specificHoldings.some(h => h.ticker && h.ticker.trim().length > 0);
    
    if (hasSpecificHoldings) {
      // Calculate total from dollar amounts if provided
      const totalFromDollars = intakeData.specificHoldings!.reduce((sum, h) => sum + (h.dollarAmount || 0), 0);
      if (totalFromDollars > 0) {
        calculatedPortfolioValue = totalFromDollars;
        
        // Update the intakeData with the calculated value
        intakeData.portfolio.totalValue = calculatedPortfolioValue;
      }
      
      // Convert holdings to percentage if needed
      if (calculatedPortfolioValue && calculatedPortfolioValue > 0) {
        intakeData.specificHoldings = intakeData.specificHoldings!.map(h => {
          if (h.dollarAmount && h.dollarAmount > 0) {
            return {
              ...h,
              percentage: (h.dollarAmount / calculatedPortfolioValue!) * 100
            };
          }
          return h;
        });
      }
    }

    console.log('📊 Dashboard Analysis Request:', {
      email: userData.email,
      experience: intakeData.experienceLevel,
      portfolioValue: intakeData.portfolio.totalValue,
      calculatedFromHoldings: hasSpecificHoldings,
      specificHoldingsCount: intakeData.specificHoldings?.length || 0
    });
    
    // Verify the update was successful
    if (hasSpecificHoldings && intakeData.portfolio.totalValue !== calculatedPortfolioValue) {
      console.error('❌ Portfolio value mismatch!', {
        expected: calculatedPortfolioValue,
        actual: intakeData.portfolio.totalValue
      });
    }

    // Load market context
    const marketData = await loadMarketContext();

    // Transform intake data to analysis format (now with correct portfolio value)
    const transformedData = transformIntakeData(intakeData);

    // Run portfolio analysis using AI
    const analysis = await analyzePortfolioWithAI(
      transformedData.goals,
      transformedData.portfolio,
      marketData,
      intakeData
    );

    // ALWAYS fetch portfolio comparison data (using proxy ETFs if no specific holdings)
    // NOTE: Portfolio comparison uses 1-year Monte Carlo for realistic short-term projections
    // Goal analysis (in analyze-cycles) uses the user's actual goal timeHorizon
    let portfolioComparison = null;
    
    if (calculatedPortfolioValue && calculatedPortfolioValue > 0) {
      try {
        console.log('📊 Fetching portfolio comparison data (1-year Monte Carlo)...');
        
        const requestBody = hasSpecificHoldings
          ? {
              userHoldings: intakeData.specificHoldings!.map(h => ({
                ticker: h.ticker || h.name,
                name: h.name,
                percentage: h.percentage
              })),
              portfolioValue: calculatedPortfolioValue,
              timeHorizon: 1  // Always use 1 year for portfolio comparison Monte Carlo
            }
          : {
              portfolioAllocation: {
                stocks: intakeData.portfolio.stocks,
                bonds: intakeData.portfolio.bonds,
                cash: intakeData.portfolio.cash,
                realEstate: intakeData.portfolio.realEstate,
                commodities: intakeData.portfolio.commodities,
                alternatives: intakeData.portfolio.alternatives
              },
              portfolioValue: calculatedPortfolioValue,
              timeHorizon: 1  // Always use 1 year for portfolio comparison Monte Carlo
            };

        console.log(hasSpecificHoldings 
          ? '✓ Using actual user holdings' 
          : '✓ Using proxy ETFs (SPY, AGG, VNQ, GLD, QQQ)');

        const portfolioDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/portfolio/get-portfolio-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (portfolioDataResponse.ok) {
          const portfolioData = await portfolioDataResponse.json();
          if (portfolioData.success) {
            portfolioComparison = portfolioData.comparison;
            console.log('✅ Portfolio comparison data fetched with real Monte Carlo');
          }
        }
      } catch (error) {
        console.warn('⚠️ Portfolio comparison fetch failed (non-blocking):', error);
      }
    }

    // Save to Supabase (store raw intake data and analysis)
    try {
      await saveSessionState({
        sessionId,
        userEmail: userData.email,
        stage: 'analyze',
        goals: {
          goal_type: transformedData.goals.goal_type === 'balanced' ? 'both' : transformedData.goals.goal_type as 'growth' | 'income' | 'both',
          target_amount: transformedData.goals.goal_amount,
          timeline_years: transformedData.goals.horizon_years,
        },
        portfolio: {
          portfolio_value: 0, // Not tracked in dashboard format
          holdings: Object.entries(transformedData.portfolio.allocations as Record<string, number>)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({ name, value })),
        },
        analysis: {
          ...analysis,
          completed_at: new Date().toISOString(),
          market_context: marketData,
          user_data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            experienceLevel: intakeData.experienceLevel,
          },
          raw_intake: intakeData,
        } as Record<string, unknown>,
      });
      console.log('✅ Analysis saved to Supabase');
      
      // Save intake form data to dedicated table
      const conversation = await getConversationBySessionId(sessionId);
      if (conversation) {
        await saveIntakeForm({
          conversationId: conversation.id,
          sessionId: sessionId,
          avatarVariant: 'variant-b', // Always use variant-b
          intakeData: intakeData,
        });
        console.log('✅ Intake form saved to database with variant: variant-b');
      }
    } catch (error) {
      console.error('❌ Supabase save failed (non-blocking):', error);
    }

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        portfolioComparison
      },
      conversationId: sessionId,
    });
  } catch (error) {
    console.error('❌ Dashboard analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

/**
 * Load market context from configuration file
 */
async function loadMarketContext(): Promise<Record<string, unknown>> {
  try {
    const marketContextPath = path.join(process.cwd(), 'market-context.json');
    
    if (!fs.existsSync(marketContextPath)) {
      return { 
        status: 'fallback', 
        content: 'Standard market analysis - market context file not available' 
      };
    }

    const fileContent = fs.readFileSync(marketContextPath, 'utf8');
    const marketConfig = JSON.parse(fileContent);
    
    return {
      status: 'success',
      content: marketConfig.marketContext || 'No market context available',
      metadata: {
        version: marketConfig.version,
        lastUpdated: marketConfig.lastUpdated,
        updatedBy: marketConfig.updatedBy,
        keyMetrics: marketConfig.keyMetrics,
        investmentTheme: marketConfig.investmentTheme,
        riskFactors: marketConfig.riskFactors,
        opportunities: marketConfig.opportunities,
      },
    };
  } catch (error) {
    console.error('❌ Market context loading error:', error);
    return { 
      status: 'fallback', 
      content: 'Using baseline market analysis - configuration file error' 
    };
  }
}

/**
 * Transform dashboard intake data to analysis format (FSM-compatible)
 */
function transformIntakeData(intakeData: IntakeFormData) {
  // Extract goal amount and timeline from intake form
  // Priority: use explicit fields (goalAmount, timeHorizon) first
  let goalAmount = intakeData.goalAmount || intakeData.incomeGoal || 100000;
  let timelineYears = intakeData.timeHorizon || 10;

  // Fallback: try to extract from accumulation goal text if explicit fields not provided
  if (intakeData.accumulationGoal) {
    // Try to extract amount and timeline from free text
    const amountMatch = intakeData.accumulationGoal.match(/\$?([\d,]+(?:\.\d+)?)\s*(?:k|thousand|million|M)?/i);
    const yearMatch = intakeData.accumulationGoal.match(/(\d+)\s*year/i);

    if (amountMatch && !intakeData.goalAmount) {
      let amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (amountMatch[0].toLowerCase().includes('k') || amountMatch[0].toLowerCase().includes('thousand')) {
        amount *= 1000;
      } else if (amountMatch[0].toLowerCase().includes('m') || amountMatch[0].toLowerCase().includes('million')) {
        amount *= 1000000;
      }
      goalAmount = amount;
    }

    if (yearMatch && !intakeData.timeHorizon) {
      timelineYears = parseInt(yearMatch[1]);
    }
  }

  // Determine goal type based on income vs accumulation
  let goalType: 'growth' | 'income' | 'balanced' = 'balanced';
  if (intakeData.incomeGoal && !intakeData.accumulationGoal) {
    goalType = 'income';
  } else if (!intakeData.incomeGoal && intakeData.accumulationGoal) {
    goalType = 'growth';
  }

  // ✅ Use user-selected risk tolerance directly (no inference)
  const riskTolerance = intakeData.riskTolerance;

  // ✅ NEW: Extract portfolio value
  const portfolioValue = intakeData.portfolio.totalValue || 0;
  
  // ✅ NEW: Build holdings array from allocations + specific holdings
  const holdings: Array<{ name: string; value: number }> = [];
  
  // Add allocations as dollar values if portfolio value is known
  if (portfolioValue > 0) {
    if (intakeData.portfolio.stocks > 0) {
      holdings.push({ name: 'Stocks', value: portfolioValue * (intakeData.portfolio.stocks / 100) });
    }
    if (intakeData.portfolio.bonds > 0) {
      holdings.push({ name: 'Bonds', value: portfolioValue * (intakeData.portfolio.bonds / 100) });
    }
    if (intakeData.portfolio.cash > 0) {
      holdings.push({ name: 'Cash', value: portfolioValue * (intakeData.portfolio.cash / 100) });
    }
    if (intakeData.portfolio.realEstate > 0) {
      holdings.push({ name: 'Real Estate', value: portfolioValue * (intakeData.portfolio.realEstate / 100) });
    }
    if (intakeData.portfolio.commodities > 0) {
      holdings.push({ name: 'Commodities', value: portfolioValue * (intakeData.portfolio.commodities / 100) });
    }
    if (intakeData.portfolio.alternatives > 0) {
      holdings.push({ name: 'Alternatives', value: portfolioValue * (intakeData.portfolio.alternatives / 100) });
    }
  }
  
  // Add specific holdings if provided
  if (intakeData.specificHoldings && intakeData.specificHoldings.length > 0 && portfolioValue > 0) {
    intakeData.specificHoldings.forEach(holding => {
      if (holding.name && holding.percentage > 0) {
        holdings.push({
          name: holding.ticker ? `${holding.name} (${holding.ticker})` : holding.name,
          value: portfolioValue * (holding.percentage / 100)
        });
      }
    });
  }
  
  // ✅ NEW: Detect new investor
  const portfolioSum = Object.values({
    stocks: intakeData.portfolio.stocks,
    bonds: intakeData.portfolio.bonds,
    cash: intakeData.portfolio.cash,
    realEstate: intakeData.portfolio.realEstate,
    commodities: intakeData.portfolio.commodities,
    alternatives: intakeData.portfolio.alternatives,
  }).reduce((sum, val) => sum + val, 0);
  
  const isNewInvestor = 
    intakeData.experienceLevel === 'Beginner' &&
    (portfolioValue === 0 || portfolioSum === 0);

  return {
    goals: {
      goal_type: goalType,
      goal_amount: goalAmount,
      horizon_years: timelineYears,
      risk_tolerance: riskTolerance,
      liquidity_needs: timelineYears < 5 ? 'high' : timelineYears > 15 ? 'low' : 'medium',
    },
    portfolio: {
      allocations: {
        stocks: intakeData.portfolio.stocks,
        bonds: intakeData.portfolio.bonds,
        cash: intakeData.portfolio.cash,
        commodities: intakeData.portfolio.commodities,
        real_estate: intakeData.portfolio.realEstate,
        alternatives: intakeData.portfolio.alternatives,
      },
      currency: 'USD',
      portfolio_value: portfolioValue,
      holdings: holdings,
      new_investor: isNewInvestor,
    },
  };
}

/**
 * Analyze portfolio using AI (adapted from FSM logic)
 */
async function analyzePortfolioWithAI(
  goals: Record<string, unknown>,
  portfolio: Record<string, unknown>,
  marketData: Record<string, unknown>,
  intakeData: IntakeFormData
): Promise<Record<string, unknown>> {
  try {
    const portfolioAllocations = portfolio.allocations as Record<string, number>;
    
    // ✅ NEW: Extract portfolio data matching FSM format
    const portfolioValue = (portfolio.portfolio_value as number) || 0;
    const holdings = (portfolio.holdings as Array<{ name: string; value: number }>) || [];
    const isNewInvestor = portfolio.new_investor as boolean || false;
    
    // Build holdings description
    const holdingsDescription = holdings.length > 0 
      ? holdings.map(h => `${h.name}: $${h.value.toLocaleString()}`).join(', ')
      : 'No specific holdings provided';
    
    // Portfolio type description
    const portfolioType = isNewInvestor 
      ? 'New investor'
      : holdings.length > 0 
        ? 'Existing investor with specific holdings'
        : 'Existing investor with allocation percentages only';

    const analysisPrompt = `
You are a Clockwise Capital portfolio advisor analyzing a client's investment approach. Your goal is to create positive doubt about their current strategy and guide them toward booking a consultation to discuss Clockwise's superior solutions.

CLIENT PROFILE:
- Goal: ${goals?.goal_type} of $${typeof goals?.goal_amount === 'number' ? goals.goal_amount.toLocaleString() : 'TBD'} over ${goals?.horizon_years} years
- Risk Profile: ${goals?.risk_tolerance} risk tolerance, ${goals?.liquidity_needs} liquidity needs
- Experience Level: ${intakeData.experienceLevel}
- Portfolio Value: ${portfolioValue > 0 ? `$${portfolioValue.toLocaleString()}` : 'Not specified'}
- Holdings: ${holdingsDescription}
- Portfolio Type: ${portfolioType}
- Allocation: Stocks ${portfolioAllocations.stocks}%, Bonds ${portfolioAllocations.bonds}%, Cash ${portfolioAllocations.cash}%, Real Estate ${portfolioAllocations.real_estate}%, Commodities ${portfolioAllocations.commodities}%, Alternatives ${portfolioAllocations.alternatives}%
${intakeData.portfolioDescription ? `- Additional Notes: ${intakeData.portfolioDescription}` : ''}

CURRENT MARKET REALITY:
${(marketData as Record<string, unknown>)?.content || 'Standard market conditions'}

CLOCKWISE SOLUTIONS TO REFERENCE:
- TIME ETF (NYSE: TIME): Active managed hedged growth fund that rebalances daily to adapt to technology and economic cycles. Minimum investment: <$50
- Clockwise Diversified Growth Portfolios: AI & human expert managed, broadly diversified ETF portfolios with monthly rebalancing. Minimum: $50k+
- Clockwise Diversified Income Portfolios: AI & human expert managed for maximum risk-adjusted income with monthly rebalancing. Minimum: $50k+

ANALYSIS STRATEGY - CREATE POSITIVE DOUBT:
1. Acknowledge their current approach has merit, BUT highlight critical gaps and hidden risks
2. Show how market complexities require expertise they may not have considered
3. Demonstrate how Clockwise's adaptive, cycle-aware approach addresses these blind spots
4. Position consultation as essential for navigating today's challenging market environment

RESPONSE TONE: Optimistic about their potential success, but concerned about their current path in these complex times.

Provide analysis in this JSON format with three distinct impact sections:
{
  "riskLevel": "Low/Medium/High",
  "beta": "Portfolio beta vs market",
  "volatility": "Annual volatility estimate", 
  "correlation_matrix": "Correlation with TIME/SPY",
  "sector_concentration": "Top sector concentration %",
  "cycle_stage": "Late-cycle/Mid-cycle/Early-cycle",
  "gap_to_goal": "Potential years behind target without optimization",
  "marketImpact": "Return 3-4 bullet points (start with '•'). BE DYNAMIC AND SPECIFIC to their situation:\n- Portfolio value: ${portfolioValue > 0 ? `$${portfolioValue.toLocaleString()}` : 'Not specified'}\n- Experience: ${intakeData.experienceLevel}\n- Holdings: ${holdingsDescription}\n${isNewInvestor ? '- NEW INVESTOR: Explain why THIS market is challenging for beginners starting out' : '- EXISTING INVESTOR: Relate market risks to THEIR specific portfolio size and holdings'}\nAlways tie back to current late-cycle risks but make it PERSONAL to them.",
  "portfolioImpact": "Return 3-4 bullet points (start with '•'). PERSONALIZE based on what they told you:\n${holdings.length > 0 ? `- They have SPECIFIC holdings: ${holdingsDescription}\n- Analyze THOSE exact holdings and their risks` : `- They only provided allocations: Stocks ${portfolioAllocations.stocks}%, Bonds ${portfolioAllocations.bonds}%, Cash ${portfolioAllocations.cash}%`}\n${isNewInvestor ? '- NEW INVESTOR: Explain what they NEED to consider starting out' : '- Focus on what\'s MISSING or RISKY in their current allocation'}\n- Always position Clockwise TIME ETF or Diversified Portfolios as the solution to THEIR specific situation\nDO NOT make up allocations they didn't mention. BE SPECIFIC about their actual data.",
  "goalImpact": "Return 3-4 bullet points (start with '•'). Make it DEEPLY PERSONAL using their exact numbers:\n- Calculate and mention: 'Your goal of $${(goals?.goal_amount as number || 0).toLocaleString()} in ${goals?.horizon_years || 0} years...'\n${portfolioValue > 0 ? `- 'Your current $${portfolioValue.toLocaleString()} needs X% annual growth to reach your goal...'` : '- Emphasize importance of knowing portfolio value for planning'}\n- Create urgency: explain how THEIR specific timeline is at risk\n- Show how Clockwise solutions specifically address THEIR goal/timeline/risk profile\n${isNewInvestor ? '- NEW INVESTOR: Focus on importance of starting right with professional guidance' : '- Show the gap between where they are and where they need to be'}\nMake them FEEL the urgency and opportunity.",
  "metrics": [
    ["Current Risk Level", "X/10", "Needs professional management"],
    ["Market Timing", "Static approach", "Daily adaptation needed"], 
    ["Expert Guidance", "DIY strategy", "Professional oversight required"],
    ["Portfolio Optimization", "Suboptimal", "Clockwise solutions available"]
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: analysisPrompt }],
        response_format: { type: 'json_object' },
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    
    console.log('✅ Portfolio analysis complete');
    return analysis;
  } catch (error) {
    console.error('❌ Portfolio analysis error:', error);
    
    // Fallback analysis
    return {
      riskLevel: goals?.risk_tolerance || 'Medium',
      marketContext: 'Current market dynamics reveal several concerning trends for individual investors.',
      recommendation: 'Consider professional portfolio management to optimize your path to financial goals.',
      metrics: [
        ['Current Risk Level', '7/10', 'Needs professional management'],
        ['Market Timing', 'Static approach', 'Daily adaptation needed'],
        ['Expert Guidance', 'DIY strategy', 'Professional oversight required'],
        ['Portfolio Optimization', 'Suboptimal', 'Clockwise solutions available'],
      ],
    };
  }
}
