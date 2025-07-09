'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GleapSDK } from '@/types/gleap';

// Create a variable to track if Gleap is initialized
let isGleapInitialized = false;

// Use undefined instead of null to match Window interface declaration
let Gleap: GleapSDK | undefined = undefined;

// For development testing, we're using a Gleap API key with AI chat enabled
// IMPORTANT: Replace this with your actual API key in .env.local
const TEMP_API_KEY = 'ogNWGglQvy3w1Vl7gQCGLYvBl5plfc2d'; // Demo key with AI capabilities

// This component should only be used in client components or with the "use client" directive
export default function GleapChat() {
  const pathname = usePathname();
  const [initAttempts, setInitAttempts] = useState(0);

  useEffect(() => {
    // Dynamically import Gleap to avoid require() style imports
    const loadGleap = async () => {
      try {
        // Dynamic import instead of require()
        const gleapModule = await import('gleap');
        // Type assertion to safely assign to our GleapSDK interface
        // This ensures TypeScript understands that the imported module conforms to our interface
        const importedGleap = (gleapModule.default || gleapModule) as unknown as GleapSDK;
        
        // Make Gleap globally available
        window.GleapInstance = importedGleap;
        window.Gleap = importedGleap;
        
        return importedGleap;
      } catch (error) {
        console.error('Error importing Gleap:', error);
        return undefined;
      }
    };
    
    // Define the function to initialize Gleap
    const initializeGleap = async () => {
      if (typeof window === 'undefined') return;

      // Skip if already initialized
      if (isGleapInitialized) {
        console.log('Gleap already initialized, skipping.');
        return;
      }

      // Load Gleap if not available
      if (!Gleap) {
        console.log('Gleap not loaded, attempting to load...');
        const loadedGleap = await loadGleap();
        if (loadedGleap) {
          Gleap = loadedGleap;
        }
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
          if (window.Gleap) {
            console.log('Found Gleap on window object');
            Gleap = window.Gleap;
          } else if (window.GleapInstance) {
            console.log('Found Gleap as GleapInstance');
            Gleap = window.GleapInstance;
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
          if (Gleap) {
            window.Gleap = Gleap;
            window.GleapInstance = Gleap;
          }
          
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
