'use client';

import { getVideoPath } from '@/hooks/useAvatarVariant';

export default function AIAvatarSection() {
  // Always use variant-b video
  const videoPath = getVideoPath('/kronos-intro-no-watermark.mp4');
  
  return (
    <div className="bg-gradient-to-br from-blue-900 via-teal-800 to-teal-900 text-white pt-20">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-20 md:py-24">
        {/* Full-Width Video Section */}
        <div className="relative max-w-[1600px] mx-auto">
          <div className="relative w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-2xl border border-teal-500/30">
            {/* Video Player */}
            <div className="relative aspect-video">
              <video
                src={videoPath}
                controls
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                poster="/placeholder-video.jpg"
              >
                Your browser does not support the video tag.
              </video>
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
                      <span className="font-semibold text-white">Investing Environments</span>
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">-</span>
                    <p className="text-gray-300">
                      <span className="font-semibold text-white">Personalized Portfolio Risks</span>
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">-</span>
                    <p className="text-gray-300">
                      <span className="font-semibold text-white">Personalized Goal Risks</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
        </div>
      </div>
    </div>
  );
}
