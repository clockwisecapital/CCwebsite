'use client';

import React, { useState, useRef } from 'react';
import { parseCSV, validateCSVFile, type ParseResult } from '@/lib/utils/csvParser';

export interface Holding {
  name?: string;
  ticker?: string;
  dollarAmount?: number;
  percentage: number;
}

export interface KronosPortfolioFormData {
  name: string;
  description?: string;
  totalValue?: number;
  portfolioValueRange: string;
  specificHoldings: Holding[];
}

interface KronosStylePortfolioFormProps {
  onSubmit: (data: KronosPortfolioFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function KronosStylePortfolioForm({ onSubmit, isLoading = false }: KronosStylePortfolioFormProps) {
  const [formData, setFormData] = useState<KronosPortfolioFormData>({
    name: '',
    description: '',
    totalValue: undefined,
    portfolioValueRange: '',
    specificHoldings: [],
  });

  const [displayTotalValue, setDisplayTotalValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [csvUploadStatus, setCsvUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [csvParseResult, setCsvParseResult] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatNumberWithCommas = (value: string): string => {
    const numericValue = value.replace(/,/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue).toLocaleString('en-US');
  };

  const parseNumber = (value: string): number => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/portfolio-holdings-template.csv';
    link.download = 'portfolio-holdings-template.csv';
    link.click();
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvParseResult(null);
    setCsvUploadStatus('uploading');

    const validation = validateCSVFile(file);
    if (!validation.valid) {
      setCsvUploadStatus('error');
      setCsvParseResult({
        success: false,
        holdings: [],
        errors: [validation.error || 'Invalid file'],
        warnings: [],
        skippedRows: 0,
      });
      return;
    }

    try {
      const text = await file.text();
      const result = parseCSV(text);
      setCsvParseResult(result);

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          specificHoldings: [...(prev.specificHoldings || []), ...result.holdings],
        }));
        setCsvUploadStatus('success');
      } else {
        setCsvUploadStatus('error');
      }
    } catch (error) {
      setCsvUploadStatus('error');
      setCsvParseResult({
        success: false,
        holdings: [],
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        skippedRows: 0,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Portfolio name is required';
    }
    
    const hasPortfolioValue = formData.totalValue && formData.totalValue > 0;
    const hasSpecificHoldings = formData.specificHoldings && formData.specificHoldings.length > 0;
    
    if (!hasPortfolioValue && !hasSpecificHoldings) {
      newErrors.portfolio = 'Please add at least one investment to continue';
    }
    
    if (hasSpecificHoldings && formData.specificHoldings) {
      const hasValidHolding = formData.specificHoldings.some(h => 
        h.ticker && h.ticker.trim().length > 0 && 
        (h.dollarAmount && h.dollarAmount > 0 || h.percentage > 0)
      );
      
      if (!hasValidHolding) {
        newErrors.portfolio = 'Please enter at least one investment with ticker and amount';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Portfolio Name */}
      <div>
        <label htmlFor="portfolioName" className="block text-sm font-semibold text-gray-200 mb-2">
          Portfolio Name *
        </label>
        <input
          type="text"
          id="portfolioName"
          value={formData.name}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, name: e.target.value }));
            if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
          }}
          placeholder="e.g., Growth Portfolio"
          className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
        />
        {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name}</p>}
      </div>

      {/* Total Portfolio Value Selection */}
      <div>
        <label htmlFor="portfolioValueRange" className="block text-sm font-semibold text-gray-200 mb-2">
          Total Portfolio Value
        </label>
        <select
          id="portfolioValueRange"
          value={formData.portfolioValueRange}
          onChange={(e) => {
            const range = e.target.value;
            setFormData(prev => ({ ...prev, portfolioValueRange: range }));
            
            let value: number | undefined;
            switch (range) {
              case 'less-than-100k':
                value = 50000;
                break;
              case '100k-500k':
                value = 300000;
                break;
              case '500k-1m':
                value = 750000;
                break;
              case '1m-2m-plus':
                value = 1500000;
                break;
              case 'custom':
                value = formData.totalValue;
                break;
              default:
                value = undefined;
            }
            
            if (range !== 'custom' && range !== '') {
              setFormData(prev => ({
                ...prev,
                totalValue: value,
                specificHoldings: []
              }));
            } else if (range === 'custom') {
              setFormData(prev => ({
                ...prev,
                specificHoldings: []
              }));
            }
          }}
          className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
        >
          <option value="">Select Range...</option>
          <option value="less-than-100k">$0 - $100k</option>
          <option value="100k-500k">$100k - $500k</option>
          <option value="500k-1m">$500k - $1M</option>
          <option value="1m-2m-plus">$1M - $2M+</option>
          <option value="custom">Enter Custom Amount</option>
        </select>
      </div>

      {/* Custom Amount Input - Only show if "custom" is selected */}
      {formData.portfolioValueRange === 'custom' && (
        <div className="space-y-6">
          <div>
            <label htmlFor="customTotalValue" className="block text-sm font-semibold text-gray-200 mb-2">
              Enter Total Portfolio Value
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">$</span>
              <input
                type="text"
                id="customTotalValue"
                value={displayTotalValue}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value) {
                    const formatted = formatNumberWithCommas(value);
                    setDisplayTotalValue(formatted);
                    setFormData(prev => ({
                      ...prev,
                      totalValue: parseNumber(formatted)
                    }));
                  } else {
                    setDisplayTotalValue('');
                    setFormData(prev => ({
                      ...prev,
                      totalValue: undefined
                    }));
                  }
                }}
                className="w-full pl-8 pr-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="500,000"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-200">
                Describe Your Holdings
              </label>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              <span className="font-semibold text-teal-400">Enter ticker symbols or tradeable identifiers</span> for each investment. Examples: AAPL (stocks), VOO (ETFs), AGG (bonds), VNQ (REITs), GLD (gold).
            </p>

            {/* Add Holding Button */}
            <button
              type="button"
              onClick={() => {
                const newHoldings = [...(formData.specificHoldings || []), { name: '', ticker: '', percentage: 0 }];
                setFormData({ ...formData, specificHoldings: newHoldings });
              }}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-semibold mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Investment
            </button>

            {/* Holdings Total Summary */}
            {formData.specificHoldings && formData.specificHoldings.length > 0 && (
              <div className="mb-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                {(() => {
                  const totalDollars = formData.specificHoldings.reduce((sum, h) => sum + (h.dollarAmount || 0), 0);
                  const totalPercentage = formData.specificHoldings.reduce((sum, h) => sum + (h.percentage || 0), 0);
                  const hasDollars = totalDollars > 0;
                  const hasPercentages = totalPercentage > 0;

                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Total Holdings:</span>
                      <div className="text-sm font-semibold text-teal-400">
                        {hasDollars && <span>${totalDollars.toLocaleString()}</span>}
                        {hasDollars && hasPercentages && <span className="text-gray-500 mx-2">•</span>}
                        {hasPercentages && (
                          <span className={totalPercentage > 100 ? 'text-amber-400' : ''}>
                            {totalPercentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Holdings List */}
            {formData.specificHoldings && formData.specificHoldings.length > 0 && (
              <div className="space-y-3 mb-4">
                {formData.specificHoldings.map((holding, index) => {
                  const holdingDollarAmount = holding.dollarAmount || 0;
                  
                  return (
                    <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Ticker Symbol */}
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Ticker / Symbol *
                          </label>
                          <input
                            type="text"
                            value={holding.ticker || ''}
                            onChange={(e) => {
                              const newHoldings = [...(formData.specificHoldings || [])];
                              newHoldings[index] = { ...newHoldings[index], ticker: e.target.value.toUpperCase() };
                              setFormData({ ...formData, specificHoldings: newHoldings });
                            }}
                            className="w-full px-3 py-2 border border-gray-500 bg-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm uppercase"
                            placeholder={index === 0 ? "AAPL" : index === 1 ? "VTI" : index === 2 ? "AGG" : "TICKER"}
                          />
                        </div>

                        {/* Dollar Amount OR Percentage */}
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Amount or %
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                              <input
                                type="text"
                                value={holdingDollarAmount > 0 ? holdingDollarAmount.toLocaleString() : ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9]/g, '');
                                  const newHoldings = [...(formData.specificHoldings || [])];
                                  if (value) {
                                    const amount = parseInt(value);
                                    newHoldings[index] = { 
                                      ...newHoldings[index], 
                                      dollarAmount: amount,
                                      percentage: 0
                                    };
                                  } else {
                                    newHoldings[index] = { 
                                      ...newHoldings[index], 
                                      dollarAmount: undefined 
                                    };
                                  }
                                  setFormData({ ...formData, specificHoldings: newHoldings });
                                }}
                                className="w-full pl-6 pr-2 py-2 border border-gray-500 bg-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                placeholder="50000"
                              />
                            </div>
                            <span className="text-gray-400 text-sm">or</span>
                            <div className="relative flex-1">
                              <input
                                type="number"
                                value={holding.percentage || ''}
                                onChange={(e) => {
                                  const newHoldings = [...(formData.specificHoldings || [])];
                                  const percentage = parseFloat(e.target.value) || 0;
                                  newHoldings[index] = { 
                                    ...newHoldings[index], 
                                    percentage: percentage,
                                    dollarAmount: undefined
                                  };
                                  setFormData({ ...formData, specificHoldings: newHoldings });
                                }}
                                className="w-full pr-7 pl-2 py-2 border border-gray-500 bg-gray-600 text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                                placeholder="25"
                                min="0"
                                max="100"
                                step="0.1"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newHoldings = formData.specificHoldings?.filter((_, i) => i !== index);
                          setFormData({ ...formData, specificHoldings: newHoldings });
                        }}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center text-sm text-gray-400 my-4">
              — or upload from file —
            </div>

            {/* CSV Upload Section */}
            <div className="mb-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  aria-label="Upload CSV file"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={csvUploadStatus === 'uploading'}
                  className="flex-1 py-2.5 px-4 border border-gray-600 hover:border-teal-500 text-gray-300 hover:text-teal-400 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {csvUploadStatus === 'uploading' ? 'Uploading...' : 'Upload CSV'}
                </button>
                <span className="text-xs text-gray-400">or</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex-1 py-2.5 px-4 border border-gray-600 hover:border-teal-500 text-gray-300 hover:text-teal-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </button>
              </div>

              {/* Upload Status Messages */}
              {csvParseResult && (
                <div className="mt-3">
                  {csvParseResult.success && (
                    <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-green-300 font-medium">
                            Successfully imported {csvParseResult.holdings.length} holding{csvParseResult.holdings.length !== 1 ? 's' : ''}
                          </p>
                          {csvParseResult.skippedRows > 0 && (
                            <p className="text-xs text-green-400 mt-1">
                              Skipped {csvParseResult.skippedRows} empty or invalid row{csvParseResult.skippedRows !== 1 ? 's' : ''}
                            </p>
                          )}
                          {csvParseResult.warnings.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {csvParseResult.warnings.map((warning, idx) => (
                                <p key={idx} className="text-xs text-yellow-400">⚠️ {warning}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!csvParseResult.success && csvParseResult.errors.length > 0 && (
                    <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-red-300 font-medium mb-2">Upload failed:</p>
                          <div className="space-y-1">
                            {csvParseResult.errors.map((error, idx) => (
                              <p key={idx} className="text-xs text-red-400">• {error}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {errors.portfolio && (
              <p className="mt-2 text-sm text-red-400">{errors.portfolio}</p>
            )}

            <p className="text-xs text-gray-400 mt-3">
              <span className="font-semibold text-teal-400">📊 Analysis Tip:</span> Use publicly traded ticker symbols for accurate Monte Carlo simulations based on real market data and historical volatility.
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating Portfolio...
          </>
        ) : (
          'Create Portfolio'
        )}
      </button>
    </form>
  );
}
