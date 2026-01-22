'use client';

import React, { useState } from 'react';
import { FiX, FiCalendar, FiTag, FiType, FiZap } from 'react-icons/fi';
import type { CreateScenarioQuestionInput, HistoricalPeriod } from '@/types/community';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: CreateScenarioQuestionInput) => Promise<void>;
}

interface AIEnrichmentResult {
  title: string;
  historicalPeriod: HistoricalPeriod;
  historicalPeriodId: number;
  tags: string[];
  description: string;
}

export default function CreateQuestionModal({ isOpen, onClose, onSubmit }: CreateQuestionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [questionText, setQuestionText] = useState('');
  const [aiEnrichment, setAiEnrichment] = useState<AIEnrichmentResult | null>(null);

  if (!isOpen) return null;

  // Reset form
  const resetForm = () => {
    setQuestionText('');
    setAiEnrichment(null);
    setErrors({});
  };

  // Call AI to enrich the question
  const enrichQuestion = async () => {
    if (questionText.trim().length < 10) {
      setErrors({ questionText: 'Question must be at least 10 characters' });
      return;
    }

    setIsEnriching(true);
    setErrors({});

    try {
      const response = await fetch('/api/community/questions/ai-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: questionText.trim() })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to enrich question');
      }

      setAiEnrichment(result.data);
    } catch (error: any) {
      console.error('Failed to enrich question:', error);
      setErrors({ submit: error.message || 'Failed to analyze question. Please try again.' });
    } finally {
      setIsEnriching(false);
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (questionText.trim().length < 10 || questionText.trim().length > 500) {
      newErrors.questionText = 'Question must be between 10 and 500 characters';
    }

    if (!aiEnrichment) {
      newErrors.enrichment = 'Please click "Analyze Question" to generate details';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !aiEnrichment) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: aiEnrichment.title,
        description: aiEnrichment.description,
        question_text: questionText.trim(),
        historical_period: [aiEnrichment.historicalPeriod],
        tags: aiEnrichment.tags,
        metadata: {
          sp500_return: (aiEnrichment as any).sp500Return || 0.10 // Store S&P 500 return
        }
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to create question:', error);
      setErrors({ submit: 'Failed to create question. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-question-modal-title"
    >
      <div className="bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-gray-700">
          <h2 id="create-question-modal-title" className="text-lg sm:text-xl md:text-2xl font-bold text-white pr-2">
            <span className="hidden sm:inline">Test Question</span>
            <span className="sm:hidden">Test Question</span>
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
          {/* AI Info Banner */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-500/10 to-teal-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-start gap-2 sm:gap-3">
              <FiZap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-purple-300 mb-1">
                  AI-Powered Question Intelligence
                </p>
                <p className="text-[10px] sm:text-xs text-gray-300 leading-relaxed">
                  Tell me your question and I'll identify the Economic Cycle and scenario test your portfolio.
                </p>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label htmlFor="questionText" className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2">
              Your Question *
            </label>
            <textarea
              id="questionText"
              value={questionText}
              onChange={(e) => {
                setQuestionText(e.target.value);
                setAiEnrichment(null); // Reset enrichment when question changes
              }}
              placeholder="e.g., What happens to a 60/40 portfolio if inflation spikes?"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm sm:text-base text-white 
                placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent 
                transition-all resize-none"
              rows={4}
              maxLength={500}
              required
            />
            {errors.questionText && <p className="mt-1 text-[10px] sm:text-xs text-red-400">{errors.questionText}</p>}
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500">{questionText.length}/500 characters</p>
          </div>

          {/* Analyze Button */}
          {!aiEnrichment && (
            <button
              type="button"
              onClick={enrichQuestion}
              disabled={isEnriching || questionText.trim().length < 10}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 
                hover:to-teal-700 text-white text-sm sm:text-base font-bold rounded-lg transition-all duration-300 
                hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isEnriching ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs sm:text-sm">Analyzing Question...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FiZap className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm">Analyze Question with AI</span>
                </span>
              )}
            </button>
          )}

          {/* AI Generated Results */}
          {aiEnrichment && (
            <div className="space-y-3 sm:space-y-4">
              {/* Title */}
              <div className="p-3 sm:p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <FiType className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
                  <p className="text-[10px] sm:text-xs font-semibold text-teal-400">AI-Generated Title</p>
                </div>
                <p className="text-sm sm:text-base font-semibold text-white break-words">{aiEnrichment.title}</p>
              </div>

              {/* Historical Period */}
              <div className="p-3 sm:p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <FiCalendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <p className="text-[10px] sm:text-xs font-semibold text-blue-400">Detected Historical Period</p>
                </div>
                <p className="text-sm sm:text-base font-semibold text-white mb-2">
                  {aiEnrichment.historicalPeriod.label}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed break-words">
                  {aiEnrichment.description}
                </p>
              </div>

              {/* Economic Cycle Tag */}
              <div className="p-3 sm:p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <FiTag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                  <p className="text-[10px] sm:text-xs font-semibold text-purple-400">Economic Cycle Tag</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/20 border 
                    border-purple-500/30 text-purple-300 text-sm sm:text-base font-bold rounded-lg capitalize"
                  >
                    {aiEnrichment.tags[0]} Cycle
                  </span>
                </div>
              </div>

              {/* Regenerate Button */}
              <button
                type="button"
                onClick={enrichQuestion}
                disabled={isEnriching}
                className="w-full px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs sm:text-sm font-semibold 
                  rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnriching ? 'Regenerating...' : 'Regenerate with AI'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 sm:p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-xs sm:text-sm text-red-400 break-words">{errors.submit}</p>
            </div>
          )}

          {errors.enrichment && (
            <div className="p-3 sm:p-4 bg-orange-900/20 border border-orange-500/50 rounded-lg">
              <p className="text-xs sm:text-sm text-orange-400 break-words">{errors.enrichment}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-5 md:p-6 border-t border-gray-700">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
            className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white 
              text-xs sm:text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !aiEnrichment}
            className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-lg 
              transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/30 
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              'Post Question'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
