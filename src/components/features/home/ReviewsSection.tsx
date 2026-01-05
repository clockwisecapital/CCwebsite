"use client";

import React from "react";
import { FaStar } from "react-icons/fa";

interface Review {
  name: string;
  title: string;
  age: number;
  initials: string;
  text: string;
  rating: number;
}

const reviews: Review[] = [
  {
    name: "Brandon W.",
    title: "Business Owner",
    age: 52,
    initials: "BW",
    text: "The portfolio analysis opened my eyes to risks I didn't know I had. After working with their advisor team, I much more confident about my retirement timeline.",
    rating: 5,
  },
  {
    name: "Michael L.",
    title: "Tech Executive",
    age: 47,
    initials: "ML",
    text: "I was skeptical about AI-driven investing, but the cycle analysis convinced me. My portfolio weathered the recent volatility much better than my old 60/40 allocation.",
    rating: 5,
  },
  {
    name: "Sarah K.",
    title: "Physician",
    age: 55,
    initials: "SK",
    text: "Finally, advisors who actually explain why they're making changes. The combination of AI insights and human expertise is exactly what I was looking for.",
    rating: 5,
  },
];

const ReviewsSection: React.FC = () => {
  return (
    <section id="reviews" className="py-20 px-4 relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-[#0e171e] z-0" />
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <p className="text-[#1FAAA3] text-sm font-semibold uppercase tracking-wider mb-4">
              Results
            </p>
            <h2 className="text-4xl md:text-4xl font-bold mb-6">What Our Clients Say</h2>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 hover:bg-white/10 transition-all duration-300"
              >
                {/* Star Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <FaStar key={i} className="text-[#E3B23C] text-sm" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-white/90 text-sm leading-relaxed mb-6 italic">
                  "{review.text}"
                </p>

                {/* Client Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1FAAA3] flex items-center justify-center font-bold text-[#0A1F35]">
                    {review.initials}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{review.name}</p>
                    <p className="text-white/60 text-xs">
                      {review.title}, {review.age}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
