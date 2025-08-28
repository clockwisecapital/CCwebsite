// Tool contract for collecting and validating portfolio allocation data

import { sessionManager } from '../session';

export interface PortfolioAllocations {
  stocks: number;
  bonds: number;
  cash: number;
  commodities: number;
  real_estate: number;
  alternatives: number;
}

export interface TopPosition {
  name: string;
  weight: number;
}

export interface SectorAllocation {
  name: string;
  percentage: number;
}

export interface PortfolioData {
  allocations: PortfolioAllocations;
  currency: string;
  top_positions?: TopPosition[];
  sectors?: SectorAllocation[];
}

export async function collectPortfolio(
  sessionId: string,
  portfolioData: Partial<PortfolioData>
): Promise<{ portfolio_id: string; normalized: PortfolioData; validation_errors: string[] }> {
  
  const validation_errors: string[] = [];
  
  // Validate allocations exist
  if (!portfolioData.allocations) {
    validation_errors.push("Portfolio allocations are required");
    return {
      portfolio_id: '',
      normalized: {} as PortfolioData,
      validation_errors
    };
  }

  const allocations = portfolioData.allocations;
  
  // Validate all allocation percentages are present and non-negative
  const requiredAllocations = ['stocks', 'bonds', 'cash', 'commodities', 'real_estate', 'alternatives'];
  for (const allocation of requiredAllocations) {
    const value = allocations[allocation as keyof PortfolioAllocations];
    if (value === undefined || value === null) {
      validation_errors.push(`${allocation} allocation is required`);
    } else if (value < 0 || value > 100) {
      validation_errors.push(`${allocation} allocation must be between 0 and 100`);
    }
  }

  // Validate allocations sum to 100%
  const total = Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0);
  if (Math.abs(total - 100) > 0.01) { // Allow for small floating point errors
    validation_errors.push(`Portfolio allocations must sum to 100% (currently ${total.toFixed(1)}%)`);
  }

  // Validate currency
  if (!portfolioData.currency) {
    validation_errors.push("Currency is required");
  } else if (!/^[A-Z]{3}$/.test(portfolioData.currency)) {
    validation_errors.push("Currency must be a 3-letter ISO code (e.g., USD, EUR, GBP)");
  }

  // Validate top positions if provided
  if (portfolioData.top_positions) {
    if (portfolioData.top_positions.length > 10) {
      validation_errors.push("Maximum 10 top positions allowed");
    }
    
    for (const position of portfolioData.top_positions) {
      if (!position.name || !position.name.trim()) {
        validation_errors.push("Position name is required");
      }
      if (position.weight === undefined || position.weight < 0 || position.weight > 100) {
        validation_errors.push("Position weight must be between 0 and 100");
      }
    }
  }

  // Validate sectors if provided
  if (portfolioData.sectors) {
    const sectorTotal = portfolioData.sectors.reduce((sum, sector) => sum + (sector.percentage || 0), 0);
    if (sectorTotal > 100.01) { // Allow small floating point errors
      validation_errors.push(`Sector allocations cannot exceed 100% (currently ${sectorTotal.toFixed(1)}%)`);
    }
  }

  // If validation fails, return errors
  if (validation_errors.length > 0) {
    return {
      portfolio_id: '',
      normalized: {} as PortfolioData,
      validation_errors
    };
  }

  // Normalize portfolio data
  const normalized: PortfolioData = {
    allocations: {
      stocks: allocations.stocks || 0,
      bonds: allocations.bonds || 0,
      cash: allocations.cash || 0,
      commodities: allocations.commodities || 0,
      real_estate: allocations.real_estate || 0,
      alternatives: allocations.alternatives || 0
    },
    currency: portfolioData.currency!,
    top_positions: portfolioData.top_positions,
    sectors: portfolioData.sectors
  };

  const portfolio_id = `portfolio_${sessionId}_${Date.now()}`;
  
  // Update session with portfolio data
  const session = sessionManager.getSession(sessionId);
  if (session) {
    sessionManager.updateSession(sessionId, {
      portfolio: normalized
    });
    
    // Update completed slots
    sessionManager.updateSlots(session, ['allocations', 'currency']);
    
    // Add key facts
    const topAllocations = Object.entries(normalized.allocations)
      .filter(([_, value]) => value > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 2)
      .map(([key, value]) => `${key}=${value}%`);
    
    session.key_facts.push(
      `allocations=100%`,
      `currency=${normalized.currency}`,
      ...topAllocations
    );
  }

  return {
    portfolio_id,
    normalized,
    validation_errors: []
  };
}
