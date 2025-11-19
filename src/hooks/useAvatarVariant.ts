import { useState, useEffect } from 'react';

export type AvatarVariant = 'control' | 'variant-b';

const STORAGE_KEY = 'avatarVariant';

/**
 * Custom hook for A/B testing HeyGen avatar variants
 * Assigns users to either 'control' or 'variant-b' with 50/50 split
 * Persists assignment in localStorage for consistency
 * 
 * Handles SSR hydration by starting with 'control' on server,
 * then updating to stored/random variant on client after mount
 */
export function useAvatarVariant(): AvatarVariant {
  // Start with 'control' for SSR consistency
  const [variant, setVariant] = useState<AvatarVariant>('control');

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if variant already exists in localStorage
    const existingVariant = localStorage.getItem(STORAGE_KEY) as AvatarVariant | null;

    if (existingVariant && (existingVariant === 'control' || existingVariant === 'variant-b')) {
      // Use existing variant
      setVariant(existingVariant);
      console.log('🎯 Existing avatar variant loaded:', existingVariant);
    } else {
      // Randomly assign new variant (50/50 split)
      const randomVariant: AvatarVariant = Math.random() < 0.5 ? 'control' : 'variant-b';
      setVariant(randomVariant);
      localStorage.setItem(STORAGE_KEY, randomVariant);
      console.log('🎲 New avatar variant assigned:', randomVariant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return variant;
}

/**
 * Helper function to get video path based on variant
 * @param baseVideoPath - The base video path without variant suffix (e.g., '/kronos-intro-no-watermark.mp4')
 * @param variant - The avatar variant ('control' or 'variant-b')
 * @returns The appropriate video path for the variant
 */
export function getVideoPath(baseVideoPath: string, variant: AvatarVariant): string {
  if (variant === 'control') {
    return baseVideoPath;
  }
  
  // For variant-b, insert '-variant-b' before the file extension
  const extensionIndex = baseVideoPath.lastIndexOf('.mp4');
  if (extensionIndex === -1) return baseVideoPath;
  
  return `${baseVideoPath.slice(0, extensionIndex)}-variant-b${baseVideoPath.slice(extensionIndex)}`;
}
