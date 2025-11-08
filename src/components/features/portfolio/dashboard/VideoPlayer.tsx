'use client';

import { useState, useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string | null;
  onVideoReady?: () => void;
}

export default function VideoPlayer({ videoId, onVideoReady }: VideoPlayerProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasNotified = useRef(false); // Track if we've already called onVideoReady

  console.log('🎥 VideoPlayer rendered with videoId:', videoId, 'status:', status);

  useEffect(() => {
    if (!videoId) return;
    
    // Set timeout to show fallback video after 90 seconds
    const fallbackTimeout = setTimeout(() => {
      if (status !== 'completed') {
        console.log('⏱️ Video generation timeout - showing fallback video');
        setError('Video generation timeout');
      }
    }, 90000); // 90 seconds

    const checkVideoStatus = async (intervalId: NodeJS.Timeout) => {
      try {
        const response = await fetch(`/api/portfolio/video-status?videoId=${videoId}`);
        const data = await response.json();

        if (data.success) {
          setStatus(data.status);

          if (data.status === 'completed' && data.videoUrl) {
            setVideoUrl(data.videoUrl);
            clearInterval(intervalId);
            clearTimeout(fallbackTimeout);
            console.log('✅ Video ready:', data.videoUrl);
            // Notify parent that video is ready (only once)
            if (onVideoReady && !hasNotified.current) {
              hasNotified.current = true;
              onVideoReady();
            }
          } else if (data.status === 'failed') {
            setError('Video generation failed');
            clearInterval(intervalId);
            clearTimeout(fallbackTimeout);
          }
        }
      } catch (err) {
        console.error('Failed to check video status:', err);
        setError('Failed to check video status');
      }
    };

    // Poll every 3 seconds
    const pollInterval = setInterval(() => checkVideoStatus(pollInterval), 3000);
    
    // Check immediately (pass pollInterval for potential cleanup)
    checkVideoStatus(pollInterval);

    // Cleanup on unmount
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      clearTimeout(fallbackTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]); // Removed onVideoReady from deps to prevent re-running

  if (!videoId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium">No video ID available. Please complete the intake and analysis first.</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Show fallback video when API fails
    return (
      <div className="relative w-full bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        <div className="relative aspect-video">
          <video
            controls
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            poster="/placeholder-video.jpg"
          >
            <source src="/8cbbd46caa4a47e19e58b99801b272d3.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        {/* Info banner */}
        <div className="bg-amber-50 border-t border-amber-200 px-6 py-3">
          <div className="flex items-center gap-2 text-amber-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">Showing sample analysis video (personalized video temporarily unavailable)</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'completed' && videoUrl) {
    return (
      <div className="relative w-full bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        <div className="relative aspect-video">
          <video
            controls
            autoPlay
            muted
            className="w-full h-full object-cover"
            poster="/placeholder-video.jpg"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        {/* Bottom Info Section */}
        <div className="border-t border-gray-700/50 bg-gray-900/30 backdrop-blur-sm px-6 py-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">
              Hi! I&rsquo;m Kronos, Your Portfolio Intelligence Guide.
            </h2>
            <p className="text-lg text-teal-300 mb-4">
              I Analyze:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-teal-400 font-bold">-</span>
                <p className="text-gray-300">
                  <span className="font-semibold text-white">Investing Environment</span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-teal-400 font-bold">-</span>
                <p className="text-gray-300">
                  <span className="font-semibold text-white">Portfolio Impact</span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-teal-400 font-bold">-</span>
                <p className="text-gray-300">
                  <span className="font-semibold text-white">Your Goals Impact</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="relative w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-2xl border border-teal-500/30">
      <div className="relative aspect-video bg-gradient-to-br from-blue-900/50 to-teal-900/50 flex items-center justify-center">
        <div className="text-center">
          {/* Animated Kronos Icon */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg animate-pulse mx-auto">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            {/* Spinner */}
            <svg className="absolute -inset-3 w-32 h-32 animate-spin mx-auto left-1/2 -ml-16" viewBox="0 0 50 50">
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
          <p className="text-white font-medium">
            {status === 'pending' && 'Preparing your video...'}
            {status === 'processing' && 'Kronos is recording...'}
          </p>
          <p className="text-sm text-teal-300 mt-2">
            This usually takes 30-60 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
