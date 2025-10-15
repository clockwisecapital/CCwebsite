'use client';

import { useState } from 'react';

export default function AIAvatarSection() {
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <div className="bg-gradient-to-br from-blue-900 via-teal-800 to-teal-900 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Welcome Message - LEFT SIDE */}
          <div className="space-y-6 order-2 lg:order-1">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-teal-300">
                Welcome to Your Portfolio Analysis
              </h1>
              <p className="text-xl text-teal-100 leading-relaxed">
                Get personalized insights on your investments aligned with economic and technology cycles
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-gray-200">
                  <span className="font-semibold">Cycle-Aware Analysis:</span> Understand where you stand in current economic and technology cycles
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-gray-200">
                  <span className="font-semibold">Personalized Recommendations:</span> Tailored strategies based on your goals and risk tolerance
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-gray-200">
                  <span className="font-semibold">Stress Test Scenarios:</span> See how your portfolio performs under different market conditions
                </p>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-300">
                Complete the intake form below to receive your comprehensive portfolio analysis in minutes
              </p>
            </div>
          </div>

          {/* Video Modal - RIGHT SIDE */}
          <div className="relative order-1 lg:order-2">
            {/* Video Thumbnail with Play Button */}
            <button
              onClick={() => setShowVideoModal(true)}
              className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-2xl border border-teal-500/30 group cursor-pointer hover:border-teal-400 transition-all duration-300"
            >
              {/* Video Thumbnail Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-teal-900/50"></div>
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* "Watch Introduction" Text */}
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <p className="text-white font-semibold text-lg">Watch Introduction</p>
                <p className="text-teal-300 text-sm">Learn how our analysis works</p>
              </div>
            </button>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
