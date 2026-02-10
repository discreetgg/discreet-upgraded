'use client';

import { NotificationManager } from '@/components/notification-manager';
import { useAlertPreferences } from '@/context/alert-preferences-context';
import { useNotification } from '@/hooks/use-notification';
import { createContext, useContext } from 'react';

interface GlobalNotificationContextType {
  addUnreadMessage: () => void;
  markAsRead: (count?: number) => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
  playNotificationSound: () => void;
}

const GlobalNotificationContext =
  createContext<GlobalNotificationContextType | null>(null);

export const GlobalNotificationProvider = ({
  children,
}: { children: React.ReactNode }) => {
  const { alertSoundsEnabled } = useAlertPreferences();
  const notification = useNotification({
    soundEnabled: alertSoundsEnabled,
    titleUpdates: true,
    faviconBadge: true,
  });

  return (
    <GlobalNotificationContext.Provider value={notification}>
      <NotificationManager
        clearNotifications={notification.clearNotifications}
        clearOnFocus
        clearOnVisibilityChange
      />
      {children}
    </GlobalNotificationContext.Provider>
  );
};

export const useGlobalNotification = () => {
  const context = useContext(GlobalNotificationContext);
  if (!context) {
    throw new Error(
      'useGlobalNotification must be used within a GlobalNotificationProvider'
    );
  }
  return context;
};
