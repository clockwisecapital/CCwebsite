/**
 * Utility functions for interacting with Gleap chat widget
 */

import { GleapInstance, GleapSDK } from '@/types/gleap';

/**
 * Opens the Gleap chat widget programmatically
 * This function can be attached to any "Ask Clockwise AI" button in the application
 */
export const openGleapChat = (): void => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  console.log('Trying to open Gleap chat...');
  
  // First try GleapInstance which is our globally set variable
  if (window.GleapInstance) {
    console.log('Using GleapInstance global');
    const Gleap = window.GleapInstance as GleapSDK;
    
    try {
      // Try all possible methods to open the chat
      if (typeof Gleap.open === 'function') {
        console.log('Using GleapInstance.open()');
        Gleap.open();
        return;
      }
      
      if (typeof Gleap.openConversation === 'function') {
        console.log('Using GleapInstance.openConversation()');
        Gleap.openConversation();
        return;
      }
      
      if (typeof Gleap.startBot === 'function') {
        console.log('Using GleapInstance.startBot()');
        Gleap.startBot();
        return;
      }
      
      // Try using the widget instance directly
      if (typeof Gleap.getInstance === 'function') {
        console.log('Using GleapInstance.getInstance().openWidget()');
        const instance = Gleap.getInstance();
        if (instance) {
          if (typeof instance.openWidget === 'function') {
            instance.openWidget();
            return;
          }
          
          if (typeof instance.open === 'function') {
            instance.open();
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error using GleapInstance:', error);
    }
  }
  
  // Fallback to window.Gleap if GleapInstance didn't work
  if (window.Gleap) {
    console.log('Falling back to window.Gleap');
    const Gleap = window.Gleap as GleapSDK;
    
    try {
      // Direct method call on Gleap global
      if (typeof Gleap.open === 'function') {
        console.log('Using Gleap.open()');
        Gleap.open();
        return;
      }
      
      // Try other methods
      if (typeof Gleap.openConversation === 'function') {
        console.log('Using Gleap.openConversation()');
        Gleap.openConversation();
        return;
      }
      
      // Try using startBot
      if (typeof Gleap.startBot === 'function') {
        console.log('Using Gleap.startBot()');
        Gleap.startBot();
        return;
      }
      
      // Try using the widget instance directly
      if (typeof Gleap.getInstance === 'function') {
        console.log('Using getInstance().openWidget()');
        const instance = Gleap.getInstance();
        if (instance && typeof instance.openWidget === 'function') {
          instance.openWidget();
          return;
        }
      }
    } catch (error) {
      console.error('Error opening Gleap chat:', error);
    }
  }
  
  console.warn('Could not find a way to open Gleap chat');
  console.log('Attempting to click Gleap button directly...');
  
  // Last resort - try to find and click the Gleap button directly
  const attemptDirectButtonClick = () => {
    // Common selectors for Gleap buttons
    const selectors = [
      '.gleap-feedback-button', 
      '.gleap-button',
      '[data-gleap-button]',
      '.cl-button'
    ];
    
    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button && button instanceof HTMLElement) {
        console.log(`Found button with selector: ${selector}`);
        button.click();
        return true;
      }
    }
    
    return false;
  };
  
  // Try clicking immediately
  if (!attemptDirectButtonClick()) {
    // If not successful, try again after a short delay
    console.log('Button not found, retrying after delay...');
    setTimeout(() => {
      if (!attemptDirectButtonClick()) {
        console.error('Could not find Gleap button to click');
      }
    }, 500);
  }
};

/**
 * TypeScript declaration for Gleap in the window object
 */
declare global {
  interface Window {
    Gleap?: GleapSDK; // Using proper type instead of any
    GleapInstance?: GleapSDK; // Using proper type instead of any
  }
}
