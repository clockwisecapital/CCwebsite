'use client';

import { useKronosNotification } from '@/hooks/useKronosNotification';
import KronosNotificationToast from './KronosNotificationToast';

export default function GlobalNotifications() {
  const { shouldShowNotification, notificationData, dismissNotification } = useKronosNotification();

  if (!shouldShowNotification || !notificationData) {
    return null;
  }

  return (
    <KronosNotificationToast
      firstName={notificationData.firstName}
      onDismiss={dismissNotification}
    />
  );
}
