import type { Metadata } from 'next';
import { IBM_Plex_Serif } from 'next/font/google';
import { Inter } from 'next/font/google';
import './globals.css';
import './fonts.css';

// Import components
import Footer from '../components/layout/Footer';
import Header from '../components/layout/Header';
import ScrollProgressIndicator from '../components/ui/ScrollProgressIndicator';
import GleapChatWrapper from '../components/ui/GleapChatWrapper';
import React from 'react';

// Only load IBM Plex Serif through next/font
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// Metadata for SEO
export const metadata: Metadata = {
  title: 'Clockwise Capital | Portfolios + Advisors to Navigate Turbulent Times',
  description: 'Clockwise Capital helps smart investors understand economic and technology cycles, positioning your portfolio for what\'s coming, not just what\'s happened.',
  icons: {
    icon: '/CC%20(Blue%20C).png',
    shortcut: '/CC%20(Blue%20C).png',
    apple: '/CC%20(Blue%20C).png',
  },
};

// Root layout that wraps all pages
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <head />
      <body className={`${inter.variable} ${ibmPlexSerif.variable} font-sans min-h-screen flex flex-col relative`}>
        <Header />
        <ScrollProgressIndicator 
          sections={['Home', 'ETF', 'Portfolios', 'Hedge Fund', 'Media', 'Partners', 'Team']} 
          position="right" 
          showLabels={false}
        />
        <div>
          {children}
        </div>
        <Footer />
        
        {/* Render Gleap chat component via client wrapper */}
        <GleapChatWrapper />
      </body>
    </html>
  );
}
