'use client';

import { useState, useEffect } from 'react';
import AIAvatarSection from './AIAvatarSection';
import IntakeTab from './IntakeTab';
import ReviewTab from './ReviewTab';
import ThinkingModal from './ThinkingModal';
import VideoPlayer from './VideoPlayer';

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
  const [activeTab, setActiveTab] = useState<'intake' | 'review' | 'analyze'>('intake');
  const [intakeData, setIntakeData] = useState<IntakeFormData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showThinkingModal, setShowThinkingModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [showAdvisorPopup, setShowAdvisorPopup] = useState(false);

  // Effect to scroll to top when switching tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Effect to show advisor popup after 30 seconds on Review or Analyze tabs
  useEffect(() => {
    if (activeTab !== 'review' && activeTab !== 'analyze') return;

    const timer = setTimeout(() => {
      setShowAdvisorPopup(true);
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [activeTab]);

  // Effect to start video generation immediately when email submitted (don't wait for analysis)
  useEffect(() => {
    if (emailData && analysisResult && !videoId) {
      console.log('🎬 Starting video generation immediately with user name:', emailData.firstName);
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
  }, [emailData, analysisResult, videoId]);

  // Effect to show review tab only when BOTH email submitted AND analysis complete
  useEffect(() => {
    if (emailData && analysisComplete && analysisResult && conversationId) {
      // User has submitted email and analysis is complete
      updateEmailOnBackend(conversationId, emailData);
      setShowThinkingModal(false);
      setActiveTab('review');
    }
  }, [emailData, analysisComplete, analysisResult, conversationId]);

  const handleIntakeSubmit = async (data: IntakeFormData) => {
    setIntakeData(data);
    setIsAnalyzing(true);
    setShowThinkingModal(true);
    setAnalysisComplete(false);
    setEmailData(null);

    try {
      // Start both APIs in parallel and wait for both to complete
      console.log('🚀 Starting parallel analysis (dashboard + cycles)...');
      
      const [dashboardResponse, cycleResponse] = await Promise.all([
        fetch('/api/portfolio/analyze-dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userData: { email: 'temp@temp.com', firstName: 'Temp', lastName: 'User' },
            intakeData: data,
          }),
        }),
        fetch('/api/portfolio/analyze-cycles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intakeData: data,
          }),
        })
      ]);

      // Check both responses
      if (!dashboardResponse.ok) {
        throw new Error('Dashboard analysis failed');
      }
      if (!cycleResponse.ok) {
        throw new Error('Cycle analysis failed');
      }

      // Parse both results in parallel
      const [dashboardResult, cycleResult] = await Promise.all([
        dashboardResponse.json(),
        cycleResponse.json()
      ]);

      console.log('✅ Both analyses completed successfully');
      
      // Combine results immediately
      setAnalysisResult({
        ...dashboardResult.analysis,
        cycleAnalysis: cycleResult.cycleAnalysis,
      });
      setConversationId(dashboardResult.conversationId);
      setAnalysisComplete(true);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
      setShowThinkingModal(false);
      // Reset state to allow retry
      setAnalysisResult(null);
      setAnalysisComplete(false);
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Avatar Section - Only show on Intake tab */}
      {activeTab === 'intake' && <AIAvatarSection />}

      {/* Gradient spacer for Review and Analyze Tabs */}
      {(activeTab === 'review' || activeTab === 'analyze') && (
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 pt-20 pb-16"></div>
      )}

      {/* Dashboard Container */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${(activeTab === 'review' || activeTab === 'analyze') ? '-mt-20' : ''}`}>
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('intake')}
                className={`
                  flex-1 px-3 sm:px-6 md:px-8 py-3 md:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'intake'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-teal-100 text-teal-600 text-xs font-bold">
                    1
                  </span>
                  <span className="text-xs sm:text-sm">Intake</span>
                </span>
              </button>
              
              <button
                onClick={() => analysisResult && setActiveTab('review')}
                disabled={!analysisResult}
                className={`
                  flex-1 px-3 sm:px-6 md:px-8 py-3 md:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'review'
                    ? 'border-teal-500 text-teal-600'
                    : analysisResult
                      ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold ${
                    analysisResult ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    2
                  </span>
                  <span className="text-xs sm:text-sm">Review</span>
                </span>
              </button>
              
              <button
                onClick={() => videoId && setActiveTab('analyze')}
                disabled={!videoId}
                className={`
                  flex-1 px-3 sm:px-6 md:px-8 py-3 md:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'analyze'
                    ? 'border-teal-500 text-teal-600'
                    : videoId
                      ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold ${
                    videoId ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    3
                  </span>
                  <span className="text-xs sm:text-sm">Analyze</span>
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
                onNavigateToAnalyze={() => setActiveTab('analyze')}
              />
            )}
            
            {activeTab === 'analyze' && videoId && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Personalized Analysis</h3>
                    <p className="text-sm text-gray-600 mt-1">Kronos explains your portfolio results</p>
                  </div>
                  <div className="p-0">
                    <VideoPlayer videoId={videoId} />
                  </div>
                </div>

                {/* Next Steps CTA */}
                <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-4 md:p-8 text-white">
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Ready to Optimize?</h3>
                  <p className="text-sm md:text-base text-teal-100 mb-4 md:mb-6">
                    Work 1:1 with a Clockwise Capital strategist to refine your strategy.
                  </p>
                  <div className="flex justify-center">
                    <a
                      href="https://clockwisecapital.com/contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 md:px-8 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-center flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Schedule a Consultation
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advisor Popup - Chatbot Style */}
      {showAdvisorPopup && (
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out animate-in slide-in-from-bottom-4 fade-in">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setShowAdvisorPopup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Need Help?</h4>
                  <p className="text-xs text-gray-500">Talk to an advisor</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Ready to optimize your portfolio strategy? Work 1:1 with a Clockwise Capital strategist.
              </p>

              <a
                href="https://clockwisecapital.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all text-center"
              >
                Match me with an advisor
              </a>
            </div>
          </div>
        </div>
      )}

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
