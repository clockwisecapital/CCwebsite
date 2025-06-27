"use client";

import React, { useState } from 'react';


interface Card3DProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  number: string;
  id: string;
  onOpenModal: (id: string) => void;
}

const Card3D: React.FC<Card3DProps> = ({ 
  title, 
  description, 
  icon, 
  number,
  id,
  onOpenModal
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="block h-full perspective-1000 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenModal(id)}
    >
      <div 
        className={`
          relative h-full rounded-xl overflow-hidden backdrop-blur-md
          bg-white/10 border border-white/20
          transition-all duration-500 ease-out
          group min-h-[420px] w-full mx-auto
          ${isHovered ? 'shadow-xl shadow-[#1FAAA3]/20' : 'shadow-lg shadow-black/5'}
        `}
        style={{
          transform: isHovered 
            ? 'perspective(1000px) rotateX(0deg) scale(1.03) translateY(-10px)' 
            : 'perspective(1000px) rotateX(10deg) scale(1.0) translateY(0)',
          transformStyle: 'preserve-3d',
          transformOrigin: 'center bottom',
          transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* 3D depth effect elements */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-70"
          style={{
            transform: 'translateZ(-10px)',
            transformStyle: 'preserve-3d',
          }}
        />
        
        {/* Glow effect on hover */}
        <div 
          className={`
            absolute inset-0 bg-gradient-to-br from-[#1FAAA3]/30 via-transparent to-[#E3B23C]/20
            opacity-0 group-hover:opacity-100 transition-opacity duration-700
          `}
        />
        
        {/* Card number */}
        <div 
          className="absolute top-4 right-4 text-3xl font-bold text-white/30"
          style={{
            transform: 'translateZ(20px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {number}
        </div>
        
        {/* Card content */}
        <div 
          className="p-8 relative z-10 h-full flex flex-col"
          style={{
            transform: isHovered ? 'translateZ(30px)' : 'translateZ(0)',
            transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transformStyle: 'preserve-3d',
          }}
        >
          {icon && (
            <div 
              className="mb-6 text-[#1FAAA3] transform transition-transform duration-500"
              style={{
                transform: isHovered ? 'translateZ(40px) scale(1.1)' : 'translateZ(20px)',
                transformStyle: 'preserve-3d',
              }}
            >
              {icon}
            </div>
          )}
          
          <h3 
            className="text-xl md:text-2xl font-medium text-white mb-4 group-hover:text-[#E3B23C] transition-colors duration-300"
            style={{
              transform: isHovered ? 'translateZ(50px)' : 'translateZ(15px)',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.3s ease',
            }}
          >
            {title}
          </h3>
          
          <p 
            className="text-white/70 text-sm md:text-base font-light mb-8 flex-grow"
            style={{
              transform: isHovered ? 'translateZ(40px)' : 'translateZ(10px)',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {description}
          </p>
          
          <div 
            className="mt-auto"
            style={{
              transform: isHovered ? 'translateZ(60px)' : 'translateZ(20px)',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <span 
              className={`
                inline-flex items-center text-sm font-medium text-[#1FAAA3] group-hover:text-[#E3B23C]
                transition-all duration-300
              `}
            >
              Learn more
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 ml-1 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </div>
          
          {/* Shine effect on hover */}
          <div 
            className={`
              absolute -inset-x-20 -inset-y-20 w-[200%] h-[200%] 
              bg-gradient-to-r from-transparent via-white/10 to-transparent
              opacity-0 group-hover:opacity-100
              transition-opacity duration-1000 ease-out
              pointer-events-none
              rotate-12
              ${isHovered ? 'translate-x-full' : '-translate-x-full'}
            `}
            style={{
              transitionDuration: '1.5s',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Card3D;
