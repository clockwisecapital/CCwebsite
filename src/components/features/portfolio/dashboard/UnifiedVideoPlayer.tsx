'use client';

import { useState, useEffect, useRef } from 'react';
import { useKronosNotification } from '@/hooks/useKronosNotification';

export interface VideoConfig {
  id: string;
  title: string;
  videoSrc?: string; // Static video path
  videoId?: string; // For dynamic video (analysis)
  needsPolling?: boolean; // If videoId needs status polling
}

interface UnifiedVideoPlayerProps {
  currentVideo: VideoConfig;
  onVideoReady?: () => void;
  onVideoEnd?: () => void;
  playedVideos?: string[];
  onVideoPlayed?: (videoId: string) => void;
  onPersonalizedVideoReady?: (videoData: { videoId: string; videoUrl: string; thumbnailUrl?: string }) => void;
  firstName?: string; // For Kronos notification
  isAuthenticated?: boolean; // Only show notification for authenticated users
}

export default function UnifiedVideoPlayer({ currentVideo, onVideoReady, onVideoEnd, playedVideos = [], onVideoPlayed, onPersonalizedVideoReady, firstName, isAuthenticated = false }: UnifiedVideoPlayerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [displayedVideo, setDisplayedVideo] = useState<VideoConfig>(currentVideo);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // For analysis video polling
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasNotified = useRef(false);
  const previousVideoId = useRef<string>(currentVideo.id);
  const hasTriggeredNotification = useRef(false);
  const hasCalledVideoReady = useRef(false); // Track if we've already called onPersonalizedVideoReady
  
  // Kronos notification hook
  const { triggerNotification } = useKronosNotification();

  // Handle video polling for analysis video
  useEffect(() => {
    if (!currentVideo.videoId || !currentVideo.needsPolling) {
      console.log('🔍 Video polling check:', {
        hasVideoId: !!currentVideo.videoId,
        needsPolling: currentVideo.needsPolling,
        videoId: currentVideo.videoId,
        currentVideoId: currentVideo.id,
      });
      return;
    }

    console.log('🔄 Starting HeyGen video polling for:', currentVideo.videoId, '(currentVideo:', currentVideo.id, ')');

    // Check immediately on mount
    let hasChecked = false;

    const checkVideoStatus = async (intervalId?: NodeJS.Timeout) => {
      try {
        console.log('📡 Checking video status for:', currentVideo.videoId);
        const response = await fetch(`/api/portfolio/video-status?videoId=${currentVideo.videoId}`);
        const data = await response.json();
        
        console.log('📡 Video status response:', {
          videoId: currentVideo.videoId,
          status: data.status,
          hasVideoUrl: !!data.videoUrl,
          success: data.success,
        });

        if (data.success) {
          setStatus(data.status);

          if (data.status === 'completed' && data.videoUrl) {
            console.log('🎉 HeyGen video COMPLETED!', {
              videoUrl: data.videoUrl,
              videoId: currentVideo.videoId,
              hasCallback: !!onPersonalizedVideoReady,
              alreadyCalled: hasCalledVideoReady.current,
            });
            setVideoUrl(data.videoUrl);
            if (intervalId) clearInterval(intervalId);
            setError(null);
            
            if (onVideoReady && !hasNotified.current) {
              hasNotified.current = true;
              onVideoReady();
            }
            
            // Store personalized video data in analysis result (only call once!)
            if (currentVideo.videoId && onPersonalizedVideoReady && !hasCalledVideoReady.current) {
              hasCalledVideoReady.current = true; // Mark as called BEFORE calling to prevent race conditions
              
              console.log('📹 HeyGen video completed! Calling onPersonalizedVideoReady with:', {
                videoId: currentVideo.videoId,
                videoUrl: data.videoUrl,
                thumbnailUrl: data.thumbnailUrl,
              });
              
              onPersonalizedVideoReady({
                videoId: currentVideo.videoId,
                videoUrl: data.videoUrl,
                thumbnailUrl: data.thumbnailUrl,
              });
              
              console.log('✅ Personalized video data sent to parent:', currentVideo.videoId);
            } else if (hasCalledVideoReady.current) {
              console.log('⏭️ Skipping duplicate onPersonalizedVideoReady call');
            } else {
              console.warn('⚠️ Personalized video ready but callback missing:', {
                hasVideoId: !!currentVideo.videoId,
                hasCallback: !!onPersonalizedVideoReady,
              });
            }
            
            // Trigger Kronos notification ONLY for authenticated users (guests will see video when they create account)
            if (currentVideo.videoId && !hasTriggeredNotification.current && isAuthenticated) {
              hasTriggeredNotification.current = true;
              triggerNotification(currentVideo.videoId, firstName);
              console.log('🔔 Kronos notification triggered for authenticated user:', currentVideo.videoId);
            } else if (!isAuthenticated && currentVideo.videoId) {
              console.log('📭 Skipping notification for guest user. Video will be available after account creation.');
            }
          } else if (data.status === 'failed') {
            setError('Video generation failed');
            if (intervalId) clearInterval(intervalId);
          }
        } else {
          setError('Failed to retrieve video status');
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Failed to check video status:', err);
        setError('Failed to check video status');
        if (intervalId) clearInterval(intervalId);
      }
    };

    // Check immediately first, then poll every 3 seconds
    const pollInterval = setInterval(() => checkVideoStatus(pollInterval), 3000);
    checkVideoStatus(pollInterval);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentVideo.videoId, currentVideo.needsPolling, onVideoReady, onPersonalizedVideoReady, isAuthenticated]);

  // Handle video transitions
  useEffect(() => {
    if (currentVideo.id !== previousVideoId.current) {
      // Check if this video has been played before
      const hasBeenPlayed = playedVideos.includes(currentVideo.id);
      
      // Update displayed video immediately (key prop handles the switch)
      setDisplayedVideo(currentVideo);
      
      // Reset callback flags when switching to a new video with videoId
      if (currentVideo.videoId && currentVideo.videoId !== previousVideoId.current) {
        hasCalledVideoReady.current = false;
        hasTriggeredNotification.current = false;
        console.log('🔄 Reset callback flags for new video:', currentVideo.videoId);
      }
      
      previousVideoId.current = currentVideo.id;
      
      // Only autoplay if video hasn't been played before
      setIsPlaying(!hasBeenPlayed);
      
      // Expand player when new video starts
      setIsMinimized(false);
      
      // Reset video URL and status when switching away from analysis video
      if (previousVideoId.current.includes('analysis')) {
        setVideoUrl(null);
        setStatus('pending');
        setError(null);
        hasNotified.current = false;
      }
    }
  }, [currentVideo, playedVideos]);

  // Don't render video player if there's no video source - check after all hooks
  const hasVideo = currentVideo.videoSrc || currentVideo.videoId;
  if (!hasVideo) {
    return null;
  }

  // Toggle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(err => {
          console.log('Play prevented:', err);
        });
        setIsPlaying(true);
      }
    }
  };

  // Track when video starts playing
  const handleVideoPlay = () => {
    setIsPlaying(true);
    // Mark this video as played via callback to parent
    if (onVideoPlayed && !playedVideos.includes(currentVideo.id)) {
      onVideoPlayed(currentVideo.id);
    }
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  // When video ends, pause it and minimize player
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    // Auto-minimize after video completes
    setIsMinimized(true);
    
    // Notify parent component that video has ended
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  const getVideoSource = (): string | null => {
    // For analysis video with polling
    if (displayedVideo.needsPolling && displayedVideo.videoId) {
      if (error) {
        return '/8cbbd46caa4a47e19e58b99801b272d3.mp4'; // Fallback video
      }
      return videoUrl;
    }
    
    // For static videos
    return displayedVideo.videoSrc || null;
  };

  const videoSource = getVideoSource();
  const isLoading = displayedVideo.needsPolling && !videoSource && !error;

  if (isMinimized) {
    return (
      <div className="sticky top-4 z-50 flex justify-end px-4 md:fixed md:top-auto md:bottom-4 md:left-auto md:right-8 md:px-0">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-br from-teal-600 to-blue-600 text-white rounded-full p-4 shadow-2xl hover:shadow-teal-500/50 transition-all hover:scale-110 group"
          aria-label="Expand video player"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            ●
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-[9998] w-full md:fixed md:z-50 md:top-auto md:bottom-4 md:left-auto md:right-4 md:w-auto md:max-w-[360px] lg:md:max-w-[400px]">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 md:rounded-xl shadow-2xl border-b md:border border-teal-500/30 overflow-hidden">
        {/* Header with title and controls */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
              <span className="text-[10px] text-white/80 font-medium">{isPlaying ? 'LIVE' : 'PAUSED'}</span>
            </div>
            <h3 className="text-xs font-semibold text-white truncate">
              {displayedVideo.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            <button
              onClick={togglePlayPause}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              aria-label={isPlaying ? 'Stop live stream' : 'Resume live stream'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
              aria-label="Minimize player"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-black">
        {isLoading ? (
          // Loading state for analysis video
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/50 to-teal-900/50">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg animate-pulse mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                  <svg className="absolute -inset-2 w-20 h-20 animate-spin mx-auto left-1/2 -ml-10" viewBox="0 0 50 50">
                    <circle 
                      className="opacity-25" 
                      cx="25" 
                      cy="25" 
                      r="20" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none"
                      style={{ color: '#0d9488' }}
                    />
                    <circle 
                      className="opacity-75" 
                      cx="25" 
                      cy="25" 
                      r="20" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none"
                      strokeDasharray="80"
                      strokeDashoffset="60"
                      style={{ color: '#0d9488' }}
                    />
                  </svg>
                </div>
                <p className="text-white text-sm font-medium">
                  {status === 'pending' && 'Preparing your video...'}
                  {status === 'processing' && 'Kronos is thinking...'}
                </p>
                <p className="text-xs text-teal-300 mt-2">
                  This usually takes 30-60 seconds
                </p>
              </div>
            </div>
          ) : videoSource ? (
            <>
              {/* Main video */}
              <video
                key={`${displayedVideo.id}-${videoSource}`}
                ref={videoRef}
                src={videoSource}
                autoPlay={isPlaying}
                muted={isMuted}
                playsInline
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }} // Disable scrubbing
              >
                Your browser does not support the video tag.
              </video>

              {/* Play button overlay when paused */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10"
                  onClick={togglePlayPause}
                  style={{ pointerEvents: 'auto' }}
                >
                  <button 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 group"
                    aria-label="Play video"
                  >
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-white ml-1 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Error banner for fallback video */}
              {error && (
                <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 px-3 py-2">
                  <div className="flex items-center gap-2 text-white text-xs">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">Showing sample video (personalized video temporarily unavailable)</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            // No video available
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Video unavailable</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
