import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AnimatedSection from '@/components/ui/AnimatedSection';

interface TeamMember {
  name: string;
  title: string;
  imageSrc: string;
  bio: string;
  social: {
    linkedin?: string;
    twitter?: string;
  };
}

const ClockwiseTeam = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const teamMembers: TeamMember[] = [
    {
      name: 'Kronos',
      title: 'AI Portfolio Manager',
      imageSrc: '/team/kronos.png',
      bio: 'Kronos is Clockwise Capital\'s proprietary AI Portfolio Manager, engineered to bring adaptive intelligence, discipline, and transparency to modern investing. Built on the Adaptive Investment Framework, Kronos analyzes market cycles, macroeconomic trends, valuation regimes, and risk dynamics in real time—continuously adjusting portfolio positioning to reflect the shifting forces that drive long-term returns. At the core of Kronos is a singular mission: help investors compound wealth more intelligently across every phase of the market cycle. By integrating machine learning, quantitative research, and human investment expertise, Kronos powers the strategy behind TIME: Clockwise Core Equity & Innovation ETF and Clockwise Adaptive Portfolios, ensuring allocations evolve with changing market conditions rather than relying on static models, incapable of adapting to the speed of change. Kronos is designed not just to react to markets, but to anticipate them—detecting shifts in growth, value, momentum, and defensive factors, and rebalancing portfolios to maximize durability and opportunity. With an emphasis on explainability and rigorous methodology, Kronos gives investors access to institutional-grade adaptive strategy in a transparent, accessible format. Kronos represents the future of portfolio management: always learning, always adapting, and always aligned with long-term investor outcomes.',
      social: {
        linkedin: 'https://www.linkedin.com/in/kronos-clockwise-79aab7397/'
      }
    },
    {
      name: 'Eli Mikel, CFP®, CRPC®',
      title: 'Chief Growth Officer',
      imageSrc: '/team/Eli-clockwise.png',
      bio: 'Mr. Mikel is a seasoned financial professional with a deep passion for empowering clients to navigate the rapid pace of technological change. Armed with a Bachelor of Science in Finance from Virginia Commonwealth University and post-graduate education from Georgetown University, Mr. Mikel combines a strong academic foundation with over two decades of experience in finance and marketing. As a driving force behind the company\'s brand awareness, education, and growth initiatives, he leverages creative technology solutions to expand the firm\'s reach and impact, ensuring clients have access to innovative tools and insights. Mr. Mikel is dedicated to fostering a culture of transparency and financial literacy, equipping investors with the knowledge and resources they need to make informed decisions in an ever-evolving investment landscape. His commitment to client empowerment and education enables investors to thrive in a future shaped by technological advancement.',
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      name: 'James Cakmak, CFA',
      title: 'Portfolio Manager',
      imageSrc: '/team/James-clockwise.png',
      bio: 'Mr. Cakmak is a thought leader in the capital markets and more broadly within technology and innovation. At Clockwise Capital he is responsible for advancing the company\'s mission to harness transformative technologies and novel ideas. With two decades of experience in finance and a keen insight into emerging trends, Mr. Cakmak directs the fund\'s strategic approach, identifying high-potential investment opportunities and adeptly navigating complex market dynamics. His role encompasses rigorous research, analysis, and portfolio management, ensuring Clockwise remains agile and responsive to shifting market conditions. Leveraging Clockwise\'s AI-enhanced investment model, Mr. Cakmak actively engineers this tool to enhance the firm\'s ability to swiftly adapt to changes in technology and economic cycles, positioning it at the forefront of innovation-driven investment. Mr. Cakmak holds a Bachelor\'s degree from Johns Hopkins University, bringing both his academic and industry expertise to bear in cultivating a firm aligned with the future of transformative growth.',
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      name: 'Adam Simon',
      title: 'Portfolio Manager',
      imageSrc: '/team/Adam%20Simon.jpeg',
      bio: 'Adam Simon is a Portfolio Manager at Clockwise Capital, bringing over two decades of investment experience from Goldman Sachs, Brahman Capital, and Echo Street Capital, where he served as Partner and Director of Research at the $2 billion investment fund. With expertise spanning equity research, event-driven investing, and "quantamental" strategies, Adam leverages cutting-edge technology and AI-enhanced investment models to identify transformative opportunities in companies that save customers time or improve its quality, managing strategies across Clockwise\'s Adaptive Portfolios and hedge fund offerings while utilizing advanced options overlays and market cycle analysis to optimize returns and capitalize on artificial intelligence and broader technology trends.',
      social: {
        linkedin: 'https://linkedin.com'
      }
    }
  ];

  
  
  return (
    <div id="team">
      <AnimatedSection 
      className="py-24 relative overflow-hidden bg-[#0e171e]"
      animation="fade-right"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Team</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full" />
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Our expert team combines decades of experience in finance, technology, and economic cycles to guide you through today&apos;s complex investment landscape.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto">
          {/* Team members horizontal row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 justify-items-center items-start mb-12" onMouseLeave={() => setActiveIndex(null)}>
            {teamMembers.map((member, index) => {
              const isActive = activeIndex === index;
              
              return (
                <motion.div 
                  key={index}
                  className={`relative w-64 cursor-pointer transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-105'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex flex-col items-center">
                    <div className={`relative aspect-square w-40 rounded-full overflow-hidden border-4 transition-all duration-300 ${isActive ? 'border-[#1FAAA3]' : 'border-transparent hover:border-[#1FAAA3]/50'}`}>
                      <Image 
                        src={member.imageSrc} 
                        alt={member.name}
                        fill
                        sizes="160px"
                        className={`bg-white filter grayscale ${member.name === 'Kronos' ? 'object-cover object-center scale-[1.55] translate-y-10 translate-x-2' : 'object-cover object-center'}`}
                        priority
                      />
                    </div>
                    <div className="mt-4 flex flex-col items-center min-h-[72px]">
                      <h3 className="text-lg font-medium text-white text-center leading-snug whitespace-nowrap">{member.name}</h3>
                      <p className="text-[#1FAAA3] text-center text-sm leading-snug">{member.title}</p>
                    </div>
                    
                    <div className="flex space-x-3 mt-2">
                      {member.social.linkedin && (
                        <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" 
                           className="text-white/70 hover:text-[#1FAAA3] transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </a>
                      )}
                      {member.social.twitter && (
                        <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" 
                           className="text-white/70 hover:text-[#1FAAA3] transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Bio display for active member */}
          {activeIndex !== null && (
            <motion.div 
              className="bg-[#0A1F35] border border-[#1FAAA3]/20 rounded-lg p-6 shadow-lg max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-xl font-medium text-white">{teamMembers[activeIndex].name}</h3>
                  <p className="text-[#1FAAA3]">{teamMembers[activeIndex].title}</p>
                </div>
                <button 
                  onClick={() => setActiveIndex(null)}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Close bio"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-white/80 leading-relaxed">{teamMembers[activeIndex].bio}</p>
            </motion.div>
          )}
          
          {/* Join the team button */}
          <motion.div 
            className="mt-16 text-center hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <a 
              href="/careers" 
              className="inline-flex items-center gap-2 bg-[#1FAAA3] hover:bg-[#1FAAA3]/80 text-white px-6 py-3 rounded-md font-medium shadow-lg transition-all duration-300"
            >
              Join the Clockwise Team
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </motion.div>
        </div>
      </div>
      </AnimatedSection>
    </div>
  );
};


export default ClockwiseTeam;
