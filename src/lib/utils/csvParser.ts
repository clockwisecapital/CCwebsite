/**
 * CSV Parser for Portfolio Holdings
 * Supports multiple column name variations from different brokers
 */

export interface ParsedHolding {
  name: string;
  ticker?: string;
  percentage: number;
  dollarAmount?: number;
}

export interface ParseResult {
  success: boolean;
  holdings: ParsedHolding[];
  errors: string[];
  warnings: string[];
  skippedRows: number;
}

export interface ColumnMapping {
  ticker?: number;
  name?: number;
  quantity?: number;
  price?: number;
  marketValue?: number;
  percentage?: number;
}

// Column name variations commonly used by brokers
const COLUMN_VARIATIONS = {
  ticker: ['symbol', 'ticker', 'security', 'stock', 'tickersymbol', 'stockticker'],
  name: ['name', 'description', 'securityname', 'security name', 'holdingname', 'holding name'],
  quantity: ['quantity', 'shares', 'units', 'qty', 'sharebalance', 'share balance'],
  price: ['price', 'pricepershare', 'price per share', 'unitprice', 'unit price', 'currentprice', 'current price'],
  marketValue: ['marketvalue', 'market value', 'value', 'totalvalue', 'total value', 'amount', 'totalamount'],
  percentage: ['percentage', 'weight', 'allocation', 'percent', '%', 'weighting', 'weightings'],
};

/**
 * Normalize column names by removing spaces, special chars, and converting to lowercase
 */
function normalizeColumnName(colName: string): string {
  return colName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Map CSV headers to standardized column indices
 */
export function normalizeColumnNames(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  headers.forEach((header, index) => {
    const normalized = normalizeColumnName(header);

    // Check each column type for a match
    for (const [columnType, variations] of Object.entries(COLUMN_VARIATIONS)) {
      if (variations.includes(normalized)) {
        mapping[columnType as keyof ColumnMapping] = index;
        break;
      }
    }
  });

  return mapping;
}

/**
 * Parse a single CSV row into a holding object
 */
function parseRow(
  row: string[],
  mapping: ColumnMapping,
  rowNumber: number
): { holding?: ParsedHolding; error?: string; warning?: string } {
  // Extract values based on mapping
  const ticker = mapping.ticker !== undefined ? row[mapping.ticker]?.trim().toUpperCase() : undefined;
  const name = mapping.name !== undefined ? row[mapping.name]?.trim() : '';
  const quantityStr = mapping.quantity !== undefined ? row[mapping.quantity]?.trim() : undefined;
  const priceStr = mapping.price !== undefined ? row[mapping.price]?.trim() : undefined;
  const marketValueStr = mapping.marketValue !== undefined ? row[mapping.marketValue]?.trim() : undefined;
  const percentageStr = mapping.percentage !== undefined ? row[mapping.percentage]?.trim() : undefined;

  // Skip empty rows
  if (!ticker && !name && !quantityStr && !marketValueStr && !percentageStr) {
    return {};
  }

  // Validate required fields
  if (!ticker) {
    return { error: `Row ${rowNumber}: Missing ticker symbol` };
  }

  // Parse numeric values
  let quantity: number | undefined;
  let price: number | undefined;
  let marketValue: number | undefined;
  let percentage: number | undefined;

  if (quantityStr) {
    quantity = parseFloat(quantityStr.replace(/,/g, ''));
    if (isNaN(quantity) || quantity < 0) {
      return { error: `Row ${rowNumber}: Invalid quantity "${quantityStr}"` };
    }
  }

  if (priceStr) {
    price = parseFloat(priceStr.replace(/[$,]/g, ''));
    if (isNaN(price) || price < 0) {
      return { error: `Row ${rowNumber}: Invalid price "${priceStr}"` };
    }
  }

  if (marketValueStr) {
    marketValue = parseFloat(marketValueStr.replace(/[$,]/g, ''));
    if (isNaN(marketValue) || marketValue < 0) {
      return { error: `Row ${rowNumber}: Invalid market value "${marketValueStr}"` };
    }
  }

  if (percentageStr) {
    // Handle percentage with or without % sign
    const cleanPercentage = percentageStr.replace(/[%,]/g, '');
    percentage = parseFloat(cleanPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return { error: `Row ${rowNumber}: Invalid percentage "${percentageStr}"` };
    }
  }

  // Calculate market value if we have quantity and price but no market value
  if (quantity && price && !marketValue) {
    marketValue = quantity * price;
  }

  // Ensure we have either market value or percentage
  if (!marketValue && !percentage) {
    return {
      error: `Row ${rowNumber}: Must provide either Market Value or Percentage (or Quantity + Price)`,
    };
  }

  const holding: ParsedHolding = {
    ticker,
    name: name || ticker, // Use ticker as name if name is not provided
    percentage: percentage || 0,
    dollarAmount: marketValue,
  };

  return { holding };
}

/**
 * Parse CSV text into holdings array
 */
export function parseCSV(csvText: string): ParseResult {
  const result: ParseResult = {
    success: false,
    holdings: [],
    errors: [],
    warnings: [],
    skippedRows: 0,
  };

  try {
    // Split into lines and remove empty lines
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      result.errors.push('CSV must contain at least a header row and one data row');
      return result;
    }

    // Parse headers
    const headerLine = lines[0];
    const headers = headerLine.split(',').map((h) => h.trim());

    // Create column mapping
    const mapping = normalizeColumnNames(headers);

    // Validate required columns
    if (mapping.ticker === undefined) {
      result.errors.push(
        'CSV must include a Symbol/Ticker column. Supported headers: ' +
          COLUMN_VARIATIONS.ticker.join(', ')
      );
      return result;
    }

    // Check for at least one value column
    const hasValueColumn =
      mapping.marketValue !== undefined ||
      mapping.percentage !== undefined ||
      (mapping.quantity !== undefined && mapping.price !== undefined);

    if (!hasValueColumn) {
      result.errors.push(
        'CSV must include at least one of: Market Value, Percentage, or (Quantity + Price)'
      );
      return result;
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(',').map((v) => v.trim());

      const parseResult = parseRow(values, mapping, i + 1);

      if (parseResult.error) {
        result.errors.push(parseResult.error);
        result.skippedRows++;
      } else if (parseResult.warning) {
        result.warnings.push(parseResult.warning);
      } else if (parseResult.holding) {
        result.holdings.push(parseResult.holding);
      } else {
        // Empty row - skip silently
        result.skippedRows++;
      }
    }

    // Final validation
    if (result.holdings.length === 0) {
      result.errors.push('No valid holdings found in CSV');
      return result;
    }

    // Check if percentages add up (if percentages are used)
    const hasPercentages = result.holdings.some((h) => h.percentage > 0);
    if (hasPercentages) {
      const totalPercentage = result.holdings.reduce((sum, h) => sum + h.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.1 && totalPercentage > 0) {
        result.warnings.push(
          `Percentages add up to ${totalPercentage.toFixed(1)}% instead of 100%. You can adjust individual holdings after import.`
        );
      }
    }

    result.success = true;
    return result;
  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Validate a CSV file before parsing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    return { valid: false, error: 'Please upload a CSV file (.csv)' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
}

