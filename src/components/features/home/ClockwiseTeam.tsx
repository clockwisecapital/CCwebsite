"use client";

import React, { useState } from 'react';
import Image from "next/image";
import AnimatedSection from "../../ui/AnimatedSection";

const ClockwiseTeam = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const teamMembers = [
    {
      name: "Eli Mikel, CFP®, CRPC®",
      title: "Clockwise Partner",
      imageSrc: "/team/Eli-clockwise.png",
      bio: "Mr. Mikel is a seasoned financial professional with a deep passion for empowering clients to navigate the rapid pace of technological change. Armed with a Bachelor of Science in Finance from Virginia Commonwealth University and post-graduate education from Georgetown University, Mr. Mikel combines a strong academic foundation with over two decades of experience in finance and marketing. As a driving force behind the company's brand awareness, education, and growth initiatives, he leverages creative technology solutions to expand the firm's reach and impact, ensuring clients have access to innovative tools and insights. Mr. Mikel is dedicated to fostering a culture of transparency and financial literacy, equipping investors with the knowledge and resources they need to make informed decisions in an ever-evolving investment landscape. His commitment to client empowerment and education enables investors to thrive in a future shaped by technological advancement."
    },
    {
      name: "James Cakmak, CFA",
      title: "Clockwise Partner",
      imageSrc: "/team/James-clockwise.png",
      bio: "Mr. Cakmak is a thought leader in the capital markets and more broadly within technology and innovation. At Clockwise Capital he is responsible for advancing the company's mission to harness transformative technologies and novel ideas. With two decades of experience in finance and a keen insight into emerging trends, Mr. Cakmak directs the fund's strategic approach, identifying high-potential investment opportunities and adeptly navigating complex market dynamics. His role encompasses rigorous research, analysis, and portfolio management, ensuring Clockwise remains agile and responsive to shifting market conditions. Leveraging Clockwise's AI-enhanced investment model, Mr. Cakmak actively engineers this tool to enhance the firm's ability to swiftly adapt to changes in technology and economic cycles, positioning it at the forefront of innovation-driven investment. Mr. Cakmak holds a Bachelor's degree from Johns Hopkins University, bringing both his academic and industry expertise to bear in cultivating a firm aligned with the future of transformative growth."
    },
    {
      name: "Dr. Harry Mamaysky",
      title: "Clockwise Quantstreet Partner",
      imageSrc: "/team/Dr Harry-clockwise.png",
      bio: "Dr. Mamaysky is a partner at QuantStreet Capital, which offers its clients model and market analytics, wealth management, and investing services through separately managed accounts and works closely in partnership with Clockwise Capital. Harry is also a professor at Columbia Business School, where he is the director of the Program for Financial Studies. Harry's research focuses on the application of quantitative techniques to investing and wealth management. Harry is a frequent industry and academic speaker. Prior to Columbia, Harry spent years in finance practice, rising to senior portfolio manager at Citigroup, and later serving on the firm's Risk Executive Committee. Harry was a professor at the Yale School of Management, which he joined after earning his PhD in Finance from the Massachusetts Institute of Technology. He holds BS and MS degrees in Computer Science and a BA in Economics from Brown University."
    },
    {
      name: "Isaac Mamaysky, Esq.",
      title: "Clockwise Quantstreet Partner",
      imageSrc: "/team/Isaac-clockwise.png",
      bio: "Mr. Mamaysky is a partner at QuantStreet Capital, where he oversees operations, compliance, and legal matters and works closely in partnership with Clockwise Capital. QuantStreet offers clients model and market analytics, wealth management, and investment services through separately managed accounts. In addition to his role at QuantStreet, Isaac is a partner at Potomac Law Group PLLC, where he founded the Investment Advisers, Asset Managers, and Private Funds practice. He is also an adjunct professor at the Elisabeth Haub School of Law at Pace University. Isaac has taught courses in Corporations and Partnerships, Ethics and Compliance, and Employment Law. He has also published numerous articles in these fields in academic journals and industry publications. Beyond his practice, Isaac and his wife, Lisa, have spent over a decade leading a large 501(c)(3) nonprofit focused on children's health, which they co-founded in 2012. Isaac is a cum laude graduate of the Boston University School of Law and a summa cum laudegraduate of the University of Rhode Island."
    }
  ];

  return (
    <AnimatedSection animation="fade-right" className="py-16 px-4 relative bg-gradient-to-br from-black via-[#0A1A35] to-[#1A3A5F] overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#1FAAA3]/5 blur-3xl -z-0"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 blur-2xl -z-0"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-sans font-semibold text-white mb-4">Clockwise Team</h2>
          <p className="text-base md:text-lg font-serif leading-relaxed max-w-3xl mx-auto text-gray-200">
            Our mission is to help clients safely navigate the pace of innovation propelled forward by an unprecedented technology cycle.
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-white to-[#1FAAA3] mx-auto rounded-full mt-4"></div>
        </div>
        
        {/* Staggered grid layout with precise alignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {teamMembers.map((member, index) => {
            // Alternate layout for visual interest
            const isEven = index % 2 === 0;
            
            return (
              <div 
                key={index} 
                className={`group ${isEven ? 'md:translate-y-12' : ''} transition-all duration-500`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-500 border border-white/20 overflow-hidden group-hover:border-[#1FAAA3]/50 h-full">
                  <div className="flex flex-col h-full">
                    {/* Image container with hover effect */}
                    <div className="relative h-56 overflow-hidden">
                      <Image 
                        src={member.imageSrc}
                        alt={`Photo of ${member.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                      
                      {/* Name and title overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-base font-sans font-semibold text-white mb-0.5 group-hover:text-[#1FAAA3] transition-colors duration-300">
                          {member.name}
                        </h3>
                        <p className="text-xs text-[#1FAAA3] font-medium">{member.title}</p>
                      </div>
                    </div>
                    
                    {/* Bio with expanding effect - only shows on hover of this specific card */}
                    <div className="p-4 bg-gradient-to-b from-black/40 to-transparent">
                      <p className={`text-gray-200 font-serif leading-relaxed text-sm transition-all duration-500 ${activeIndex === index ? 'line-clamp-none' : 'line-clamp-2'}`}>
                        {member.bio}
                      </p>
                      <div className="h-6 flex items-center justify-center mt-2">
                        <span className="text-[#1FAAA3] text-sm">
                          {activeIndex === index ? "Read less" : "Read more"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
};

export default ClockwiseTeam;
