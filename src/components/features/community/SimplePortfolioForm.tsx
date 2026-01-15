'use client';

import React, { useState, useRef } from 'react';
import { FiDollarSign, FiTrendingUp, FiTrash2, FiPlus } from 'react-icons/fi';
import { parseCSV, validateCSVFile, type ParseResult } from '@/lib/utils/csvParser';

export interface Holding {
  ticker: string;
  dollarAmount?: number;
  percentage?: number;
}

export interface SimplePortfolioFormData {
  name: string;
  description: string;
  totalValue: number;
  stocks: number;
  bonds: number;
  cash: number;
  alternatives: number;
  riskTolerance: 'low' | 'medium' | 'high';
  specificHoldings: Holding[];
}

interface SimplePortfolioFormProps {
  onSubmit: (data: SimplePortfolioFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function SimplePortfolioForm({ onSubmit, isLoading = false }: SimplePortfolioFormProps) {
  const [formData, setFormData] = useState<SimplePortfolioFormData>({
    name: '',
    description: '',
    totalValue: 0,
    stocks: 60,
    bonds: 30,
    cash: 10,
    alternatives: 0,
    riskTolerance: 'medium',
    specificHoldings: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [csvUploadStatus, setCsvUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [csvParseResult, setCsvParseResult] = useState<ParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalValue' ? parseFloat(value) || 0 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAllocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    const allocationKeys = ['stocks', 'bonds', 'cash', 'alternatives'] as const;
    type AllocationKey = typeof allocationKeys[number];
    const other = allocationKeys.filter(key => key !== name);
    
    // Calculate remaining allocation
    const remaining = 100 - numValue;
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
      // Distribute remaining among other allocations proportionally
      ...other.reduce((acc, key) => {
        const allocationKey = key as AllocationKey;
        const currentTotal = other.reduce((sum, k) => sum + (prev[k as AllocationKey] || 0), 0);
        acc[allocationKey] = Math.round((prev[allocationKey] / currentTotal) * remaining);
        return acc;
      }, {} as Partial<Pick<SimplePortfolioFormData, AllocationKey>>)
    }));
  };

  const handleAddHolding = () => {
    setFormData(prev => ({
      ...prev,
      specificHoldings: [...prev.specificHoldings, { ticker: '', dollarAmount: 0, percentage: 0 }]
    }));
  };

  const handleHoldingChange = (index: number, field: 'ticker' | 'dollarAmount' | 'percentage', value: string | number) => {
    const newHoldings = [...formData.specificHoldings];
    if (field === 'ticker') {
      newHoldings[index] = { ...newHoldings[index], ticker: (value as string).toUpperCase() };
    } else if (field === 'dollarAmount') {
      const amount = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, '')) || 0 : value;
      newHoldings[index] = { ...newHoldings[index], dollarAmount: amount, percentage: 0 };
    } else if (field === 'percentage') {
      const pct = typeof value === 'string' ? parseFloat(value) : value;
      newHoldings[index] = { ...newHoldings[index], percentage: pct, dollarAmount: 0 };
    }
    setFormData(prev => ({ ...prev, specificHoldings: newHoldings }));
  };

  const handleRemoveHolding = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specificHoldings: prev.specificHoldings.filter((_, i) => i !== index)
    }));
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

    // Reset previous results
    setCsvParseResult(null);
    setCsvUploadStatus('uploading');

    // Validate file
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

    // Read and parse file
    try {
      const text = await file.text();
      const result = parseCSV(text);
      setCsvParseResult(result);

      if (result.success) {
        // Add parsed holdings to form data, filtering to ensure all have valid tickers
        const validHoldings: Holding[] = result.holdings
          .filter(h => h.ticker) // Only include holdings with ticker
          .map(h => ({
            ticker: h.ticker!,
            dollarAmount: h.dollarAmount,
            percentage: h.percentage,
          }));
        
        setFormData(prev => ({
          ...prev,
          specificHoldings: [...(prev.specificHoldings || []), ...validHoldings],
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalAllocation = formData.stocks + formData.bonds + formData.cash + formData.alternatives;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Portfolio name is required';
    }
    if (formData.totalValue <= 0) {
      newErrors.totalValue = 'Portfolio value must be greater than 0';
    }
    if (totalAllocation !== 100) {
      newErrors.allocation = `Allocation must equal 100% (currently ${totalAllocation}%)`;
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
        <label className="block text-sm font-semibold text-gray-200 mb-2">
          Portfolio Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Growth Portfolio"
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none transition-colors"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-2">
          Description (Optional)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., My long-term growth strategy"
          rows={2}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Total Portfolio Value */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-2">
          Total Portfolio Value *
        </label>
        <div className="relative">
          <FiDollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <input
            type="number"
            name="totalValue"
            value={formData.totalValue || ''}
            onChange={handleChange}
            placeholder="100,000"
            min="0"
            step="1000"
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none transition-colors"
          />
        </div>
        {errors.totalValue && <p className="text-red-400 text-sm mt-1">{errors.totalValue}</p>}
      </div>

      {/* Holdings */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
          <FiTrendingUp className="w-4 h-4" />
          Your Holdings (Optional)
        </label>
        <p className="text-xs text-gray-400 mb-4">
          Add specific holdings with ticker symbols. Examples: AAPL (stocks), VOO (ETFs), AGG (bonds)
        </p>

        {formData.specificHoldings.length > 0 && (
          <div className="space-y-3 mb-4">
            {formData.specificHoldings.map((holding, index) => (
              <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  {/* Ticker */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Ticker Symbol *
                    </label>
                    <input
                      type="text"
                      value={holding.ticker}
                      onChange={(e) => handleHoldingChange(index, 'ticker', e.target.value)}
                      placeholder="AAPL"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none transition-colors uppercase text-sm"
                    />
                  </div>

                  {/* Dollar Amount */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Amount ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="text"
                        value={holding.dollarAmount && holding.dollarAmount > 0 ? holding.dollarAmount.toLocaleString() : ''}
                        onChange={(e) => handleHoldingChange(index, 'dollarAmount', e.target.value)}
                        placeholder="50000"
                        className="w-full pl-6 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Percentage */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Or %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={holding.percentage || ''}
                        onChange={(e) => handleHoldingChange(index, 'percentage', e.target.value)}
                        placeholder="25"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full pr-7 pl-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none transition-colors text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveHolding(index)}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <FiTrash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Holding Button */}
        <button
          type="button"
          onClick={handleAddHolding}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-teal-500 transition-colors text-sm font-medium"
        >
          <FiPlus className="w-4 h-4" />
          Add Holding
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-400">or upload from file</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* CSV Upload Section */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
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
              className="flex-1 py-2.5 px-4 border border-gray-700 hover:border-teal-500 text-gray-300 hover:text-teal-400 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
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
              className="flex-1 py-2.5 px-4 border border-gray-700 hover:border-teal-500 text-gray-300 hover:text-teal-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
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
      </div>

      {/* Asset Allocation */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <FiTrendingUp className="w-4 h-4" />
          Asset Allocation {totalAllocation !== 100 && <span className="text-red-400">({totalAllocation}%)</span>}
        </label>
        
        <div className="space-y-3">
          {/* Stocks */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Stocks</label>
              <span className="text-sm font-semibold text-teal-400">{formData.stocks}%</span>
            </div>
            <input
              type="range"
              name="stocks"
              min="0"
              max="100"
              value={formData.stocks}
              onChange={handleAllocationChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
          </div>

          {/* Bonds */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Bonds</label>
              <span className="text-sm font-semibold text-blue-400">{formData.bonds}%</span>
            </div>
            <input
              type="range"
              name="bonds"
              min="0"
              max="100"
              value={formData.bonds}
              onChange={handleAllocationChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Cash */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Cash</label>
              <span className="text-sm font-semibold text-green-400">{formData.cash}%</span>
            </div>
            <input
              type="range"
              name="cash"
              min="0"
              max="100"
              value={formData.cash}
              onChange={handleAllocationChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>

          {/* Alternatives */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Alternatives</label>
              <span className="text-sm font-semibold text-purple-400">{formData.alternatives}%</span>
            </div>
            <input
              type="range"
              name="alternatives"
              min="0"
              max="100"
              value={formData.alternatives}
              onChange={handleAllocationChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
        {errors.allocation && <p className="text-red-400 text-sm mt-2">{errors.allocation}</p>}
      </div>

      {/* Risk Tolerance */}
      <div>
        <label className="block text-sm font-semibold text-gray-200 mb-2">
          Risk Tolerance
        </label>
        <select
          name="riskTolerance"
          value={formData.riskTolerance}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-teal-500 focus:outline-none transition-colors"
        >
          <option value="low">Conservative (Low Risk)</option>
          <option value="medium">Moderate (Medium Risk)</option>
          <option value="high">Aggressive (High Risk)</option>
        </select>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white font-bold rounded-lg transition-colors"
      >
        {isLoading ? 'Creating Portfolio...' : 'Create Portfolio'}
      </button>
    </form>
  );
}
