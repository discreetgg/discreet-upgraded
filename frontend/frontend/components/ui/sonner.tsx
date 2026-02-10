'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { Icon } from './icons';
import { toastPresets } from '@/lib/toast-presets';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
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
