'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import the GleapChat component directly in a client component
const GleapChat = dynamic(() => import('./GleapChat'), { 
  ssr: false 
});

export default function GleapChatWrapper() {
  return (
    <div id="gleap-container" suppressHydrationWarning>
      <GleapChat />
    </div>
  );
}
