/**
 * API Route: /api/community/questions/ai-enrich
 * Uses AI to automatically generate title, detect historical period, and suggest tags from question text
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { phases } from '@/utils/turbulentData';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { questionText } = await request.json();

    if (!questionText || typeof questionText !== 'string') {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    if (questionText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Question must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Build the prompt with available historical periods
    const periodsInfo = phases.map(p => 
      `- ID: ${p.id}, Title: "${p.title}", Years: ${p.years}, Synopsis: ${p.synopsis}`
    ).join('\n');

    const prompt = `You are an expert financial analyst helping users create scenario testing questions.

Given the following user question about portfolio performance:
"${questionText}"

And these available historical periods:
${periodsInfo}

Please analyze the question and provide:
1. A concise, engaging title (5-50 characters) that captures the essence of the question
2. The most relevant historical period ID from the list above that best matches the scenario described
3. A single tag representing the Economic Cycle category that best fits this question

Return ONLY a JSON object in this exact format:
{
  "title": "Short engaging title here",
  "historicalPeriodId": 1,
  "tags": ["economic"]
}

Guidelines:
- Title should be clear, specific, and engaging (not just a restatement of the question)
- Choose the historical period that best matches the economic conditions, market dynamics, or time period mentioned or implied in the question
- **IMPORTANT PERIOD SELECTION RULES:**
  - Questions about pandemics, COVID, health crises, or rapid crashes with Fed intervention → COVID Crash period
  - Questions about tech bubbles, AI hype, dot-com parallels → Peak & Crash (2000-2008) period
  - Questions about 2008 financial crisis, bank failures, credit freeze → Great Deleveraging (2008-2020) period
  - Questions about meme stocks, crypto, 2022 rate hikes → Post-COVID Era (2021-Present) period
  - Questions about general long-term trends or "what if" futures → Reset (Forecast) period
- **CRITICAL: You must select EXACTLY ONE tag from these 6 Economic Cycle categories:**
  - "empire": Questions about geopolitical shifts, global power dynamics, international relations
  - "technology": Questions about technological innovation, AI, tech bubbles, digital transformation
  - "economic": Questions about macroeconomic conditions, GDP, inflation, recession, monetary policy
  - "business": Questions about corporate performance, earnings, business cycles, sector trends
  - "market": Questions about market dynamics, volatility, crashes, bull/bear markets, investor sentiment
  - "company": Questions about specific companies, stock picks, individual holdings
- The tags array should contain exactly one element (the cycle category), lowercase
- If the question is about current/future scenarios, choose the most similar historical analog
- Be concise and precise`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }

    const aiResult = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (!aiResult.title || !aiResult.historicalPeriodId || !aiResult.tags || aiResult.tags.length === 0) {
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    // Validate that the tag is one of the valid cycles
    const validCycles = ['empire', 'technology', 'economic', 'business', 'market', 'company'];
    const cycleTag = aiResult.tags[0]?.toLowerCase();
    
    if (!cycleTag || !validCycles.includes(cycleTag)) {
      console.warn(`AI did not provide a valid cycle tag. Tag was: ${cycleTag}. Defaulting to 'market'.`);
      aiResult.tags = ['market'];
    } else {
      // Ensure tag is lowercase
      aiResult.tags = [cycleTag];
    }

    // Verify the historical period exists
    const selectedPhase = phases.find(p => p.id === aiResult.historicalPeriodId);
    if (!selectedPhase) {
      return NextResponse.json(
        { error: 'Invalid historical period selected by AI' },
        { status: 500 }
      );
    }

    // Build the historical period object
    const [startYear, endYear] = selectedPhase.years.split('-');
    const historicalPeriod = {
      start: startYear.trim(),
      end: endYear.trim().replace('?', ''),
      label: `${selectedPhase.title} (${selectedPhase.years})`
    };

    // Fetch S&P 500 return for this period
    let sp500Return = 0.10; // Default 10% if calculation fails
    try {
      const sp500Response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/community/questions/calculate-sp500-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startYear: historicalPeriod.start,
          endYear: historicalPeriod.end
        })
      });

      if (sp500Response.ok) {
        const sp500Data = await sp500Response.json();
        if (sp500Data.success) {
          sp500Return = sp500Data.sp500Return;
          console.log(`📊 S&P 500 return for ${historicalPeriod.start}-${historicalPeriod.end}: ${(sp500Return * 100).toFixed(1)}%`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch S&P 500 return, using default:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        title: aiResult.title.substring(0, 200), // Ensure max length
        historicalPeriod,
        historicalPeriodId: aiResult.historicalPeriodId,
        tags: aiResult.tags, // Single cycle tag only
        description: selectedPhase.synopsis,
        sp500Return // Include S&P 500 return in response
      }
    });

  } catch (error: any) {
    console.error('Error in AI enrichment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
