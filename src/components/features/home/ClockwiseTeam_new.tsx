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
    linkedin: string;
    twitter: string;
  };
}

const ClockwiseTeam = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const teamMembers: TeamMember[] = [
    {
      name: 'John Smith, CFA',
      title: 'Chief Investment Officer',
      imageSrc: '/images/team/team-member-1.jpg',
      bio: 'John has over 20 years of experience in investment management, focusing on economic cycles and their impact on market performance. Prior to Clockwise Capital, he was a Senior Portfolio Manager at BlackRock.',
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      name: 'Sarah Johnson, MBA',
      title: 'Director of Research',
      imageSrc: '/images/team/team-member-2.jpg',
      bio: 'Sarah leads our research team with expertise in technology sector analysis and emerging market trends. She previously worked at Goldman Sachs and holds an MBA from Wharton.',
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      name: 'Michael Chen, PhD',
      title: 'Quantitative Strategist',
      imageSrc: '/images/team/team-member-3.jpg',
      bio: 'Michael develops our proprietary quantitative models that drive portfolio construction and risk management. He holds a PhD in Financial Engineering from MIT.',
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      name: 'Emily Rodriguez',
      title: 'Client Relations Director',
      imageSrc: '/images/team/team-member-4.jpg',
      bio: 'Emily ensures our clients receive personalized service and clear communication about their investment strategies. She has 15 years of experience in wealth management.',
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      name: 'David Park',
      title: 'ESG Investment Specialist',
      imageSrc: '/images/team/team-member-5.jpg',
      bio: 'David focuses on integrating environmental, social, and governance factors into our investment process. He previously worked at Sustainable Capital and holds certifications in ESG investing.',
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    }
  ];

  const handleMemberClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <AnimatedSection
      className="py-16 md:py-24 bg-gradient-to-br from-[#0A1F35] to-[#0A1F35]/90 relative overflow-hidden"
      animation="fade-right"
    >
      {/* Abstract shapes in background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#1FAAA3]/30 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#E3B23C]/20 blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Meet Our Team</h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Our experienced professionals bring diverse expertise to help you navigate the complex investment landscape.
          </p>
        </div>
        
        {/* Team Member Layout */}
        <div className="w-full max-w-6xl mx-auto my-12">
          {/* Team members row */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            {teamMembers.map((member, index) => {
              const isActive = index === activeIndex;
              
              return (
                <motion.div 
                  key={member.name}
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => handleMemberClick(index)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex flex-col items-center">
                    {/* Member photo */}
                    <div className={`relative w-40 h-40 overflow-hidden rounded-full transition-all duration-300 ${isActive ? 'ring-4 ring-[#1FAAA3]' : 'hover:ring-2 hover:ring-[#1FAAA3]/50'}`}>
                      <Image 
                        src={member.imageSrc} 
                        alt={member.name}
                        width={160}
                        height={160}
                        className="object-cover w-full h-full"
                        priority
                      />
                    </div>
                    
                    {/* Member name and title */}
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium text-white">{member.name.split(',')[0]}</h3>
                      <p className="text-sm text-[#1FAAA3]">{member.title}</p>
                    </div>
                    
                    {/* Social links */}
                    <div className="mt-2 flex gap-3">
                      <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" 
                         className="text-white/70 hover:text-[#1FAAA3] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      </a>
                      <a href={member.social.twitter} target="_blank" rel="noopener noreferrer" 
                         className="text-white/70 hover:text-[#1FAAA3] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                      </a>
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
            className="mt-16 text-center"
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
  );
};

export default ClockwiseTeam;
