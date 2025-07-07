"use client";

import React from "react";

interface AdvisorOption {
  tier: string;
  price: string;
  description: string;
  features: string[];
}

const advisorOptions: AdvisorOption[] = [
  {
    tier: "Advisor 1",
    price: "Free",
    description: "Clockwise AI (Educational Purposes Only)",
    features: ["Investing Education", "Portfolio Planning"],
  },
  {
    tier: "Advisor 2",
    price: "Subscription",
    description: "Human Advisor (Avg. $499/mo)",
    features: [
      "Low Complexity (Middle Income Earners)",
      "Portfolio Planning",
      "Cash Flow Planning",
    ],
  },
  {
    tier: "Advisor 3",
    price: "Fee Based",
    description: "Human Advisor (Avg. 1%/year)",
    features: [
      "High Complexity (High Income Earners)",
      "Portfolio Planning",
      "Cash Flow Planning",
      "Tax Reduction Planning",
      "Wellness Planning",
      "Risk Planning",
      "Legacy Planning",
    ],
  },
];

const AdvisorOptions: React.FC = () => {
  return (
    <section id="plan" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-sans font-medium text-[#1A3A5F] mb-4">
            Advisor Options
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] rounded-full mx-auto mb-6" />
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our range of approved independent advisor options designed to help you navigate economic and technology cycles with confidence.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
          {advisorOptions.map((opt) => (
            <div
              key={opt.tier}
              className="relative bg-gradient-to-br from-[#0A1F35] via-[#1A3A5F] to-[#0A1F35] border border-white/10 rounded-xl shadow-lg p-8 flex flex-col hover:shadow-xl transition-shadow duration-300 text-white"
            >
              <h3 className="text-xl font-semibold mb-2">{opt.tier}</h3>
              <p className="text-teal-300 font-medium mb-4">{opt.price}</p>
              <p className="text-white/80 mb-6">{opt.description}</p>
              <ul className="list-disc list-inside space-y-2 text-sm text-white/90 flex-1">
                {opt.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvisorOptions;