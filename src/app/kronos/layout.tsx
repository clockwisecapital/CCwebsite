import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kronos - AI Portfolio Analysis | Clockwise Capital',
  description: 'Get personalized portfolio analysis powered by Kronos AI',
};

/**
 * Kronos Layout
 * 
 * Adjusts header visibility for Kronos workflow:
 * - Desktop: Header always visible with auth status
 * - Mobile: Header hidden, video player takes top position
 */
export default function KronosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide scroll indicator on all devices for Kronos, keep header visible on desktop */}
      <style>{`
        /* Hide scroll progress indicator on Kronos pages */
        [class*="ScrollProgressIndicator"] {
          display: none !important;
        }
        
        /* On mobile, hide header to let video player take top position */
        @media (max-width: 768px) {
          header {
            display: none !important;
          }
        }
        
        /* On desktop, ensure header is visible but doesn't interfere with video player */
        @media (min-width: 769px) {
          header {
            z-index: 40;
          }
        }
      `}</style>
      {children}
    </>
  );
}
