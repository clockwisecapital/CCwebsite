"use client";

import React, { ReactNode } from 'react';
import useScrollAnimation from '../../hooks/useScrollAnimation';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'zoom-in' | 'none';
  delay?: number; // delay in ms
  duration?: number; // duration in ms
  threshold?: number; // 0-1, percentage of element that needs to be visible
  rootMargin?: string; // margin around the root
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 800,
  threshold = 0.1,
  rootMargin = '0px',
}) => {
  const { ref, isInView } = useScrollAnimation({
    threshold,
    rootMargin,
    triggerOnce: true,
  });

  // Define animation classes based on the animation type
  const getAnimationClasses = () => {
    if (!isInView) {
      switch (animation) {
        case 'fade-up':
          return 'opacity-0 translate-y-10';
        case 'fade-left':
          return 'opacity-0 -translate-x-10';
        case 'fade-right':
          return 'opacity-0 translate-x-10';
        case 'zoom-in':
          return 'opacity-0 scale-95';
        case 'none':
        default:
          return '';
      }
    }
    return 'opacity-100 translate-y-0 translate-x-0 scale-100';
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`${className} ${getAnimationClasses()} transition-all ease-out will-change-transform`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </section>
  );
};

export default AnimatedSection;
