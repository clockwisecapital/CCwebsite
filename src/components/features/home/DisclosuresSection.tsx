"use client";

import React from "react";

const DisclosuresSection: React.FC = () => (
  <section id="disclosures" className="bg-[#f9fafb] py-20 px-4">
    <div className="max-w-4xl mx-auto space-y-8 text-gray-700">
      <h2 className="text-2xl md:text-3xl font-semibold text-center text-[#1A3A5F]">Disclosures</h2>
      <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full" />

      <p className="leading-relaxed">
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
  </section>
);

export default DisclosuresSection;
