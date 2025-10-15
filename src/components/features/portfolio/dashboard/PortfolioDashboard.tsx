'use client';

import { useState } from 'react';
import AIAvatarSection from './AIAvatarSection';
import IntakeTab from './IntakeTab';
import ReviewTab from './ReviewTab';
import EmailCaptureModal from './EmailCaptureModal';

export interface IntakeFormData {
  // Personal
  age?: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  riskTolerance: 'low' | 'medium' | 'high';  // NEW: User risk tolerance
  
  // Goals
  incomeGoal?: number;
  accumulationGoal?: string;
  
  // Portfolio
  portfolio: {
    totalValue?: number;        // NEW: Total portfolio value in dollars
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    alternatives: number;
  };
  portfolioDescription?: string;
  specificHoldings?: Array<{    // NEW: Optional specific holdings
    name: string;
    ticker?: string;
    percentage: number;          // Percentage of total portfolio
  }>;
}

export interface AnalysisResult {
  riskLevel: string;
  beta?: string;
  volatility?: string;
  correlation_matrix?: string;
  sector_concentration?: string;
  cycle_stage?: string;
  gap_to_goal?: string;
  marketImpact?: string | string[];
  portfolioImpact?: string | string[];
  goalImpact?: string | string[];
  metrics?: Array<[string, string, string]>;
  cycleScore?: number;
  cyclePhase?: string;
  portfolioScore?: number;
  recommendations?: string[];
  marketContext?: Record<string, unknown>;
  detailedAnalysis?: string;
  benchmarkComparison?: Record<string, unknown>;
}

export default function PortfolioDashboard() {
  const [activeTab, setActiveTab] = useState<'intake' | 'review'>('intake');
  const [intakeData, setIntakeData] = useState<IntakeFormData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleIntakeSubmit = (data: IntakeFormData) => {
    setIntakeData(data);
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (emailData: { email: string; firstName: string; lastName: string }) => {
    if (!intakeData) return;

    setIsAnalyzing(true);
    setShowEmailModal(false);

    try {
      // Call analysis API
      const response = await fetch('/api/portfolio/analyze-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: emailData,
          intakeData,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result.analysis);
      setConversationId(result.conversationId);
      setActiveTab('review');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setActiveTab('intake');
    setIntakeData(null);
    setAnalysisResult(null);
    setConversationId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Avatar Section */}
      <AIAvatarSection />

      {/* Dashboard Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('intake')}
                className={`
                  px-8 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'intake'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-600 text-xs font-bold">
                    1
                  </span>
                  Intake
                </span>
              </button>
              
              <button
                onClick={() => analysisResult && setActiveTab('review')}
                disabled={!analysisResult}
                className={`
                  px-8 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'review'
                    ? 'border-teal-500 text-teal-600'
                    : analysisResult
                      ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    analysisResult ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    2
                  </span>
                  Review
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'intake' && (
              <IntakeTab
                onSubmit={handleIntakeSubmit}
                initialData={intakeData}
                isAnalyzing={isAnalyzing}
              />
            )}
            
            {activeTab === 'review' && analysisResult && intakeData && (
              <ReviewTab
                analysisResult={analysisResult}
                intakeData={intakeData}
                conversationId={conversationId}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </div>

      {/* Email Capture Modal */}
      {showEmailModal && (
        <EmailCaptureModal
          onSubmit={handleEmailSubmit}
          onCancel={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
