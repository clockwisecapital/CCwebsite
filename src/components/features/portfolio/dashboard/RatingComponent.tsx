'use client';

import { useState } from 'react';

interface RatingComponentProps {
  conversationId: string | null;
  onRatingSubmitted?: (rating: number) => void;
}

export default function RatingComponent({ conversationId, onRatingSubmitted }: RatingComponentProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingClick = async (value: number) => {
    if (isSubmitted || !conversationId) return;
    
    setRating(value);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/portfolio/submit-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          rating: value,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        console.log('✅ Rating submitted:', value);
        onRatingSubmitted?.(value);
      } else {
        console.error('❌ Failed to submit rating');
        setRating(null);
      }
    } catch (error) {
      console.error('❌ Error submitting rating:', error);
      setRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-teal-900/30 to-blue-900/30 border border-teal-500/30 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <svg className="w-8 h-8 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h3 className="text-xl font-bold text-white">Thank You for Your Feedback!</h3>
        </div>
        <p className="text-gray-300">
          Your rating of <span className="text-teal-400 font-bold">{rating}/10</span> helps us improve your experience.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-2 text-center">
        How was your experience?
      </h3>
      <p className="text-gray-400 text-sm text-center mb-6">
        Rate your experience from 1 (poor) to 10 (excellent)
      </p>

      {/* Rating Buttons */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
          const isHovered = hoveredRating !== null && value <= hoveredRating;
          const isSelected = rating !== null && value <= rating;
          
          return (
            <button
              key={value}
              onClick={() => handleRatingClick(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(null)}
              disabled={isSubmitting}
              className={`
                w-12 h-12 rounded-lg font-bold text-lg transition-all duration-200
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                ${isSelected || isHovered
                  ? 'bg-gradient-to-br from-teal-500 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {value}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs text-gray-400 px-1">
        <span>😞 Poor</span>
        <span>😊 Excellent</span>
      </div>

      {isSubmitting && (
        <div className="text-center mt-4 text-teal-400 text-sm">
          Submitting your rating...
        </div>
      )}
    </div>
  );
}
