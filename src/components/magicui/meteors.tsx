"use client";
 
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
 
interface MeteorsProps {
  number?: number;
  minDelay?: number;
  maxDelay?: number;
  minDuration?: number;
  maxDuration?: number;
  angle?: number;
  className?: string;
}

type MeteorStyle = {
  id: number;
  top: string;
  left: string;
  angle: string;
  delay: string;
  duration: string;
};
 
export const Meteors = ({
  number = 20,
  minDelay = 0.2,
  maxDelay = 1.2,
  minDuration = 2,
  maxDuration = 10,
  angle = 215,
  className,
}: MeteorsProps) => {
  const [meteors, setMeteors] = useState<MeteorStyle[]>([]);
 
  useEffect(() => {
    // Reset and regenerate meteors when window is resized
    const handleResize = () => {
      generateMeteors();
    };

    // Generate initial meteors
    generateMeteors();
    
    // Add resize listener
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
    
    // Function to generate meteor styles
    function generateMeteors() {
      const meteorStyles: MeteorStyle[] = [];
      for (let i = 0; i < number; i++) {
        meteorStyles.push({
          id: i,
          top: "-5%",
          left: `${Math.random() * 100}%`,
          angle: `${-angle}deg`,
          delay: `${Math.random() * (maxDelay - minDelay) + minDelay}s`,
          duration: `${Math.floor(Math.random() * (maxDuration - minDuration) + minDuration)}s`,
        });
      }
      setMeteors(meteorStyles);
    }
  }, [number, minDelay, maxDelay, minDuration, maxDuration, angle]);
 
  return (
    <div className="absolute inset-0 overflow-hidden">
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className={cn(
            "pointer-events-none absolute", 
            className
          )}
          style={{
            top: meteor.top,
            left: meteor.left,
            transform: `rotate(${meteor.angle})`,
            animationDelay: meteor.delay,
            animationDuration: meteor.duration,
          }}
        >
          {/* Meteor Head */}
          <div className="animate-meteor">
            <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)]" />
            {/* Meteor Tail */}
            <div className="absolute top-1/2 -z-10 h-[2px] w-[150px] -translate-y-1/2 bg-gradient-to-r from-white to-transparent" />
          </div>
        </div>
      ))}
    </div>
  );
};
