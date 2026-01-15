'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiChevronRight } from 'react-icons/fi';
import SimplePortfolioForm, { type SimplePortfolioFormData } from './SimplePortfolioForm';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';

interface UserPortfolio {
  id: string;
  name: string;
  description?: string;
}

interface PortfolioSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPortfolioSelect: (portfolioId: string, portfolioName: string) => void;
  questionId: string;
}

export default function PortfolioSelectionModal({
  isOpen,
  onClose,
  onPortfolioSelect,
  questionId,
}: PortfolioSelectionModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'create'>('select');
  const [portfolios, setPortfolios] = useState<UserPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdPortfolioId, setCreatedPortfolioId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPortfolios();
    }
  }, [isOpen, user]);

  const fetchUserPortfolios = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/portfolios/list', { headers });
      const data = await response.json();

      if (response.ok && data.portfolios) {
        setPortfolios(data.portfolios.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description
        })));
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortfolio = async (formData: SimplePortfolioFormData) => {
    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Create portfolio with simple data including holdings
      const response = await fetch('/api/portfolios/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          portfolio_data: JSON.stringify({
            totalValue: formData.totalValue,
            stocks: formData.stocks,
            bonds: formData.bonds,
            cash: formData.cash,
            alternatives: formData.alternatives,
            holdings: formData.specificHoldings && formData.specificHoldings.length > 0 
              ? formData.specificHoldings 
              : [],
          }),
          intake_data: JSON.stringify(formData),
        }),
      });

      const result = await response.json();

      if (response.ok && result.portfolio) {
        setCreatedPortfolioId(result.portfolio.id);
        // Trigger selection
        onPortfolioSelect(result.portfolio.id, result.portfolio.name);
        setTimeout(() => {
          onClose();
          setStep('select');
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to create portfolio:', error);
      alert('Failed to create portfolio. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-20 bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-selection-modal-title"
    >
      <div className="bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] rounded-2xl border border-teal-600/50 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-teal-600/30">
          <h2 id="portfolio-selection-modal-title" className="text-2xl font-bold text-white">
            {step === 'select' ? 'Select Your Portfolio' : 'Create New Portfolio'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'select' ? (
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading your portfolios...</p>
                </div>
              ) : portfolios.length > 0 ? (
                <>
                  <p className="text-sm text-gray-400 mb-4">
                    Select an existing portfolio or create a new one to test
                  </p>
                  <div className="space-y-2">
                    {portfolios.map((portfolio) => (
                      <button
                        key={portfolio.id}
                        onClick={() => onPortfolioSelect(portfolio.id, portfolio.name)}
                        className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-900 border border-gray-700 hover:border-teal-500/50 rounded-lg transition-all group"
                      >
                        <div className="text-left flex-1">
                          <p className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                            {portfolio.name}
                          </p>
                          {portfolio.description && (
                            <p className="text-sm text-gray-400">{portfolio.description}</p>
                          )}
                        </div>
                        <FiChevronRight className="w-5 h-5 text-gray-500 group-hover:text-teal-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-6">You don't have any portfolios yet</p>
                </div>
              )}

              {/* Create New Button */}
              <button
                onClick={() => setStep('create')}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                Create New Portfolio
              </button>
            </div>
          ) : (
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-6">
                Fill in your portfolio information to test this scenario
              </p>
              <SimplePortfolioForm
                onSubmit={handleCreatePortfolio}
                isLoading={isCreating}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step === 'create' && (
          <div className="border-t border-teal-600/30 p-6 flex gap-3">
            <button
              onClick={() => setStep('select')}
              className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-900/50 transition-colors"
            >
              Back
            </button>
            {createdPortfolioId && (
              <div className="flex-1 flex items-center justify-center text-green-400 font-medium">
                ✓ Portfolio Created
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
