import React from 'react';
import Image from "next/image";

const ClockwiseTeam = () => {
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
    <section className="py-20 px-4 bg-gradient-to-br from-[#F5F7FA] to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-sans font-semibold text-[#1A3A5F] mb-6">Clockwise Team</h2>
          <p className="text-lg md:text-xl font-serif leading-relaxed max-w-4xl mx-auto text-gray-700">
            Our mission is to help clients safely navigate the pace of innovation propelled forward by an unprecedented technology cycle.
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-[#1A3A5F] to-[#1FAAA3] mx-auto rounded-full mt-6"></div>
        </div>
        
        <div className="space-y-16 mt-12">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <div className="aspect-square rounded-xl overflow-hidden relative">
                    <Image 
                      src={member.imageSrc}
                      alt={`Photo of ${member.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-sans font-semibold text-[#1A3A5F] mb-2">{member.name}</h3>
                  <p className="text-lg text-[#1FAAA3] font-medium mb-4">{member.title}</p>
                  <p className="text-gray-600 font-serif leading-relaxed">{member.bio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClockwiseTeam;
