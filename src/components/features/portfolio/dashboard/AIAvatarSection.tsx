'use client';

import { useState } from 'react';
import VideoPlayer from './VideoPlayer';

interface AIAvatarSectionProps {
  videoId?: string | null;
}

export default function AIAvatarSection({ videoId }: AIAvatarSectionProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <div className="bg-gradient-to-br from-blue-900 via-teal-800 to-teal-900 text-white pt-20">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-20 md:py-24">
        {/* Full-Width Video Section */}
        <div className="relative max-w-[1600px] mx-auto">
          {/* Show HeyGen video if available, otherwise show intro placeholder */}
          {videoId ? (
            <VideoPlayer videoId={videoId} />
          ) : (
            <button
              onClick={() => setShowVideoModal(true)}
              className="relative w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-2xl border border-teal-500/30 group cursor-pointer hover:border-teal-400 transition-all duration-300 text-left"
            >
            {/* Video Thumbnail Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-teal-900/50"></div>
            
            <div className="relative z-10">
              {/* Top: Large Video Play Button Area */}
              <div className="flex flex-col items-center justify-center py-24 md:py-32 lg:py-40 px-8">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-teal-500 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-2xl mb-6">
                  <svg className="w-16 h-16 md:w-20 md:h-20 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-2xl md:text-3xl mb-2">Watch Introduction</p>
                  <p className="text-teal-300 text-base md:text-lg">Learn how our portfolio analysis works</p>
                </div>
              </div>

              {/* Bottom: Compact Intro Content */}
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
                        <span className="font-semibold text-white">Your Investing Environment</span>
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-teal-400 font-bold">-</span>
                      <p className="text-gray-300">
                        <span className="font-semibold text-white">Your Portfolio Impact</span>
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
          </button>
          )}
          
          {/* Decorative Elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl">
            {/* Close Button */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-teal-400 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Container */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
              {/* Replace this iframe with your actual video URL */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1"
                title="Portfolio Analysis Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              
              {/* Placeholder if no video URL yet */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center text-white space-y-4">
                  <svg className="w-16 h-16 mx-auto text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xl font-semibold">Video Coming Soon</p>
                    <p className="text-sm text-gray-400 mt-2">Introduction video will be embedded here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
