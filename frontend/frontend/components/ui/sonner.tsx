'use client';

import { toastPresets } from '@/lib/toast-presets';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { Icon } from './icons';

const MOBILE_SWIPE_DIRECTIONS: NonNullable<ToasterProps['swipeDirections']> = [
  'top',
  'left',
  'right',
];

const Toaster = ({ swipeDirections, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      swipeDirections={
        swipeDirections ?? (isMobile ? MOBILE_SWIPE_DIRECTIONS : undefined)
      }
      visibleToasts={2}
      expand={false}
      toastOptions={{
        className: toastPresets.neutral.className,
        descriptionClassName: toastPresets.neutral.descriptionClassName,
        duration: toastPresets.neutral.duration,
      }}
      icons={{
        success: <Icon.toastSuccess />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
