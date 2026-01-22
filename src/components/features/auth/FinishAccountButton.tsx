'use client';

/**
 * Finish Account Button Component
 * Shows a persistent button for unauthenticated users to complete their account signup
 */

import { FiUserPlus } from 'react-icons/fi';

interface FinishAccountButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'minimal';
  className?: string;
}

export default function FinishAccountButton({ 
  onClick, 
  variant = 'primary',
  className = '' 
}: FinishAccountButtonProps) {
  
  if (variant === 'minimal') {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors ${className}`}
      >
        <FiUserPlus className="w-4 h-4" />
        <span>Finish Account to Save</span>
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded-lg font-semibold transition-all hover:scale-105 ${className}`}
      >
        <FiUserPlus className="w-4 h-4" />
        <span>Finish Account</span>
      </button>
    );
  }

  // Primary variant (default)
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-lg font-bold transition-all hover:scale-105 shadow-lg ${className}`}
    >
      <FiUserPlus className="w-5 h-5" />
      <span>Finish Account to Save Portfolio</span>
    </button>
  );
}
