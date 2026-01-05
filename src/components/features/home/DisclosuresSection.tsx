"use client";

import React, { useState } from "react";

const DisclosuresSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section id="disclosures" className="bg-[#0e171e] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all duration-300"
        >
          <h4 className="text-xs font-normal text-gray-500">Disclosures</h4>
          <svg 
            className={`w-3 h-3 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="mt-4 px-6 py-6 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-gray-300 leading-relaxed">
              Clockwise Capital prioritizes the secure and ethical use of artificial intelligence (AI) to enhance our
              services while safeguarding client information. Our policy strictly prohibits sharing passwords with AI tools
              and entering client non-public personal information (NPI) without explicit authorization. We work exclusively
              with AI providers that demonstrate robust data protection, commit to not retaining or selling client
              information, and immediately notify us of any breaches. These providers must also indemnify our firm against
              violations and provide annual compliance confirmations. Employees are required to acknowledge this policy
              regularly and adhere to rigorous standards to ensure the integrity of our processes and the trust of our
              clients.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DisclosuresSection;
