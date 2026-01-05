"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ClockwiseMedia = () => {
  const videos = [
    {
      id: "EQ2OSHJF9VY",
      title: "Investors need exposure to Nvidia, ju...",
      source: "CNBC",
    },
    {
      id: "ubtgD8j0lHw",
      title: "'Too many unknowns' with election & marke...",
      source: "CNBC",
    },
    {
      id: "JnTK7md0n0k",
      title: "Cakmak: I think Netflix has redeemed itself....",
      source: "SCHWAB",
    },
    {
      id: "Xjxmf0KDbDs",
      title: "Cakmak: Trimming Nvidia, as most of its...",
      source: "CNBC",
    },
  ];

  return (
    <section id="media" className="py-20 md:py-28 bg-[#0a1119] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 rounded-full bg-[#1FAAA3] blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[#1FAAA3] uppercase tracking-wide mb-3 text-sm font-medium">Insights</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Clockwise Media
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl">
            Catch our latest media appearances and market insights.
          </p>
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-br from-[#1A2332] to-[#0F1419] rounded-xl overflow-hidden border border-white/10 hover:border-[#1FAAA3]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#1FAAA3]/10"
              >
                {/* Video thumbnail with play button */}
                <div className="aspect-video relative bg-gradient-to-br from-gray-800 to-gray-900">
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-[#1FAAA3] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Source badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium">
                    {video.source}
                  </div>
                </div>

                {/* Video title */}
                <div className="p-4">
                  <h3 className="text-white text-sm font-medium leading-snug line-clamp-2">
                    {video.title}
                  </h3>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};



export default ClockwiseMedia;
