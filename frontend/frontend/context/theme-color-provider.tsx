'use client';

import { setGlobalColorTheme } from '@/lib/utils';
import type {
  ThemeColorStateParams,
  ThemeColors,
} from '@/types/theme-color-types';
import {
  type ThemeProvider as NextThemesProvider,
  useTheme,
} from 'next-themes';
import * as React from 'react';

export const ThemeColorContext = React.createContext<ThemeColorStateParams>(
  {} as ThemeColorStateParams
);

export function ThemeColorProvider({
  children,
}: React.ComponentProps<typeof NextThemesProvider>) {
  const getSavedThemeColor = () => {
    try {
      return (localStorage.getItem('themeColor') as ThemeColors) || 'Zinc';
    } catch {
      'Zinc' as ThemeColors;
    }
  };

  const [themeColor, setThemeColor] = React.useState<ThemeColors>(
    getSavedThemeColor() as ThemeColors
  );
  const [isMounted, setIsMounted] = React.useState(false);
  const { theme } = useTheme();

  React.useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
    setGlobalColorTheme(theme as 'light' | 'dark', themeColor);

    if (!isMounted) {
      setIsMounted(true);
    }
  }, [themeColor, theme, isMounted]);

  if (!isMounted) {
    return null;
  }
  return (
    <ThemeColorContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeColorContext.Provider>
  );
}
