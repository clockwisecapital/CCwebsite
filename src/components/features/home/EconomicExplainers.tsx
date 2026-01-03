"use client";

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";

// Single transparent-glass card wrapper
interface OverlayCardProps {
  title: string;
  summary: React.ReactNode;
  details: React.ReactNode;
}

const OverlayCard: React.FC<OverlayCardProps> = ({ title, summary, details }) => {
  return (
    <section className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 shadow-xl text-gray-100 flex flex-col space-y-4">
      <h3 className="text-2xl font-semibold text-white mb-3">{title}</h3>
      <div className="space-y-3 text-sm text-gray-200">
        {summary}
      </div>
      <hr className="border-white/20" />
      <div className="space-y-3 text-sm text-gray-200">
        {details}
      </div>
    </section>
  );
};

// Three steps data
const approachSteps = [
  {
    id: 1,
    number: "1",
    title: "Score Your Portfolio",
    description: "Kronos analyzes your holdings across 6 market cycles in 60 seconds."
  },
  {
    id: 2,
    number: "2",
    title: "See Opportunities",
    description: "Compare to cycle-optimized strategies and identify gaps."
  },
  {
    id: 3,
    number: "3",
    title: "Talk to an Advisor",
    description: "A fiduciary helps you implement changes that fit your goals."
  }
];

const EconomicExplainers: React.FC = () => {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  return (
  <section className="relative w-full overflow-hidden py-20 md:py-28">
    {/* Background video */}
    <video
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      src="/navigationsection/social_u9354481378_Cinematic_beach_scene_split_ocean_view_left_surfe_556968b1-f947-41d8-b525-2ef2881f11b9_3.mp4"
    />
    {/* Dark overlay for readability */}
    <div className="absolute inset-0 bg-black/70" />
    
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-1 mb-4 rounded-full bg-[#1FAAA3]/20 border border-[#1FAAA3]/50">
          <span className="text-[#1FAAA3] text-sm font-medium uppercase tracking-wider">Our Approach</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Adaptive Investing in 3 Steps
        </h2>
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
          We combine AI-powered analysis with fiduciary advisors to help you navigate today&apos;s markets.
        </p>
      </div>

      {/* Three Steps Cards */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
        {approachSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1A2332] to-[#0F1419] rounded-xl p-8 border border-white/10 hover:border-[#1FAAA3]/50 transition-all duration-300"
          >
            {/* Number Badge */}
            <div className="w-12 h-12 rounded-full bg-[#1FAAA3]/20 border-2 border-[#1FAAA3] flex items-center justify-center text-[#1FAAA3] text-xl font-bold mb-6">
              {step.number}
            </div>

            {/* Title */}
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-gray-400 leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* CTA Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto bg-gradient-to-br from-[#1A2332] to-[#0F1419] rounded-2xl p-8 md:p-12 border border-[#1FAAA3]/30 text-center"
      >
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          See How Your Portfolio Scores
        </h3>
        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
          Get an instant analysis across 6 market cycles. Identify exposures and opportunities in under a minute.
        </p>
        
        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-gray-300">
            <svg className="w-5 h-5 text-[#1FAAA3]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm">60-second analysis</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <svg className="w-5 h-5 text-[#1FAAA3]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm">No account linking</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <svg className="w-5 h-5 text-[#1FAAA3]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span className="text-sm">Personalized report</span>
          </div>
        </div>

        {/* CTA Button */}
        <button 
          onClick={() => router.push('/kronos')} 
          className="group relative overflow-hidden bg-[#1FAAA3] hover:bg-[#1FAAA3]/90 text-white font-sans font-bold py-4 px-8 rounded-lg shadow-lg transition-all duration-300 inline-block hover:scale-105"
        >
          <span className="absolute top-0 left-0 w-full h-full bg-white/10 transform -translate-x-full skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
          <span className="relative flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Score My Portfolio</span>
          </span>
        </button>
      </motion.div>

      {/* Toggle Button for Details */}
      <div className="text-center mt-12">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="group inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-[#1FAAA3]/50 rounded-lg text-white font-medium transition-all duration-300"
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>{showDetails ? 'Hide' : 'Learn More About'} Our Methodology</span>
        </button>
      </div>

      {/* Collapsible Details Section */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-12 pt-12 border-t border-white/10"
        >
          <div className="relative">
            {/* overlay cards */}
            <div className="relative z-10 py-8 grid gap-10 md:grid-cols-2">
              {/* card 1 */}
              <OverlayCard
                title="Stock-Bond Correlation: 40-Year Trend Is Over"
                summary={(
                  <ul className="list-disc list-inside pl-4 space-y-1 text-sm text-gray-200">
                    <li>Historical average (1990-2010): −0.30 (strong diversification)</li>
                    <li>Current level (2020-2025): +0.60 (assets moving together)</li>
                    <li>Crisis spikes (COVID-19, 2022): +0.80 (diversification fails)</li>
                  </ul>
                )}
                details={(
                  <>
                    <p>
                      The classic negative relationship between stocks and bonds supported the 60/40 portfolio for decades. Inflation shocks
                      and synchronized policy moves have pushed both asset classes in the same direction, removing the natural hedge.
                    </p>
                    <p>
                      Volatility is higher, and static portfolios experience larger swings. Investors must explore alternative hedges and more
                      dynamic allocation methods.
                    </p>
                  </>
                )}
              />

              {/* card 2 */}
              <OverlayCard
                title="Passive vs Adaptive ETF Portfolios"
                summary={(
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
                    <div>
                      <h4 className="font-semibold text-white mb-3">Passive Portfolios</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Fixed allocations (60% stocks, 40% bonds)</li>
                        <li>Rebalances quarterly or yearly</li>
                        <li>Ignores market conditions</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3">Adaptive (AI)</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>AI calculates optimal allocations daily</li>
                        <li>Adjusts to dynamic market correlations</li>
                        <li>Protects downside automatically</li>
                        <li>Captures upside opportunities</li>
                        <li>Uses machine learning algorithms</li>
                      </ul>
                    </div>
                  </div>
                )}
                details={(
                  <>
                    <p className="text-gray-200 text-sm">Passive portfolios are like using a flip phone in 2025. They worked fine in the 1990s when markets were simpler, but today&rsquo;s volatile, AI-driven markets need smarter tools. Adaptive portfolios are like having a smartphone – same basic function (investing), but with way more intelligence built in.</p>
                  </>
                )}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  </section>
  );
};

export default EconomicExplainers;