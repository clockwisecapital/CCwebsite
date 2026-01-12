'use client';

import { useState, useEffect, useMemo } from 'react';
import IntakeTab from './IntakeTab';
import ReviewTab from './ReviewTab';
import ScenarioTestingTab from './ScenarioTestingTab';
import UnifiedVideoPlayer, { type VideoConfig } from './UnifiedVideoPlayer';
import { getVideoPath } from '@/hooks/useAvatarVariant';
import CreatePasswordModal from '@/components/features/auth/CreatePasswordModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';

export interface IntakeFormData {
  // Personal
  age?: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  riskTolerance: 'low' | 'medium' | 'high';
  firstName?: string;
  lastName?: string;
  email?: string;
  
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
    dollarAmount?: number;  // Can store dollar amount independently
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
  portfolioComparison?: import('@/types/portfolio').PortfolioComparison; // Portfolio comparison data
}

export default function PortfolioDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'intake' | 'review' | 'analyze' | 'scenarios'>('intake');
  const [intakeData, setIntakeData] = useState<IntakeFormData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [cycleAnalysisTab, setCycleAnalysisTab] = useState<'market' | 'portfolio' | 'goal'>('goal');
  const [cyclesLoading, setCyclesLoading] = useState(false); // Track if market cycles are still loading
  const [showCreatePasswordModal, setShowCreatePasswordModal] = useState(false);
  const [portfolioSaved, setPortfolioSaved] = useState(false);
  const [savedPortfolioId, setSavedPortfolioId] = useState<string | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  
  // Track carousel slides for video sync
  const [goalSlide, setGoalSlide] = useState(0);
  const [portfolioSlide, setPortfolioSlide] = useState(0);
  const [marketSlide, setMarketSlide] = useState(0);

  // Reusable function to save portfolio to database
  const savePortfolio = async (userId: string) => {
    if (!conversationId || !intakeData || !analysisResult) {
      console.warn('Cannot save portfolio: missing required data');
      return;
    }

    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch('/api/portfolios/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          conversationId,
          intakeData,
          analysisResult,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPortfolioSaved(true);
        setSavedPortfolioId(data.portfolio?.id || null);
        console.log('✅ Portfolio saved successfully!', data.portfolio?.id);
      } else {
        const error = await response.json();
        console.error('❌ Failed to save portfolio:', error);
      }
    } catch (error) {
      console.error('❌ Portfolio save error:', error);
    }
  };

  // Effect to load portfolio from sessionStorage if requested
  useEffect(() => {
    const loadPortfolioId = sessionStorage.getItem('loadPortfolioId');
    if (loadPortfolioId && user && !intakeData) {
      setLoadingPortfolio(true);
      
      // Fetch portfolio data
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        try {
          const response = await fetch(`/api/portfolios/${loadPortfolioId}`, { headers });
          const data = await response.json();
          
          if (response.ok && data.portfolio) {
            const portfolio = data.portfolio;
            
            // Convert saved portfolio to intake form format
            const loadedIntakeData: IntakeFormData = {
              firstName: portfolio.intake_data?.firstName || user.user_metadata?.first_name,
              lastName: portfolio.intake_data?.lastName || user.user_metadata?.last_name,
              email: portfolio.intake_data?.email || user.email,
              age: portfolio.intake_data?.age,
              experienceLevel: portfolio.intake_data?.experienceLevel || 'Intermediate',
              riskTolerance: portfolio.intake_data?.riskTolerance || 'medium',
              portfolio: portfolio.portfolio_data || portfolio.intake_data?.portfolio,
              specificHoldings: portfolio.intake_data?.specificHoldings || [],
              goalAmount: portfolio.intake_data?.goalAmount,
              goalDescription: portfolio.intake_data?.goalDescription,
              timeHorizon: portfolio.intake_data?.timeHorizon,
              monthlyContribution: portfolio.intake_data?.monthlyContribution,
            };
            
            setIntakeData(loadedIntakeData);
            
            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-24 right-4 z-50 bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3';
            notification.innerHTML = `
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Portfolio "${portfolio.name}" loaded! Ready to re-test.</span>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
            
            console.log('✅ Portfolio loaded successfully:', portfolio.name);
          } else {
            console.error('❌ Failed to load portfolio:', data.error);
            alert('Failed to load portfolio. Please try again.');
          }
        } catch (error) {
          console.error('❌ Error loading portfolio:', error);
          alert('Error loading portfolio. Please try again.');
        } finally {
          setLoadingPortfolio(false);
          sessionStorage.removeItem('loadPortfolioId');
        }
      });
    }
  }, [user, intakeData]);

  // Effect to scroll to top when switching tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Effect to start video generation immediately when email submitted (don't wait for analysis)
  useEffect(() => {
    if (emailData && analysisResult && !videoId) {
      console.log('🎬 Starting video generation process...', { firstName: emailData.firstName });
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

  // Effect to show review tab when analysis is complete
  useEffect(() => {
    if (emailData && analysisComplete && analysisResult && conversationId) {
      // Analysis is complete, update email and show results
      updateEmailOnBackend(conversationId, emailData);
      setActiveTab('review');
      
      // Handle portfolio saving based on authentication status
      if (user && !portfolioSaved) {
        // User is authenticated: automatically save portfolio
        console.log('🔐 User authenticated, auto-saving portfolio...');
        savePortfolio(user.id);
      } else if (!user && !portfolioSaved) {
        // User is not authenticated: show create password modal
        setTimeout(() => {
          setShowCreatePasswordModal(true);
        }, 2000); // 2 second delay to let user see results first
      }
    }
  }, [emailData, analysisComplete, analysisResult, conversationId, user, portfolioSaved]);

  const handleIntakeSubmit = async (data: IntakeFormData) => {
    setIntakeData(data);
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setCyclesLoading(true); // Start with cycles loading

    // Personal info should always be collected in the intake form now
    if (data.firstName && data.lastName && data.email) {
      setEmailData({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      });
    }

    const userData = { 
      email: data.email || 'temp@temp.com', 
      firstName: data.firstName || 'Temp', 
      lastName: data.lastName || 'User' 
    };

    try {
      // PHASE 1: Fast APIs - Dashboard + Goal Analysis (show results quickly)
      console.log('🚀 Phase 1: Starting fast analysis (dashboard + goal)...');
      
      const [dashboardResponse, goalResponse] = await Promise.all([
        fetch('/api/portfolio/analyze-dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userData, intakeData: data }),
        }),
        fetch('/api/portfolio/analyze-goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intakeData: data }),
        })
      ]);

      if (!dashboardResponse.ok) {
        throw new Error('Dashboard analysis failed');
      }
      
      const [dashboardResult, goalResult] = await Promise.all([
        dashboardResponse.json(),
        goalResponse.json()
      ]);

      console.log('✅ Phase 1 complete - showing Goal & Portfolio tabs');
      
      // Show initial results with goal analysis (Market tab will show loading)
      setAnalysisResult({
        ...dashboardResult.analysis,
        cycleAnalysis: goalResult.success ? {
          goalAnalysis: goalResult.goalAnalysis,
          cycles: null, // Will be filled in Phase 2
          portfolioAnalysis: null, // Will be filled in Phase 2
        } : null,
      });
      setConversationId(dashboardResult.conversationId);
      setAnalysisComplete(true); // Show review tab now
      setIsAnalyzing(false); // Stop main loading spinner

      // PHASE 2: Slow APIs - Cycle Analysis (load in background)
      console.log('🚀 Phase 2: Starting cycle analysis in background...');
      
      fetch('/api/portfolio/analyze-cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeData: data }),
      })
        .then(response => {
          if (!response.ok) throw new Error('Cycle analysis failed');
          return response.json();
        })
        .then(cycleResult => {
          console.log('✅ Phase 2 complete - updating Market tab');
          
          // Update with full cycle data
          setAnalysisResult(prev => prev ? {
            ...prev,
            cycleAnalysis: {
              ...cycleResult.cycleAnalysis,
              // Keep the fast goal analysis if cycle's goal failed
              goalAnalysis: cycleResult.cycleAnalysis?.goalAnalysis || prev.cycleAnalysis?.goalAnalysis,
            },
          } : null);
          setCyclesLoading(false);
        })
        .catch(error => {
          console.error('❌ Cycle analysis error:', error);
          setCyclesLoading(false);
          // Don't alert - user already has Goal & Portfolio tabs working
        });

    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
      setAnalysisResult(null);
      setAnalysisComplete(false);
      setIsAnalyzing(false);
      setCyclesLoading(false);
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

  const handleReset = () => {
    setActiveTab('intake');
    setIntakeData(null);
    setAnalysisResult(null);
    setConversationId(null);
    setEmailData(null);
    setAnalysisComplete(false);
    setVideoId(null);
    setCycleAnalysisTab('goal');
    setShowCreatePasswordModal(false);
    setPortfolioSaved(false);
  };

  const handlePasswordCreated = async (userId: string) => {
    // Save the portfolio after user creates password
    await savePortfolio(userId);
  };

  // Determine current video based on app state and carousel slides
  const currentVideo: VideoConfig = useMemo(() => {
    // 1. Intake video
    if (activeTab === 'intake' && !isAnalyzing) {
      return {
        id: 'intake-intro',
        title: 'Meet Kronos - Your Portfolio Intelligence Guide',
        videoSrc: getVideoPath('/kronos-intro-no-watermark.mp4')
      };
    }

    // 2. Kronos Thinking (during analysis loading)
    if (isAnalyzing) {
      return {
        id: 'kronos-thinking',
        title: 'Kronos is thinking... This usually takes 30-60 seconds',
        videoSrc: getVideoPath('/kronos-thinking.mp4')
      };
    }

    // 3-8. Review tab with carousel slides
    if (activeTab === 'review') {
      // Goal Tab Slides
      if (cycleAnalysisTab === 'goal') {
        if (goalSlide === 0) {
          return {
            id: 'probability-goal',
            title: 'Probability of Reaching Your Goal',
            videoSrc: getVideoPath('/kronos-probability-goal.mp4')
          };
        }
        if (goalSlide === 1) {
          return {
            id: 'projected-values',
            title: 'Projected Portfolio Values',
            videoSrc: getVideoPath('/kronos-projected-values.mp4')
          };
        }
      }
      
      // Portfolio Tab Slides
      if (cycleAnalysisTab === 'portfolio') {
        if (portfolioSlide === 0) {
          return {
            id: 'portfolio-performance',
            title: 'Portfolio Performance Analysis',
            videoSrc: getVideoPath('/kronos-portfolio-performance.mp4')
          };
        }
      }
      
      // Market Tab Slides
      if (cycleAnalysisTab === 'market') {
        if (marketSlide === 0) {
          return {
            id: 'cycle-analysis',
            title: 'Market Cycle Analysis',
            videoSrc: getVideoPath('/kronos-cycle-analysis.mp4')
          };
        }
        if (marketSlide === 1) {
          // Slide 1 (Historical Analog) - No video
          return {
            id: 'historical-analog-no-video',
            title: 'Historical Market Analog'
          };
        }
        if (marketSlide === 2) {
          // Slide 2 (Performance By Cycle) - No video
          return {
            id: 'performance-by-cycle-no-video',
            title: 'Performance By Cycle'
          };
        }
      }
    }

    // 9. Analysis video (personalized Kronos)
    if (activeTab === 'analyze' && videoId) {
      return {
        id: 'analysis-personalized',
        title: 'Your Personalized Portfolio Analysis',
        videoId: videoId,
        needsPolling: true
      };
    }

    // Fallback - no video
    return {
      id: 'no-video',
      title: 'Portfolio Dashboard'
    };
  }, [activeTab, isAnalyzing, cycleAnalysisTab, videoId, goalSlide, portfolioSlide, marketSlide]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Unified Video Player - appears at top on mobile, bottom-right on desktop */}
      <UnifiedVideoPlayer currentVideo={currentVideo} />

      {/* Create Password Modal */}
      {emailData && !user && (
        <CreatePasswordModal
          isOpen={showCreatePasswordModal}
          onClose={() => setShowCreatePasswordModal(false)}
          email={emailData.email}
          firstName={emailData.firstName}
          lastName={emailData.lastName}
          onSuccess={handlePasswordCreated}
        />
      )}

      {/* Gradient header for all tabs */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 pt-8 pb-8 md:pt-20 md:pb-16"></div>

      {/* Dashboard Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 -mt-12 md:-mt-20">
        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-lg shadow-sm">
          <div className="border-b border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('intake')}
                className={`
                  flex-1 px-3 sm:px-6 md:px-8 py-3 md:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'intake'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-teal-900/30 text-teal-400 text-xs font-bold">
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
                    ? 'border-teal-500 text-teal-400'
                    : analysisResult
                      ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                      : 'border-transparent text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold ${
                    analysisResult ? 'bg-teal-900/30 text-teal-400' : 'bg-gray-700 text-gray-500'
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
                    ? 'border-teal-500 text-teal-400'
                    : videoId
                      ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                      : 'border-transparent text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold ${
                    videoId ? 'bg-teal-900/30 text-teal-400' : 'bg-gray-700 text-gray-500'
                  }`}>
                    3
                  </span>
                  <span className="text-xs sm:text-sm">Analysis</span>
                </span>
              </button>

              <button
                onClick={() => intakeData && setActiveTab('scenarios')}
                disabled={!intakeData}
                className={`
                  flex-1 px-3 sm:px-6 md:px-8 py-3 md:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'scenarios'
                    ? 'border-teal-500 text-teal-400'
                    : intakeData
                      ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                      : 'border-transparent text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold ${
                    intakeData ? 'bg-teal-900/30 text-teal-400' : 'bg-gray-700 text-gray-500'
                  }`}>
                    4
                  </span>
                  <span className="text-xs sm:text-sm">Scenarios</span>
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'intake' && (
              <>
                {loadingPortfolio ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full 
                      bg-teal-500/20 border-2 border-teal-500/30 mb-4">
                      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent 
                        rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-400 text-lg">Loading your portfolio...</p>
                    <p className="text-gray-500 text-sm mt-2">Preparing your data for analysis</p>
                  </div>
                ) : (
                  <IntakeTab
                    onSubmit={handleIntakeSubmit}
                    initialData={intakeData}
                    isAnalyzing={isAnalyzing}
                    authenticatedUser={user}
                  />
                )}
              </>
            )}
            
            {activeTab === 'review' && analysisResult && intakeData && (
              <ReviewTab
                analysisResult={analysisResult}
                intakeData={intakeData}
                conversationId={conversationId}
                videoId={videoId}
                onReset={handleReset}
                onBack={() => setActiveTab('intake')}
                onNavigateToAnalyze={() => setActiveTab('analyze')}
                cycleAnalysisTab={cycleAnalysisTab}
                onCycleAnalysisTabChange={setCycleAnalysisTab}
                onGoalSlideChange={setGoalSlide}
                onPortfolioSlideChange={setPortfolioSlide}
                onMarketSlideChange={setMarketSlide}
                cyclesLoading={cyclesLoading}
                portfolioId={savedPortfolioId || undefined}
              />
            )}

            {activeTab === 'scenarios' && intakeData && (
              <ScenarioTestingTab
                portfolioData={intakeData.portfolio}
                onNext={() => setActiveTab('analyze')}
                onBack={() => setActiveTab('review')}
              />
            )}
            
            {activeTab === 'analyze' && videoId && (
              <div className="space-y-6">
                {/* Ready to Optimize CTA */}
                <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-lg p-4 md:p-8 text-white">
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Ready to Optimize?</h3>
                  <p className="text-sm md:text-base text-teal-100 mb-4 md:mb-6">
                    Work 1:1 with a Clockwise Approved Advisor to refine your strategy.
                  </p>
                  <div className="flex justify-center">
                    <a
                      href="https://calendly.com/clockwisecapital/appointments"
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

                {/* Portfolio Oversight Suggested - Moved to Top */}
                {intakeData && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="border-b border-gray-700 bg-gray-700 px-6 py-4">
                      <h3 className="text-lg font-semibold text-gray-100">Portfolio Oversight Suggested</h3>
                      <p className="text-sm text-gray-400 mt-1">Recommended Clockwise Portfolios Based on Your Risk Profile</p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-blue-300 mb-1">
                            Based on your {intakeData.riskTolerance === 'high' ? 'Aggressive' : intakeData.riskTolerance === 'medium' ? 'Moderate' : 'Conservative'} risk tolerance, we recommend:
                          </p>
                        </div>
                      </div>
                      
                      {/* Portfolio Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          let portfolio1 = '';
                          let portfolio2 = '';
                          
                          if (intakeData.riskTolerance === 'high') {
                            portfolio1 = 'Max Growth';
                            portfolio2 = 'Growth';
                          } else if (intakeData.riskTolerance === 'medium') {
                            portfolio1 = 'Growth';
                            portfolio2 = 'Moderate';
                          } else {
                            portfolio1 = 'Moderate';
                            portfolio2 = 'Income';
                          }
                          
                          return (
                            <>
                              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  <h4 className="text-lg font-bold text-blue-300">{portfolio1}</h4>
                                </div>
                                <p className="text-sm text-gray-300">Clockwise {portfolio1} Portfolio</p>
                              </div>
                              
                              <div className="bg-gradient-to-br from-teal-900/40 to-teal-800/40 border border-teal-700 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  <h4 className="text-lg font-bold text-teal-300">{portfolio2}</h4>
                                </div>
                                <p className="text-sm text-gray-300">Clockwise {portfolio2} Portfolio</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      <div className="mt-4 text-center">
                        <p className="text-xs text-gray-400">
                          Schedule a consultation to learn more about these portfolios
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Portfolio Intelligence Results */}
                {analysisResult && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="border-b border-gray-700 bg-gray-700 px-6 py-4">
                      <h3 className="text-lg font-semibold text-gray-100">Portfolio Intelligence Results</h3>
                      <p className="text-sm text-gray-400 mt-1">Impact & Recommendation</p>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Market Impact */}
                      <div>
                        <h4 className="font-semibold text-gray-100 mb-3">Market Impact</h4>
                        <ul className="space-y-2 text-gray-300">
                          {(() => {
                            const processImpactData = (data: string | string[] | undefined): string[] => {
                              if (Array.isArray(data)) {
                                return data.map(item => item.startsWith('•') ? item : `• ${item}`);
                              }
                              if (typeof data === 'string') {
                                return data.split('\n')
                                  .map(line => line.trim())
                                  .filter(line => line.length > 0)
                                  .map(line => line.startsWith('•') ? line : `• ${line}`);
                              }
                              return ['• No data available'];
                            };
                            const marketImpact = processImpactData(analysisResult.marketImpact);
                            return marketImpact.map((item, idx) => (
                              <li key={idx} className="pl-4">{item}</li>
                            ));
                          })()}
                        </ul>
                      </div>

                      {/* Personalized Portfolio Risks */}
                      <div>
                        <h4 className="font-semibold text-gray-100 mb-3">Personalized Portfolio Risks</h4>
                        <ul className="space-y-2 text-gray-300">
                          {(() => {
                            const processImpactData = (data: string | string[] | undefined): string[] => {
                              if (Array.isArray(data)) {
                                return data.map(item => item.startsWith('•') ? item : `• ${item}`);
                              }
                              if (typeof data === 'string') {
                                return data.split('\n')
                                  .map(line => line.trim())
                                  .filter(line => line.length > 0)
                                  .map(line => line.startsWith('•') ? line : `• ${line}`);
                              }
                              return ['• No data available'];
                            };
                            const portfolioImpact = processImpactData(analysisResult.portfolioImpact);
                            return portfolioImpact.map((item, idx) => (
                              <li key={idx} className="pl-4">{item}</li>
                            ));
                          })()}
                        </ul>
                      </div>

                      {/* Goal Impact */}
                      <div>
                        <h4 className="font-semibold text-gray-100 mb-3">Goal Impact</h4>
                        <ul className="space-y-2 text-gray-300">
                          {(() => {
                            const processImpactData = (data: string | string[] | undefined): string[] => {
                              if (Array.isArray(data)) {
                                return data.map(item => item.startsWith('•') ? item : `• ${item}`);
                              }
                              if (typeof data === 'string') {
                                return data.split('\n')
                                  .map(line => line.trim())
                                  .filter(line => line.length > 0)
                                  .map(line => line.startsWith('•') ? line : `• ${line}`);
                              }
                              return ['• No data available'];
                            };
                            const goalImpact = processImpactData(analysisResult.goalImpact);
                            return goalImpact.map((item, idx) => (
                              <li key={idx} className="pl-4">{item}</li>
                            ));
                          })()}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
