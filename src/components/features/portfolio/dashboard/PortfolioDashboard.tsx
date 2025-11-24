'use client';

import { useState, useEffect, useMemo } from 'react';
import IntakeTab from './IntakeTab';
import ReviewTab from './ReviewTab';
import UnifiedVideoPlayer, { type VideoConfig } from './UnifiedVideoPlayer';
import { getVideoPath } from '@/hooks/useAvatarVariant';

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
  const [activeTab, setActiveTab] = useState<'intake' | 'review' | 'analyze'>('intake');
  const [intakeData, setIntakeData] = useState<IntakeFormData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [cycleAnalysisTab, setCycleAnalysisTab] = useState<'market' | 'portfolio' | 'goal'>('goal');
  
  // Track carousel slides for video sync
  const [goalSlide, setGoalSlide] = useState(0);
  const [portfolioSlide, setPortfolioSlide] = useState(0);
  const [marketSlide, setMarketSlide] = useState(0);

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
    }
  }, [emailData, analysisComplete, analysisResult, conversationId]);

  const handleIntakeSubmit = async (data: IntakeFormData) => {
    setIntakeData(data);
    setIsAnalyzing(true);
    setAnalysisComplete(false);

    // Personal info should always be collected in the intake form now
    if (data.firstName && data.lastName && data.email) {
      setEmailData({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      });
    }

    try {
      // Start both APIs in parallel and wait for both to complete
      console.log('🚀 Starting parallel analysis (dashboard + cycles)...');
      
      const userData = { 
        email: data.email || 'temp@temp.com', 
        firstName: data.firstName || 'Temp', 
        lastName: data.lastName || 'User' 
      };
      
      const [dashboardResponse, cycleResponse] = await Promise.all([
        fetch('/api/portfolio/analyze-dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userData,
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

  const handleReset = () => {
    setActiveTab('intake');
    setIntakeData(null);
    setAnalysisResult(null);
    setConversationId(null);
    setEmailData(null);
    setAnalysisComplete(false);
    setVideoId(null);
    setCycleAnalysisTab('goal');
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
        title: 'Kronos is recording... This usually takes 30-60 seconds',
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
      {/* Gradient header for all tabs */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 pt-20 pb-16"></div>

      {/* Dashboard Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-20">
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
                onBack={() => setActiveTab('intake')}
                onNavigateToAnalyze={() => setActiveTab('analyze')}
                cycleAnalysisTab={cycleAnalysisTab}
                onCycleAnalysisTabChange={setCycleAnalysisTab}
                onGoalSlideChange={setGoalSlide}
                onPortfolioSlideChange={setPortfolioSlide}
                onMarketSlideChange={setMarketSlide}
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

                      {/* Professional Oversight Notice */}
                      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-blue-300 mb-1">Professional oversight suggested</p>
                            <p className="text-xs text-blue-400">Clockwise portfolio solutions available</p>
                          </div>
                        </div>
                      </div>

                      {/* Metrics Table */}
                      {analysisResult.metrics && analysisResult.metrics.length > 0 && (
                        <div className="mt-6 overflow-hidden border border-gray-700 rounded-lg">
                          <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                  Metric
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                  Current Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                  Recommendation
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                              {analysisResult.metrics.map((row, idx) => (
                                <tr key={idx}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                                    {row[0]}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {row[1]}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {row[2]}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unified Video Player */}
      <UnifiedVideoPlayer currentVideo={currentVideo} />
    </div>
  );
}
