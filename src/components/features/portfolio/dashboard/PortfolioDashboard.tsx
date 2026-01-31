'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import IntakeTab from './IntakeTab';
import ReviewTab from './ReviewTab';
import UnifiedVideoPlayer, { type VideoConfig } from './UnifiedVideoPlayer';
import { getVideoPath } from '@/hooks/useAvatarVariant';
import CreatePasswordModal from '@/components/features/auth/CreatePasswordModal';
import ScenarioAuthModal from '@/components/features/auth/ScenarioAuthModal';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { clearKronosCache, validateKronosCache } from '@/utils/clearKronosCache';

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
  portfolioName?: string;           // User-provided portfolio name
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
  personalizedVideo?: {
    videoId: string;
    videoUrl: string;
    thumbnailUrl?: string;
    createdAt: string;
  };
}

// LocalStorage key for persisting dashboard state
const DASHBOARD_STATE_KEY = 'kronos-dashboard-state';

export default function PortfolioDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stateLoaded, setStateLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'intake' | 'review'>('intake');
  const [intakeData, setIntakeData] = useState<IntakeFormData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [showCreatePasswordModal, setShowCreatePasswordModal] = useState(false);
  const [showFinishAccountModal, setShowFinishAccountModal] = useState(false);
  const [portfolioSaved, setPortfolioSaved] = useState(false);
  const [savedPortfolioId, setSavedPortfolioId] = useState<string | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false); // Guard against concurrent saves
  
  // Track current video in the Review tab sequence
  const [reviewVideoIndex, setReviewVideoIndex] = useState(0); // 0 = goal, 1 = portfolio, 2 = personalized (if videoId exists)
  const [hasUpdatedPortfolioWithVideo, setHasUpdatedPortfolioWithVideo] = useState(false); // Track if we've already updated the portfolio with video data
  
  // Track which videos have been played to prevent autoplay on revisit
  const [playedVideos, setPlayedVideos] = useState<string[]>([]);

  // Load saved state from localStorage on mount (ONLY after auth is loaded)
  useEffect(() => {
    // Wait for auth to finish loading before attempting to restore state
    if (authLoading) {
      console.log('⏳ Waiting for auth to load before restoring state...');
      return;
    }

    console.log('🔐 Auth loaded. User:', user?.id || 'guest');

    // Validate cache against current user
    const isValid = validateKronosCache(user?.id);
    
    if (!isValid) {
      console.log('🧹 Clearing invalid cache and resetting state');
      clearKronosCache();
      
      // Reset all React state to initial values
      setActiveTab('intake');
      setIntakeData(null);
      setAnalysisResult(null);
      setConversationId(null);
      setEmailData(null);
      setAnalysisComplete(false);
      setVideoId(null);
      setPortfolioSaved(false);
      setSavedPortfolioId(null);
      setPlayedVideos([]);
      setReviewVideoIndex(0);
      
      setStateLoaded(true);
      return;
    }

    // Cache is valid - try to restore state
    try {
      const savedState = localStorage.getItem(DASHBOARD_STATE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        console.log('✅ Restoring valid dashboard state from localStorage');
        
        // Restore all state
        if (parsed.activeTab && (parsed.activeTab === 'intake' || parsed.activeTab === 'review')) {
          setActiveTab(parsed.activeTab);
        }
        if (parsed.intakeData) setIntakeData(parsed.intakeData);
        if (parsed.analysisResult) setAnalysisResult(parsed.analysisResult);
        if (parsed.conversationId) setConversationId(parsed.conversationId);
        if (parsed.emailData) setEmailData(parsed.emailData);
        if (parsed.analysisComplete !== undefined) setAnalysisComplete(parsed.analysisComplete);
        if (parsed.videoId) setVideoId(parsed.videoId);
        if (parsed.portfolioSaved !== undefined) setPortfolioSaved(parsed.portfolioSaved);
        if (parsed.savedPortfolioId) setSavedPortfolioId(parsed.savedPortfolioId);
        if (parsed.playedVideos) setPlayedVideos(parsed.playedVideos);
        if (parsed.hasUpdatedPortfolioWithVideo !== undefined) setHasUpdatedPortfolioWithVideo(parsed.hasUpdatedPortfolioWithVideo);
      } else {
        console.log('📭 No cached state found. Starting fresh');
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard state:', error);
      clearKronosCache();
      
      // Reset state on error
      setActiveTab('intake');
      setIntakeData(null);
      setAnalysisResult(null);
      setConversationId(null);
      setEmailData(null);
      setAnalysisComplete(false);
      setVideoId(null);
      setPortfolioSaved(false);
      setSavedPortfolioId(null);
      setPlayedVideos([]);
      setReviewVideoIndex(0);
    } finally {
      setStateLoaded(true);
      console.log('✅ State loading complete');
    }
  }, [authLoading, user]);

  // Save state to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (!stateLoaded) return; // Don't save until we've loaded initial state
    
    try {
      const stateToSave = {
        userId: user?.id || null, // Store user ID to validate cache on load
        activeTab,
        intakeData,
        analysisResult,
        conversationId,
        emailData,
        analysisComplete,
        videoId,
        portfolioSaved,
        savedPortfolioId,
        playedVideos,
        hasUpdatedPortfolioWithVideo,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(stateToSave));
      console.log('💾 Dashboard state saved to localStorage');
    } catch (error) {
      console.error('Failed to save dashboard state:', error);
    }
  }, [
    stateLoaded,
    user,
    activeTab,
    intakeData,
    analysisResult,
    conversationId,
    emailData,
    analysisComplete,
    videoId,
    portfolioSaved,
    savedPortfolioId,
    playedVideos,
    hasUpdatedPortfolioWithVideo,
  ]);

  // Reusable function to save portfolio to database
  const savePortfolio = async (userId: string) => {
    console.log('💾 savePortfolio called with userId:', userId);
    console.log('📊 Portfolio save state check:', {
      hasConversationId: !!conversationId,
      hasIntakeData: !!intakeData,
      hasAnalysisResult: !!analysisResult,
      conversationId,
      email: intakeData?.email,
      isSavingPortfolio,
      portfolioSaved,
    });
    
    // Guard against concurrent saves or already saved portfolio
    if (isSavingPortfolio) {
      console.warn('⚠️ Save already in progress, skipping duplicate call');
      return;
    }
    
    if (portfolioSaved) {
      console.warn('⚠️ Portfolio already saved, skipping duplicate call');
      return;
    }
    
    if (!conversationId || !intakeData || !analysisResult) {
      console.warn('❌ Cannot save portfolio: missing required data', {
        conversationId: !!conversationId,
        intakeData: !!intakeData,
        analysisResult: !!analysisResult,
      });
      return;
    }

    try {
      // Set saving flag to prevent concurrent saves
      setIsSavingPortfolio(true);
      
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      console.log('📤 Sending portfolio save request...');
      console.log('📦 Analysis result includes:', {
        hasCycleAnalysis: !!analysisResult.cycleAnalysis,
        hasPersonalizedVideo: !!analysisResult.personalizedVideo,
        personalizedVideoId: analysisResult.personalizedVideo?.videoId,
      });
      
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
        console.error('❌ Failed to save portfolio - Response not OK:', error);
      }
    } catch (error) {
      console.error('❌ Portfolio save error:', error);
    } finally {
      // Always clear the saving flag
      setIsSavingPortfolio(false);
    }
  };

  // Effect to load portfolio from sessionStorage if requested
  useEffect(() => {
    const loadPortfolioId = sessionStorage.getItem('loadPortfolioId');
    if (loadPortfolioId && user && !intakeData && stateLoaded) {
      setLoadingPortfolio(true);
      
      // Clear existing localStorage state since we're loading a specific portfolio
      try {
        localStorage.removeItem(DASHBOARD_STATE_KEY);
        console.log('🗑️ Cleared localStorage for fresh portfolio load');
      } catch (error) {
        console.error('Failed to clear dashboard state:', error);
      }
      
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
  }, [user, intakeData, stateLoaded]);

  // Effect to scroll to top when switching tabs and reset video sequence
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset video sequence when entering Review tab
    if (activeTab === 'review') {
      setReviewVideoIndex(0);
    }
  }, [activeTab]);

  // Effect to detect email change and clear old videoId (prevents cross-account video reuse)
  useEffect(() => {
    if (emailData && videoId) {
      // Check if we need to regenerate video for different user
      // Compare current email with the one that was stored in state
      const savedState = localStorage.getItem(DASHBOARD_STATE_KEY);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          // If email changed, clear the old videoId
          if (parsed.emailData?.email !== emailData.email) {
            console.log('🔄 Email changed - clearing old videoId');
            setVideoId(null);
          }
        } catch (error) {
          console.error('Failed to check email change:', error);
        }
      }
    }
  }, [emailData]);

  // Effect to start video generation immediately when email submitted (don't wait for analysis)
  useEffect(() => {
    if (emailData && analysisResult && !videoId) {
      console.log('🎬 Starting video generation process...', { firstName: emailData.firstName, email: emailData.email });
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
      if (user && !portfolioSaved && !isSavingPortfolio) {
        // User is authenticated: automatically save portfolio
        console.log('🔐 User authenticated, auto-saving portfolio...');
        savePortfolio(user.id);
      }
      // Note: For unauthenticated users, we now wait until the Analysis tab video finishes
      // The prompt will be triggered by handleVideoEnd() when they watch the personalized video
    }
  }, [emailData, analysisComplete, analysisResult, conversationId, user, portfolioSaved, isSavingPortfolio]);

  const handleIntakeSubmit = async (data: IntakeFormData) => {
    setIntakeData(data);
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    
    // Clear video-related state for new analysis
    setVideoId(null);
    setPlayedVideos([]);
    setPortfolioSaved(false);
    setSavedPortfolioId(null);
    setIsSavingPortfolio(false);
    setHasUpdatedPortfolioWithVideo(false); // Reset video update flag
    console.log('🔄 Starting new analysis - cleared video and portfolio state');

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
        })
        .catch(error => {
          console.error('❌ Cycle analysis error:', error);
          // Don't alert - user already has Goal & Portfolio tabs working
        });

    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
      setAnalysisResult(null);
      setAnalysisComplete(false);
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

  const handleReset = () => {
    // Clear all state
    setActiveTab('intake');
    setIntakeData(null);
    setAnalysisResult(null);
    setConversationId(null);
    setEmailData(null);
    setAnalysisComplete(false);
    setVideoId(null);
    setShowCreatePasswordModal(false);
    setPortfolioSaved(false);
    setSavedPortfolioId(null);
    setIsSavingPortfolio(false);
    setPlayedVideos([]);
    setReviewVideoIndex(0);
    
    // Clear localStorage
    try {
      localStorage.removeItem(DASHBOARD_STATE_KEY);
      console.log('🗑️ Dashboard state cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear dashboard state:', error);
    }
  };

  const handlePasswordCreated = async (userId: string) => {
    // Save the portfolio after user creates password
    await savePortfolio(userId);
  };

  const handleVideoPlayed = (videoId: string) => {
    // Mark video as played to prevent autoplay on revisit
    if (!playedVideos.includes(videoId)) {
      setPlayedVideos(prev => [...prev, videoId]);
    }
  };

  const handleVideoEnd = () => {
    // When on Review tab, automatically advance to next video in sequence
    if (activeTab === 'review') {
      if (reviewVideoIndex === 0) {
        // Goal video ended, move to portfolio video
        setReviewVideoIndex(1);
      } else if (reviewVideoIndex === 1 && videoId) {
        // Portfolio video ended and we have a personalized video, move to it
        setReviewVideoIndex(2);
        console.log('🎬 Advancing to personalized video:', videoId);
      }
      // If reviewVideoIndex === 2, we're at the end - do nothing
    }
  };

  const handlePersonalizedVideoReady = async (videoData: { videoId: string; videoUrl: string; thumbnailUrl?: string }) => {
    // Store personalized video data in analysis result
    console.log('🎥 handlePersonalizedVideoReady called with:', videoData);
    
    // Prevent duplicate calls
    if (hasUpdatedPortfolioWithVideo) {
      console.log('⚠️ Portfolio already updated with video data, skipping duplicate call');
      return;
    }
    
    if (analysisResult) {
      const updatedResult = {
        ...analysisResult,
        personalizedVideo: {
          ...videoData,
          createdAt: new Date().toISOString(),
        },
      };
      setAnalysisResult(updatedResult);
      console.log('✅ Personalized video stored in analysis result:', {
        videoId: videoData.videoId,
        videoUrl: videoData.videoUrl,
        hasCycleAnalysis: !!updatedResult.cycleAnalysis,
      });

      // If user is authenticated and portfolio already saved, update it with video data
      if (user && portfolioSaved && savedPortfolioId && !isSavingPortfolio) {
        console.log('🔄 Updating saved portfolio with personalized video...');
        try {
          setIsSavingPortfolio(true);
          setHasUpdatedPortfolioWithVideo(true); // Mark as updated to prevent duplicates
          
          const { data: { session } } = await supabase.auth.getSession();
          const headers: HeadersInit = { 'Content-Type': 'application/json' };
          
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }

          const response = await fetch('/api/portfolios/save', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              userId: user.id,
              conversationId,
              intakeData,
              analysisResult: updatedResult, // Use the updated result with video
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            console.log('✅ Portfolio updated with personalized video:', data.portfolioId);
          } else {
            console.error('❌ Failed to update portfolio with video:', data.error);
          }
        } catch (error) {
          console.error('❌ Error updating portfolio with video:', error);
        } finally {
          setIsSavingPortfolio(false);
        }
      } else if (!user) {
        // For guest users, just mark as updated (video will be saved when they create account)
        setHasUpdatedPortfolioWithVideo(true);
        console.log('📭 Guest user - video will be saved when account is created');
      }
    } else {
      console.error('❌ Cannot store personalized video: analysisResult is null');
    }
  };

  const handleFinishAccountClick = () => {
    setShowFinishAccountModal(true);
  };

  const handleFinishAccountSuccess = async (authenticatedUser: { id: string }) => {
    // After user finishes account, save portfolio if we have the data
    // Use the passed user directly instead of waiting for context to update
    if (authenticatedUser && !portfolioSaved && !isSavingPortfolio && conversationId && intakeData && analysisResult) {
      console.log('💾 Saving portfolio for user:', authenticatedUser.id);
      await savePortfolio(authenticatedUser.id);
      console.log('✅ Portfolio saved, modal will close and redirect');
    } else {
      console.warn('⚠️ Portfolio not saved:', { 
        hasUser: !!authenticatedUser, 
        portfolioSaved,
        isSavingPortfolio, 
        hasConversationId: !!conversationId,
        hasIntakeData: !!intakeData,
        hasAnalysisResult: !!analysisResult 
      });
    }
    // Don't close modal here - let the modal handle its own closing after showing success screen
  };

  // Auto-save portfolio for authenticated users when analysis completes
  // NOTE: Removed redundant useEffect - portfolio saving is now handled by the 
  // useEffect at lines 358-373 and by handleFinishAccountSuccess for new accounts

  // Determine current video based on app state and sequence
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

    // 3-5. Review tab with sequential videos
    if (activeTab === 'review') {
      // Play videos in sequence: Goal first, then Portfolio, then Personalized (if available)
      if (reviewVideoIndex === 0) {
        return {
          id: 'probability-goal',
          title: 'Probability of Reaching Your Goal',
          videoSrc: getVideoPath('/kronos-probability-goal.mp4')
        };
      } else if (reviewVideoIndex === 1) {
        return {
          id: 'portfolio-performance',
          title: 'Portfolio Performance Analysis',
          videoSrc: getVideoPath('/kronos-portfolio-performance.mp4')
        };
      } else if (reviewVideoIndex === 2 && videoId) {
        // Personalized HeyGen video (with polling)
        return {
          id: `personalized-analysis-${videoId}`,
          title: 'Your Personalized Analysis by Kronos',
          videoId: videoId,
          needsPolling: true,
        };
      }
    }

    // Fallback - no video
    return {
      id: 'no-video',
      title: 'Portfolio Dashboard'
    };
  }, [activeTab, isAnalyzing, reviewVideoIndex, videoId]);

  // Show loading state while auth is loading or state is being restored
  if (authLoading || !stateLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Unified Video Player - appears at top on mobile, bottom-right on desktop */}
      <UnifiedVideoPlayer 
        currentVideo={currentVideo} 
        playedVideos={playedVideos}
        onVideoPlayed={handleVideoPlayed}
        onVideoEnd={handleVideoEnd}
        onPersonalizedVideoReady={handlePersonalizedVideoReady}
        firstName={intakeData?.firstName || emailData?.firstName}
        isAuthenticated={!!user}
      />

      {/* Create Password Modal (legacy - for backward compatibility) */}
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

      {/* Finish Account Modal (new unified modal) */}
      {emailData && (
        <ScenarioAuthModal
          isOpen={showFinishAccountModal}
          onClose={() => setShowFinishAccountModal(false)}
          onSuccess={handleFinishAccountSuccess}
          title="Finish Your Account"
          description="Create a password to save your analysis and access scenario testing."
          defaultEmail={emailData.email}
          defaultFirstName={emailData.firstName}
          defaultLastName={emailData.lastName}
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
                onReset={handleReset}
                onBack={() => setActiveTab('intake')}
                portfolioId={savedPortfolioId || undefined}
                user={user}
                onFinishAccountClick={handleFinishAccountClick}
                emailData={emailData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
