import { NextRequest, NextResponse } from 'next/server';

interface ValidationRequest {
  data: {
    stocks?: number;
    bonds?: number;
    cash?: number;
    commodities?: number;
    realEstate?: number;
    alternatives?: number;
    topHoldings?: string[];
    sectorExposure?: string[];
    currentValue?: number;
    goalType?: 'Annual Income' | 'Lump Sum';
    goalAmount?: number;
  };
  csvData?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  parsedData?: {
    allocations?: Record<string, number>;
    currency?: string;
    topHoldings?: Array<{ name: string; percentage: number }>;
    sectorExposure?: Array<{ sector: string; percentage: number }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { data, csvData } = body;

    if (csvData) {
      // Validate CSV data
      return NextResponse.json(validateCsvData(csvData));
    } else if (data) {
      // Validate form data
      return NextResponse.json(validateFormData(data));
    } else {
      return NextResponse.json({
        isValid: false,
        errors: ['No data provided for validation'],
        warnings: [],
      });
    }
  } catch (error) {
    console.error('Data validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}

function validateFormData(data: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate asset allocation percentages
  const assetFields = ['stocks', 'bonds', 'cash', 'commodities', 'realEstate', 'alternatives'];
  const allocations: Record<string, number> = {};
  let totalAllocation = 0;

  for (const field of assetFields) {
    const value = data[field];
    if (typeof value === 'number') {
      if (value < 0) {
        errors.push(`${field} allocation cannot be negative`);
      } else if (value > 100) {
        errors.push(`${field} allocation cannot exceed 100%`);
      } else {
        allocations[field] = value;
        totalAllocation += value;
      }
    } else if (value !== undefined && value !== null) {
      errors.push(`${field} must be a number`);
    }
  }

  // Check total allocation
  if (Math.abs(totalAllocation - 100) > 0.01) {
    errors.push(`Total allocation must equal 100% (currently ${totalAllocation.toFixed(2)}%)`);
  }

  // Validate portfolio value
  if (data.currentValue !== undefined) {
    if (typeof data.currentValue !== 'number' || data.currentValue <= 0) {
      errors.push('Current portfolio value must be a positive number');
    } else if (data.currentValue < 1000) {
      warnings.push('Portfolio value seems low - please verify the amount');
    }
  }

  // Validate goal type and amount
  if (data.goalType && !['Annual Income', 'Lump Sum'].includes(data.goalType)) {
    errors.push('Goal type must be either "Annual Income" or "Lump Sum"');
  }

  if (data.goalAmount !== undefined) {
    if (typeof data.goalAmount !== 'number' || data.goalAmount <= 0) {
      errors.push('Goal amount must be a positive number');
    } else if (data.currentValue && data.goalAmount < data.currentValue && data.goalType === 'Lump Sum') {
      warnings.push('Goal amount is less than current portfolio value');
    }
  }

  // Validate top holdings
  if (data.topHoldings) {
    if (!Array.isArray(data.topHoldings)) {
      errors.push('Top holdings must be an array');
    } else {
      if (data.topHoldings.length > 10) {
        warnings.push('More than 10 holdings provided - only top 10 will be used');
      }
      
      for (let i = 0; i < data.topHoldings.length; i++) {
        const holding = data.topHoldings[i];
        if (typeof holding !== 'string') {
          errors.push(`Top holding ${i + 1} must be a string`);
        } else if (!holding.includes('%')) {
          warnings.push(`Top holding "${holding}" should include percentage (e.g., "AAPL 5%")`);
        }
      }
    }
  }

  // Validate sector exposure
  if (data.sectorExposure) {
    if (!Array.isArray(data.sectorExposure)) {
      errors.push('Sector exposure must be an array');
    } else {
      for (let i = 0; i < data.sectorExposure.length; i++) {
        const sector = data.sectorExposure[i];
        if (typeof sector !== 'string') {
          errors.push(`Sector exposure ${i + 1} must be a string`);
        } else if (!sector.includes('%')) {
          warnings.push(`Sector "${sector}" should include percentage (e.g., "Technology 25%")`);
        }
      }
    }
  }

  // Risk-based warnings
  if (allocations.stocks > 80) {
    warnings.push('High stock allocation (>80%) may increase portfolio volatility');
  }
  if (allocations.cash > 20) {
    warnings.push('High cash allocation (>20%) may limit growth potential');
  }
  if (allocations.alternatives > 30) {
    warnings.push('High alternative allocation (>30%) may increase complexity and fees');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    parsedData: errors.length === 0 ? data : undefined,
  };
}

function validateCsvData(csvData: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      errors.push('CSV must contain at least a header row and one data row');
      return { isValid: false, errors, warnings };
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Check for required headers
    const requiredHeaders = ['stocks %', 'bonds %', 'cash %', 'commodities %', 'real estate %', 'alternatives %'];
    const missingHeaders = requiredHeaders.filter(required => 
      !headers.some(header => header.includes(required.replace(' %', '').replace(' ', '')))
    );

    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Parse data rows
    const parsedData: any = {};
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        warnings.push(`Row ${i + 1} has ${values.length} values but ${headers.length} headers`);
        continue;
      }

      // Map values to data structure
      headers.forEach((header, index) => {
        const value = values[index];
        
        if (header.includes('stocks') || header.includes('stock')) {
          parsedData.stocks = parseFloat(value) || 0;
        } else if (header.includes('bonds') || header.includes('bond')) {
          parsedData.bonds = parseFloat(value) || 0;
        } else if (header.includes('cash')) {
          parsedData.cash = parseFloat(value) || 0;
        } else if (header.includes('commodities') || header.includes('commodity')) {
          parsedData.commodities = parseFloat(value) || 0;
        } else if (header.includes('real estate') || header.includes('realestate')) {
          parsedData.realEstate = parseFloat(value) || 0;
        } else if (header.includes('alternatives') || header.includes('alternative')) {
          parsedData.alternatives = parseFloat(value) || 0;
        } else if (header.includes('value') || header.includes('amount')) {
          parsedData.currentValue = parseFloat(value) || 0;
        } else if (header.includes('goal type')) {
          parsedData.goalType = value;
        } else if (header.includes('goal amount')) {
          parsedData.goalAmount = parseFloat(value) || 0;
        } else if (header.includes('top holdings') || header.includes('holdings')) {
          parsedData.topHoldings = value.split(';').map(h => h.trim()).filter(h => h);
        } else if (header.includes('sector')) {
          parsedData.sectorExposure = value.split(';').map(s => s.trim()).filter(s => s);
        }
      });
    }

    // Validate the parsed data using the same logic as form validation
    const formValidation = validateFormData(parsedData);
    
    return {
      isValid: formValidation.isValid,
      errors: [...errors, ...formValidation.errors],
      warnings: [...warnings, ...formValidation.warnings],
      parsedData: formValidation.isValid ? parsedData : undefined,
    };

  } catch {
    errors.push('Failed to parse CSV data - please check format');
    return { isValid: false, errors, warnings };
  }
}
