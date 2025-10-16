import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || description.trim() === '') {
      return NextResponse.json(
        { error: 'Portfolio description is required' },
        { status: 400 }
      );
    }

    // Use OpenAI to parse the portfolio description and extract allocations
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a financial portfolio analyzer. Parse the user's portfolio description and extract:
1. Total portfolio value (if mentioned)
2. Asset allocation percentages across these categories:
   - Stocks (individual stocks, equity ETFs, stock mutual funds)
   - Bonds (individual bonds, bond ETFs, bond funds, treasuries)
   - Cash (savings, money market, CDs)
   - Real Estate (REITs, rental properties, real estate funds)
   - Commodities (gold, silver, commodity ETFs)
   - Alternatives (crypto, private equity, hedge funds, other)

Rules:
- Allocations MUST sum to exactly 100%
- If total value is not mentioned, return null for totalValue
- Be intelligent about categorization (e.g., VTSAX is stocks, BND is bonds)
- If you can't determine exact percentages, make reasonable estimates based on dollar amounts
- Round to 1 decimal place

Return ONLY valid JSON with this exact structure:
{
  "totalValue": number | null,
  "stocks": number,
  "bonds": number,
  "cash": number,
  "realEstate": number,
  "commodities": number,
  "alternatives": number,
  "confidence": "high" | "medium" | "low",
  "notes": "brief explanation of categorization decisions"
}`
        },
        {
          role: 'user',
          content: description
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(result);

    // Validate that allocations sum to 100
    const total = 
      (parsed.stocks || 0) + 
      (parsed.bonds || 0) + 
      (parsed.cash || 0) + 
      (parsed.realEstate || 0) + 
      (parsed.commodities || 0) + 
      (parsed.alternatives || 0);

    // Allow small rounding differences
    if (Math.abs(total - 100) > 0.5) {
      // Normalize to 100%
      const factor = 100 / total;
      parsed.stocks = Math.round((parsed.stocks || 0) * factor * 10) / 10;
      parsed.bonds = Math.round((parsed.bonds || 0) * factor * 10) / 10;
      parsed.cash = Math.round((parsed.cash || 0) * factor * 10) / 10;
      parsed.realEstate = Math.round((parsed.realEstate || 0) * factor * 10) / 10;
      parsed.commodities = Math.round((parsed.commodities || 0) * factor * 10) / 10;
      
      // Calculate alternatives to make sum exactly 100
      const currentSum = parsed.stocks + parsed.bonds + parsed.cash + parsed.realEstate + parsed.commodities;
      parsed.alternatives = Math.round((100 - currentSum) * 10) / 10;
    }

    return NextResponse.json({
      success: true,
      allocations: {
        totalValue: parsed.totalValue,
        stocks: parsed.stocks || 0,
        bonds: parsed.bonds || 0,
        cash: parsed.cash || 0,
        realEstate: parsed.realEstate || 0,
        commodities: parsed.commodities || 0,
        alternatives: parsed.alternatives || 0,
      },
      confidence: parsed.confidence || 'medium',
      notes: parsed.notes || 'Portfolio allocation parsed successfully'
    });

  } catch (error) {
    console.error('Portfolio parsing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse portfolio description',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
