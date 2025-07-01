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
      name: 'Eli Mikel, CFP®, CRPC®',
      title: 'Clockwise Partner',
      imageSrc: '/team/Eli-clockwise.png',
      bio: 'Mr. Mikel is a seasoned financial professional with a deep passion for empowering clients to navigate the rapid pace of technological change. Armed with a Bachelor of Science in Finance from Virginia Commonwealth University and post-graduate education from Georgetown University, Mr. Mikel combines a strong academic foundation with over two decades of experience in finance and marketing. As a driving force behind the company\'s brand awareness, education, and growth initiatives, he leverages creative technology solutions to expand the firm\'s reach and impact, ensuring clients have access to innovative tools and insights. Mr. Mikel is dedicated to fostering a culture of transparency and financial literacy, equipping investors with the knowledge and resources they need to make informed decisions in an ever-evolving investment landscape. His commitment to client empowerment and education enables investors to thrive in a future shaped by technological advancement.',
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      name: 'James Cakmak, CFA',
      title: 'Clockwise Partner',
      imageSrc: '/team/James-clockwise.png',
      bio: 'Mr. Cakmak is a thought leader in the capital markets and more broadly within technology and innovation. At Clockwise Capital he is responsible for advancing the company\'s mission to harness transformative technologies and novel ideas. With two decades of experience in finance and a keen insight into emerging trends, Mr. Cakmak directs the fund\'s strategic approach, identifying high-potential investment opportunities and adeptly navigating complex market dynamics. His role encompasses rigorous research, analysis, and portfolio management, ensuring Clockwise remains agile and responsive to shifting market conditions. Leveraging Clockwise\'s AI-enhanced investment model, Mr. Cakmak actively engineers this tool to enhance the firm\'s ability to swiftly adapt to changes in technology and economic cycles, positioning it at the forefront of innovation-driven investment. Mr. Cakmak holds a Bachelor\'s degree from Johns Hopkins University, bringing both his academic and industry expertise to bear in cultivating a firm aligned with the future of transformative growth.',
      social: {
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com'
      }
    },
    {
      name: 'Dr. Harry Mamaysky',
      title: 'Clockwise Quantstreet Partner',
      imageSrc: '/team/Dr Harry-clockwise.png',
      bio: 'Dr. Mamaysky is a partner at QuantStreet Capital, which offers its clients model and market analytics, wealth management, and investing services through separately managed accounts and works closely in partnership with Clockwise Capital. Harry is also a professor at Columbia Business School, where he is the director of the Program for Financial Studies. Harry\'s research focuses on the application of quantitative techniques to investing and wealth management. Harry is a frequent industry and academic speaker. Prior to Columbia, Harry spent years in finance practice, rising to senior portfolio manager at Citigroup, and later serving on the firm\'s Risk Executive Committee. Harry was a professor at the Yale School of Management, which he joined after earning his PhD in Finance from the Massachusetts Institute of Technology. He holds BS and MS degrees in Computer Science and a BA in Economics from Brown University.',
      social: {
        linkedin: 'https://linkedin.com'
      }
    },
    {
      name: 'Isaac Mamaysky, Esq.',
      title: 'Clockwise Quantstreet Partner',
      imageSrc: '/team/Isaac-clockwise.png',
      bio: 'Mr. Mamaysky is a partner at QuantStreet Capital, where he oversees operations, compliance, and legal matters and works closely in partnership with Clockwise Capital. QuantStreet offers clients model and market analytics, wealth management, and investment services through separately managed accounts. In addition to his role at QuantStreet, Isaac is a partner at Potomac Law Group PLLC, where he founded the Investment Advisers, Asset Managers, and Private Funds practice. He is also an adjunct professor at the Elisabeth Haub School of Law at Pace University. Isaac has taught courses in Corporations and Partnerships, Ethics and Compliance, and Employment Law. He has also published numerous articles in these fields in academic journals and industry publications. Beyond his practice, Isaac and his wife, Lisa, have spent over a decade leading a large 501(c)(3) nonprofit focused on children\'s health, which they co-founded in 2012. Isaac is a cum laude graduate of the Boston University School of Law and a summa cum laude graduate of the University of Rhode Island.',
      social: {
        linkedin: 'https://linkedin.com'
      }
    }
  ];

  
  
  return (
    <AnimatedSection 
      className="py-24 relative overflow-hidden bg-gradient-to-br from-[#0A1F35] to-[#0A1F35]/90"
      animation="fade-right"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Meet Our Team</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full" />
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Our expert team combines decades of experience in finance, technology, and economic cycles to guide you through today&apos;s complex investment landscape.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto">
          {/* Team members horizontal row */}
          <div className="flex flex-wrap justify-center gap-8 mb-12" onMouseLeave={() => setActiveIndex(null)}>
            {teamMembers.map((member, index) => {
              const isActive = activeIndex === index;
              
              return (
                <motion.div 
                  key={index}
                  className={`relative cursor-pointer transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-105'}`}
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
                        className="object-cover object-center bg-white"
                        priority
                      />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-white">{member.name}</h3>
                    <p className="text-[#1FAAA3]">{member.title}</p>
                    
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
