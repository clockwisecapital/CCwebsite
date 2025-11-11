'use client';

import { useState, useEffect } from 'react';
import type { IntakeFormData } from './PortfolioDashboard';

interface IntakeTabProps {
  onSubmit: (data: IntakeFormData) => void;
  initialData?: IntakeFormData | null;
  isAnalyzing: boolean;
}

export default function IntakeTab({ onSubmit, initialData, isAnalyzing }: IntakeTabProps) {
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
  const [isParsing, setIsParsing] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [parseNotes, setParseNotes] = useState('');
  const [allocationsParsed, setAllocationsParsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.goalAmount) {
        setDisplayGoalAmount(initialData.goalAmount.toLocaleString('en-US'));
      }
      if (initialData.monthlyContribution) {
        setDisplayMonthlyContribution(initialData.monthlyContribution.toLocaleString('en-US'));
      }
    }
  }, [initialData]);

  const formatNumberWithCommas = (value: string): string => {
    const numericValue = value.replace(/,/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue).toLocaleString('en-US');
  };

  const parseNumber = (value: string): number => {
    return parseInt(value.replace(/,/g, '')) || 0;
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
    if (currentStep === 0 && (!formData.portfolioDescription || formData.portfolioDescription.trim() === '')) {
      setErrors({ portfolioDescription: 'Portfolio Description is required' });
      return;
    }
    if (currentStep === 1 && !formData.age) {
      setErrors({ age: 'Age is required' });
      return;
    }
    if (currentStep === 8 && (!formData.firstName || !formData.firstName.trim())) {
      setErrors({ firstName: 'First name is required' });
      return;
    }
    if (currentStep === 9 && (!formData.lastName || !formData.lastName.trim())) {
      setErrors({ lastName: 'Last name is required' });
      return;
    }
    if (currentStep === 10) {
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

    // When moving from step 7 to 8, parse the portfolio (but don't submit yet)
    if (currentStep === 7 && !analysisStarted) {
      setAnalysisStarted(true);
      // Parse portfolio allocations
      await parsePortfolio();
    }

    // Move to next step
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
    } else {
      // On final step (10), submit everything and Show Analysis 
      if (isPortfolioValid && allocationsParsed) {
        onSubmit(formData);
      }
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

  const steps = [
    { id: 0, title: 'Portfolio Description', field: 'portfolioDescription' },
    { id: 1, title: 'Age', field: 'age' },
    { id: 2, title: 'Investment Experience', field: 'experienceLevel' },
    { id: 3, title: 'Risk Tolerance', field: 'riskTolerance' },
    { id: 4, title: 'Target Goal Amount', field: 'goalAmount' },
    { id: 5, title: 'Time Horizon', field: 'timeHorizon' },
    { id: 6, title: 'Monthly Contribution', field: 'monthlyContribution' },
    { id: 7, title: 'Goal Description', field: 'goalDescription' },
    { id: 8, title: 'First Name', field: 'firstName' },
    { id: 9, title: 'Last Name', field: 'lastName' },
    { id: 10, title: 'Email & Acknowledgment', field: 'email' },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Portfolio Description
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                Let&apos;s start by understanding your current portfolio. Describe your holdings with names and amounts.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="portfolioDescription" className="block text-sm font-medium text-gray-700">
                  Your Answer
                </label>
                <button
                  type="button"
                  onClick={() => setShowExampleModal(true)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  See Example
                </button>
              </div>
              <textarea
                id="portfolioDescription"
                rows={6}
                value={formData.portfolioDescription || ''}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, portfolioDescription: e.target.value }));
                  setAllocationsParsed(false);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="Example: I have a $500,000 portfolio with Apple stock ($75,000), Microsoft ($50,000), Vanguard S&P 500 ETF ($100,000)..."
              />
              {errors.portfolioDescription && (
                <p className="mt-2 text-sm text-red-600">{errors.portfolioDescription}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                AI will categorize your holdings automatically when you complete the questions.
              </p>
            </div>
          </div>
        );

      case 1:
        // Age
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                How old are you?
              </p>
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <input
                type="number"
                id="age"
                min="18"
                max="100"
                value={formData.age || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="35"
              />
              {errors.age && (
                <p className="mt-2 text-sm text-red-600">{errors.age}</p>
              )}
            </div>
          </div>
        );

      case 2:
        // Investment Experience
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                What&apos;s your investment experience level?
              </p>
            </div>
            <div>
              <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <select
                id="experienceLevel"
                value={formData.experienceLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value as IntakeFormData['experienceLevel'] }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        );

      case 3:
        // Risk Tolerance
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
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
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.riskTolerance === 'low' ? 'bg-red-500' : 'bg-gray-200'
                    }`}>
                      <svg className={`w-5 h-5 ${formData.riskTolerance === 'low' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold ${formData.riskTolerance === 'low' ? 'text-red-600' : 'text-gray-700'}`}>
                        Conservative
                      </div>
                      <div className="text-xs text-gray-500">Capital preservation</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, riskTolerance: 'medium' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.riskTolerance === 'medium'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.riskTolerance === 'medium' ? 'bg-amber-500' : 'bg-gray-200'
                    }`}>
                      <svg className={`w-5 h-5 ${formData.riskTolerance === 'medium' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold ${formData.riskTolerance === 'medium' ? 'text-amber-600' : 'text-gray-700'}`}>
                        Moderate
                      </div>
                      <div className="text-xs text-gray-500">Balanced growth</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, riskTolerance: 'high' }))}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.riskTolerance === 'high'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.riskTolerance === 'high' ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                      <svg className={`w-5 h-5 ${formData.riskTolerance === 'high' ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold ${formData.riskTolerance === 'high' ? 'text-green-600' : 'text-gray-700'}`}>
                        Aggressive
                      </div>
                      <div className="text-xs text-gray-500">Maximum growth</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-700">
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

      case 4:
        // Target Goal Amount
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                What&apos;s your target goal amount?
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">$</span>
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
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                  placeholder="1,000,000"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        // Time Horizon
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                What&apos;s your time horizon in years?
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <input
                type="number"
                value={formData.timeHorizon || ''}
                onChange={(e) => setFormData({ ...formData, timeHorizon: Number(e.target.value) || undefined })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 mt-1">Years until you need to reach this goal</p>
            </div>
          </div>
        );

      case 6:
        // Monthly Contribution
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                How much will you contribute monthly? (Optional)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">$</span>
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
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                  placeholder="500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Additional monthly investment</p>
            </div>
          </div>
        );

      case 7:
        // Goal Description
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                What is this goal for?
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <input
                type="text"
                value={formData.goalDescription || ''}
                onChange={(e) => setFormData({ ...formData, goalDescription: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="Retirement, Home Purchase, etc."
              />
            </div>
          </div>
        );

      case 8:
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">I&apos;m thinking...</h3>
              <p className="text-gray-600 text-sm">
                I need about 20-30 seconds to complete your analysis
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                While I analyze your portfolio, what&apos;s your first name?
              </p>
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>
          </div>
        );

      case 9:
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">I&apos;m thinking...</h3>
              <p className="text-gray-600 text-sm">
                I&apos;m analyzing your portfolio across multiple economic cycles
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                And your last name?
              </p>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="Smith"
              />
              {errors.lastName && (
                <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>
        );

      case 10:
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">I&apos;m thinking...</h3>
              <p className="text-gray-600 text-sm">
                I need about 20-30 seconds to complete your analysis
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6 mb-6">
              <p className="text-gray-800 text-lg leading-relaxed">
                Where should I send your personalized analysis?
              </p>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
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
                <span className="text-sm text-gray-700">
                  <strong>Acknowledgement:</strong> This is for education only and not investing advice. 
                  AI makes mistakes and should not be relied upon for investing decisions.
                </span>
              </label>
              {errors.acknowledgement && (
                <p className="mt-2 text-sm text-red-600">{errors.acknowledgement}</p>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <p className="text-xs text-gray-600">
                We&apos;ll email your personalized cycle analysis and portfolio review. 
                We never sell your data.{' '}
                <a href="/privacy-policy" className="text-teal-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </p>
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
          <span className="text-sm font-medium text-gray-700">
            Question {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
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
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-0 disabled:cursor-not-allowed transition-all"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isParsing || (isAnalyzing && currentStep === 10)}
          className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isParsing && currentStep === 7 ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : currentStep === 10 ? (
            'Show Analysis '
          ) : (
            'Next →'
          )}
        </button>
      </div>


      {/* Example Modal */}
      {showExampleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowExampleModal(false)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Portfolio Description Examples</h3>
                <button
                  onClick={() => setShowExampleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    To get the most accurate allocation, include the following in your description:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Total portfolio value</strong> (e.g., &ldquo;$500,000 portfolio&rdquo;)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Specific holdings with amounts</strong> (e.g., &ldquo;Apple stock $75,000, Microsoft $50,000&rdquo;)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Fund names or tickers</strong> (e.g., &ldquo;Vanguard S&P 500 ETF (VOO)&rdquo;, &ldquo;Vanguard Total Bond (BND)&rdquo;)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Asset types</strong> (stocks, bonds, REITs, gold, crypto, cash, etc.)</span>
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
                  <p className="text-xs text-gray-500 mt-2 italic">
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
                  <p className="text-xs text-gray-500 mt-2 italic">
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
                  <p className="text-xs text-gray-500 mt-2 italic">
                    AI will categorize: Stocks 60%, Bonds 20%, Real Estate 10%, Cash 10%
                  </p>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mt-6">
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
