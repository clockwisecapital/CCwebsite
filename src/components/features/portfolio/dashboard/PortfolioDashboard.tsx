'use client';

import { useState, useEffect } from 'react';
import AIAvatarSection from './AIAvatarSection';
import IntakeTab from './IntakeTab';
import ReviewTab from './ReviewTab';
import ThinkingModal from './ThinkingModal';

export interface IntakeFormData {
  // Personal
  age?: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  riskTolerance: 'low' | 'medium' | 'high';
  
  // Financial Goals
  goalAmount?: number;              // Target goal amount in dollars
  goalDescription?: string;         // Description of the financial goal
  timeHorizon?: number;             // Years to reach goal
  monthlyContribution?: number;     // Monthly contribution amount
  
  // Portfolio
  portfolio: {
    totalValue?: number;            // Total portfolio value in dollars
    stocks: number;
    bonds: number;
    cash: number;
    realEstate: number;
    commodities: number;
    alternatives: number;
  };
  portfolioDescription?: string;
  specificHoldings?: Array<{
    name: string;
    ticker?: string;
    percentage: number;
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
  cycleAnalysis?: import('@/types/cycleAnalysis').CycleAnalysisResult; // Add cycle analysis data
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
  const [showThinkingModal, setShowThinkingModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [dashboardComplete, setDashboardComplete] = useState(false);

  // Effect to start video generation when email submitted and dashboard ready
  useEffect(() => {
    if (emailData && dashboardComplete && analysisResult && !videoId) {
      console.log('🎬 Starting video generation with user name:', emailData.firstName);
      fetch('/api/portfolio/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisResult: analysisResult,
          userData: {
            firstName: emailData.firstName,
            lastName: emailData.lastName,
          },
        }),
      })
        .then(res => res.json())
        .then(videoData => {
          if (videoData.success) {
            console.log('✅ Video generation started:', videoData.videoId);
            setVideoId(videoData.videoId);
          } else {
            console.warn('⚠️ Video generation failed:', videoData.error);
          }
        })
        .catch(err => {
          console.warn('⚠️ Video generation error:', err);
        });
    }
  }, [emailData, dashboardComplete, analysisResult, videoId]);

  // Effect to handle transition when both email and analysis are complete
  useEffect(() => {
    if (emailData && analysisComplete && conversationId && analysisResult) {
      // Both conditions met, update backend and redirect
      const finishFlow = async () => {
        await updateEmailOnBackend(conversationId, emailData);
        setShowThinkingModal(false);
        setActiveTab('review');
      };
      finishFlow();
    }
  }, [emailData, analysisComplete, conversationId, analysisResult]);

  const handleIntakeSubmit = async (data: IntakeFormData) => {
    setIntakeData(data);
    setIsAnalyzing(true);
    setShowThinkingModal(true);
    setAnalysisComplete(false);
    setEmailData(null);

    try {
      // Start both APIs in parallel but handle them independently
      const dashboardPromise = fetch('/api/portfolio/analyze-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: { email: 'temp@temp.com', firstName: 'Temp', lastName: 'User' }, // Temporary, will be updated
          intakeData: data,
        }),
      });

      const cyclePromise = fetch('/api/portfolio/analyze-cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeData: data,
        }),
      });

      // Wait for dashboard to complete first
      const dashboardResponse = await dashboardPromise;
      if (!dashboardResponse.ok) {
        throw new Error('Dashboard analysis failed');
      }

      const dashboardResult = await dashboardResponse.json();
      console.log('✅ Dashboard analysis completed (~15s)');
      
      // Store dashboard result for video generation (will start when email submitted)
      setAnalysisResult({
        ...dashboardResult.analysis,
        cycleAnalysis: null, // Will be filled in later
      });
      setConversationId(dashboardResult.conversationId);
      setDashboardComplete(true);
      
      // NOW wait for cycle analysis to complete
      console.log('⏳ Waiting for cycle analysis to complete...');
      const cycleResponse = await cyclePromise;
      let cycleAnalysis = null;
      if (cycleResponse.ok) {
        const cycleResult = await cycleResponse.json();
        cycleAnalysis = cycleResult.cycleAnalysis;
        console.log('✅ Cycle analysis completed successfully');
      } else {
        console.warn('⚠️ Cycle analysis failed, will use mock data');
      }

      // Update analysis result with cycle data
      setAnalysisResult(prev => ({
        ...prev!,
        cycleAnalysis,
      }));
      setAnalysisComplete(true);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
      setShowThinkingModal(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateEmailOnBackend = async (convId: string, userData: { email: string; firstName: string; lastName: string }) => {
    try {
      // Update the conversation with actual user email data
      await fetch('/api/portfolio/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          userData,
        }),
      });
    } catch (error) {
      console.error('Failed to update email:', error);
      // Non-blocking error, continue to show results
    }
  };

  const handleEmailSubmit = (userData: { email: string; firstName: string; lastName: string }) => {
    // Just set the email data - useEffect will handle video generation
    setEmailData(userData);
  };

  const handleReset = () => {
    setActiveTab('intake');
    setIntakeData(null);
    setAnalysisResult(null);
    setConversationId(null);
    setEmailData(null);
    setAnalysisComplete(false);
    setVideoId(null);
    setDashboardComplete(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Avatar Section */}
      <AIAvatarSection videoId={videoId} />

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
                videoId={videoId}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </div>

      {/* Thinking Modal */}
      {showThinkingModal && (
        <ThinkingModal
          onSubmit={handleEmailSubmit}
          onCancel={() => setShowThinkingModal(false)}
          isAnalyzing={isAnalyzing}
          analysisComplete={analysisComplete}
        />
      )}
    </div>
  );
}
