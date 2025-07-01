"use client";

import React from 'react';
import AnimatedSection from "../../ui/AnimatedSection";

const ClockwiseMedia = () => {
  const videos = [
    {
      id: "EQ2OSHJF9VY",
      title: "Investors need exposure to Nvidia, just to what degree, says Clockwise Capital's James Cakmak",
    },
    {
      id: "ubtgD8j0lHw",
      title: "'Too many unknowns' with election & market to be overweight megacaps, says Clockwise's Cakmak",
    },
    {
      id: "JnTK7md0n0k",
      title: "Cakmak: I think Netflix has redeemed itself... they'll figure it out.",
    },
    {
      id: "Xjxmf0KDbDs",
      title: "Cakmak: Trimming Nvidia, as most of its upside is already priced in",
    },
  ];

  return (
    <AnimatedSection
      animation="zoom-in"
      className="py-20 px-4 bg-white text-[#1A3A5F] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Clockwise Media
          </h2>
          <p className="text-base md:text-lg max-w-3xl mx-auto text-gray-600">
            Catch our latest media appearances and insights
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full mt-4" />
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              <div className="aspect-video relative">
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?rel=0`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              <h5 className="mt-2 text-sm sm:text-base font-serif font-normal leading-snug px-3 pb-3 min-h-[48px]">
                {video.title}
              </h5>
            </div>
          ))}
        </div>

        {/* View all button */}
        <div className="text-center mt-12">
          <a
            href="/media"
            className="inline-flex items-center gap-2 bg-[#1FAAA3] hover:bg-[#17867A] text-white px-8 py-3 rounded-md font-medium shadow-lg transition-colors duration-300"
          >
            View All Media
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </div>
    </AnimatedSection>
  );
};



export default ClockwiseMedia;
