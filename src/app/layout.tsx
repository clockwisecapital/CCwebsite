import type { Metadata } from 'next';
import { IBM_Plex_Serif } from 'next/font/google';
import './globals.css';
import './fonts.css';

// Import components
import Footer from '../components/layout/Footer';

// Only load IBM Plex Serif through next/font
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

// We'll load Inter directly via Google Fonts link in the head

// Metadata for SEO
export const metadata: Metadata = {
  title: 'Clockwise Capital | Where Smart Investors Learn, Grow, Plan',
  description: 'Clockwise Capital helps smart investors understand economic and technology cycles, positioning your portfolio for what\'s coming, not just what\'s happened.',
};

// Root layout that wraps all pages
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${ibmPlexSerif.variable} font-sans min-h-screen flex flex-col`}>
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
