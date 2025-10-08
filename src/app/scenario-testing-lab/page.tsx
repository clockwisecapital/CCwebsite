'use client';

import React from 'react';
import { FiTrendingUp, FiActivity, FiBarChart2 } from 'react-icons/fi';

export default function ScenarioTestingLab() {
  // Set body background color for this page
  React.useEffect(() => {
    document.body.style.backgroundColor = '#1A3A5F';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#1A3A5F', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-teal/5 via-transparent to-accent-gold/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-[#E3B23C]/15 transition-all duration-300 group mb-8" style={{ backgroundColor: 'rgba(227, 178, 60, 0.1)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(227, 178, 60, 0.3)' }}>
            <FiActivity className="w-3.5 h-3.5 group-hover:animate-pulse" style={{ color: '#E3B23C' }} />
            <span className="text-xs font-semibold tracking-wide" style={{ color: '#E3B23C' }}>AI-Powered Cycle Intelligence</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
            What Time Is It?
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            The world moves in cycles – both deterministic and random. TIME AI observes these
            patterns in <span className="text-secondary-teal font-bold">Economies</span> and{' '}
            <span className="text-accent-gold font-bold">Companies</span> to reveal how they impact markets, portfolios,
            and your financial goals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group relative px-10 py-5 bg-secondary-teal hover:bg-secondary-teal/90 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-2xl hover:shadow-secondary-teal/40 hover:scale-105 hover:-translate-y-0.5 min-w-[280px] sm:min-w-[320px]">
              <span className="relative z-10">Scenario Test My Portfolio</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-secondary-teal to-secondary-teal/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button className="group px-10 py-5 bg-white hover:bg-gray-50 text-primary-blue font-bold text-lg rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-0.5 border-2 border-transparent hover:border-secondary-teal/20 min-w-[280px] sm:min-w-[320px]">
              Watch Demo
            </button>
          </div>

          {/* Subtle Decorative Element */}
          <div className="mt-20 flex justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary-teal/30 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-secondary-teal/50 animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-secondary-teal animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Card 1 - White */}
          <div className="group relative bg-white rounded-2xl p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: '#1A3A5F' }}>
                <FiActivity className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="text-4xl lg:text-5xl font-bold mb-2 tracking-tight group-hover:scale-105 transition-transform duration-300" style={{ color: '#1A3A5F' }}>47+</div>
              <div className="text-xs font-semibold text-gray-700">Market Cycles Tracked</div>
            </div>
          </div>

          {/* Card 2 - Gold */}
          <div className="group relative rounded-2xl p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden" style={{ backgroundColor: '#E3B23C' }}>
            <div className="relative z-10">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30">
                <FiBarChart2 className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight group-hover:scale-105 transition-transform duration-300">1000+</div>
              <div className="text-xs font-semibold text-white/90">Portfolio Scenarios</div>
            </div>
          </div>

          {/* Card 3 - Blue */}
          <div className="group relative rounded-2xl p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border-2" style={{ backgroundColor: '#1A3A5F', borderColor: '#E3B23C' }}>
            <div className="relative z-10">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{ backgroundColor: '#E3B23C' }}>
                <FiTrendingUp className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight group-hover:scale-105 transition-transform duration-300">+23%</div>
              <div className="text-xs font-semibold text-white/90">Avg. Sync-Solar Improvement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Score Cards */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E3B23C' }}>
                <FiTrendingUp className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">Rate My Portfolio</h2>
            </div>
            <p className="text-sm md:text-base text-white/80">See how your portfolio aligns with current market cycles</p>
          </div>

          {/* Score Cards Container */}
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 space-y-3">
            {/* Your Portfolio Card */}
            <div className="group relative bg-white rounded-2xl p-5 md:p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="relative z-10">
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#1A3A5F' }}>Your Portfolio</div>
                <div className="text-6xl md:text-7xl font-bold mb-2 tracking-tighter group-hover:scale-105 transition-transform duration-300" style={{ color: '#1A3A5F' }}>72</div>
                <div className="text-sm md:text-base font-semibold text-gray-600">Cycle Sync Score</div>
              </div>
            </div>

            {/* TIME ETF Benchmark Card */}
            <div className="group relative rounded-2xl p-5 md:p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden" style={{ backgroundColor: '#E3B23C' }}>
              <div className="relative z-10">
                <div className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">TIME ETF Benchmark</div>
                <div className="text-6xl md:text-7xl font-bold text-white mb-2 tracking-tighter group-hover:scale-105 transition-transform duration-300">78</div>
                <div className="text-sm md:text-base font-semibold text-white/90">Optimal Alignment</div>
              </div>
            </div>

            {/* Divider Line */}
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
            </div>

            {/* Message and CTA */}
            <div className="text-center pt-3">
              <p className="text-xs md:text-sm text-white/80 mb-6 max-w-2xl mx-auto leading-relaxed">
                Your portfolio is slightly behind TIME ETF cycle alignment.
              </p>
              <button className="group relative px-8 py-3 text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-2xl hover:scale-105 hover:-translate-y-1" style={{ backgroundColor: '#E3B23C' }}>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Get Detailed Analysis
                  <span className="inline-block group-hover:translate-x-2 transition-transform duration-300">→</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Macro Cycle Intelligence Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
              Macro Cycle Intelligence
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">Real-time tracking of economic, technology, and market cycles</p>
          </div>

          {/* Cycle Information Card */}
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6">
            {/* Cycle Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-700">
              <div className="w-12 h-12 rounded-2xl bg-secondary-teal/20 flex items-center justify-center flex-shrink-0 border border-secondary-teal/30">
                <FiActivity className="w-6 h-6 text-secondary-teal" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 tracking-tight">Macro Cycle Clock Sync Score: 72 / 100</h3>
                <p className="text-sm md:text-base text-gray-300">Long-Term Economic Cycle</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F59E0B' }} />
              80% Complete
            </div>

            {/* Cycle Phase */}
            <div className="mb-6">
              <h4 className="text-lg md:text-xl font-bold text-white mb-4">Phase: Late Debt Supercycle</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group bg-gray-800/70 rounded-2xl p-5 border-2 border-secondary-teal/30 hover:border-secondary-teal/50 transition-all duration-300 hover:shadow-xl hover:shadow-secondary-teal/20">
                  <div className="text-xs font-bold uppercase tracking-widest text-secondary-teal mb-3">Signal</div>
                  <div className="text-sm md:text-base text-gray-200 leading-relaxed">
                    High debt-to-GDP, aging demographics, slower productivity.
                  </div>
                </div>

                <div className="group bg-gray-800/70 rounded-2xl p-5 border-2 hover:border-accent-gold/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent-gold/20" style={{ borderColor: 'rgba(227, 178, 60, 0.3)' }}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#E3B23C' }}>Example</div>
                  <div className="text-sm md:text-base text-gray-200 leading-relaxed">
                    Developed Economies — elevated public debt, reverse labor pressure.
                  </div>
                </div>
              </div>
            </div>

            {/* Framework */}
            <div className="inline-block px-4 py-2 rounded-xl bg-gray-800/70 border border-gray-600 text-sm font-semibold text-gray-300 mb-6">
              Framework: TIME
            </div>

            {/* Short-Term Cycle */}
            <div className="bg-gray-800/50 rounded-2xl p-5 md:p-6 border-2 border-gray-700">
              <h4 className="text-lg md:text-xl font-bold text-white mb-4">Short-Term Economic Cycle</h4>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#F59E0B' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F59E0B' }} />
                65% Complete
              </div>
              <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                <div className="text-sm md:text-base font-medium text-gray-200">
                  Phase: Mid-Expansion → Late Expansion Risk
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scenario Comparison Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Scenario Card */}
          <div className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-md border border-gray-700 rounded-2xl p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-secondary-teal/20 flex items-center justify-center flex-shrink-0 border border-secondary-teal/30">
                <FiBarChart2 className="w-6 h-6 text-secondary-teal" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 tracking-tight">Extended Government Shutdown Scenario</h3>
                <p className="text-sm md:text-base text-gray-300">
                  Comparison of Average Upside and Downside between User Portfolio and TIME ETF (Hypothetical)
                </p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 rounded-2xl p-8 mb-6 h-48 flex items-center justify-center border-2 border-gray-700 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-secondary-teal/20 flex items-center justify-center border border-secondary-teal/30">
                  <FiBarChart2 className="w-8 h-8 text-secondary-teal" />
                </div>
                <p className="text-lg font-bold text-gray-300 mb-2">Interactive Chart Visualization</p>
                <p className="text-sm text-gray-400">Portfolio performance comparison over time</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* User Upside */}
              <div className="group relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-2 border-gray-700 rounded-xl p-4 text-center hover:border-secondary-teal/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-secondary-teal/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-teal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-1 tracking-tight group-hover:scale-105 transition-transform duration-300">+15%</div>
                  <div className="text-xs md:text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">User Upside</div>
                </div>
              </div>

              {/* User Downside */}
              <div className="group relative bg-gradient-to-br from-red-950/90 to-red-900/80 border-2 border-red-800/60 rounded-xl p-4 text-center hover:border-red-600/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-bold text-red-400 mb-1 tracking-tight group-hover:scale-105 transition-transform duration-300">-10%</div>
                  <div className="text-xs md:text-sm font-semibold text-gray-300 group-hover:text-red-200 transition-colors">User Downside</div>
                </div>
              </div>

              {/* TIME Upside */}
              <div className="group relative bg-gradient-to-br from-blue-950/90 to-blue-900/80 border-2 border-blue-800/60 rounded-xl p-4 text-center hover:border-blue-600/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-1 tracking-tight group-hover:scale-105 transition-transform duration-300">+18%</div>
                  <div className="text-xs md:text-sm font-semibold text-gray-300 group-hover:text-blue-200 transition-colors">TIME Upside</div>
                </div>
              </div>

              {/* TIME Downside */}
              <div className="group relative bg-gradient-to-br from-blue-950/90 to-blue-900/80 border-2 border-blue-800/60 rounded-xl p-4 text-center hover:border-blue-600/60 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-1 tracking-tight group-hover:scale-105 transition-transform duration-300">-8%</div>
                  <div className="text-xs md:text-sm font-semibold text-gray-300 group-hover:text-blue-200 transition-colors">TIME Downside</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-teal/5 via-transparent to-accent-gold/5 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Icon Badge */}
          <div className="w-24 h-24 mx-auto mb-10 rounded-3xl flex items-center justify-center backdrop-blur-sm border-2" style={{ backgroundColor: 'rgba(31, 170, 163, 0.2)', borderColor: '#E3B23C' }}>
            <FiBarChart2 className="w-12 h-12 text-secondary-teal" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Scenario Testing Lab
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
            Stress-test your portfolio against real-world economic scenarios
          </p>

          {/* CTA Button */}
          <button className="group relative px-10 py-4 text-white font-bold text-base md:text-lg rounded-xl transition-all duration-300 shadow-2xl hover:scale-110 hover:-translate-y-2" style={{ backgroundColor: '#E3B23C' }}>
            <span className="relative z-10 flex items-center justify-center gap-4">
              Start Testing Your Portfolio
              <span className="inline-block group-hover:translate-x-3 transition-transform duration-300 text-2xl">→</span>
            </span>
          </button>

          {/* Decorative Elements */}
          <div className="mt-12 flex justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-secondary-teal/50 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-secondary-teal/70 animate-pulse" style={{ animationDelay: '200ms' }} />
            <div className="w-3 h-3 rounded-full bg-secondary-teal animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </section>
    </div>
  );
}
