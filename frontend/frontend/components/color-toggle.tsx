'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeColor } from '@/hooks/use-color-theme';
import { themeDataColors } from '@/lib/data';
import type { ThemeColors } from '@/types/theme-color-types';
import { CircleStop } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ColorToggle() {
  const { resolvedTheme } = useTheme();
  const { themeColor, setThemeColor } = useThemeColor();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <CircleStop
            size={19}
            color={
              themeDataColors?.find(
                (themeDataColor) => themeDataColor.name === themeColor
              )?.light || 'currentColor'
            }
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {themeDataColors.map(({ name, light, dark }) => (
          <DropdownMenuItem
            key={name}
            onClick={() => setThemeColor(name as ThemeColors)}
            className='flex item-center space-x-3'
          >
            <CircleStop
              size={19}
              color={resolvedTheme === 'light' ? light : dark}
            />
            <div className='text-sm'>{name}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
