"use client";

import React from 'react';
import { motion } from 'framer-motion';

const MissionSection = () => {
  return (
    <section id="mission" className="py-20 md:py-28 bg-[#0a1119] relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-[#1FAAA3] uppercase tracking-wide mb-3 text-sm font-medium">Our Mission</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Investing Evolved
            </h2>
          </div>
          
          {/* Mission Statement */}
          <div className="max-w-4xl mx-auto">
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed text-center mb-6">
              Markets move faster than ever. Technology cycles, monetary policy, and geopolitics create complexity that static portfolios can&apos;t handle. <span className="text-white font-semibold">We built Clockwise to give everyday investors access to the adaptive strategies institutions have used for decades</span> — combined with fiduciary advisors who actually explain what&apos;s happening and why.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MissionSection;
