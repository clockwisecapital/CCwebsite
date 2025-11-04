'use client';

import { useState } from 'react';

interface ThinkingModalProps {
  onSubmit: (data: { email: string; firstName: string; lastName: string }) => void;
  onCancel: () => void;
  isAnalyzing: boolean;
  analysisComplete?: boolean;
}

export default function ThinkingModal({ onSubmit, onCancel, isAnalyzing, analysisComplete = false }: ThinkingModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acknowledged, setAcknowledged] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!acknowledged) {
      newErrors.acknowledgement = 'You must acknowledge the disclaimer to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setEmailSubmitted(true);
      onSubmit(formData);
    }
  };

  // Determine modal state
  const getModalState = () => {
    if (emailSubmitted && analysisComplete) {
      return 'complete';
    } else if (emailSubmitted) {
      return 'waiting';
    } else if (analysisComplete) {
      return 'ready';
    } else {
      return 'analyzing';
    }
  };

  const modalState = getModalState();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={!isAnalyzing ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full p-8 transform transition-all">
          {/* Kronos is Thinking Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {isAnalyzing ? (
                <div className="relative">
                  {/* Animated Kronos Logo/Icon */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg animate-pulse">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  {/* Spinner around icon */}
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
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {modalState === 'complete' && 'Redirecting to results...'}
              {modalState === 'waiting' && 'Finalizing analysis...'}
              {modalState === 'ready' && 'Analysis complete!'}
              {modalState === 'analyzing' && 'Kronos is thinking...'}
            </h2>
            <p className="text-gray-600">
              {modalState === 'complete' && 'Taking you to your personalized portfolio analysis'}
              {modalState === 'waiting' && 'Just a moment while we finish processing your portfolio'}
              {modalState === 'ready' && 'Submit your information below to view your results'}
              {modalState === 'analyzing' && 'Please provide your information while we analyze your portfolio across multiple economic cycles'}
            </p>
          </div>

          {/* Form - Always visible for user to fill out while waiting */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={emailSubmitted}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={emailSubmitted}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Smith"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={emailSubmitted}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Acknowledgement Checkbox */}
            <div className="mt-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  disabled={emailSubmitted}
                  className="mt-1 w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-700">
                  <strong>Acknowledgement:</strong> Education only and not investing advice. 
                  AI makes mistakes and should not be relied upon for investing decisions.
                </span>
              </label>
              {errors.acknowledgement && (
                <p className="mt-2 text-sm text-red-600">{errors.acknowledgement}</p>
              )}
            </div>

            {/* Privacy Notice */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <p className="text-xs text-gray-600">
                We&apos;ll email your personalized cycle analysis and portfolio review. 
                We never sell your data.{' '}
                <a href="/privacy-policy" className="text-teal-600 hover:underline" target="_blank">
                  Privacy Policy
                </a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {!emailSubmitted && !isAnalyzing && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={emailSubmitted}
                className={`px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg transition-all shadow-lg ${
                  emailSubmitted 
                    ? 'flex-1 cursor-not-allowed opacity-50' 
                    : 'flex-1 hover:bg-teal-700 transform hover:scale-105'
                }`}
              >
                {emailSubmitted ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {analysisComplete ? 'Loading results...' : 'Waiting for analysis...'}
                  </span>
                ) : (
                  'View Analysis'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
