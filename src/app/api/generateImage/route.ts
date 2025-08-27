import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ImageRequest {
  type: 'lifecycle' | 'portfolio_comparison';
  analysisData: {
    debtCyclePhase?: string;
    sp500LifecycleStage?: string;
    portfolioAllocation?: {
      stocks: number;
      bonds: number;
      cash: number;
      commodities: number;
      realEstate: number;
      alternatives: number;
    };
    timeEtfComparison?: {
      betaVsTime: number;
      correlation: number;
      sectorConcentration: Record<string, number>;
    };
  };
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

    const body: ImageRequest = await request.json();
    const { type, analysisData } = body;

    // Validate request body
    if (!type || !analysisData) {
      return NextResponse.json(
        { error: 'Missing required fields: type and analysisData' },
        { status: 400 }
      );
    }

    let prompt = '';
    
    if (type === 'lifecycle') {
      // Validate lifecycle data exists
      if (!analysisData.debtCyclePhase || !analysisData.sp500LifecycleStage) {
        return NextResponse.json(
          { error: 'Missing lifecycle analysis data' },
          { status: 400 }
        );
      }

      prompt = `Create a professional financial lifecycle diagram showing Ray Dalio's Long-Term Debt Cycle and S&P 500 positioning.

Current Analysis:
- Debt Cycle Phase: ${analysisData.debtCyclePhase}
- S&P 500 Stage: ${analysisData.sp500LifecycleStage}

Design Requirements:
- Clean, modern financial chart with Clockwise Capital's blue (#1E3A8A) and green (#10B981) color scheme
- Circular cycle diagram showing all phases with current position prominently highlighted
- Professional layout suitable for investment presentations
- Include subtle background elements suggesting market cycles and time progression
- Add Clockwise Capital branding elements
- High contrast, readable text and clear phase labels`;

    } else if (type === 'portfolio_comparison') {
      // Validate comparison data exists
      if (!analysisData.portfolioAllocation || !analysisData.timeEtfComparison) {
        return NextResponse.json(
          { error: 'Missing portfolio comparison data' },
          { status: 400 }
        );
      }

      const { portfolioAllocation, timeEtfComparison } = analysisData;
      const topSectors = Object.entries(timeEtfComparison.sectorConcentration)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 6);
      
      prompt = `Create a professional portfolio comparison dashboard showing asset allocation and sector analysis.

Portfolio Data:
- Asset Allocation: Stocks ${portfolioAllocation.stocks}%, Bonds ${portfolioAllocation.bonds}%, Cash ${portfolioAllocation.cash}%, Commodities ${portfolioAllocation.commodities}%, Real Estate ${portfolioAllocation.realEstate}%, Alternatives ${portfolioAllocation.alternatives}%
- TIME ETF Beta: ${timeEtfComparison.betaVsTime.toFixed(2)}
- Correlation: ${timeEtfComparison.correlation.toFixed(2)}
- Top Sectors: ${topSectors.map(([sector, pct]) => `${sector} ${(pct as number).toFixed(1)}%`).join(', ')}

Design Requirements:
- Modern financial dashboard with side-by-side comparison charts
- Use Clockwise Capital's blue (#1E3A8A) and green (#10B981) color scheme
- Include both pie charts for asset allocation and bar charts for sector comparison
- Clean, professional layout with clear labels and percentages
- Add performance metrics display (Beta, Correlation)
- Suitable for investment presentations and client reports`;

    } else {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "lifecycle" or "portfolio_comparison"' },
        { status: 400 }
      );
    }

    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      const imageUrl = response.data?.[0]?.url;
      
      if (!imageUrl) {
        console.error('OpenAI returned empty response');
        return NextResponse.json(
          { error: 'No image URL returned from OpenAI' },
          { status: 500 }
        );
      }

      return NextResponse.json({ imageUrl });
    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      
      // Handle specific OpenAI errors
      if (openaiError?.status === 400) {
        return NextResponse.json(
          { error: 'Invalid prompt or parameters' },
          { status: 400 }
        );
      } else if (openaiError?.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 500 }
        );
      } else if (openaiError?.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      } else if (openaiError?.status >= 500) {
        return NextResponse.json(
          { error: 'OpenAI service temporarily unavailable' },
          { status: 503 }
        );
      }
      
      throw openaiError; // Re-throw for general error handler
    }
  } catch (error: any) {
    console.error('Image generation error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Image generation failed' },
      { status: 500 }
    );
  }
}
