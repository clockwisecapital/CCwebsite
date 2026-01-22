'use client';

import { useState, useEffect, useRef } from 'react';
import type { IntakeFormData } from './PortfolioDashboard';
import { parseCSV, validateCSVFile, type ParseResult } from '@/lib/utils/csvParser';
import type { User } from '@supabase/supabase-js';

interface IntakeTabProps {
  onSubmit: (data: IntakeFormData) => void;
  initialData?: IntakeFormData | null;
  isAnalyzing: boolean;
  authenticatedUser?: User | null;
}

export default function IntakeTab({ onSubmit, initialData, isAnalyzing, authenticatedUser }: IntakeTabProps) {
  const [formData, setFormData] = useState<IntakeFormData>({
    experienceLevel: 'Intermediate',
    riskTolerance: 'medium',
    portfolio: {
      totalValue: undefined,
      stocks: 0,
      bonds: 0,
      cash: 0,
      realEstate: 0,
      commodities: 0,
      alternatives: 0,
    },
    specificHoldings: [],
    goalAmount: undefined,
    goalDescription: '',
    timeHorizon: undefined,
    monthlyContribution: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [displayGoalAmount, setDisplayGoalAmount] = useState('');
  const [displayMonthlyContribution, setDisplayMonthlyContribution] = useState('');
  const [displayTotalValue, setDisplayTotalValue] = useState('');
  const [portfolioValueRange, setPortfolioValueRange] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [parseNotes, setParseNotes] = useState('');
  const [allocationsParsed, setAllocationsParsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  // CSV Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvUploadStatus, setCsvUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [csvParseResult, setCsvParseResult] = useState<ParseResult | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.goalAmount) {
        setDisplayGoalAmount(initialData.goalAmount.toLocaleString('en-US'));
      }
      if (initialData.monthlyContribution) {
        setDisplayMonthlyContribution(initialData.monthlyContribution.toLocaleString('en-US'));
      }
      if (initialData.portfolio.totalValue) {
        setDisplayTotalValue(initialData.portfolio.totalValue.toLocaleString('en-US'));
      }
    }
  }, [initialData]);

  // Auto-fill user data if authenticated
  useEffect(() => {
    if (authenticatedUser && !formData.email) {
      // Only auto-fill if the fields are empty
      setFormData(prev => ({
        ...prev,
        email: authenticatedUser.email || prev.email,
        firstName: authenticatedUser.user_metadata?.first_name || prev.firstName,
        lastName: authenticatedUser.user_metadata?.last_name || prev.lastName,
      }));
      // Auto-acknowledge for authenticated users
      setAcknowledged(true);
    }
  }, [authenticatedUser, formData.email]);

  const formatNumberWithCommas = (value: string): string => {
    const numericValue = value.replace(/,/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue).toLocaleString('en-US');
  };

  const parseNumber = (value: string): number => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  // CSV Upload Handlers
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
        // Add parsed holdings to form data
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculate portfolio sum excluding totalValue
  const { stocks, bonds, cash, realEstate, commodities, alternatives } = formData.portfolio;
  const portfolioSum = stocks + bonds + cash + realEstate + commodities + alternatives;
  const isPortfolioValid = portfolioSum === 100;


  // Reserved for future reset functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleReset = () => {
    setFormData({
      experienceLevel: 'Intermediate',
      riskTolerance: 'medium',
      portfolio: {
        totalValue: undefined,
        stocks: 0,
        bonds: 0,
        cash: 0,
        realEstate: 0,
        commodities: 0,
        alternatives: 0,
      },
      specificHoldings: [],
      goalAmount: undefined,
      goalDescription: '',
      timeHorizon: undefined,
      monthlyContribution: 0,
    });
    setErrors({});
    setAllocationsParsed(false);
    setParseNotes('');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.age) {
      newErrors.age = 'Age is required';
    }

    if (!formData.portfolioDescription || formData.portfolioDescription.trim() === '') {
      newErrors.portfolioDescription = 'Portfolio Description is required';
    }

    // Only validate portfolio allocations if they've been parsed
    if (allocationsParsed && !isPortfolioValid) {
      newErrors.portfolio = `Portfolio allocations must sum to 100% (currently ${portfolioSum.toFixed(1)}%)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = async () => {
    // Clear errors when moving forward
    setErrors({});

    // Validate current step before proceeding
    // Step 0: Age
    if (currentStep === 0 && !formData.age) {
      setErrors({ age: 'Age is required' });
      return;
    }
    // Step 1: Portfolio - Require either specific holdings OR a portfolio value range
    if (currentStep === 1) {
      const hasPortfolioValue = formData.portfolio.totalValue && formData.portfolio.totalValue > 0;
      const hasSpecificHoldings = formData.specificHoldings && formData.specificHoldings.length > 0;
      
      // If no portfolio value and no specific holdings, require at least one
      if (!hasPortfolioValue && !hasSpecificHoldings) {
        setErrors({ specificHoldings: 'Please add at least one investment to continue' });
        return;
      }
      
      // If they have specific holdings, validate they're complete
      if (hasSpecificHoldings && formData.specificHoldings) {
        const hasValidHolding = formData.specificHoldings.some(h => 
          h.ticker && h.ticker.trim().length > 0 && 
          (h.dollarAmount && h.dollarAmount > 0 || h.percentage > 0)
        );
        
        if (!hasValidHolding) {
          setErrors({ specificHoldings: 'Please enter at least one investment with ticker and amount' });
          return;
        }
      }
    }
    // Step 7: First Name (only for unauthenticated users)
    if (!authenticatedUser && currentStep === 7 && (!formData.firstName || !formData.firstName.trim())) {
      setErrors({ firstName: 'First name is required' });
      return;
    }
    // Step 8: Last Name (only for unauthenticated users)
    if (!authenticatedUser && currentStep === 8 && (!formData.lastName || !formData.lastName.trim())) {
      setErrors({ lastName: 'Last name is required' });
      return;
    }
    // Step 9: Email & Acknowledgement (only for unauthenticated users)
    if (!authenticatedUser && currentStep === 9) {
      if (!formData.email || !formData.email.trim()) {
        setErrors({ email: 'Email is required' });
        return;
      }
      if (!validateEmail(formData.email)) {
        setErrors({ email: 'Please enter a valid email address' });
        return;
      }
      if (!acknowledged) {
        setErrors({ acknowledgement: 'You must acknowledge the disclaimer to continue' });
        return;
      }
    }
    // Step 10: Portfolio Name (optional but we proceed anyway)
    // For authenticated users, this is step 7; for unauthenticated, it's step 10
    const portfolioNameStep = authenticatedUser ? 7 : 10;
    if (currentStep === portfolioNameStep) {
      // Portfolio name is optional, so no validation required
      // Just proceed to submission
    }

    // When moving from step 6 to 7, parse the portfolio (but don't submit yet)
    if (currentStep === 6 && !analysisStarted) {
      setAnalysisStarted(true);
      // Parse portfolio allocations
      await parsePortfolio();
    }

    // Move to next step
    const finalStep = authenticatedUser ? 7 : 10;
    if (currentStep < finalStep) {
      setCurrentStep(currentStep + 1);
    } else {
      // On final step, submit everything and Show Analysis 
      // Submit regardless of portfolio parsing state - backend will handle validation
      onSubmit(formData);
    }
  };

  const parsePortfolio = async () => {
    if (!allocationsParsed) {
      setIsParsing(true);
      setErrors({});

      try {
        const response = await fetch('/api/portfolio/parse-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: formData.portfolioDescription })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to parse portfolio');
        }

        // Update allocations with AI-parsed values
        const updatedFormData = {
          ...formData,
          portfolio: {
            ...formData.portfolio,
            totalValue: data.allocations.totalValue || formData.portfolio.totalValue,
            stocks: data.allocations.stocks,
            bonds: data.allocations.bonds,
            cash: data.allocations.cash,
            realEstate: data.allocations.realEstate,
            commodities: data.allocations.commodities,
            alternatives: data.allocations.alternatives,
          }
        };

        setFormData(updatedFormData);
        setParseNotes(data.notes);
        setAllocationsParsed(true);

        // Validate the parsed allocations MUST equal 100%
        const sum = data.allocations.stocks + data.allocations.bonds + 
                    data.allocations.cash + data.allocations.realEstate + 
                    data.allocations.commodities + data.allocations.alternatives;
        
        setIsParsing(false);
        
        if (sum !== 100) {
          setErrors({ portfolio: `Portfolio allocations must equal 100% to proceed (currently ${sum.toFixed(1)}%). Please go back and adjust your description.` });
          setAnalysisStarted(false);
          return;
        }

        // Portfolio parsed successfully - continue to personal info questions
        // Analysis will start when user completes step 10
      } catch (error) {
        setIsParsing(false);
        setAnalysisStarted(false);
        setErrors({ portfolioDescription: error instanceof Error ? error.message : 'Failed to parse portfolio. Please go back and try again.' });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submission is handled by clicking Next through all steps
    // The last step (10) will use handleNext which validates and completes
  };

  // Define steps - exclude email/name fields for authenticated users
  const steps = [
    { id: 0, title: 'Age', field: 'age' },
    { id: 1, title: 'Current Investments', field: 'specificHoldings' },
    { id: 2, title: 'Risk Tolerance', field: 'riskTolerance' },
    { id: 3, title: 'Target Goal Amount', field: 'goalAmount' },
    { id: 4, title: 'Time Horizon', field: 'timeHorizon' },
    { id: 5, title: 'Monthly Contribution', field: 'monthlyContribution' },
    { id: 6, title: 'Goal Description', field: 'goalDescription' },
    // Only show name/email steps for unauthenticated users
    ...(authenticatedUser ? [] : [
      { id: 7, title: 'First Name', field: 'firstName' },
      { id: 8, title: 'Last Name', field: 'lastName' },
      { id: 9, title: 'Email & Acknowledgment', field: 'email' },
    ]),
    { id: 10, title: 'Portfolio Name', field: 'portfolioName' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Age
        return (
          <div className="space-y-4">
            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                How old are you?
              </p>
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-300 mb-2">
                Your Answer
              </label>
              <input
                type="number"
                id="age"
                min="18"
                max="100"
                value={formData.age || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="35"
              />
              {errors.age && (
                <p className="mt-2 text-sm text-red-600">{errors.age}</p>
              )}
            </div>
          </div>
        );

      case 1:
        // Portfolio Description
        return (
          <div className="space-y-4">
            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                Let&apos;s understand your current investments. Enter each position with its ticker, name, and amount for personalized analysis.
              </p>
            </div>
            
            {/* Total Portfolio Value Selection */}
            <div>
              <label htmlFor="portfolioValueRange" className="block text-sm font-medium text-gray-300 mb-2">
                Total Portfolio Value
              </label>
              <select
                id="portfolioValueRange"
                value={portfolioValueRange}
                onChange={(e) => {
                  const range = e.target.value;
                  setPortfolioValueRange(range);
                  // Set totalValue based on range selection (use representative midpoint)
                  let value: number | undefined;
                  switch (range) {
                    case 'less-than-100k':
                      value = 50000;    // $0-$100k → $50k
                      break;
                    case '100k-500k':
                      value = 300000;   // $100k-$500k → $300k
                      break;
                    case '500k-1m':
                      value = 750000;   // $500k-$1M → $750k
                      break;
                    case '1m-2m-plus':
                      value = 1500000;  // $1M-$2M+ → $1.5M
                      break;
                    case 'custom':
                      value = formData.portfolio.totalValue;
                      break;
                    default:
                      value = undefined;
                  }
                  if (range !== 'custom' && range !== '') {
                    // Set 100% stocks allocation - proxy system will use SPY automatically
                    setFormData(prev => ({
                      ...prev,
                      portfolio: {
                        ...prev.portfolio,
                        totalValue: value,
                        stocks: 100,      // Proxy system will use SPY
                        bonds: 0,
                        cash: 0,
                        realEstate: 0,
                        commodities: 0,
                        alternatives: 0
                      },
                      specificHoldings: []  // No specific holdings - use proxy
                    }));
                  } else if (range === 'custom') {
                    // Clear any holdings when switching to custom
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
            {portfolioValueRange === 'custom' && (
              <>
                <div>
                  <label htmlFor="customTotalValue" className="block text-sm font-medium text-gray-300 mb-2">
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
                            portfolio: {
                              ...prev.portfolio,
                              totalValue: parseNumber(formatted)
                            }
                          }));
                        } else {
                          setDisplayTotalValue('');
                          setFormData(prev => ({
                            ...prev,
                            portfolio: {
                              ...prev.portfolio,
                              totalValue: undefined
                            }
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
                    <label className="block text-sm font-medium text-gray-300">
                      Describe Your Holdings
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowExampleModal(true)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      See Examples
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mb-3">
                    <span className="font-semibold text-teal-400">Enter ticker symbols or tradeable identifiers</span> for each investment. Examples: AAPL (stocks), VOO (ETFs), AGG (bonds), VNQ (REITs), GLD (gold).
                  </p>

                  {/* Add Holding Button - Primary action */}
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
                        // Store dollar amount directly on holding for independent tracking
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

                              {/* Dollar Amount OR Percentage (independent from portfolio total) */}
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
                                            percentage: 0 // Clear percentage when dollar is entered
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
                                          dollarAmount: undefined // Clear dollar when percentage is entered
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

                  {errors.specificHoldings && (
                    <p className="mt-2 text-sm text-red-400">{errors.specificHoldings}</p>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    <span className="font-semibold text-teal-400">📊 Analysis Tip:</span> Use publicly traded ticker symbols for accurate Monte Carlo simulations based on real market data and historical volatility.
                  </p>
                </div>
              </>
            )}
          </div>
        );


      case 2:
        // Risk Tolerance
        return (
          <div className="space-y-4">
            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                What&apos;s your risk tolerance?
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, riskTolerance: 'low' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.riskTolerance === 'low'
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.riskTolerance === 'low' ? 'bg-blue-500' : 'bg-gray-600'
                    }`}>
                      <svg className={`w-5 h-5 ${formData.riskTolerance === 'low' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold ${formData.riskTolerance === 'low' ? 'text-blue-400' : 'text-gray-300'}`}>
                        Conservative
                      </div>
                      <div className="text-xs text-gray-400">Capital preservation</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, riskTolerance: 'medium' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.riskTolerance === 'medium'
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.riskTolerance === 'medium' ? 'bg-purple-500' : 'bg-gray-600'
                    }`}>
                      <svg className={`w-5 h-5 ${formData.riskTolerance === 'medium' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold ${formData.riskTolerance === 'medium' ? 'text-purple-400' : 'text-gray-300'}`}>
                        Moderate
                      </div>
                      <div className="text-xs text-gray-400">Balanced growth</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, riskTolerance: 'high' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.riskTolerance === 'high'
                      ? 'border-indigo-500 bg-indigo-900/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.riskTolerance === 'high' ? 'bg-indigo-500' : 'bg-gray-600'
                    }`}>
                      <svg className={`w-5 h-5 ${formData.riskTolerance === 'high' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold ${formData.riskTolerance === 'high' ? 'text-indigo-400' : 'text-gray-300'}`}>
                        Aggressive
                      </div>
                      <div className="text-xs text-gray-400">Maximum growth</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                <p className="text-xs text-gray-300">
                  {formData.riskTolerance === 'low' && (
                    <>
                      <strong>Conservative:</strong> Prioritize capital preservation with lower volatility. 
                      Focus on stable, income-generating investments.
                    </>
                  )}
                  {formData.riskTolerance === 'medium' && (
                    <>
                      <strong>Moderate:</strong> Balance growth and stability. Accept moderate volatility 
                      for potential higher returns.
                    </>
                  )}
                  {formData.riskTolerance === 'high' && (
                    <>
                      <strong>Aggressive:</strong> Maximize growth potential. Comfortable with significant 
                      short-term volatility for <strong>potential</strong> long-term gains.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        // Target Goal Amount
        return (
          <div className="space-y-4">
            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                What&apos;s your target goal amount?
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Answer
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">$</span>
                <input
                  type="text"
                  value={displayGoalAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value) {
                      const formatted = formatNumberWithCommas(value);
                      setDisplayGoalAmount(formatted);
                      setFormData({ ...formData, goalAmount: parseNumber(formatted) });
                    } else {
                      setDisplayGoalAmount('');
                      setFormData({ ...formData, goalAmount: undefined });
                    }
                  }}
                  className="w-full pl-8 pr-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                  placeholder="1,000,000"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        // Time Horizon
        return (
          <div className="space-y-4">
            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                What&apos;s your time horizon in years?
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Answer
              </label>
              <input
                type="number"
                value={formData.timeHorizon || ''}
                onChange={(e) => setFormData({ ...formData, timeHorizon: Number(e.target.value) || undefined })}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="10"
              />
              <p className="text-xs text-gray-400 mt-1">Years until you need to reach this goal</p>
            </div>
          </div>
        );

      case 5:
        // Monthly Contribution
        return (
          <div className="space-y-4">
            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                How much will you contribute monthly? (Optional)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Answer
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">$</span>
                <input
                  type="text"
                  value={displayMonthlyContribution}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value) {
                      const formatted = formatNumberWithCommas(value);
                      setDisplayMonthlyContribution(formatted);
                      setFormData({ ...formData, monthlyContribution: parseNumber(formatted) });
                    } else {
                      setDisplayMonthlyContribution('');
                      setFormData({ ...formData, monthlyContribution: 0 });
                    }
                  }}
                  className="w-full pl-8 pr-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                  placeholder="500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Additional monthly investment</p>
            </div>
          </div>
        );

      case 6:
        // Goal Description
        return (
          <div className="space-y-4">
            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                What is this goal for?
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Answer
              </label>
              <input
                type="text"
                value={formData.goalDescription || ''}
                onChange={(e) => setFormData({ ...formData, goalDescription: e.target.value })}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="Retirement, Home Purchase, etc."
              />
            </div>
          </div>
        );

      case 7:
        // First Name - With Kronos thinking animation
        return (
          <div className="space-y-4">
            {/* Kronos Thinking Header */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <svg className="absolute -inset-2 w-24 h-24 animate-spin" viewBox="0 0 50 50">
                  <circle 
                    className="opacity-25" 
                    cx="25" 
                    cy="25" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    style={{ color: '#0d9488' }}
                  />
                  <circle 
                    className="opacity-75" 
                    cx="25" 
                    cy="25" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    strokeDasharray="80"
                    strokeDashoffset="60"
                    style={{ color: '#0d9488' }}
                  />
                </svg>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-100 mb-2">Kronos is thinking...</h3>
              <p className="text-gray-300 text-sm">
                This usually takes 30-60 seconds
              </p>
            </div>

            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                While I analyze your portfolio, what&apos;s your first name?
              </p>
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                Your Answer
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>
          </div>
        );

      case 8:
        // Last Name - With Kronos thinking animation
        return (
          <div className="space-y-4">
            {/* Kronos Thinking Header */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <svg className="absolute -inset-2 w-24 h-24 animate-spin" viewBox="0 0 50 50">
                  <circle 
                    className="opacity-25" 
                    cx="25" 
                    cy="25" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    style={{ color: '#0d9488' }}
                  />
                  <circle 
                    className="opacity-75" 
                    cx="25" 
                    cy="25" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    strokeDasharray="80"
                    strokeDashoffset="60"
                    style={{ color: '#0d9488' }}
                  />
                </svg>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-100 mb-2">Kronos is thinking...</h3>
              <p className="text-gray-300 text-sm">
                This usually takes 30-60 seconds
              </p>
            </div>

            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                And your last name?
              </p>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                Your Answer
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="Smith"
              />
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>
        );

      case 9:
        // Email & Acknowledgment - With Kronos thinking animation
        return (
          <div className="space-y-4">
            {/* Kronos Thinking Header */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg animate-pulse">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <svg className="absolute -inset-2 w-24 h-24 animate-spin" viewBox="0 0 50 50">
                  <circle 
                    className="opacity-25" 
                    cx="25" 
                    cy="25" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    style={{ color: '#0d9488' }}
                  />
                  <circle 
                    className="opacity-75" 
                    cx="25" 
                    cy="25" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                    strokeDasharray="80"
                    strokeDashoffset="60"
                    style={{ color: '#0d9488' }}
                  />
                </svg>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-100 mb-2">Kronos is thinking...</h3>
              <p className="text-gray-300 text-sm">
                This usually takes 30-60 seconds
              </p>
            </div>

            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                Where should I send your personalized analysis?
              </p>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Acknowledgement Checkbox */}
            <div className="mt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-300">
                  <strong className="text-gray-200">Acknowledgement:</strong> This is for education only and not investing advice. 
                  AI makes mistakes and should not be relied upon for investing decisions.
                </span>
              </label>
              {errors.acknowledgement && (
                <p className="mt-2 text-sm text-red-600">{errors.acknowledgement}</p>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mt-4">
              <p className="text-xs text-gray-400">
                We&apos;ll email your personalized cycle analysis and portfolio review. 
                We never sell your data.{' '}
                <a href="/privacy-policy" className="text-teal-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        );

      case 10:
        // Portfolio Name
        const today = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        const defaultPortfolioName = `${formData.firstName || 'My'}'s Portfolio - ${today}`;
        
        return (
          <div className="space-y-4">
            <div className="bg-teal-900/20 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                Give your portfolio a name so you can easily identify it later.
              </p>
            </div>
            <div>
              <label htmlFor="portfolioName" className="block text-sm font-medium text-gray-300 mb-2">
                Portfolio Name (Optional)
              </label>
              <input
                type="text"
                id="portfolioName"
                value={formData.portfolioName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, portfolioName: e.target.value }))}
                placeholder={defaultPortfolioName}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                maxLength={50}
              />
              <p className="mt-2 text-xs text-gray-400">
                {formData.portfolioName?.length || 0}/50 characters
              </p>
              {!formData.portfolioName && (
                <p className="mt-2 text-xs text-gray-400">
                  Default: &quot;{defaultPortfolioName}&quot;
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-200">
            Question {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-300">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-4 sm:px-6 py-3 text-gray-200 font-medium rounded-xl hover:bg-gray-700 disabled:opacity-0 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
        >
          <span className="hidden sm:inline">← Back</span>
          <span className="sm:hidden">← Back</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isParsing || (isAnalyzing && currentStep === 10)}
          className="px-6 sm:px-8 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm sm:text-base"
        >
          {isParsing && currentStep === 6 ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="hidden sm:inline">Processing...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : currentStep === 10 ? (
            <>
              <span className="hidden sm:inline">Show Analysis</span>
              <span className="sm:hidden">Next</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Next →</span>
              <span className="sm:hidden">Next</span>
            </>
          )}
        </button>
      </div>


      {/* Example Modal */}
      {showExampleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowExampleModal(false)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Investment Examples - Any Asset Type Welcome!</h3>
                <button
                  onClick={() => setShowExampleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-teal-900 font-medium mb-2">
                  ✓ We accept <strong>ALL investment types</strong> - just use their ticker symbol:
                </p>
                <p className="text-xs text-teal-800">
                  Stocks, ETFs, Mutual Funds, Bonds, REITs, Commodities, Crypto - anything with a publicly traded ticker works!
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter each investment using its <strong>ticker symbol or tradeable identifier</strong>, along with name and amount:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Stocks:</strong> AAPL (Apple Inc.) - $50,000 or 25%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>ETFs:</strong> VTI (Vanguard Total Stock) - $75,000 or 30%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Bonds:</strong> AGG (iShares Core Bond) - $40,000 or 20%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Real Estate:</strong> VNQ (Vanguard REIT) - $25,000 or 10%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Commodities:</strong> GLD (Gold ETF) - $10,000 or 5%</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Example 1: Detailed Portfolio</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                    <p>
                      &ldquo;I have a $500,000 portfolio diversified across growth and dividend stocks. Major holdings include:
                      Apple (AAPL) $75,000, Microsoft (MSFT) $50,000, Vanguard S&P 500 ETF (VOO) $100,000, 
                      Vanguard Total Bond Market ETF (BND) $100,000, cash reserves $75,000, 
                      real estate via Vanguard Real Estate ETF (VNQ) $75,000, and Gold ETF (GLD) $25,000.&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    AI will categorize: Stocks 45%, Bonds 20%, Cash 15%, Real Estate 15%, Commodities 5%
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Example 2: Simple List</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                    <p>
                      &ldquo;Total: $250,000. Holdings: Tesla stock $50k, Amazon $40k, VTSAX mutual fund $80k, 
                      BND bond fund $50k, high-yield savings $20k, Bitcoin $10k.&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    AI will categorize: Stocks 68%, Bonds 20%, Cash 8%, Alternatives (crypto) 4%
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Example 3: Sector-Based</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                    <p>
                      &ldquo;$1M portfolio: 60% in tech stocks (FAANG companies), 20% in treasury bonds and corporate bonds, 
                      10% in rental property REITs, 10% in money market and CDs.&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    AI will categorize: Stocks 60%, Bonds 20%, Real Estate 10%, Cash 10%
                  </p>
                </div>

                <div className="bg-teal-900/20 border border-teal-800 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-teal-800">
                      <p className="font-medium mb-1">Pro Tip:</p>
                      <p>The more specific you are with dollar amounts and fund names, the more accurate your allocation will be!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
