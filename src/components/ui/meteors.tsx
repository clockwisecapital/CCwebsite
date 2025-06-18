"use client";

import React from "react";
import { cn } from "@/lib/utils";

type MeteorProps = {
  className?: string;
  count?: number;
};

export const Meteors = ({ className, count = 30 }: MeteorProps) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, i) => {
        // Generate random values for each meteor
        const top = `${Math.random() * -10}%`; // Start slightly above the viewport
        const left = `${Math.random() * 100}%`;
        const animationDuration = `${Math.floor(Math.random() * 6) + 2}s`;
        const animationDelay = `${Math.random() * 6}s`;
        const size = Math.random() < 0.7 ? "meteor-small" : "meteor-large";
        
        return (
          <div
            key={i}
            style={{
              top,
              left,
              animationDuration,
              animationDelay
            }}
            className={`absolute h-px w-px ${size}`}
          />
        );
      })}
    </div>
  );
};
