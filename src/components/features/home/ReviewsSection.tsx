"use client";

import React, { useEffect, useState } from "react";
import { FaQuoteLeft } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface Review {
  name: string;
  text: string;
}

const reviews: Review[] = [
  {
    name: "Brandon W.",
    text: "Clockwise's insights transformed how I think about risk. Highly recommend!",
  },
  {
    name: "Daniel F.",
    text: "The AI tools are intuitive and incredibly helpful in planning my portfolio.",
  },
  {
    name: "Elizabeth B.",
    text: "I booked a consultation and felt instantly at ease—knowledgeable and transparent team.",
  },
];

const ReviewsSection: React.FC = () => {
  const [index, setIndex] = useState(0);

  // rotate every 6s
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % reviews.length), 6000);
    return () => clearInterval(id);
  }, []);

  const { name, text } = reviews[index];

  return (
    <section id="reviews" className="py-20 px-4 relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1F35] via-[#1A3A5F] to-[#0A1F35] z-0" />
      <div className="relative z-10">
      <div className="max-w-3xl mx-auto text-center space-y-10 relative">
        <h2 className="text-2xl md:text-3xl font-semibold">What Our Clients Say</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full" />

        <div className="relative mx-auto max-w-xl bg-white/10 backdrop-blur-sm rounded-lg p-8 shadow-lg">
          <FaQuoteLeft className="text-3xl text-[#1FAAA3] mb-4" />
          <blockquote className="text-base md:text-lg italic leading-relaxed">
          “{text}”
          <span className="block mt-4 not-italic font-medium text-[#1FAAA3]">— {name}</span>
        </blockquote>
        </div>

        {/* manual controls */}
        <div className="flex justify-center gap-6 text-[#1FAAA3] mt-8">
          <button
            aria-label="Previous review"
            onClick={() => setIndex((i) => (i - 1 + reviews.length) % reviews.length)}
            className="p-2 rounded-full hover:bg-[#1FAAA3]/10 transition-colors"
          >
            <FiChevronLeft size={24} />
          </button>
          <button
            aria-label="Next review"
            onClick={() => setIndex((i) => (i + 1) % reviews.length)}
            className="p-2 rounded-full hover:bg-[#1FAAA3]/10 transition-colors"
          >
            <FiChevronRight size={24} />
          </button>
        </div>
      </div>
          </div>
    </section>
  );
};

export default ReviewsSection;
