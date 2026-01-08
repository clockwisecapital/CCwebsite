import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kronos - AI Portfolio Analysis | Clockwise Capital',
  description: 'Get personalized portfolio analysis powered by Kronos AI',
};

/**
 * Kronos Layout
 * 
 * This layout hides the main website's Header on mobile devices
 * to allow the video player to take the top position.
 */
export default function KronosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the main website navigation and scroll indicator on mobile for Kronos workflow */}
      <style>{`
        @media (max-width: 768px) {
          header, [class*="ScrollProgressIndicator"] {
            display: none !important;
          }
        }
      `}</style>
      {children}
    </>
  );
}
