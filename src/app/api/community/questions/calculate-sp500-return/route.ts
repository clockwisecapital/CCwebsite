/**
 * API Route: /api/community/questions/calculate-sp500-return
 * Calculates historical S&P 500 returns for a given time period
 */

import { NextRequest, NextResponse } from 'next/server';

// Historical S&P 500 annualized returns by period
// Source: Historical market data (CAGR for each period)
const HISTORICAL_SP500_RETURNS: Record<string, number> = {
  // Format: "START-END": annualized_return (decimal)
  "1945-1965": 0.124,  // Easy Money Era - Post-WWII expansion
  "1965-1980": 0.038,  // Stagflation - High inflation, low growth
  "1980-2000": 0.176,  // Bubble Phase - Reagan boom through dot-com
  "1995-2000": 0.286,  // Dot-Com Boom - Tech bubble peak
  "2000-2002": -0.145, // Dot-Com Bust - Tech crash
  "2003-2007": 0.098,  // Pre-GFC - Housing bubble expansion
  "2007-2009": -0.57,  // 2008 Financial Crisis - Global Financial Crisis ✅ UPDATED
  "2008-2009": -0.57,  // 2008 Financial Crisis (alias)
  "2008-2020": 0.134,  // Great Deleveraging - Post-GFC recovery (2009-2020) ✅ FIXED
  "2008-Present": 0.134,  // Great Deleveraging - Post-GFC recovery (2009-2020)
  "2009-2020": 0.134,  // Recovery & Bull Market - QE era
  "2009-Present": 0.134,  // Same as 2009-2020 (alias for present-day queries)
  "2020-2021": 0.185,  // COVID Recovery - Stimulus-driven rally
  "2021-2023": 0.095,  // Post-COVID Era - Meme stocks, crypto, rate shock
  "2021-Present": 0.095,  // Post-COVID Era (alias)
  "2022-2023": 0.042,  // Rate Hike Era - Fed tightening
  "2024-2025": 0.089,  // Current Period - AI boom
};

export async function POST(request: NextRequest) {
  try {
    const { startYear, endYear } = await request.json();
    
    if (!startYear || !endYear) {
      return NextResponse.json(
        { error: 'Both startYear and endYear are required' },
        { status: 400 }
      );
    }
    
    const key = `${startYear}-${endYear}`;
    console.log(`📊 Looking up S&P 500 return for period: ${key}`);
    const sp500Return = HISTORICAL_SP500_RETURNS[key];
    
    if (sp500Return !== undefined) {
      return NextResponse.json({
        success: true,
        sp500Return,
        period: { start: startYear, end: endYear },
        source: 'historical_data'
      });
    }
    
    // If exact match not found, try to find overlapping period
    const start = parseInt(startYear);
    const end = parseInt(endYear);
    
    // Find closest matching period
    let closestMatch: { key: string; return: number } | null = null;
    let smallestDiff = Infinity;
    
    for (const [periodKey, periodReturn] of Object.entries(HISTORICAL_SP500_RETURNS)) {
      const [periodStart, periodEnd] = periodKey.split('-').map(y => parseInt(y));
      
      // Check if periods overlap
      const overlapStart = Math.max(start, periodStart);
      const overlapEnd = Math.min(end, periodEnd);
      
      if (overlapStart <= overlapEnd) {
        const overlapYears = overlapEnd - overlapStart;
        const totalYears = end - start;
        const diff = Math.abs(totalYears - overlapYears);
        
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestMatch = { key: periodKey, return: periodReturn };
        }
      }
    }
    
    if (closestMatch) {
      return NextResponse.json({
        success: true,
        sp500Return: closestMatch.return,
        period: { start: startYear, end: endYear },
        source: 'estimated',
        note: `Estimated from closest period: ${closestMatch.key}`
      });
    }
    
    // Default fallback: use long-term market average
    return NextResponse.json({
      success: true,
      sp500Return: 0.10, // ~10% long-term average
      period: { start: startYear, end: endYear },
      source: 'default',
      note: 'Using long-term market average (10%)'
    });
    
  } catch (error: any) {
    console.error('Error calculating S&P 500 return:', error);
    return NextResponse.json(
      { error: 'Failed to calculate S&P 500 return', details: error.message },
      { status: 500 }
    );
  }
}
