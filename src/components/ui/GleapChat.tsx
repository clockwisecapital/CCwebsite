'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Create a variable to track if Gleap is initialized
let isGleapInitialized = false;

// Import Gleap only on client-side
let Gleap: any;

// For development testing, we're using a Gleap API key with AI chat enabled
// IMPORTANT: Replace this with your actual API key in .env.local
const TEMP_API_KEY = 'ogNWGglQvy3w1Vl7gQCGLYvBl5plfc2d'; // Demo key with AI capabilities

// This function runs only on the client side
if (typeof window !== 'undefined') {
  try {
    // Import the correct Gleap web package
    Gleap = require('gleap');
    
    // Make Gleap globally available for our utility functions
    (window as any).GleapInstance = Gleap;
    (window as any).Gleap = Gleap;
  } catch (error) {
    console.error('Error importing Gleap:', error);
  }
}

// Extend Window interface
declare global {
  interface Window {
    GleapInstance?: any;
    Gleap?: any;
  }
}

// This component should only be used in client components or with the "use client" directive
export default function GleapChat() {
  const pathname = usePathname();
  const [initAttempts, setInitAttempts] = useState(0);

  useEffect(() => {
    // Define the function to initialize Gleap
    const initializeGleap = async () => {
      if (typeof window === 'undefined') return;

      // Skip if already initialized
      if (isGleapInitialized) {
        console.log('Gleap already initialized, skipping.');
        return;
      }

      // Make sure Gleap is available
      if (!Gleap) {
        console.error('Gleap not available for initialization');
        
        // Retry initialization if Gleap is not available yet
        if (initAttempts < 3) {
          const nextAttempt = initAttempts + 1;
          console.log(`Retrying Gleap initialization (attempt ${nextAttempt}/3)...`);
          setInitAttempts(nextAttempt);
          
          // Try to find Gleap on window
          if ((window as any).Gleap) {
            console.log('Found Gleap on window object');
            Gleap = (window as any).Gleap;
          } else if ((window as any).GleapInstance) {
            console.log('Found Gleap as GleapInstance');
            Gleap = (window as any).GleapInstance;
          }
        }
        return;
      }

      try {
        // Get API key from environment variables or use temporary key for testing
        const apiKey = process.env.NEXT_PUBLIC_GLEAP_API_KEY || TEMP_API_KEY;
        
        console.log('Initializing Gleap with API key...');
        
        // Initialize Gleap with the API key
        await Gleap.initialize(apiKey);
        
        // Configure Gleap after initialization
        try {
          console.log('Configuring Gleap widget...');
          
          // Enable AI chatbot mode
          if (typeof Gleap.enableAIToolMode === 'function') {
            Gleap.enableAIToolMode(true);
            console.log('AI chat mode enabled');
          }
          
          // Set widget properties
          if (typeof Gleap.setWidgetMode === 'function') {
            Gleap.setWidgetMode('chat');
          }
          
          // Set bot name
          if (typeof Gleap.setBotName === 'function') {
            Gleap.setBotName('Clockwise AI');
          }
          
          // Set primary color
          if (Gleap.getInstance && typeof Gleap.getInstance === 'function') {
            const instance = Gleap.getInstance();
            if (instance && instance.setAppTheme) {
              instance.setAppTheme({"primaryColor":"#1A3A5F"});
            }
          }
          
          // Make sure widget button is visible
          if (typeof Gleap.showFeedbackButton === 'function') {
            Gleap.showFeedbackButton(true);
            console.log('Showing Gleap feedback button');
          }
          
          // Make Gleap globally accessible for button clicks
          (window as any).Gleap = Gleap;
          (window as any).GleapInstance = Gleap;
          
          // Mark as initialized
          isGleapInitialized = true;
          console.log('✓ Gleap successfully initialized!');
        } catch (configError) {
          console.error('Gleap configuration error:', configError);
        }
      } catch (error) {
        console.error('Failed to initialize Gleap:', error);
        
        // Retry initialization if failed (up to 3 attempts)
        if (initAttempts < 3) {
          const nextAttempt = initAttempts + 1;
          console.log(`Retrying Gleap initialization (attempt ${nextAttempt}/3)...`);
          setInitAttempts(nextAttempt);
        }
      }
    };

    // Wait a short delay before initialization to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeGleap();
    }, 1000);

    // Clean up timer if component unmounts
    return () => clearTimeout(timer);
  }, [pathname, initAttempts]); // Re-run effect when pathname changes or retry attempts increase

  // This component doesn't render anything visible
  return null;
}
