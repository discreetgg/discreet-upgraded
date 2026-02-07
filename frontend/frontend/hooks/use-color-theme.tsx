import { ThemeColorContext } from '@/context/theme-color-provider';
import { useContext } from 'react';

export function useThemeColor() {
  return useContext(ThemeColorContext);
}
