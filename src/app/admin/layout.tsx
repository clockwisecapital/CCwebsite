import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clockwise Admin Dashboard',
  description: 'Admin dashboard for Clockwise Capital',
};

/**
 * Admin Layout
 * 
 * This layout provides a clean wrapper for admin pages,
 * hiding the main website's Header, Footer and scroll indicator.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the main website navigation for admin pages */}
      <style>{`
        header, footer, [class*="ScrollProgressIndicator"] {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
