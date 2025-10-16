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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Calculate portfolio sum excluding totalValue
  const { stocks, bonds, cash, realEstate, commodities, alternatives } = formData.portfolio;
  const portfolioSum = stocks + bonds + cash + realEstate + commodities + alternatives;
  const isPortfolioValid = portfolioSum === 100;

  const handlePortfolioChange = (field: keyof typeof formData.portfolio, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        [field]: Math.max(0, Math.min(100, numValue)),
      },
    }));
  };

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
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.age) {
      newErrors.age = 'Age is required';
    }

    if (!formData.portfolioDescription || formData.portfolioDescription.trim() === '') {
      newErrors.portfolioDescription = 'Portfolio Description is required';
    }

    if (!isPortfolioValid) {
      newErrors.portfolio = `Portfolio allocations must sum to 100% (currently ${portfolioSum.toFixed(1)}%)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Current Portfolio Allocation */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Current Portfolio Allocation</h3>
          <p className="text-sm text-gray-500">Enter percentage allocations across asset classes (must total 100%) (Auto-calculate from Holdings)</p>
        </div>

        {/* Portfolio Description */}
        <div>
          <label htmlFor="portfolioDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="portfolioDescription"
            rows={4}
            value={formData.portfolioDescription || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, portfolioDescription: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Describe your current holdings with specific dollar amounts, investment strategy, and any other relevant details..."
            required
          />
          {errors.portfolioDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.portfolioDescription}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Include total portfolio value and specific holdings to enable more accurate analysis</p>
        </div>

        {/* Portfolio Sum Indicator */}
        <div className={`p-4 rounded-lg border-2 ${
          isPortfolioValid 
            ? 'bg-green-50 border-green-500' 
            : portfolioSum > 0 
              ? 'bg-yellow-50 border-yellow-500' 
              : 'bg-gray-50 border-gray-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Allocation:</span>
            <span className={`text-2xl font-bold ${
              isPortfolioValid 
                ? 'text-green-600' 
                : portfolioSum > 0 
                  ? 'text-yellow-600' 
                  : 'text-gray-600'
            }`}>
              {portfolioSum.toFixed(1)}%
            </span>
          </div>
          {!isPortfolioValid && portfolioSum > 0 && (
            <p className="mt-2 text-xs text-yellow-700">
              {portfolioSum > 100 
                ? `Reduce by ${(portfolioSum - 100).toFixed(1)}% to reach 100%` 
                : `Add ${(100 - portfolioSum).toFixed(1)}% to reach 100%`}
            </p>
          )}
          {isPortfolioValid && (
            <p className="mt-2 text-xs text-green-700 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Portfolio allocation is valid
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { 
              key: 'stocks' as const, 
              label: 'Stocks (%)', 
              icon: (
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )
            },
            { 
              key: 'bonds' as const, 
              label: 'Bonds (%)', 
              icon: (
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )
            },
            { 
              key: 'cash' as const, 
              label: 'Cash (%)', 
              icon: (
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )
            },
            { 
              key: 'realEstate' as const, 
              label: 'Real Estate (%)', 
              icon: (
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )
            },
            { 
              key: 'commodities' as const, 
              label: 'Commodities (%)', 
              icon: (
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )
            },
            { 
              key: 'alternatives' as const, 
              label: 'Alternatives (%)', 
              icon: (
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )
            },
          ].map(({ key, label, icon }) => (
            <div key={key}>
              <label htmlFor={key} className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                {icon}
                {label}
              </label>
              <input
                type="number"
                id={key}
                min="0"
                max="100"
                step="0.1"
                value={formData.portfolio[key]}
                onChange={(e) => handlePortfolioChange(key, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        {errors.portfolio && (
          <p className="text-sm text-red-600">{errors.portfolio}</p>
        )}
      </div>

      {/* Section 2: Personal Information */}
      <div className="space-y-6 pt-6 border-t border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Personal Information</h3>
          <p className="text-sm text-gray-500">Help us understand your investment background</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="age"
              min="18"
              max="100"
              value={formData.age || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="35"
              required
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-600">{errors.age}</p>
            )}
          </div>

          <div>
            <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
              Investment Experience <span className="text-red-500">*</span>
            </label>
            <select
              id="experienceLevel"
              value={formData.experienceLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value as IntakeFormData['experienceLevel'] }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Risk Tolerance Slider */}
        <div className="pt-4">
          <label htmlFor="riskTolerance" className="block text-sm font-medium text-gray-900 mb-3">
            Risk Tolerance <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {/* Slider */}
            <div className="relative px-2">
              <input
                type="range"
                id="riskTolerance"
                min="0"
                max="2"
                step="1"
                value={formData.riskTolerance === 'low' ? 0 : formData.riskTolerance === 'medium' ? 1 : 2}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  const tolerance = value === 0 ? 'low' : value === 1 ? 'medium' : 'high';
                  setFormData(prev => ({ ...prev, riskTolerance: tolerance }));
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: 'linear-gradient(to right, #ef4444 0%, #f97316 20%, #fbbf24 50%, #a3e635 80%, #22c55e 100%)'
                }}
              />
              <style jsx>{`
                .slider-thumb::-webkit-slider-thumb {
                  appearance: none;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: white;
                  border: 3px solid #0d9488;
                  cursor: pointer;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .slider-thumb::-moz-range-thumb {
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: white;
                  border: 3px solid #0d9488;
                  cursor: pointer;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
              `}</style>
            </div>

            {/* Labels */}
            <div className="flex justify-between text-xs font-medium px-2">
              <span className={`flex items-center gap-1 transition-colors ${formData.riskTolerance === 'low' ? 'text-red-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Conservative
              </span>
              <span className={`flex items-center gap-1 transition-colors ${formData.riskTolerance === 'medium' ? 'text-amber-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                Moderate
              </span>
              <span className={`flex items-center gap-1 transition-colors ${formData.riskTolerance === 'high' ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Aggressive
              </span>
            </div>

            {/* Description */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
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
      </div>

      {/* Section 3: Investment Goals */}
      <div className="space-y-6 pt-6 border-t border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Investment Goals</h3>
          <p className="text-sm text-gray-500">Define your financial objectives</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="incomeGoal" className="block text-sm font-medium text-gray-700 mb-2">
              Current Income Goal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="incomeGoal"
                min="0"
                step="1000"
                value={formData.incomeGoal || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, incomeGoal: parseInt(e.target.value) || undefined }))}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="120,000"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Target current annual income from your portfolio</p>
          </div>

          <div>
            <label htmlFor="accumulationGoal" className="block text-sm font-medium text-gray-700 mb-2">
              Future Wealth Goal
            </label>
            <input
              type="text"
              id="accumulationGoal"
              value={formData.accumulationGoal || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, accumulationGoal: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="$2,000,000 by 2030"
            />
            <p className="mt-1 text-xs text-gray-500">Target future income or future value and timeline</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={isAnalyzing}
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={!isPortfolioValid || isAnalyzing}
          className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            'Begin Analyzing'
          )}
        </button>
      </div>
    </form>
  );
}
