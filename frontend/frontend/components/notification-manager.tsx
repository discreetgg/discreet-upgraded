'use client';

import { useNotification } from '@/hooks/use-notification';
import { useEffect } from 'react';

interface NotificationManagerProps {
  clearOnFocus?: boolean;
  clearOnVisibilityChange?: boolean;
}

export const NotificationManager = ({
  clearOnFocus = true,
  clearOnVisibilityChange = true,
}: NotificationManagerProps) => {
  const { clearNotifications } = useNotification();

  useEffect(() => {
    if (clearOnFocus === false && clearOnVisibilityChange === false) return;

    const handleFocus = () => {
      if (clearOnFocus) {
        clearNotifications();
      }
    };

    const handleVisibilityChange = () => {
      if (clearOnVisibilityChange && !document.hidden) {
        clearNotifications();
      }
    };

    // Clear notifications when window gets focus
    if (clearOnFocus) {
      window.addEventListener('focus', handleFocus);
    }

    // Clear notifications when tab becomes visible
    if (clearOnVisibilityChange) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (clearOnFocus) {
        window.removeEventListener('focus', handleFocus);
      }
      if (clearOnVisibilityChange) {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      }
    };
  }, [clearNotifications, clearOnFocus, clearOnVisibilityChange]);

  return null; // This component doesn't render anything
};
