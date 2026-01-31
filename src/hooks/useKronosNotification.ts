'use client';

import { useState, useEffect } from 'react';

const NOTIFICATION_KEY = 'kronos_intelligence_notification';
const VIEWED_KEY = 'kronos_intelligence_viewed';

export interface KronosNotificationData {
  videoId: string;
  firstName?: string;
  timestamp: number;
}

export function useKronosNotification() {
  const [shouldShowNotification, setShouldShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<KronosNotificationData | null>(null);
  const [hasUnviewedIntelligence, setHasUnviewedIntelligence] = useState(false);

  // Check for pending notifications on mount
  useEffect(() => {
    const checkNotification = () => {
      const storedNotification = localStorage.getItem(NOTIFICATION_KEY);
      const hasViewed = localStorage.getItem(VIEWED_KEY);

      if (storedNotification && !hasViewed) {
        try {
          const data = JSON.parse(storedNotification);
          setNotificationData(data);
          setShouldShowNotification(true);
          setHasUnviewedIntelligence(true);
        } catch (error) {
          console.error('Error parsing notification data:', error);
          localStorage.removeItem(NOTIFICATION_KEY);
        }
      }
    };

    checkNotification();

    // Listen for storage events from other tabs
    window.addEventListener('storage', checkNotification);
    return () => window.removeEventListener('storage', checkNotification);
  }, []);

  // Trigger notification when video is complete
  const triggerNotification = (videoId: string, firstName?: string) => {
    const data: KronosNotificationData = {
      videoId,
      firstName,
      timestamp: Date.now(),
    };

    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(data));
    localStorage.removeItem(VIEWED_KEY); // Reset viewed status
    
    setNotificationData(data);
    setShouldShowNotification(true);
    setHasUnviewedIntelligence(true);
  };

  // Dismiss the notification (but keep badge until viewed)
  const dismissNotification = () => {
    setShouldShowNotification(false);
  };

  // Mark intelligence as viewed (removes badge)
  const markAsViewed = () => {
    localStorage.setItem(VIEWED_KEY, 'true');
    localStorage.removeItem(NOTIFICATION_KEY);
    setShouldShowNotification(false);
    setHasUnviewedIntelligence(false);
  };

  // Check if badge should be shown
  const shouldShowBadge = () => {
    const storedNotification = localStorage.getItem(NOTIFICATION_KEY);
    const hasViewed = localStorage.getItem(VIEWED_KEY);
    return !!(storedNotification && !hasViewed);
  };

  // Clear all notification data (for sign out)
  const clearAllNotificationData = () => {
    localStorage.removeItem(NOTIFICATION_KEY);
    localStorage.removeItem(VIEWED_KEY);
    setShouldShowNotification(false);
    setHasUnviewedIntelligence(false);
    setNotificationData(null);
  };

  return {
    shouldShowNotification,
    notificationData,
    hasUnviewedIntelligence,
    triggerNotification,
    dismissNotification,
    markAsViewed,
    shouldShowBadge,
    clearAllNotificationData,
  };
}
