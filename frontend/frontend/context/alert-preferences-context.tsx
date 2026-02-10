'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AlertPreferencesValue = {
  liveAlertsEnabled: boolean;
  setLiveAlertsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  alertSoundsEnabled: boolean;
  setAlertSoundsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

const AlertPreferencesContext = createContext<AlertPreferencesValue | null>(null);

const storageKey = 'root:alert-preferences';

export const AlertPreferencesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [liveAlertsEnabled, setLiveAlertsEnabled] = useState(true);
  const [alertSoundsEnabled, setAlertSoundsEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        setHydrated(true);
        return;
      }

      const parsed = JSON.parse(stored) as {
        liveAlertsEnabled?: boolean;
        alertSoundsEnabled?: boolean;
      };

      if (typeof parsed.liveAlertsEnabled === 'boolean') {
        setLiveAlertsEnabled(parsed.liveAlertsEnabled);
      }

      if (typeof parsed.alertSoundsEnabled === 'boolean') {
        setAlertSoundsEnabled(parsed.alertSoundsEnabled);
      }
    } catch (error) {
      console.error('Failed to restore alert preferences:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        liveAlertsEnabled,
        alertSoundsEnabled,
      })
    );
  }, [alertSoundsEnabled, hydrated, liveAlertsEnabled]);

  const value = useMemo(
    () => ({
      liveAlertsEnabled,
      setLiveAlertsEnabled,
      alertSoundsEnabled,
      setAlertSoundsEnabled,
    }),
    [alertSoundsEnabled, liveAlertsEnabled]
  );

  return (
    <AlertPreferencesContext.Provider value={value}>
      {children}
    </AlertPreferencesContext.Provider>
  );
};

export const useAlertPreferences = () => {
  const context = useContext(AlertPreferencesContext);
  if (!context) {
    throw new Error(
      'useAlertPreferences must be used within an AlertPreferencesProvider'
    );
  }
  return context;
};

