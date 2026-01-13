'use client';

import React, { useState } from 'react';
import { FiX, FiCalendar } from 'react-icons/fi';
import type { CreateScenarioQuestionInput, HistoricalPeriod } from '@/types/community';
import { phases } from '@/utils/turbulentData';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: CreateScenarioQuestionInput) => Promise<void>;
}

export default function CreateQuestionModal({ isOpen, onClose, onSubmit }: CreateQuestionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  // Reset form
  const resetForm = () => {
    setTitle('');
    setQuestionText('');
    setSelectedPhaseId(null);
    setTags([]);
    setTagInput('');
    setErrors({});
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (title.trim().length < 5 || title.trim().length > 200) {
      newErrors.title = 'Title must be between 5 and 200 characters';
    }

    if (questionText.trim().length < 10 || questionText.trim().length > 500) {
      newErrors.questionText = 'Question must be between 10 and 500 characters';
    }

    if (!selectedPhaseId) {
      newErrors.phase = 'Please select a historical period';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Find the selected phase
      const selectedPhase = phases.find(p => p.id === selectedPhaseId);
      if (!selectedPhase) {
        throw new Error('Invalid phase selected');
      }

      // Convert phase to historical period format
      const [startYear, endYear] = selectedPhase.years.split('-');
      const historicalPeriod: HistoricalPeriod = {
        start: startYear.trim(),
        end: endYear.trim().replace('?', ''), // Remove question mark from forecast
        label: `${selectedPhase.title} (${selectedPhase.years})`
      };

      await onSubmit({
        title: title.trim(),
        description: selectedPhase.synopsis, // Use phase synopsis as description
        question_text: questionText.trim(),
        historical_period: [historicalPeriod],
        tags: tags
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

  // Add tag
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Create Scenario Question</h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-300 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Late Cycle Warning Signs"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white 
                placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent 
                transition-all"
              maxLength={200}
              required
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
            <p className="mt-1 text-xs text-gray-500">{title.length}/200 characters</p>
          </div>

          {/* Question Text */}
          <div>
            <label htmlFor="questionText" className="block text-sm font-semibold text-gray-300 mb-2">
              Question *
            </label>
            <input
              id="questionText"
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g., Is your portfolio prepared for the next market phase?"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white 
                placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent 
                transition-all"
              maxLength={500}
              required
            />
            {errors.questionText && <p className="mt-1 text-xs text-red-400">{errors.questionText}</p>}
            <p className="mt-1 text-xs text-gray-500">{questionText.length}/500 characters</p>
          </div>

          {/* Historical Period Selector */}
          <div>
            <label htmlFor="historicalPeriod" className="block text-sm font-semibold text-gray-300 mb-2">
              <FiCalendar className="inline w-4 h-4 mr-1" />
              Historical Period *
            </label>
            <select
              id="historicalPeriod"
              value={selectedPhaseId || ''}
              onChange={(e) => setSelectedPhaseId(Number(e.target.value) || null)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white 
                focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              required
            >
              <option value="">Select a historical period...</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.title} ({phase.years})
                </option>
              ))}
            </select>
            {errors.phase && <p className="mt-1 text-xs text-red-400">{errors.phase}</p>}
            
            {/* Show synopsis of selected phase */}
            {selectedPhaseId && (
              <>
                <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300 leading-relaxed">
                    {phases.find(p => p.id === selectedPhaseId)?.synopsis}
                  </p>
                </div>

                {/* How Testing Works */}
                <div className="mt-3 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                  <p className="text-xs font-semibold text-teal-400 mb-2">
                    📊 How Portfolio Testing Will Work
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    When users test their portfolios against this question, Kronos will find the best historical 
                    analog within <strong className="text-white">{phases.find(p => p.id === selectedPhaseId)?.years}</strong> that 
                    matches current market conditions, then calculate expected returns based on how similar portfolios 
                    performed during that period.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-gray-300 mb-2">
              Tags (max 10)
            </label>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-700 border 
                      border-gray-600 text-gray-300 text-sm rounded-lg"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="e.g., recession, bonds, defense"
                disabled={tags.length >= 10}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white 
                  placeholder-gray-500 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={tags.length >= 10 || !tagInput.trim()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold 
                  rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Press Enter to add tags</p>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white 
              font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg 
              transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/30 
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
