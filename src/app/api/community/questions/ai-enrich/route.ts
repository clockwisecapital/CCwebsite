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
3. 3-5 relevant tags (single words or short phrases) that categorize this question

Return ONLY a JSON object in this exact format:
{
  "title": "Short engaging title here",
  "historicalPeriodId": 1,
  "tags": ["tag1", "tag2", "tag3"]
}

Guidelines:
- Title should be clear, specific, and engaging (not just a restatement of the question)
- Choose the historical period that best matches the economic conditions, market dynamics, or time period mentioned or implied in the question
- Tags should be lowercase, relevant investment/economic terms (e.g., "recession", "tech-bubble", "inflation", "bonds", "growth")
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
    if (!aiResult.title || !aiResult.historicalPeriodId || !Array.isArray(aiResult.tags)) {
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        title: aiResult.title.substring(0, 200), // Ensure max length
        historicalPeriod,
        historicalPeriodId: aiResult.historicalPeriodId,
        tags: aiResult.tags.slice(0, 10).map((tag: string) => tag.toLowerCase().trim()),
        description: selectedPhase.synopsis
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
