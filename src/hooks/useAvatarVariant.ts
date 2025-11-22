/**
 * Avatar variant type - now fixed to 'variant-b' only
 * Legacy type kept for backwards compatibility during transition
 */
export type AvatarVariant = 'variant-b';

/**
 * Custom hook for avatar variant
 * Now always returns 'variant-b' as the single variant
 * Legacy A/B testing logic has been removed
 */
export function useAvatarVariant(): AvatarVariant {
  return 'variant-b';
}

/**
 * Helper function to get video path
 * Returns the video path as-is (variant-b videos are now the standard)
 * @param baseVideoPath - The video path (e.g., '/kronos-intro-no-watermark.mp4')
 * @returns The video path
 */
export function getVideoPath(baseVideoPath: string): string {
  // Simply return the path as-is since variant-b videos are now the standard
  return baseVideoPath;
}
