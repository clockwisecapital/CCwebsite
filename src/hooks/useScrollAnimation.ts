"use client";

import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationProps {
  threshold?: number; // Percentage of element that needs to be visible (0-1)
  rootMargin?: string; // Margin around the root
  triggerOnce?: boolean; // Whether to trigger the animation only once
}

/**
 * Custom hook to detect when an element enters the viewport
 * and trigger animations
 */
export const useScrollAnimation = ({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true
}: UseScrollAnimationProps = {}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update state when element enters viewport
        if (entry.isIntersecting) {
          setIsInView(true);
          
          // If triggerOnce is true, disconnect the observer after triggering
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          // If not triggerOnce, we toggle the state off when element leaves viewport
          setIsInView(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
};

export default useScrollAnimation;
